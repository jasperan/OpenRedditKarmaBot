# OpenRedditKarmaBot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an open-source Reddit karma bot with a Chrome Extension frontend and FastAPI + vLLM backend that generates contextual replies and types them with biometric keystroke simulation.

**Architecture:** Hybrid split — Chrome Extension handles DOM scraping and biometric typing (browser-native), FastAPI backend handles Reddit API calls, tone analysis, prompt engineering, and vLLM inference. Communication via HTTP + SSE streaming.

**Tech Stack:** Python 3.12, FastAPI, httpx, sse-starlette, pydantic-settings, Chrome Manifest V3, vanilla JS

---

### Task 1: Project Scaffolding

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/.env.example`
- Create: `.gitignore`
- Create: `LICENSE`

**Step 1: Create .gitignore**

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.venv/
venv/
*.egg

# Environment
.env
backend/.env

# IDE
.vscode/
.idea/

# Agent/skill dirs
.agents/
.claude/
.crush/
.openhands/
.serena/

# Plan artifacts
docs/plans/
task_plan.md
findings.md
progress.md

# OS
.DS_Store
Thumbs.db

# Testing
.pytest_cache/
.coverage
htmlcov/
```

**Step 2: Create pyproject.toml**

```toml
[project]
name = "openredditkarmabot"
version = "0.1.0"
description = "Open-source Reddit karma bot with vLLM-powered reply generation"
requires-python = ">=3.12"
license = "MIT"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.34.0",
    "httpx>=0.28.0",
    "pydantic-settings>=2.7.0",
    "sse-starlette>=2.2.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.25.0",
    "pytest-httpx>=0.35.0",
    "respx>=0.22.0",
]

[build-system]
requires = ["setuptools>=75.0"]
build-backend = "setuptools.backends._legacy:_Backend"

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

**Step 3: Create backend/app/__init__.py**

```python
"""OpenRedditKarmaBot backend."""
```

**Step 4: Create .env.example**

```env
# vLLM endpoint (any OpenAI-compatible API)
VLLM_BASE_URL=http://localhost:8000/v1
VLLM_API_KEY=
VLLM_MODEL=qwen3.5:27b

# Generation defaults
DEFAULT_TEMPERATURE=0.8
DEFAULT_MAX_TOKENS=300
DEFAULT_DRAFT_COUNT=3

# Reddit
REDDIT_USER_AGENT=OpenRedditKarmaBot/0.1.0
```

**Step 5: Create MIT LICENSE**

Standard MIT license with copyright line: `Copyright (c) 2026 jasperan`

**Step 6: Commit**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot
git add .gitignore LICENSE backend/pyproject.toml backend/app/__init__.py backend/.env.example
git commit -m "chore: project scaffolding with pyproject.toml and gitignore"
```

---

### Task 2: Backend Config Module

**Files:**
- Create: `backend/app/config.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/test_config.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_config.py
from app.config import Settings


def test_default_settings():
    settings = Settings(
        VLLM_BASE_URL="http://localhost:8000/v1",
        VLLM_MODEL="qwen3.5:27b",
    )
    assert settings.VLLM_BASE_URL == "http://localhost:8000/v1"
    assert settings.VLLM_MODEL == "qwen3.5:27b"
    assert settings.VLLM_API_KEY == ""
    assert settings.DEFAULT_TEMPERATURE == 0.8
    assert settings.DEFAULT_MAX_TOKENS == 300
    assert settings.DEFAULT_DRAFT_COUNT == 3
    assert settings.REDDIT_USER_AGENT == "OpenRedditKarmaBot/0.1.0"


def test_settings_override():
    settings = Settings(
        VLLM_BASE_URL="http://remote:9000/v1",
        VLLM_MODEL="llama3:8b",
        VLLM_API_KEY="sk-test123",
        DEFAULT_TEMPERATURE=0.5,
        DEFAULT_MAX_TOKENS=500,
        DEFAULT_DRAFT_COUNT=5,
    )
    assert settings.VLLM_API_KEY == "sk-test123"
    assert settings.DEFAULT_TEMPERATURE == 0.5
    assert settings.DEFAULT_MAX_TOKENS == 500
    assert settings.DEFAULT_DRAFT_COUNT == 5
```

**Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_config.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'app.config'`

**Step 3: Write minimal implementation**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VLLM_BASE_URL: str = "http://localhost:8000/v1"
    VLLM_API_KEY: str = ""
    VLLM_MODEL: str = "qwen3.5:27b"

    DEFAULT_TEMPERATURE: float = 0.8
    DEFAULT_MAX_TOKENS: int = 300
    DEFAULT_DRAFT_COUNT: int = 3

    REDDIT_USER_AGENT: str = "OpenRedditKarmaBot/0.1.0"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

**Step 4: Run test to verify it passes**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_config.py -v
```

Expected: 2 passed

**Step 5: Commit**

```bash
git add backend/app/config.py backend/tests/
git commit -m "feat: add pydantic settings config module"
```

---

### Task 3: vLLM Client

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/vllm_client.py`
- Create: `backend/tests/test_vllm_client.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_vllm_client.py
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
```

**Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_vllm_client.py -v
```

Expected: FAIL with `ModuleNotFoundError`

**Step 3: Write minimal implementation**

```python
# backend/app/services/vllm_client.py
import httpx


class VLLMClient:
    def __init__(self, base_url: str, api_key: str = "", model: str = "qwen3.5:27b"):
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.headers = {"Content-Type": "application/json"}
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 300,
    ) -> str:
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
            "extra_body": {
                "chat_template_kwargs": {"enable_thinking": False}
            },
        }
        async with httpx.AsyncClient() as http:
            resp = await http.post(
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=self.headers,
                timeout=60.0,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def generate_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.8,
        max_tokens: int = 300,
    ):
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
            "extra_body": {
                "chat_template_kwargs": {"enable_thinking": False}
            },
        }
        async with httpx.AsyncClient() as http:
            async with http.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                json=payload,
                headers=self.headers,
                timeout=120.0,
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    yield data

    async def list_models(self) -> list[str]:
        async with httpx.AsyncClient() as http:
            resp = await http.get(
                f"{self.base_url}/models",
                headers=self.headers,
                timeout=10.0,
            )
            resp.raise_for_status()
            return [m["id"] for m in resp.json()["data"]]

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient() as http:
                resp = await http.get(
                    f"{self.base_url}/models",
                    headers=self.headers,
                    timeout=5.0,
                )
                return resp.status_code == 200
        except (httpx.HTTPError, Exception):
            return False
```

**Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_vllm_client.py -v
```

Expected: 4 passed

**Step 5: Commit**

```bash
git add backend/app/services/ backend/tests/test_vllm_client.py
git commit -m "feat: add vLLM client with streaming and health check"
```

---

### Task 4: Reddit Context Service

**Files:**
- Create: `backend/app/services/reddit_context.py`
- Create: `backend/tests/test_reddit_context.py`
- Create: `backend/tests/fixtures/` (test JSON fixtures)

**Step 1: Create a test fixture**

Save a minimal Reddit `.json` response as `backend/tests/fixtures/sample_thread.json`:

```json
{
  "data": [
    {
      "kind": "Listing",
      "data": {
        "children": [
          {
            "kind": "t3",
            "data": {
              "title": "How I grew my startup to $10k MRR",
              "selftext": "Here's my journey from zero to $10k monthly revenue...",
              "subreddit": "Entrepreneur",
              "author": "startup_guy",
              "score": 342,
              "link_flair_text": "Case Study",
              "num_comments": 87
            }
          }
        ]
      }
    },
    {
      "kind": "Listing",
      "data": {
        "children": [
          {
            "kind": "t1",
            "data": {
              "author": "helpful_commenter",
              "body": "This is inspiring! What was your biggest challenge?",
              "score": 45,
              "depth": 0,
              "created_utc": 1711756800,
              "replies": {
                "kind": "Listing",
                "data": {
                  "children": [
                    {
                      "kind": "t1",
                      "data": {
                        "author": "startup_guy",
                        "body": "Honestly, customer acquisition was brutal.",
                        "score": 28,
                        "depth": 1,
                        "created_utc": 1711760400,
                        "replies": ""
                      }
                    }
                  ]
                }
              }
            }
          },
          {
            "kind": "t1",
            "data": {
              "author": "skeptic_dave",
              "body": "What's your tech stack?",
              "score": 12,
              "depth": 0,
              "created_utc": 1711764000,
              "replies": ""
            }
          }
        ]
      }
    }
  ]
}
```

**Step 2: Write the failing test**

```python
# backend/tests/test_reddit_context.py
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
    respx.get(url + ".json").mock(
        return_value=httpx.Response(200, json=sample_thread_json["data"])
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
    respx.get(url + ".json").mock(
        return_value=httpx.Response(200, json=sample_thread_json["data"])
    )

    thread = await service.fetch_thread(url)
    top_level = [c for c in thread.comments if c.depth == 0]
    assert len(top_level) == 2
    assert top_level[0].author == "helpful_commenter"
    assert top_level[0].score == 45


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
```

**Step 3: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_reddit_context.py -v
```

Expected: FAIL

**Step 4: Write minimal implementation**

```python
# backend/app/services/reddit_context.py
from dataclasses import dataclass, field

import httpx


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
                self._parse_comments(
                    c["replies"]["data"]["children"], result
                )

    async def sample_subreddit(
        self, subreddit: str, limit: int = 10
    ) -> list[dict]:
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
```

**Step 5: Run tests to verify they pass**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_reddit_context.py -v
```

Expected: 3 passed

**Step 6: Commit**

```bash
git add backend/app/services/reddit_context.py backend/tests/test_reddit_context.py backend/tests/fixtures/
git commit -m "feat: add Reddit context service with thread parsing"
```

---

### Task 5: Tone Analyzer Service

**Files:**
- Create: `backend/app/services/tone_analyzer.py`
- Create: `backend/tests/test_tone_analyzer.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_tone_analyzer.py
import pytest

from app.services.tone_analyzer import ToneAnalyzer, CultureProfile


@pytest.fixture
def analyzer():
    return ToneAnalyzer()


def test_analyze_casual_comments(analyzer):
    comments = [
        "lol this is so true, been there done that",
        "ngl this hits different. gonna try it out",
        "bruh same thing happened to me last week 😂",
        "yo that's wild, how did you even figure that out",
        "fr fr, this is the way to go",
    ]
    profile = analyzer.analyze(comments)
    assert isinstance(profile, CultureProfile)
    assert profile.formality_score < 0.4  # casual
    assert profile.emoji_frequency > 0
    assert profile.avg_sentence_length > 0


def test_analyze_professional_comments(analyzer):
    comments = [
        "This is an excellent analysis. I would recommend considering the tax implications.",
        "From a regulatory standpoint, Section 401(k) provisions may apply here.",
        "I appreciate you sharing this. The methodology is sound and well-documented.",
        "Could you elaborate on the revenue model? The unit economics seem promising.",
        "Great insight. I have been working in this space for fifteen years.",
    ]
    profile = analyzer.analyze(comments)
    assert profile.formality_score > 0.6  # professional


def test_analyze_returns_recommended_tone(analyzer):
    casual_comments = ["lol nice", "bruh moment", "yooo 😂😂"]
    profile = analyzer.analyze(casual_comments)
    assert profile.recommended_tone in ("Casual", "Meme-heavy")


def test_profile_to_prompt_fragment(analyzer):
    comments = ["This is a test comment for analysis purposes."]
    profile = analyzer.analyze(comments)
    fragment = profile.to_prompt_fragment()
    assert isinstance(fragment, str)
    assert len(fragment) > 0
```

**Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_tone_analyzer.py -v
```

Expected: FAIL

**Step 3: Write minimal implementation**

```python
# backend/app/services/tone_analyzer.py
import re
from dataclasses import dataclass


EMOJI_PATTERN = re.compile(
    r"[\U0001f600-\U0001f64f\U0001f300-\U0001f5ff"
    r"\U0001f680-\U0001f6ff\U0001f1e0-\U0001f1ff"
    r"\u2600-\u26ff\u2700-\u27bf]+"
)

SLANG_WORDS = {
    "lol", "lmao", "bruh", "ngl", "fr", "imo", "tbh", "smh",
    "yo", "yooo", "gonna", "wanna", "gotta", "kinda", "sorta",
    "haha", "omg", "wtf", "tho", "rn", "idk", "ikr", "fwiw",
}


@dataclass
class CultureProfile:
    formality_score: float  # 0.0 (very casual) to 1.0 (very formal)
    avg_sentence_length: float
    emoji_frequency: float  # emojis per comment
    slang_frequency: float  # slang words per comment
    recommended_tone: str

    def to_prompt_fragment(self) -> str:
        return (
            f"Community culture profile:\n"
            f"- Tone: {self.recommended_tone}\n"
            f"- Formality: {self.formality_score:.1f}/1.0\n"
            f"- Average sentence length: {self.avg_sentence_length:.0f} words\n"
            f"- Emoji usage: {'common' if self.emoji_frequency > 0.3 else 'rare'}\n"
            f"- Slang usage: {'heavy' if self.slang_frequency > 1.0 else 'moderate' if self.slang_frequency > 0.3 else 'minimal'}\n"
            f"Match this community's communication style naturally."
        )


class ToneAnalyzer:
    def analyze(self, comments: list[str]) -> CultureProfile:
        if not comments:
            return CultureProfile(
                formality_score=0.5,
                avg_sentence_length=15,
                emoji_frequency=0,
                slang_frequency=0,
                recommended_tone="Casual",
            )

        total_emojis = 0
        total_slang = 0
        total_sentences = 0
        total_words = 0

        for comment in comments:
            total_emojis += len(EMOJI_PATTERN.findall(comment))
            words = comment.lower().split()
            total_words += len(words)
            total_slang += sum(1 for w in words if w.strip(".,!?") in SLANG_WORDS)
            sentences = [s.strip() for s in re.split(r"[.!?]+", comment) if s.strip()]
            total_sentences += max(len(sentences), 1)

        n = len(comments)
        avg_sentence_length = total_words / max(total_sentences, 1)
        emoji_freq = total_emojis / n
        slang_freq = total_slang / n

        # Formality heuristic: long sentences + no slang + no emoji = formal
        formality = 0.5
        if avg_sentence_length > 15:
            formality += 0.2
        if avg_sentence_length > 20:
            formality += 0.1
        if slang_freq < 0.3:
            formality += 0.1
        if emoji_freq < 0.1:
            formality += 0.1
        if slang_freq > 1.0:
            formality -= 0.2
        if emoji_freq > 0.5:
            formality -= 0.1
        if avg_sentence_length < 8:
            formality -= 0.2

        formality = max(0.0, min(1.0, formality))

        if formality > 0.7:
            tone = "Professional"
        elif formality > 0.4:
            tone = "Casual"
        elif emoji_freq > 0.5 or slang_freq > 2.0:
            tone = "Meme-heavy"
        else:
            tone = "Concise"

        return CultureProfile(
            formality_score=formality,
            avg_sentence_length=avg_sentence_length,
            emoji_frequency=emoji_freq,
            slang_frequency=slang_freq,
            recommended_tone=tone,
        )
```

**Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_tone_analyzer.py -v
```

Expected: 4 passed

**Step 5: Commit**

```bash
git add backend/app/services/tone_analyzer.py backend/tests/test_tone_analyzer.py
git commit -m "feat: add tone analyzer with culture profiling"
```

---

### Task 6: Prompt Engine

**Files:**
- Create: `backend/app/services/prompt_engine.py`
- Create: `backend/tests/test_prompt_engine.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_prompt_engine.py
import pytest

from app.services.prompt_engine import PromptEngine
from app.services.reddit_context import RedditPost, RedditComment, RedditThread
from app.services.tone_analyzer import CultureProfile


@pytest.fixture
def engine():
    return PromptEngine()


@pytest.fixture
def sample_thread():
    return RedditThread(
        post=RedditPost(
            title="How I grew my startup to $10k MRR",
            selftext="Here's my journey...",
            subreddit="Entrepreneur",
            author="startup_guy",
            score=342,
            flair="Case Study",
            num_comments=87,
        ),
        comments=[
            RedditComment(
                author="helpful_commenter",
                body="This is inspiring! What was your biggest challenge?",
                score=45,
                depth=0,
                created_utc=1711756800,
            ),
        ],
    )


@pytest.fixture
def sample_profile():
    return CultureProfile(
        formality_score=0.6,
        avg_sentence_length=15,
        emoji_frequency=0.1,
        slang_frequency=0.2,
        recommended_tone="Casual",
    )


def test_build_prompts_returns_n_pairs(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=3,
    )
    assert len(prompts) == 3
    for system_prompt, user_prompt in prompts:
        assert isinstance(system_prompt, str)
        assert isinstance(user_prompt, str)
        assert len(system_prompt) > 0
        assert len(user_prompt) > 0


def test_prompts_include_thread_context(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=1,
    )
    system_prompt, user_prompt = prompts[0]
    assert "Entrepreneur" in user_prompt
    assert "How I grew my startup" in user_prompt


def test_prompts_include_tone(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=1,
    )
    system_prompt, _ = prompts[0]
    assert "Casual" in system_prompt or "culture" in system_prompt.lower()


def test_each_draft_has_different_angle(engine, sample_thread, sample_profile):
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=None,
        draft_count=5,
    )
    system_prompts = [sp for sp, _ in prompts]
    # Each should have a distinct angle
    assert len(set(system_prompts)) == 5


