from pydantic import BaseModel, Field


class ThreadContext(BaseModel):
    url: str
    post_title: str
    post_body: str = ""
    subreddit: str
    post_author: str = ""
    post_score: int = 0
    post_flair: str = ""
    comments: list[dict] = Field(default_factory=list)
    target_comment: dict | None = None


class GenerateRequest(BaseModel):
    context: ThreadContext
    tone: str = "auto"  # "auto", "Professional", "Casual", "Concise", "Meme-heavy"
    draft_count: int = Field(default=3, ge=1, le=5)
    temperature: float = Field(default=0.8, ge=0.0, le=2.0)
    max_tokens: int = Field(default=300, ge=50, le=1000)
    model: str | None = None  # override default model


class SettingsUpdate(BaseModel):
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    draft_count: int | None = None
