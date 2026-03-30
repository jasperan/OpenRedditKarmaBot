import pytest

from app.services.tone_analyzer import ToneAnalyzer, CultureProfile


@pytest.fixture
def analyzer():
    return ToneAnalyzer()


def test_analyze_casual_comments(analyzer):
    comments = [
        "lol this is so true, been there done that",
        "ngl this hits different. gonna try it out",
        "bruh same thing happened to me last week 😂",
        "yo that's wild, how did you even figure that out",
        "fr fr, this is the way to go",
    ]
    profile = analyzer.analyze(comments)
    assert isinstance(profile, CultureProfile)
    assert profile.formality_score < 0.4  # casual
    assert profile.emoji_frequency > 0
    assert profile.avg_sentence_length > 0


def test_analyze_professional_comments(analyzer):
    comments = [
        "This is an excellent analysis. I would recommend considering the tax implications.",
        "From a regulatory standpoint, Section 401(k) provisions may apply here.",
        "I appreciate you sharing this. The methodology is sound and well-documented.",
        "Could you elaborate on the revenue model? The unit economics seem promising.",
        "Great insight. I have been working in this space for fifteen years.",
    ]
    profile = analyzer.analyze(comments)
    assert profile.formality_score > 0.6  # professional


def test_analyze_returns_recommended_tone(analyzer):
    casual_comments = ["lol nice", "bruh moment", "yooo 😂😂"]
    profile = analyzer.analyze(casual_comments)
    assert profile.recommended_tone in ("Casual", "Meme-heavy")


def test_profile_to_prompt_fragment(analyzer):
    comments = ["This is a test comment for analysis purposes."]
    profile = analyzer.analyze(comments)
    fragment = profile.to_prompt_fragment()
    assert isinstance(fragment, str)
    assert len(fragment) > 0
