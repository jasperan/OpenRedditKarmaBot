from fastapi import APIRouter, Header

from app.config import settings
from app.models.responses import HealthResponse, ModelsResponse
from app.services.demo_generator import DEMO_LOCAL_MODEL
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


def _resolve_api_key(
    authorization: str | None,
    x_model_api_key: str | None,
) -> str:
    return x_model_api_key or _extract_bearer_token(authorization)


def _get_vllm_client(api_key_override: str = "") -> VLLMClient:
    return VLLMClient(
        base_url=settings.VLLM_BASE_URL,
        api_key=api_key_override or settings.VLLM_API_KEY,
        model=settings.VLLM_MODEL,
    )


@router.get("/health", response_model=HealthResponse)
async def health(
    authorization: str | None = Header(default=None),
    x_model_api_key: str | None = Header(default=None, alias="X-Model-Api-Key"),
):
    client = _get_vllm_client(_resolve_api_key(authorization, x_model_api_key))
    connected = await client.health_check()
    return HealthResponse(
        status="ok" if connected else "degraded",
        vllm_connected=connected,
        model=settings.VLLM_MODEL,
        demo_mode_available=True,
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models(
    authorization: str | None = Header(default=None),
    x_model_api_key: str | None = Header(default=None, alias="X-Model-Api-Key"),
):
    client = _get_vllm_client(_resolve_api_key(authorization, x_model_api_key))
    models = [DEMO_LOCAL_MODEL]
    try:
        remote_models = await client.list_models()
    except Exception:
        remote_models = []

    for model in remote_models:
        if model not in models:
            models.append(model)

    return ModelsResponse(models=models)
