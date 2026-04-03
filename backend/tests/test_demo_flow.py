from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_demo_thread_page_is_served():
    response = client.get("/demo/thread")
    assert response.status_code == 200
    assert "OpenRedditKarmaBot Demo Thread" in response.text
    assert "data-testid=\"post-title\"" in response.text


def test_generate_uses_scanned_context_for_demo_model():
    response = client.post(
        "/api/generate",
        json={
            "context": {
                "url": "http://127.0.0.1:8000/demo/thread",
                "post_title": "How do you keep automated community workflows from sounding robotic?",
                "post_body": "Need a realistic local demo.",
                "subreddit": "SideProject",
                "comments": [
                    {
                        "author": "context_matters",
                        "body": "Context beats templates.",
                        "score": 12,
                        "depth": 0,
                    }
                ],
            },
            "model": "demo:local",
            "draft_count": 2,
        },
    )

    assert response.status_code == 200
    assert '"demo_mode": true' in response.text
    assert '"context_source": "inline_fallback"' in response.text
    assert "event: draft" in response.text
    assert "repeatable habit" in response.text
    assert "consistency usually beats the cleverest tactic" in response.text
