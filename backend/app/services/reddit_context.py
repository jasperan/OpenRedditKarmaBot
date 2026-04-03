from dataclasses import dataclass, field
import re
from typing import Any

import httpx

_REDDIT_URL_RE = re.compile(r"^https://(www\.|old\.)?reddit\.com/r/")


@dataclass
class RedditPost:
    title: str
    selftext: str
    subreddit: str
    author: str
    score: int
    flair: str
    num_comments: int


@dataclass
class RedditComment:
    author: str
    body: str
    score: int
    depth: int
    created_utc: float


@dataclass
class RedditThread:
    post: RedditPost
    comments: list[RedditComment] = field(default_factory=list)


class RedditContextService:
    def __init__(self, user_agent: str = "OpenRedditKarmaBot/0.1.0"):
        self.headers = {"User-Agent": user_agent}

    async def fetch_thread(self, url: str) -> RedditThread:
        if not _REDDIT_URL_RE.match(url):
            raise ValueError(f"URL must be a reddit.com thread link: {url}")
        json_url = url.rstrip("/") + ".json"
        async with httpx.AsyncClient() as http:
            resp = await http.get(
                json_url,
                headers=self.headers,
                timeout=15.0,
                follow_redirects=True,
            )
            resp.raise_for_status()
            data = resp.json()

        post_data = data[0]["data"]["children"][0]["data"]
        post = RedditPost(
            title=post_data["title"],
            selftext=post_data.get("selftext", ""),
            subreddit=post_data["subreddit"],
            author=post_data["author"],
            score=post_data.get("score", 0),
            flair=post_data.get("link_flair_text", ""),
            num_comments=post_data.get("num_comments", 0),
        )

        comments = []
        if len(data) > 1:
            self._parse_comments(data[1]["data"]["children"], comments)

        return RedditThread(post=post, comments=comments)

    def _parse_comments(self, children: list, result: list[RedditComment]):
        for child in children:
            if child["kind"] != "t1":
                continue
            c = child["data"]
            result.append(
                RedditComment(
                    author=c.get("author", "[deleted]"),
                    body=c.get("body", ""),
                    score=c.get("score", 0),
                    depth=c.get("depth", 0),
                    created_utc=c.get("created_utc", 0),
                )
            )
            if isinstance(c.get("replies"), dict):
                self._parse_comments(c["replies"]["data"]["children"], result)

    async def sample_subreddit(self, subreddit: str, limit: int = 10) -> list[dict]:
        url = f"https://www.reddit.com/r/{subreddit}/hot.json"
        async with httpx.AsyncClient() as http:
            resp = await http.get(
                url,
                headers=self.headers,
                params={"limit": limit},
                timeout=15.0,
                follow_redirects=True,
            )
            resp.raise_for_status()
            data = resp.json()

        posts = []
        for child in data["data"]["children"]:
            p = child["data"]
            posts.append(
                {
                    "title": p["title"],
                    "selftext": p.get("selftext", ""),
                    "author": p.get("author", ""),
                    "score": p.get("score", 0),
                    "num_comments": p.get("num_comments", 0),
                }
            )
        return posts
