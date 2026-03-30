import httpx
import pytest
import respx

from app.services.vllm_client import VLLMClient


@pytest.fixture
def client():
    return VLLMClient(
        base_url="http://test:8000/v1",
        api_key="sk-test",
        model="qwen3.5:27b",
    )


@respx.mock
@pytest.mark.asyncio
async def test_generate_single(client):
    respx.post("http://test:8000/v1/chat/completions").mock(
        return_value=httpx.Response(
            200,
            json={
                "choices": [
                    {
                        "message": {"content": "Great point about startups!"},
                        "finish_reason": "stop",
                    }
                ]
            },
        )
    )

    result = await client.generate(
        system_prompt="You are a Reddit commenter.",
        user_prompt="Reply to this post about startups.",
        temperature=0.8,
        max_tokens=300,
    )
    assert result == "Great point about startups!"


@respx.mock
@pytest.mark.asyncio
async def test_list_models(client):
    respx.get("http://test:8000/v1/models").mock(
        return_value=httpx.Response(
            200,
            json={"data": [{"id": "qwen3.5:27b"}, {"id": "llama3:8b"}]},
        )
    )

    models = await client.list_models()
    assert models == ["qwen3.5:27b", "llama3:8b"]


@respx.mock
@pytest.mark.asyncio
async def test_health_check_ok(client):
    respx.get("http://test:8000/v1/models").mock(
        return_value=httpx.Response(200, json={"data": []})
    )

    assert await client.health_check() is True


@respx.mock
@pytest.mark.asyncio
async def test_health_check_fail(client):
    respx.get("http://test:8000/v1/models").mock(
        return_value=httpx.Response(500)
    )

    assert await client.health_check() is False
