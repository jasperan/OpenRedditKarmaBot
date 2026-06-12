from fastapi import APIRouter, Depends

from app.auth import resolve_model_api_key
from app.config import settings
from app.models.responses import HealthResponse, ModelsResponse
from app.services.demo_generator import DEMO_LOCAL_MODEL
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


def _get_vllm_client(api_key_override: str = "") -> VLLMClient:
    return VLLMClient(
        base_url=settings.VLLM_BASE_URL,
        api_key=api_key_override or settings.VLLM_API_KEY,
        model=settings.VLLM_MODEL,
    )


@router.get("/health", response_model=HealthResponse)
async def health(api_key: str = Depends(resolve_model_api_key)):
    client = _get_vllm_client(api_key)
    connected = await client.health_check()
    return HealthResponse(
        status="ok" if connected else "degraded",
        vllm_connected=connected,
        model=settings.VLLM_MODEL,
        demo_mode_available=True,
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models(api_key: str = Depends(resolve_model_api_key)):
    client = _get_vllm_client(api_key)
    models = [DEMO_LOCAL_MODEL]
    try:
        remote_models = await client.list_models()
    except Exception:
        remote_models = []

    for model in remote_models:
        if model not in models:
            models.append(model)

    return ModelsResponse(models=models)
