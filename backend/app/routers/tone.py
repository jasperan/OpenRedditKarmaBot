from fastapi import APIRouter

from app.config import settings
from app.models.responses import ToneResponse
from app.services.reddit_context import RedditContextService
from app.services.tone_analyzer import ToneAnalyzer

router = APIRouter(prefix="/api")


@router.post("/analyze-tone", response_model=ToneResponse)
async def analyze_tone(subreddit: str):
    reddit = RedditContextService(user_agent=settings.REDDIT_USER_AGENT)
    posts = await reddit.sample_subreddit(subreddit, limit=10)

    comments_text = [p["selftext"] for p in posts if p["selftext"]]
    analyzer = ToneAnalyzer()
    profile = analyzer.analyze(comments_text)

    return ToneResponse(
        formality_score=profile.formality_score,
        avg_sentence_length=profile.avg_sentence_length,
        emoji_frequency=profile.emoji_frequency,
        slang_frequency=profile.slang_frequency,
        recommended_tone=profile.recommended_tone,
    )