def test_reply_to_specific_comment(engine, sample_thread, sample_profile):
    target = sample_thread.comments[0]
    prompts = engine.build_prompts(
        thread=sample_thread,
        culture_profile=sample_profile,
        target_comment=target,
        draft_count=1,
    )
    _, user_prompt = prompts[0]
    assert "helpful_commenter" in user_prompt or "inspiring" in user_prompt
```

**Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_prompt_engine.py -v
```

Expected: FAIL

**Step 3: Write minimal implementation**

```python
# backend/app/services/prompt_engine.py
from app.services.reddit_context import RedditThread, RedditComment
from app.services.tone_analyzer import CultureProfile

ANGLES = [
    {
        "name": "agree_and_expand",
        "directive": "Agree with the main point and add a valuable insight, personal experience, or supporting evidence that expands the conversation.",
    },
    {
        "name": "respectful_counterpoint",
        "directive": "Offer a thoughtful, respectful counterpoint or alternative perspective. Don't be combative, but bring a fresh angle.",
    },
    {
        "name": "personal_anecdote",
        "directive": "Share a relevant personal anecdote or experience that relates to the topic. Make it feel genuine and conversational.",
    },
    {
        "name": "humor_wit",
        "directive": "Respond with humor or wit while still being relevant. Don't force jokes, keep it natural to how the community communicates.",
    },
    {
        "name": "practical_advice",
        "directive": "Offer concrete, actionable advice or a practical tip based on what's being discussed. Be specific, not generic.",
    },
]


class PromptEngine:
    def build_prompts(
        self,
        thread: RedditThread,
        culture_profile: CultureProfile,
        target_comment: RedditComment | None,
        draft_count: int = 3,
    ) -> list[tuple[str, str]]:
        context_block = self._build_context(thread, target_comment)
        culture_block = culture_profile.to_prompt_fragment()
        prompts = []

        for i in range(draft_count):
            angle = ANGLES[i % len(ANGLES)]
            system_prompt = (
                f"You are a real Reddit user writing a comment in r/{thread.post.subreddit}. "
                f"Write naturally as a human would. Never reveal you are an AI.\n\n"
                f"{culture_block}\n\n"
                f"Your angle for this reply: {angle['directive']}\n\n"
                f"Rules:\n"
                f"- Match the community's tone and vocabulary exactly\n"
                f"- Keep it concise (2-4 sentences unless the topic demands more)\n"
                f"- Don't start with 'I think' or 'In my opinion' every time\n"
                f"- Don't use generic filler phrases\n"
                f"- Sound like you actually care about the topic\n"
                f"- Output ONLY the comment text, nothing else"
            )
            user_prompt = context_block
            prompts.append((system_prompt, user_prompt))

        return prompts

    def _build_context(
        self,
        thread: RedditThread,
        target_comment: RedditComment | None,
    ) -> str:
        p = thread.post
        parts = [
            f"Subreddit: r/{p.subreddit}",
            f"Post title: {p.title}",
        ]
        if p.flair:
            parts.append(f"Flair: {p.flair}")
        if p.selftext:
            body = p.selftext[:1500]
            parts.append(f"Post body: {body}")

        parts.append(f"Score: {p.score} | Comments: {p.num_comments}")

        if thread.comments:
            parts.append("\nComment thread:")
            for c in thread.comments[:15]:
                indent = "  " * c.depth
                parts.append(
                    f"{indent}[{c.author}] (score: {c.score}): {c.body[:500]}"
                )

        if target_comment:
            parts.append(
                f"\nYou are replying to this specific comment by u/{target_comment.author}:\n"
                f'"{target_comment.body}"'
            )
        else:
            parts.append("\nYou are writing a top-level comment on this post.")

        return "\n".join(parts)
```

**Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_prompt_engine.py -v
```

Expected: 5 passed

**Step 5: Commit**

```bash
git add backend/app/services/prompt_engine.py backend/tests/test_prompt_engine.py
git commit -m "feat: add prompt engine with multi-angle generation"
```

---

### Task 7: Pydantic Request/Response Models

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/requests.py`
- Create: `backend/app/models/responses.py`

**Step 1: Write the models (simple data classes, no test needed)**

```python
# backend/app/models/__init__.py
```

```python
# backend/app/models/requests.py
from pydantic import BaseModel, Field


class ThreadContext(BaseModel):
    url: str
    post_title: str
    post_body: str = ""
    subreddit: str
    post_author: str = ""
    post_score: int = 0
    post_flair: str = ""
    comments: list[dict] = Field(default_factory=list)
    target_comment: dict | None = None


class GenerateRequest(BaseModel):
    context: ThreadContext
    tone: str = "auto"  # "auto", "Professional", "Casual", "Concise", "Meme-heavy"
    draft_count: int = Field(default=3, ge=1, le=5)
    temperature: float = Field(default=0.8, ge=0.0, le=2.0)
    max_tokens: int = Field(default=300, ge=50, le=1000)
    model: str | None = None  # override default model


class SettingsUpdate(BaseModel):
    model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    draft_count: int | None = None
```

