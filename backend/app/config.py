from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VLLM_BASE_URL: str = "http://localhost:8000/v1"
    VLLM_API_KEY: str = ""
    VLLM_MODEL: str = "qwen3.5:27b"

    DEFAULT_TEMPERATURE: float = 0.8
    DEFAULT_MAX_TOKENS: int = 300
    DEFAULT_DRAFT_COUNT: int = 3

    REDDIT_USER_AGENT: str = "OpenRedditKarmaBot/0.1.0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
