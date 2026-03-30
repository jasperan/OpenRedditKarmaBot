from app.config import Settings


def test_default_settings():
    settings = Settings(
        VLLM_BASE_URL="http://localhost:8000/v1",
        VLLM_MODEL="qwen3.5:27b",
    )
    assert settings.VLLM_BASE_URL == "http://localhost:8000/v1"
    assert settings.VLLM_MODEL == "qwen3.5:27b"
    assert settings.VLLM_API_KEY == ""
    assert settings.DEFAULT_TEMPERATURE == 0.8
    assert settings.DEFAULT_MAX_TOKENS == 300
    assert settings.DEFAULT_DRAFT_COUNT == 3
    assert settings.REDDIT_USER_AGENT == "OpenRedditKarmaBot/0.1.0"


def test_settings_override():
    settings = Settings(
        VLLM_BASE_URL="http://remote:9000/v1",
        VLLM_MODEL="llama3:8b",
        VLLM_API_KEY="sk-test123",
        DEFAULT_TEMPERATURE=0.5,
        DEFAULT_MAX_TOKENS=500,
        DEFAULT_DRAFT_COUNT=5,
    )
    assert settings.VLLM_API_KEY == "sk-test123"
    assert settings.DEFAULT_TEMPERATURE == 0.5
    assert settings.DEFAULT_MAX_TOKENS == 500
    assert settings.DEFAULT_DRAFT_COUNT == 5