```python
# backend/app/models/responses.py
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    vllm_connected: bool
    model: str


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
```

**Step 2: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add pydantic request/response models"
```

---

### Task 8: FastAPI App & Routers

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/generate.py`
- Create: `backend/app/routers/tone.py`
- Create: `backend/app/routers/settings.py`
- Create: `backend/tests/test_generate.py`

**Step 1: Write the failing integration test**

```python
# backend/tests/test_generate.py
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
        respx.get("https://www.reddit.com/r/test/comments/abc/test_post/.json").mock(
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
```

**Step 2: Run test to verify it fails**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_generate.py -v
```

Expected: FAIL

**Step 3: Write the routers and main app**

```python
# backend/app/routers/__init__.py
```

```python
# backend/app/routers/settings.py
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
```

```python
# backend/app/routers/tone.py
from fastapi import APIRouter

from app.config import settings
from app.models.responses import ToneResponse
from app.services.reddit_context import RedditContextService
from app.services.tone_analyzer import ToneAnalyzer

router = APIRouter(prefix="/api")


@router.post("/analyze-tone", response_model=ToneResponse)
async def analyze_tone(subreddit: str):
    reddit = RedditContextService(user_agent=settings.REDDIT_USER_AGENT)
    posts = await reddit.sample_subreddit(subreddit, limit=10)

    comments_text = [p["selftext"] for p in posts if p["selftext"]]
    analyzer = ToneAnalyzer()
    profile = analyzer.analyze(comments_text)

    return ToneResponse(
        formality_score=profile.formality_score,
        avg_sentence_length=profile.avg_sentence_length,
        emoji_frequency=profile.emoji_frequency,
        slang_frequency=profile.slang_frequency,
        recommended_tone=profile.recommended_tone,
    )
```

```python
# backend/app/routers/generate.py
import json

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.models.requests import GenerateRequest
from app.services.prompt_engine import PromptEngine, ANGLES
from app.services.reddit_context import (
    RedditContextService,
    RedditComment,
    RedditThread,
)
from app.services.tone_analyzer import ToneAnalyzer
from app.services.vllm_client import VLLMClient

router = APIRouter(prefix="/api")


@router.post("/generate")
async def generate(req: GenerateRequest):
    reddit = RedditContextService(user_agent=settings.REDDIT_USER_AGENT)

    # Fetch full thread from Reddit API
    thread = await reddit.fetch_thread(req.context.url)

    # Analyze tone
    if req.tone == "auto":
        posts = await reddit.sample_subreddit(thread.post.subreddit, limit=10)
        sample_texts = [p["selftext"] for p in posts if p["selftext"]]
        comment_texts = [c.body for c in thread.comments[:10]]
        analyzer = ToneAnalyzer()
        culture_profile = analyzer.analyze(sample_texts + comment_texts)
    else:
        analyzer = ToneAnalyzer()
        culture_profile = analyzer.analyze([])
        culture_profile.recommended_tone = req.tone

    # Build target comment if provided
    target = None
    if req.context.target_comment:
        tc = req.context.target_comment
        target = RedditComment(
            author=tc.get("author", ""),
            body=tc.get("body", ""),
            score=tc.get("score", 0),
            depth=tc.get("depth", 0),
            created_utc=tc.get("created_utc", 0),
        )

    # Build prompts
    engine = PromptEngine()
    prompts = engine.build_prompts(
        thread=thread,
        culture_profile=culture_profile,
        target_comment=target,
        draft_count=req.draft_count,
    )

    # Generate replies
    model = req.model or settings.VLLM_MODEL
    client = VLLMClient(
        base_url=settings.VLLM_BASE_URL,
        api_key=settings.VLLM_API_KEY,
        model=model,
    )

    async def event_stream():
        for i, (system_prompt, user_prompt) in enumerate(prompts):
            angle_name = ANGLES[i % len(ANGLES)]["name"]
            text = await client.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                temperature=req.temperature,
                max_tokens=req.max_tokens,
            )
            yield {
                "event": "draft",
                "data": json.dumps(
                    {
                        "index": i,
                        "text": text,
                        "angle": angle_name,
                        "done": True,
                    }
                ),
            }
        yield {"event": "complete", "data": "{}"}

    return EventSourceResponse(event_stream())
```

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import generate, tone, settings

app = FastAPI(
    title="OpenRedditKarmaBot",
    version="0.1.0",
    description="Open-source Reddit karma bot backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(tone.router)
app.include_router(settings.router)
```

**Step 4: Run tests to verify they pass**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest tests/test_generate.py -v
```

Expected: 4 passed

**Step 5: Run full test suite**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest -v
```

Expected: all tests pass

**Step 6: Commit**

```bash
git add backend/app/main.py backend/app/routers/ backend/tests/test_generate.py
git commit -m "feat: add FastAPI app with generate, tone, and settings routers"
```

---

### Task 9: Chrome Extension — Manifest & Service Worker

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/background/service_worker.js`
- Create: `extension/icons/` (placeholder icons)

**Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "OpenRedditKarmaBot",
  "version": "0.1.0",
  "description": "AI-powered Reddit comment generator with biometric typing simulation",
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["*://*.reddit.com/*"],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "background/service_worker.js"
  },
  "content_scripts": [
    {
      "matches": ["*://*.reddit.com/*"],
      "js": [
        "utils/bigram_timings.js",
        "content/scanner.js",
        "content/typing_engine.js",
        "content/injector.js"
      ],
      "run_at": "document_idle"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

**Step 2: Create service worker**

```javascript
// extension/background/service_worker.js

const DEFAULT_SETTINGS = {
  backendUrl: "http://localhost:8000",
  apiKey: "",
  wpm: 85,
  draftCount: 3,
  tone: "auto",
  autoSubmit: false,
  typoSimulation: false,
  temperature: 0.8,
  maxTokens: 300,
  model: "",
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("settings");
  if (!stored.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
});

// Message routing between popup and content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SETTINGS") {
    chrome.storage.local.get("settings").then((data) => {
      sendResponse(data.settings || DEFAULT_SETTINGS);
    });
    return true; // async response
  }

  if (message.type === "SAVE_SETTINGS") {
    chrome.storage.local.set({ settings: message.settings }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "SCAN_PAGE") {
    // Forward to content script in active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { type: "SCAN_PAGE" }, (result) => {
          sendResponse(result);
        });
      }
    });
    return true;
  }

  if (message.type === "TYPE_REPLY") {
    // Forward typing command to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TYPE_REPLY",
          text: message.text,
          wpm: message.wpm,
          typoSimulation: message.typoSimulation,
          autoSubmit: message.autoSubmit,
        });
        sendResponse({ ok: true });
      }
    });
    return true;
  }
});
```

**Step 3: Create placeholder icons**

Generate simple colored square PNGs at 16x16, 48x48, 128x128 using canvas (or just create empty placeholder files — real icons come later).

**Step 4: Commit**

```bash
git add extension/manifest.json extension/background/service_worker.js extension/icons/
git commit -m "feat: add Chrome extension manifest and service worker"
```

---

### Task 10: Chrome Extension — DOM Scanner

**Files:**
- Create: `extension/content/scanner.js`

**Step 1: Write the scanner**

```javascript
// extension/content/scanner.js

