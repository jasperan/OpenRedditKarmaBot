from fastapi import APIRouter

from app.config import settings
from app.models.responses import HealthResponse, ModelsResponse
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


def _get_vllm_client() -> VLLMClient:
    return VLLMClient(
        base_url=settings.VLLM_BASE_URL,
        api_key=settings.VLLM_API_KEY,
        model=settings.VLLM_MODEL,
    )


@router.get("/health", response_model=HealthResponse)
async def health():
    client = _get_vllm_client()
    connected = await client.health_check()
    return HealthResponse(
        status="ok" if connected else "degraded",
        vllm_connected=connected,
        model=settings.VLLM_MODEL,
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models():
    client = _get_vllm_client()
    models = await client.list_models()
    return ModelsResponse(models=models)
