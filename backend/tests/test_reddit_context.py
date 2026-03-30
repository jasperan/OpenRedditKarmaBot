import json
from pathlib import Path

import httpx
import pytest
import respx

from app.services.reddit_context import RedditContextService


@pytest.fixture
def service():
    return RedditContextService(user_agent="TestBot/1.0")


@pytest.fixture
def sample_thread_json():
    fixture = Path(__file__).parent / "fixtures" / "sample_thread.json"
    return json.loads(fixture.read_text())


@respx.mock
@pytest.mark.asyncio
async def test_fetch_thread(service, sample_thread_json):
    url = "https://www.reddit.com/r/Entrepreneur/comments/abc123/how_i_grew/"
    respx.get(url.rstrip("/") + ".json").mock(
        return_value=httpx.Response(200, json=sample_thread_json)
    )

    thread = await service.fetch_thread(url)
    assert thread.post.title == "How I grew my startup to $10k MRR"
    assert thread.post.subreddit == "Entrepreneur"
    assert thread.post.author == "startup_guy"
    assert len(thread.comments) == 3  # 2 top-level + 1 reply


@respx.mock
@pytest.mark.asyncio
async def test_parse_comment_tree(service, sample_thread_json):
    url = "https://www.reddit.com/r/Entrepreneur/comments/abc123/how_i_grew/"
    respx.get(url.rstrip("/") + ".json").mock(
        return_value=httpx.Response(200, json=sample_thread_json)
    )

    thread = await service.fetch_thread(url)
    top_level = [c for c in thread.comments if c.depth == 0]
    assert len(top_level) == 2
    assert top_level[0].author == "helpful_commenter"
    assert top_level[0].score == 45


@pytest.mark.asyncio
async def test_fetch_thread_rejects_non_reddit_url(service):
    with pytest.raises(ValueError, match="URL must be a reddit.com thread link"):
        await service.fetch_thread("https://evil.com/r/something")


@respx.mock
@pytest.mark.asyncio
async def test_sample_subreddit(service):
    hot_data = {
        "data": {
            "children": [
                {
                    "kind": "t3",
                    "data": {
                        "title": f"Post {i}",
                        "selftext": f"Content {i}",
                        "author": f"user{i}",
                        "score": i * 10,
                        "num_comments": i * 5,
                    },
                }
                for i in range(5)
            ]
        }
    }
    respx.get("https://www.reddit.com/r/Entrepreneur/hot.json").mock(
        return_value=httpx.Response(200, json=hot_data)
    )

    posts = await service.sample_subreddit("Entrepreneur", limit=5)
    assert len(posts) == 5
    assert posts[0]["title"] == "Post 0"