const RedditScanner = {
  scan() {
    const url = window.location.href;
    const isOldReddit = url.includes("old.reddit.com");

    if (isOldReddit) {
      return this._scanOldReddit();
    }
    return this._scanNewReddit();
  },

  _scanNewReddit() {
    const result = {
      url: window.location.href,
      post_title: "",
      post_body: "",
      subreddit: "",
      post_author: "",
      post_score: 0,
      post_flair: "",
      comments: [],
      target_comment: null,
    };

    // Subreddit from URL
    const subMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (subMatch) result.subreddit = subMatch[1];

    // Post title
    const titleEl =
      document.querySelector('[data-testid="post-title"]') ||
      document.querySelector("h1") ||
      document.querySelector('[slot="title"]');
    if (titleEl) result.post_title = titleEl.textContent.trim();

    // Post body
    const bodyEl =
      document.querySelector('[data-testid="post-text-content"]') ||
      document.querySelector('[slot="text-body"]') ||
      document.querySelector(".Post .RichTextJSON-root");
    if (bodyEl) result.post_body = bodyEl.textContent.trim();

    // Post author
    const authorEl =
      document.querySelector('[data-testid="post-author"]') ||
      document.querySelector('a[href*="/user/"]');
    if (authorEl) {
      const authorMatch = authorEl.textContent.match(/u\/(\S+)/);
      result.post_author = authorMatch ? authorMatch[1] : authorEl.textContent.trim();
    }

    // Comments
    const commentEls = document.querySelectorAll(
      '[data-testid="comment"], shreddit-comment, .Comment'
    );
    commentEls.forEach((el, idx) => {
      const authorNode =
        el.querySelector('[data-testid="comment-author"]') ||
        el.querySelector('a[href*="/user/"]');
      const bodyNode =
        el.querySelector('[data-testid="comment-text-content"]') ||
        el.querySelector(".RichTextJSON-root") ||
        el.querySelector('[slot="comment"]');
      const scoreNode = el.querySelector('[data-testid="comment-score"]');

      const depth = parseInt(el.getAttribute("depth") || "0", 10);

      if (bodyNode) {
        result.comments.push({
          author: authorNode ? authorNode.textContent.replace("u/", "").trim() : "",
          body: bodyNode.textContent.trim(),
          score: scoreNode ? parseInt(scoreNode.textContent, 10) || 0 : 0,
          depth: depth,
          index: idx,
        });
      }
    });

    return result;
  },

  _scanOldReddit() {
    const result = {
      url: window.location.href,
      post_title: "",
      post_body: "",
      subreddit: "",
      post_author: "",
      post_score: 0,
      post_flair: "",
      comments: [],
      target_comment: null,
    };

    const subMatch = window.location.pathname.match(/\/r\/([^/]+)/);
    if (subMatch) result.subreddit = subMatch[1];

    const titleEl = document.querySelector("a.title");
    if (titleEl) result.post_title = titleEl.textContent.trim();

    const bodyEl = document.querySelector(".usertext-body .md");
    if (bodyEl) result.post_body = bodyEl.textContent.trim();

    const authorEl = document.querySelector(".top-matter .author");
    if (authorEl) result.post_author = authorEl.textContent.trim();

    const commentEls = document.querySelectorAll(".comment .entry");
    commentEls.forEach((el, idx) => {
      const authorNode = el.querySelector(".author");
      const bodyNode = el.querySelector(".usertext-body .md");
      const scoreNode = el.querySelector(".score.unvoted");

      const nestLevel = el.closest(".comment")
        ? (el.closest(".comment").className.match(/noncollapsed/g) || []).length
        : 0;

      if (bodyNode) {
        result.comments.push({
          author: authorNode ? authorNode.textContent.trim() : "",
          body: bodyNode.textContent.trim(),
          score: scoreNode ? parseInt(scoreNode.textContent, 10) || 0 : 0,
          depth: nestLevel,
          index: idx,
        });
      }
    });

    return result;
  },
};

// Listen for scan requests from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SCAN_PAGE") {
    const result = RedditScanner.scan();
    sendResponse(result);
  }
});
```

**Step 2: Commit**

```bash
git add extension/content/scanner.js
git commit -m "feat: add Reddit DOM scanner for new and old Reddit"
```

---

### Task 11: Chrome Extension — Biometric Typing Engine

**Files:**
- Create: `extension/utils/bigram_timings.js`
- Create: `extension/content/typing_engine.js`

**Step 1: Create bigram timing data**

```javascript
// extension/utils/bigram_timings.js

// Bigram speed multipliers relative to base typing speed.
// < 1.0 = faster (common pairs), > 1.0 = slower (awkward pairs)
const BIGRAM_TIMINGS = {
  // Fast common bigrams (muscle memory)
  th: 0.65, he: 0.68, in: 0.70, er: 0.70, an: 0.72,
  re: 0.72, on: 0.73, at: 0.74, en: 0.74, nd: 0.75,
  ti: 0.75, es: 0.76, or: 0.76, te: 0.77, of: 0.77,
  ed: 0.78, is: 0.78, it: 0.78, al: 0.79, ar: 0.79,
  st: 0.79, to: 0.80, nt: 0.80, ng: 0.80, se: 0.81,
  ha: 0.81, as: 0.82, ou: 0.82, io: 0.82, le: 0.83,
  ve: 0.83, co: 0.83, me: 0.84, de: 0.84, hi: 0.84,
  ri: 0.85, ro: 0.85, ic: 0.85, ne: 0.85, ea: 0.85,
  ra: 0.86, ce: 0.86, li: 0.86, ch: 0.87, ll: 0.87,
  be: 0.87, ma: 0.88, si: 0.88, om: 0.88, ur: 0.88,

  // Slow awkward bigrams (different hands, uncomfortable reaches)
  qx: 1.50, zp: 1.45, bv: 1.40, xz: 1.45, qz: 1.50,
  zx: 1.40, vb: 1.35, xc: 1.30, zq: 1.50, px: 1.35,
  jq: 1.45, qj: 1.45, xq: 1.50, zv: 1.40, vz: 1.40,
  bq: 1.40, qb: 1.40, jx: 1.40, xj: 1.40, kq: 1.35,
};

// Adjacent keys on QWERTY layout (for typo simulation)
const ADJACENT_KEYS = {
  q: ["w", "a"], w: ["q", "e", "s", "a"], e: ["w", "r", "d", "s"],
  r: ["e", "t", "f", "d"], t: ["r", "y", "g", "f"], y: ["t", "u", "h", "g"],
  u: ["y", "i", "j", "h"], i: ["u", "o", "k", "j"], o: ["i", "p", "l", "k"],
  p: ["o", "l"], a: ["q", "w", "s", "z"], s: ["a", "w", "e", "d", "z", "x"],
  d: ["s", "e", "r", "f", "x", "c"], f: ["d", "r", "t", "g", "c", "v"],
  g: ["f", "t", "y", "h", "v", "b"], h: ["g", "y", "u", "j", "b", "n"],
  j: ["h", "u", "i", "k", "n", "m"], k: ["j", "i", "o", "l", "m"],
  l: ["k", "o", "p"], z: ["a", "s", "x"], x: ["z", "s", "d", "c"],
  c: ["x", "d", "f", "v"], v: ["c", "f", "g", "b"], b: ["v", "g", "h", "n"],
  n: ["b", "h", "j", "m"], m: ["n", "j", "k"],
};
```

**Step 2: Create typing engine**

```javascript
// extension/content/typing_engine.js

