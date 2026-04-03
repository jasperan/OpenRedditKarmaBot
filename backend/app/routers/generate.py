import json

import httpx
from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.models.requests import GenerateRequest
from app.services.prompt_engine import PromptEngine, ANGLES
from app.services.reddit_context import (
    RedditContextService,
    RedditComment,
)
from app.services.tone_analyzer import ToneAnalyzer
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


def _resolve_thread_source(req: GenerateRequest, reddit: RedditContextService) -> str:
    if req.context_mode == "inline":
        return "inline"
    if req.context_mode == "live":
        return "live"
    return "inline" if reddit.has_inline_context(req.context) else "live"


@router.post("/generate")
async def generate(req: GenerateRequest):
    reddit = RedditContextService(user_agent=settings.REDDIT_USER_AGENT)

    context_source = _resolve_thread_source(req, reddit)
    if context_source == "inline":
        thread = reddit.build_thread_from_context(req.context)
    else:
        thread = await reddit.fetch_thread(req.context.url)

    # Analyze tone
    tone_source = "manual"
    if req.tone == "auto":
        inline_texts = [thread.post.selftext] + [c.body for c in thread.comments[:10]]
        sample_texts = []
        tone_source = "inline_context"
        if thread.post.subreddit and thread.post.subreddit != "unknown":
            try:
                posts = await reddit.sample_subreddit(thread.post.subreddit, limit=10)
                sample_texts = [p["selftext"] for p in posts if p["selftext"]]
                if sample_texts:
                    tone_source = "subreddit_sample"
            except httpx.HTTPError:
                sample_texts = []
        analyzer = ToneAnalyzer()
        culture_profile = analyzer.analyze(sample_texts + inline_texts)
    else:
        analyzer = ToneAnalyzer()
        culture_profile = analyzer.analyze([])
        culture_profile.recommended_tone = req.tone

    # Build target comment if provided
    target = None
    if req.context.target_comment:
        tc = req.context.target_comment
        target = RedditComment(
            author=tc.get("author", ""),
            body=tc.get("body", ""),
            score=tc.get("score", 0),
            depth=tc.get("depth", 0),
            created_utc=tc.get("created_utc", 0),
        )

    # Build prompts
    engine = PromptEngine()
    prompts = engine.build_prompts(
        thread=thread,
        culture_profile=culture_profile,
        target_comment=target,
        draft_count=req.draft_count,
    )

    # Generate replies
    model = req.model or settings.VLLM_MODEL
    client = VLLMClient(
        base_url=settings.VLLM_BASE_URL,
        api_key=settings.VLLM_API_KEY,
        model=model,
    )

    async def event_stream():
        yield {
            "event": "meta",
            "data": json.dumps(
                {
                    "context_source": context_source,
                    "tone_source": tone_source,
                    "model": model,
                }
            ),
        }
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
