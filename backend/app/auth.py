from fastapi import Header


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


def resolve_model_api_key(
    authorization: str | None = Header(default=None),
    x_model_api_key: str | None = Header(default=None, alias="X-Model-Api-Key"),
) -> str:
    """Resolve the provider API key from request headers.

    Prefers the explicit ``X-Model-Api-Key`` header, falling back to a
    ``Bearer`` token in the ``Authorization`` header. Usable directly as a
    FastAPI dependency (``Depends(resolve_model_api_key)``).
    """
    return x_model_api_key or _extract_bearer_token(authorization)