const TypingEngine = {
  _isTyping: false,
  _abortController: null,

  async typeText(element, text, options = {}) {
    if (this._isTyping) {
      this.abort();
      await new Promise((r) => setTimeout(r, 100));
    }

    this._isTyping = true;
    this._abortController = new AbortController();

    const wpm = options.wpm || 85;
    const typoSimulation = options.typoSimulation || false;
    const typoRate = 0.015; // 1.5% error rate

    const baseInterval = 60000 / (wpm * 5); // ms per character
    let charsSinceMicroPause = 0;
    let charsSinceThinkPause = 0;
    const microPauseInterval = this._randInt(15, 40);
    const thinkPauseInterval = this._randInt(80, 200);
    let prevChar = "";

    element.focus();

    for (let i = 0; i < text.length; i++) {
      if (this._abortController.signal.aborted) break;

      const char = text[i];

      // Typo simulation
      if (
        typoSimulation &&
        Math.random() < typoRate &&
        ADJACENT_KEYS[char.toLowerCase()]
      ) {
        const adjacent =
          ADJACENT_KEYS[char.toLowerCase()][
            this._randInt(0, ADJACENT_KEYS[char.toLowerCase()].length - 1)
          ];
        const wrongChar = char === char.toUpperCase() ? adjacent.toUpperCase() : adjacent;

        // Type wrong character
        this._insertChar(element, wrongChar);
        await this._sleep(this._randInt(80, 200));

        // Pause (noticing the mistake)
        await this._sleep(this._randInt(200, 500));

        // Backspace
        this._deleteChar(element);
        await this._sleep(this._randInt(50, 120));
      }

      // Calculate delay for this character
      let delay = baseInterval;

      // Gaussian jitter (+/- 30%)
      delay *= 1 + this._gaussianRandom() * 0.3;

      // Bigram timing
      if (prevChar) {
        const bigram = (prevChar + char).toLowerCase();
        if (BIGRAM_TIMINGS[bigram]) {
          delay *= BIGRAM_TIMINGS[bigram];
        }
      }

      // Word boundary pause
      if (char === " ") {
        delay += this._randInt(50, 150);
      }

      // Micro-pause
      charsSinceMicroPause++;
      if (charsSinceMicroPause >= microPauseInterval) {
        await this._sleep(this._randInt(200, 800));
        charsSinceMicroPause = 0;
      }

      // Thinking pause
      charsSinceThinkPause++;
      if (charsSinceThinkPause >= thinkPauseInterval) {
        await this._sleep(this._randInt(1000, 3000));
        charsSinceThinkPause = 0;
      }

      // Type the character
      this._insertChar(element, char);
      prevChar = char;

      await this._sleep(Math.max(delay, 20));
    }

    this._isTyping = false;
  },

  _insertChar(element, char) {
    element.focus();
    // Use execCommand for trusted input events
    document.execCommand("insertText", false, char);
  },

  _deleteChar(element) {
    element.focus();
    document.execCommand("delete", false, null);
  },

  abort() {
    if (this._abortController) {
      this._abortController.abort();
    }
    this._isTyping = false;
  },

  isTyping() {
    return this._isTyping;
  },

  _sleep(ms) {
    return new Promise((resolve) => {
      const id = setTimeout(resolve, ms);
      if (this._abortController) {
        this._abortController.signal.addEventListener("abort", () => {
          clearTimeout(id);
          resolve();
        });
      }
    });
  },

  _gaussianRandom() {
    // Box-Muller transform
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  },

  _randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};
```

**Step 3: Commit**

```bash
git add extension/utils/bigram_timings.js extension/content/typing_engine.js
git commit -m "feat: add biometric typing engine with bigram timings"
```

---

### Task 12: Chrome Extension — Comment Injector

**Files:**
- Create: `extension/content/injector.js`

**Step 1: Write the injector**

```javascript
// extension/content/injector.js

const CommentInjector = {
  findReplyBox(targetCommentIndex) {
    // For top-level comments (no target), find the main comment box
    if (targetCommentIndex === null || targetCommentIndex === undefined) {
      return this._findMainCommentBox();
    }
    return this._findReplyBoxForComment(targetCommentIndex);
  },

  _findMainCommentBox() {
    // New Reddit
    const newReddit =
      document.querySelector('[data-testid="comment-composer"] div[contenteditable]') ||
      document.querySelector('div[contenteditable="true"][data-placeholder]') ||
      document.querySelector('.Comment__commentInput div[contenteditable]') ||
      document.querySelector('shreddit-composer div[contenteditable]');
    if (newReddit) return newReddit;

    // New Reddit textarea fallback
    const textarea =
      document.querySelector('[data-testid="comment-composer"] textarea') ||
      document.querySelector('textarea[placeholder*="comment"]');
    if (textarea) return textarea;

    // Old Reddit
    const oldReddit = document.querySelector(".usertext-edit textarea");
    if (oldReddit) return oldReddit;

    return null;
  },

  _findReplyBoxForComment(commentIndex) {
    const comments = document.querySelectorAll(
      '[data-testid="comment"], shreddit-comment, .comment .entry'
    );

    if (commentIndex >= comments.length) return null;
    const commentEl = comments[commentIndex];

    // Try to find an open reply box within this comment
    const replyBox =
      commentEl.querySelector('div[contenteditable="true"]') ||
      commentEl.querySelector("textarea");
    if (replyBox) return replyBox;

    // Try to click the reply button to open the reply box
    const replyBtn =
      commentEl.querySelector('[data-testid="comment-reply-button"]') ||
      commentEl.querySelector('button[aria-label="Reply"]') ||
      commentEl.querySelector(".reply-button a") ||
      commentEl.querySelector('button:has(> span)');

    if (replyBtn) {
      replyBtn.click();
      // Wait a moment for the reply box to appear
      return new Promise((resolve) => {
        setTimeout(() => {
          const box =
            commentEl.querySelector('div[contenteditable="true"]') ||
            commentEl.querySelector("textarea");
          resolve(box);
        }, 500);
      });
    }

    return null;
  },

  async typeReply(text, options = {}) {
    const targetIndex = options.targetCommentIndex;
    let replyBox = this.findReplyBox(targetIndex);

    if (replyBox instanceof Promise) {
      replyBox = await replyBox;
    }

    if (!replyBox) {
      return { success: false, error: "Could not find reply box" };
    }

    replyBox.focus();
    replyBox.click();

    await new Promise((r) => setTimeout(r, 200));

    await TypingEngine.typeText(replyBox, text, {
      wpm: options.wpm || 85,
      typoSimulation: options.typoSimulation || false,
    });

    if (options.autoSubmit) {
      await this._clickSubmit(replyBox);
    }

    return { success: true };
  },

  async _clickSubmit(replyBox) {
    await new Promise((r) => setTimeout(r, 500));

    // Find submit button near the reply box
    const container = replyBox.closest("form") || replyBox.parentElement?.parentElement;
    if (!container) return;

    const submitBtn =
      container.querySelector('button[type="submit"]') ||
      container.querySelector('[data-testid="comment-submit-button"]') ||
      container.querySelector('button:not([aria-label="Reply"])');

    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click();
    }
  },
};

// Listen for typing commands from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TYPE_REPLY") {
    CommentInjector.typeReply(message.text, {
      wpm: message.wpm,
      typoSimulation: message.typoSimulation,
      autoSubmit: message.autoSubmit,
      targetCommentIndex: message.targetCommentIndex,
    }).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});
