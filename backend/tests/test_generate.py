import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    with respx.mock:
        respx.get("http://localhost:8000/v1/models").mock(
            return_value=httpx.Response(200, json={"data": [{"id": "qwen3.5:27b"}]})
        )
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["vllm_connected"] is True


def test_health_endpoint_vllm_down(client):
    with respx.mock:
        respx.get("http://localhost:8000/v1/models").mock(
            return_value=httpx.Response(500)
        )
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["vllm_connected"] is False


def test_models_endpoint(client):
    with respx.mock:
        respx.get("http://localhost:8000/v1/models").mock(
            return_value=httpx.Response(
                200,
                json={"data": [{"id": "qwen3.5:27b"}, {"id": "llama3:8b"}]},
            )
        )
        resp = client.get("/api/models")
        assert resp.status_code == 200
        assert "qwen3.5:27b" in resp.json()["models"]


def test_generate_endpoint_returns_sse(client):
    with respx.mock:
        # Mock the Reddit .json endpoint
        # fetch_thread strips trailing slash then appends .json
        respx.get("https://www.reddit.com/r/test/comments/abc/test_post.json").mock(
            return_value=httpx.Response(
                200,
                json=[
                    {
                        "data": {
                            "children": [
                                {
                                    "kind": "t3",
                                    "data": {
                                        "title": "Test Post",
                                        "selftext": "Test body",
                                        "subreddit": "test",
                                        "author": "tester",
                                        "score": 10,
                                        "link_flair_text": "",
                                        "num_comments": 1,
                                    },
                                }
                            ]
                        }
                    },
                    {"data": {"children": []}},
                ],
            )
        )
        # Mock subreddit sampling
        respx.get("https://www.reddit.com/r/test/hot.json").mock(
            return_value=httpx.Response(
                200,
                json={"data": {"children": []}},
            )
        )
        # Mock vLLM
        respx.post("http://localhost:8000/v1/chat/completions").mock(
            return_value=httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {"content": "Nice post!"},
                            "finish_reason": "stop",
                        }
                    ]
                },
            )
        )

        resp = client.post(
            "/api/generate",
            json={
                "context": {
                    "url": "https://www.reddit.com/r/test/comments/abc/test_post/",
                    "post_title": "Test Post",
                    "post_body": "Test body",
                    "subreddit": "test",
                },
                "draft_count": 1,
            },
        )
        assert resp.status_code == 200


def test_generate_endpoint_uses_inline_context_without_reddit_fetch(client):
    with respx.mock:
        respx.post("http://localhost:8000/v1/chat/completions").mock(
            return_value=httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {"content": "Inline reply works."},
                            "finish_reason": "stop",
                        }
                    ]
                },
            )
        )

        resp = client.post(
            "/api/generate",
            json={
                "context": {
                    "url": "https://invalid.local/thread",
                    "post_title": "Inline Test Post",
                    "post_body": "Inline body",
                    "subreddit": "localdemo",
                    "comments": [{"author": "demo", "body": "Inline comment", "depth": 0}],
                },
                "context_mode": "inline",
                "tone": "Casual",
                "draft_count": 1,
            },
        )

        assert resp.status_code == 200
        assert '"context_source": "inline"' in resp.text
        assert "Inline reply works." in resp.text


def test_generate_endpoint_falls_back_to_inline_tone_when_sampling_fails(client):
    with respx.mock:
        respx.get("https://www.reddit.com/r/localdemo/hot.json").mock(
            return_value=httpx.Response(503)
        )
        respx.post("http://localhost:8000/v1/chat/completions").mock(
            return_value=httpx.Response(
                200,
                json={
                    "choices": [
                        {
                            "message": {"content": "Fallback tone works."},
                            "finish_reason": "stop",
                        }
                    ]
                },
            )
        )

        resp = client.post(
            "/api/generate",
            json={
                "context": {
                    "url": "https://invalid.local/thread",
                    "post_title": "Inline Test Post",
                    "post_body": "Inline body",
                    "subreddit": "localdemo",
                    "comments": [{"author": "demo", "body": "ngl this local test slaps 😂", "depth": 0}],
                },
                "context_mode": "inline",
                "draft_count": 1,
            },
        )

        assert resp.status_code == 200
        assert '"tone_source": "inline_context"' in resp.text
        assert "Fallback tone works." in resp.text
