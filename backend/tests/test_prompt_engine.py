import pytest

from app.services.prompt_engine import PromptEngine
from app.services.reddit_context import RedditPost, RedditComment, RedditThread
from app.services.tone_analyzer import CultureProfile


@pytest.fixture
def engine():
    return PromptEngine()


@pytest.fixture
def sample_thread():
    return RedditThread(
        post=RedditPost(
            title="How I grew my startup to $10k MRR",
            selftext="Here's my journey...",
            subreddit="Entrepreneur",
            author="startup_guy",
            score=342,
            flair="Case Study",
            num_comments=87,
        ),
        comments=[
            RedditComment(
                author="helpful_commenter",
                body="This is inspiring! What was your biggest challenge?",
                score=45,
                depth=0,
                created_utc=1711756800,
            ),
        ],
    )


@pytest.fixture
def sample_profile():
    return CultureProfile(
        formality_score=0.6,
        avg_sentence_length=15,
        emoji_frequency=0.1,
        slang_frequency=0.2,
        recommended_tone="Casual",
    )


def test_build_prompts_returns_n_pairs(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=3,
    )
    assert len(prompts) == 3
    for system_prompt, user_prompt in prompts:
        assert isinstance(system_prompt, str)
        assert isinstance(user_prompt, str)
        assert len(system_prompt) > 0
        assert len(user_prompt) > 0


def test_prompts_include_thread_context(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=1,
    )
    system_prompt, user_prompt = prompts[0]
    assert "Entrepreneur" in user_prompt
    assert "How I grew my startup" in user_prompt


def test_prompts_include_tone(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=1,
    )
    system_prompt, _ = prompts[0]
    assert "Casual" in system_prompt or "culture" in system_prompt.lower()


def test_each_draft_has_different_angle(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=5,
    )
    system_prompts = [sp for sp, _ in prompts]
    assert len(set(system_prompts)) == 5


def test_reply_to_specific_comment(engine, sample_thread, sample_profile):
    target = sample_thread.comments[0]
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=target,
        draft_count=1,
    )
    _, user_prompt = prompts[0]
    assert "helpful_commenter" in user_prompt or "inspiring" in user_prompt