```

**Step 2: Commit**

```bash
git add extension/content/injector.js
git commit -m "feat: add comment injector with reply box detection"
```

---

### Task 13: Chrome Extension — Popup UI

**Files:**
- Create: `extension/popup/popup.html`
- Create: `extension/popup/popup.css`
- Create: `extension/popup/popup.js`

**Step 1: Create popup.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRedditKarmaBot</title>
  <link rel="stylesheet" href="popup.css">
</head>
<body>
  <div id="app">
    <!-- Header -->
    <header>
      <h1>OpenRedditKarmaBot</h1>
      <button id="settings-btn" title="Settings">&#9881;</button>
    </header>

    <!-- Main View -->
    <div id="main-view">
      <!-- Thread Info -->
      <div id="thread-info" class="card">
        <div id="subreddit-badge"></div>
        <div id="post-title">Click "Scan" to read the current thread</div>
      </div>

      <!-- Controls -->
      <div class="controls">
        <button id="scan-btn" class="btn primary">Scan Thread</button>

        <div class="control-row">
          <label for="tone-select">Tone</label>
          <select id="tone-select">
            <option value="auto">Auto-detect</option>
            <option value="Professional">Professional</option>
            <option value="Casual">Casual</option>
            <option value="Concise">Concise</option>
            <option value="Meme-heavy">Meme-heavy</option>
          </select>
        </div>

        <div class="control-row">
          <label for="draft-count">Drafts: <span id="draft-count-display">3</span></label>
          <input type="range" id="draft-count" min="1" max="5" value="3">
        </div>

        <button id="generate-btn" class="btn primary" disabled>Generate Replies</button>
      </div>

      <!-- Drafts -->
      <div id="drafts-container" class="hidden">
        <h2>Drafts</h2>
        <div id="drafts-list"></div>
      </div>

      <!-- Action Buttons -->
      <div id="action-buttons" class="hidden">
        <button id="type-btn" class="btn accent" disabled>Type It</button>
        <button id="regenerate-btn" class="btn secondary">Regenerate</button>
      </div>

      <!-- Status -->
      <div id="status" class="hidden"></div>
    </div>

    <!-- Settings View -->
    <div id="settings-view" class="hidden">
      <h2>Settings</h2>

      <div class="setting-group">
        <label for="backend-url">Backend URL</label>
        <input type="url" id="backend-url" placeholder="http://localhost:8000">
      </div>

      <div class="setting-group">
        <label for="api-key">API Key (optional)</label>
        <input type="password" id="api-key" placeholder="Leave empty for no auth">
      </div>

      <div class="setting-group">
        <label for="wpm">Typing Speed (WPM)</label>
        <input type="number" id="wpm" min="30" max="200" value="85">
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="auto-submit"> Auto-submit after typing
        </label>
      </div>

      <div class="setting-group">
        <label>
          <input type="checkbox" id="typo-simulation"> Enable typo simulation
        </label>
      </div>

      <div class="buttons-row">
        <button id="save-settings-btn" class="btn primary">Save</button>
        <button id="back-btn" class="btn secondary">Back</button>
      </div>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Create popup.css**

```css
/* extension/popup/popup.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  width: 380px;
  min-height: 400px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  font-size: 14px;
}

#app {
  padding: 16px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

header h1 {
  font-size: 16px;
  color: #ff6b35;
  font-weight: 700;
}

#settings-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 20px;
  cursor: pointer;
}

#settings-btn:hover {
  color: #ff6b35;
}

.card {
  background: #16213e;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

#subreddit-badge {
  font-size: 11px;
  color: #ff6b35;
  margin-bottom: 4px;
}

#post-title {
  font-size: 13px;
  color: #ccc;
  line-height: 1.4;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-row label {
  font-size: 12px;
  color: #aaa;
}

select, input[type="range"] {
  background: #16213e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

select {
  width: 140px;
}

input[type="range"] {
  width: 120px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s;
}

.btn:hover {
  opacity: 0.85;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.primary {
  background: #ff6b35;
  color: #fff;
}

.btn.secondary {
  background: #333;
  color: #ccc;
}

.btn.accent {
  background: #4ecca3;
  color: #1a1a2e;
}

#drafts-container h2 {
  font-size: 13px;
  color: #888;
  margin-bottom: 8px;
}

.draft-card {
  background: #16213e;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s;
}

.draft-card:hover {
  border-color: #333;
}

.draft-card.selected {
  border-color: #4ecca3;
}

.draft-card .angle {
  font-size: 10px;
  color: #ff6b35;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.draft-card .text {
  font-size: 13px;
  line-height: 1.5;
  color: #ddd;
}

#action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

#action-buttons .btn {
  flex: 1;
}

#status {
  margin-top: 12px;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
}

#status.error {
  background: #3d1515;
  color: #ff6b6b;
}

#status.success {
  background: #153d2e;
  color: #4ecca3;
}

#status.loading {
  background: #1a2a4a;
  color: #6bb3ff;
}

.hidden {
  display: none !important;
}

/* Settings view */
#settings-view h2 {
  font-size: 15px;
  margin-bottom: 16px;
}

.setting-group {
  margin-bottom: 14px;
}

.setting-group label {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}

.setting-group input[type="url"],
.setting-group input[type="password"],
.setting-group input[type="number"] {
  width: 100%;
  background: #16213e;
  color: #e0e0e0;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 8px;
  font-size: 13px;
}

.setting-group input[type="checkbox"] {
  margin-right: 6px;
}

.buttons-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.buttons-row .btn {
  flex: 1;
}
```

**Step 3: Create popup.js**

```javascript
// extension/popup/popup.js

let settings = {};
let scannedContext = null;
let selectedDraftIndex = null;
let drafts = [];

// --- Init ---
document.addEventListener("DOMContentLoaded", async () => {
  settings = await getSettings();
  applySettings();
  bindEvents();
});

// --- Settings ---
async function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" }, (resp) => {
      resolve(resp || {});
    });
  });
}

function applySettings() {
  document.getElementById("backend-url").value = settings.backendUrl || "http://localhost:8000";
  document.getElementById("api-key").value = settings.apiKey || "";
  document.getElementById("wpm").value = settings.wpm || 85;
  document.getElementById("auto-submit").checked = settings.autoSubmit || false;
  document.getElementById("typo-simulation").checked = settings.typoSimulation || false;
  document.getElementById("tone-select").value = settings.tone || "auto";
  document.getElementById("draft-count").value = settings.draftCount || 3;
  document.getElementById("draft-count-display").textContent = settings.draftCount || 3;
}

// --- Events ---
function bindEvents() {
  document.getElementById("settings-btn").addEventListener("click", showSettings);
  document.getElementById("back-btn").addEventListener("click", hideSettings);
  document.getElementById("save-settings-btn").addEventListener("click", saveSettings);
  document.getElementById("scan-btn").addEventListener("click", scanThread);
  document.getElementById("generate-btn").addEventListener("click", generateReplies);
  document.getElementById("type-btn").addEventListener("click", typeSelectedDraft);
  document.getElementById("regenerate-btn").addEventListener("click", generateReplies);
  document.getElementById("draft-count").addEventListener("input", (e) => {
    document.getElementById("draft-count-display").textContent = e.target.value;
  });
}

function showSettings() {
  document.getElementById("main-view").classList.add("hidden");
  document.getElementById("settings-view").classList.remove("hidden");
}

function hideSettings() {
  document.getElementById("settings-view").classList.add("hidden");
  document.getElementById("main-view").classList.remove("hidden");
}

async function saveSettings() {
  settings = {
    backendUrl: document.getElementById("backend-url").value.replace(/\/$/, ""),
    apiKey: document.getElementById("api-key").value,
    wpm: parseInt(document.getElementById("wpm").value, 10),
    autoSubmit: document.getElementById("auto-submit").checked,
    typoSimulation: document.getElementById("typo-simulation").checked,
    tone: document.getElementById("tone-select").value,
    draftCount: parseInt(document.getElementById("draft-count").value, 10),
  };

  await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SAVE_SETTINGS", settings }, resolve);
  });

  showStatus("Settings saved", "success");
  setTimeout(hideSettings, 800);
}

