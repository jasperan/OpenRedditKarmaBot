from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    vllm_connected: bool
    model: str
    demo_mode_available: bool = True


class ModelsResponse(BaseModel):
    models: list[str]


class ToneResponse(BaseModel):
    formality_score: float
    avg_sentence_length: float
    emoji_frequency: float
    slang_frequency: float
    recommended_tone: str


class DraftResponse(BaseModel):
    index: int
    text: str
    angle: str
