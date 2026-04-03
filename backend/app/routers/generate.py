import json

import httpx
from fastapi import APIRouter, Header, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.models.requests import GenerateRequest
from app.services.demo_generator import DEMO_LOCAL_MODEL, DemoGenerator
from app.services.prompt_engine import ANGLES, PromptEngine
from app.services.reddit_context import RedditContextService
from app.services.thread_builder import build_thread_from_context
from app.services.tone_analyzer import ToneAnalyzer
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


def _resolve_provider_api_key(
    authorization: str | None,
    x_model_api_key: str | None,
) -> str:
    return x_model_api_key or _extract_bearer_token(authorization)


async def _resolve_thread(req: GenerateRequest, reddit: RedditContextService):
    fallback_thread, fallback_target = build_thread_from_context(req.context)
    has_inline_context = bool(fallback_thread.post.title.strip())

    if req.context_mode == "inline":
        if not has_inline_context:
            raise HTTPException(
                status_code=400,
                detail="Inline context mode requires scanned thread content.",
            )
        return fallback_thread, fallback_target, "inline"

    if req.context_mode == "live":
        enriched_thread = await reddit.fetch_thread(req.context.url)
        return enriched_thread, fallback_target, "live"

    try:
        enriched_thread = await reddit.fetch_thread(req.context.url)
        return enriched_thread, fallback_target, "live"
    except (httpx.HTTPError, ValueError):
        if not has_inline_context:
            raise
        return fallback_thread, fallback_target, "inline_fallback"


async def _resolve_culture_profile(
    req: GenerateRequest,
    reddit: RedditContextService,
    thread,
):
    analyzer = ToneAnalyzer()
    comment_texts = [thread.post.selftext] if thread.post.selftext else []
    comment_texts.extend(comment.body for comment in thread.comments[:10] if comment.body)

    if req.tone != "auto":
        profile = analyzer.analyze(comment_texts)
        profile.recommended_tone = req.tone
        return profile, "manual"

    sample_texts = []
    tone_source = "inline_context"
    if thread.post.subreddit:
        try:
            posts = await reddit.sample_subreddit(thread.post.subreddit, limit=10)
            sample_texts = [post["selftext"] for post in posts if post.get("selftext")]
            if sample_texts:
                tone_source = "subreddit_sample"
        except Exception:
            sample_texts = []

    return analyzer.analyze(sample_texts + comment_texts), tone_source


@router.post("/generate")
async def generate(
    req: GenerateRequest,
    authorization: str | None = Header(default=None),
    x_model_api_key: str | None = Header(default=None, alias="X-Model-Api-Key"),
):
    reddit = RedditContextService(user_agent=settings.REDDIT_USER_AGENT)
    thread, target, context_source = await _resolve_thread(req, reddit)
    culture_profile, tone_source = await _resolve_culture_profile(req, reddit, thread)

    model = req.model or settings.VLLM_MODEL
    provider_api_key = _resolve_provider_api_key(authorization, x_model_api_key) or settings.VLLM_API_KEY
    demo_generator = DemoGenerator()
    demo_mode = model == DEMO_LOCAL_MODEL

    async def event_stream():
        yield {
            "event": "meta",
            "data": json.dumps(
                {
                    "context_source": context_source,
                    "tone_source": tone_source,
                    "model": model,
                    "demo_mode": demo_mode,
                }
            ),
        }
        if demo_mode:
            for draft in demo_generator.generate(
                thread=thread,
                culture_profile=culture_profile,
                target_comment=target,
                draft_count=req.draft_count,
            ):
                yield {"event": "draft", "data": json.dumps(draft)}
            yield {"event": "complete", "data": "{}"}
            return

        engine = PromptEngine()
        prompts = engine.build_prompts(
            thread=thread,
            culture_profile=culture_profile,
            target_comment=target,
            draft_count=req.draft_count,
        )

        client = VLLMClient(
            base_url=settings.VLLM_BASE_URL,
            api_key=provider_api_key,
            model=model,
        )

        for i, (system_prompt, user_prompt) in enumerate(prompts):
            angle_name = ANGLES[i % len(ANGLES)]["name"]
            try:
                text = await client.generate(
                    system_prompt=system_prompt,
                    user_prompt=user_prompt,
                    temperature=req.temperature,
                    max_tokens=req.max_tokens,
                )
            except httpx.HTTPStatusError as e:
                yield {"event": "error", "data": json.dumps({"error": str(e)})}
                return
            except Exception as e:
                yield {"event": "error", "data": json.dumps({"error": str(e)})}
                return
            yield {
                "event": "draft",
                "data": json.dumps(
                    {
                        "index": i,
                        "text": text,
                        "angle": angle_name,
                        "done": True,
                    }
                ),
            }
        yield {"event": "complete", "data": "{}"}

    return EventSourceResponse(event_stream())