// --- Scan ---
async function scanThread() {
  showStatus("Scanning thread...", "loading");
  scannedContext = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "SCAN_PAGE" }, (result) => {
      resolve(result);
    });
  });

  if (!scannedContext || !scannedContext.post_title) {
    showStatus("No Reddit thread detected. Navigate to a post first.", "error");
    return;
  }

  document.getElementById("subreddit-badge").textContent = `r/${scannedContext.subreddit}`;
  document.getElementById("post-title").textContent = scannedContext.post_title;
  document.getElementById("generate-btn").disabled = false;
  showStatus(`Found ${scannedContext.comments.length} comments`, "success");
}

// --- Generate ---
async function generateReplies() {
  if (!scannedContext) return;

  const draftCount = parseInt(document.getElementById("draft-count").value, 10);
  const tone = document.getElementById("tone-select").value;

  showStatus("Generating replies...", "loading");
  document.getElementById("generate-btn").disabled = true;
  document.getElementById("drafts-container").classList.add("hidden");
  document.getElementById("action-buttons").classList.add("hidden");
  drafts = [];
  selectedDraftIndex = null;

  try {
    const backendUrl = settings.backendUrl || "http://localhost:8000";
    const response = await fetch(`${backendUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: scannedContext,
        tone: tone,
        draft_count: draftCount,
        temperature: settings.temperature || 0.8,
        max_tokens: settings.maxTokens || 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    // Read SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === "{}") continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              drafts.push(data);
              renderDrafts();
            }
          } catch (e) {
            // skip malformed SSE data
          }
        }
      }
    }

    if (drafts.length > 0) {
      showStatus(`Generated ${drafts.length} drafts`, "success");
    } else {
      showStatus("No drafts generated. Check backend connection.", "error");
    }
  } catch (err) {
    showStatus(`Error: ${err.message}`, "error");
  }

  document.getElementById("generate-btn").disabled = false;
}

function renderDrafts() {
  const container = document.getElementById("drafts-list");
  container.innerHTML = "";

  drafts.forEach((draft, idx) => {
    const card = document.createElement("div");
    card.className = `draft-card${idx === selectedDraftIndex ? " selected" : ""}`;
    card.innerHTML = `
      <div class="angle">${(draft.angle || "").replace(/_/g, " ")}</div>
      <div class="text">${escapeHtml(draft.text)}</div>
    `;
    card.addEventListener("click", () => selectDraft(idx));
    container.appendChild(card);
  });

  document.getElementById("drafts-container").classList.remove("hidden");
  document.getElementById("action-buttons").classList.remove("hidden");
}

function selectDraft(index) {
  selectedDraftIndex = index;
  document.getElementById("type-btn").disabled = false;
  renderDrafts();
}

// --- Type ---
async function typeSelectedDraft() {
  if (selectedDraftIndex === null || !drafts[selectedDraftIndex]) return;

  const text = drafts[selectedDraftIndex].text;
  showStatus("Typing reply...", "loading");
  document.getElementById("type-btn").disabled = true;

  chrome.runtime.sendMessage(
    {
      type: "TYPE_REPLY",
      text: text,
      wpm: settings.wpm || 85,
      typoSimulation: settings.typoSimulation || false,
      autoSubmit: settings.autoSubmit || false,
    },
    (result) => {
      if (result && result.success !== false) {
        showStatus("Reply typed!", "success");
      } else {
        showStatus(result?.error || "Failed to type reply", "error");
      }
      document.getElementById("type-btn").disabled = false;
    }
  );
}

// --- Utils ---
function showStatus(message, type) {
  const el = document.getElementById("status");
  el.textContent = message;
  el.className = type;
  el.classList.remove("hidden");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
```

**Step 4: Commit**

```bash
git add extension/popup/
git commit -m "feat: add Chrome extension popup UI"
```

---

### Task 14: Placeholder Icons & README

**Files:**
- Create: `extension/icons/` (generate simple SVG-based PNGs)
- Create: `README.md`
- Create: `extension/README.md`
- Create: `backend/README.md`

**Step 1: Create README.md**

```markdown
# OpenRedditKarmaBot

Open-source Reddit karma bot with AI-powered reply generation and biometric typing simulation.

## Features

- **Context-Aware Replies** — Reads the full thread (post + comments) to generate relevant responses
- **Multi-Angle Generation** — Produces multiple drafts with different perspectives
- **Adaptive Tone Matching** — Auto-detects subreddit culture and matches your replies to it
- **Biometric Typing Engine** — Simulates human keystroke patterns (variable WPM, bigram delays, micro-pauses)
- **Any LLM Backend** — Works with vLLM, Ollama, or any OpenAI-compatible API
- **Zero Dependencies Extension** — Pure vanilla JS Chrome extension, no build step

## Architecture

Chrome Extension (DOM scanning + typing engine) + FastAPI backend (Reddit API + tone analysis + LLM inference).

## Quick Start

### Backend

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env
# Edit .env with your vLLM endpoint
uvicorn app.main:app --reload
```

### Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory

### Usage

1. Navigate to any Reddit thread
2. Click the OpenRedditKarmaBot extension icon
3. Click "Scan Thread"
4. Adjust tone and draft count
5. Click "Generate Replies"
6. Select a draft
7. Click "Type It" — watch it type naturally into the reply box

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Backend URL | `http://localhost:8000` | FastAPI server address |
| Model | `qwen3.5:27b` | Any OpenAI-compatible model |
| WPM | 85 | Typing speed for biometric simulation |
| Draft Count | 3 | Number of reply variants (1-5) |
| Temperature | 0.8 | LLM creativity (0.0-2.0) |

## License

MIT
```

**Step 2: Generate placeholder icons**

Use a Python script to create simple colored square icons:

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot
python3 -c "
from PIL import Image
for size in [16, 48, 128]:
    img = Image.new('RGBA', (size, size), (255, 107, 53, 255))
    img.save(f'extension/icons/icon{size}.png')
print('Icons created')
"
```

If PIL not available, create 1x1 PNGs with pure Python:

```python
import struct, zlib
def make_png(size, r, g, b):
    def chunk(ctype, data):
        c = ctype + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    raw = b''
    for _ in range(size):
        raw += b'\x00' + bytes([r, g, b]) * size
    return (b'\x89PNG\r\n\x1a\n' +
            chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)) +
            chunk(b'IDAT', zlib.compress(raw)) +
            chunk(b'IEND', b''))

for s in [16, 48, 128]:
    with open(f'extension/icons/icon{s}.png', 'wb') as f:
        f.write(make_png(s, 255, 107, 53))
```

**Step 3: Commit**

```bash
git add README.md extension/icons/ backend/README.md extension/README.md
git commit -m "feat: add README and placeholder extension icons"
```

---

### Task 15: Final Integration Test & Polish

**Step 1: Run the full backend test suite**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
python -m pytest -v
```

Expected: All tests pass

**Step 2: Verify extension loads in Chrome**

Manual verification:
1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Load unpacked -> select `extension/` directory
4. Verify no errors in the extension card
5. Click the extension icon, verify popup renders

**Step 3: Test backend server starts**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot/backend
uvicorn app.main:app --port 8080 &
curl http://localhost:8080/api/health
kill %1
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification"
```

**Step 5: Create GitHub repo and push**

```bash
cd /home/ubuntu/git/personal/OpenRedditKarmaBot
gh repo create jasperan/OpenRedditKarmaBot --public --source=. --push
```
