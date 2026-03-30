# OpenRedditKarmaBot — Design Document

**Date:** 2026-03-30
**Status:** Approved

## Overview

Open-source Reddit karma bot inspired by karmabuilder.xyz. Chrome Extension + Python backend architecture. Uses vLLM for contextually relevant reply generation and biometric keystroke simulation for undetectable typing.

## Key Decisions

| Decision | Choice |
|----------|--------|
| Deployment model | Chrome Extension + Python backend |
| Default model | Qwen3.5-27B (configurable to any OpenAI-compatible endpoint) |
| Chrome stealth | Extension handles typing simulation directly via content script |
| Scope | Comments only (reply to posts + reply to comments) |
| Context extraction | Hybrid: DOM scraping + Reddit `.json` endpoints |
| Tone matching | Auto-detect with manual override presets |
| Draft generation | Configurable 1-5 drafts, default 3 |
| Auth | Optional API key for vLLM endpoint, no account system |
| Backend | FastAPI (async, streaming SSE) |
| Architecture | Hybrid split: extension owns browser stuff, Python owns AI stuff |
| Extension UI | Vanilla HTML/CSS/JS popup, no framework |
| Typing engine | Biometric simulation with bigram timings, micro-pauses, jitter |
| License | MIT |

## Architecture

```
┌─────────────────────────────────────┐
│         Chrome Extension            │
│                                     │
│  ┌───────────┐  ┌────────────────┐  │
│  │  Content   │  │   Popup UI     │  │
│  │  Script    │  │  (HTML/CSS/JS) │  │
│  │            │  │                │  │
│  │ • DOM scan │  │ • Reply drafts │  │
│  │ • Typing   │  │ • Tone picker  │  │
│  │   engine   │  │ • Draft count  │  │
│  │ • Comment  │  │ • Settings     │  │
│  │   inject   │  │ • "Type It"    │  │
│  └─────┬──┬──┘  └───────┬────────┘  │
│        │  │              │           │
│        │  └──────────────┘           │
│        │    (message passing)        │
└────────┼─────────────────────────────┘
         │ HTTP (localhost)
         │
┌────────┴─────────────────────────────┐
│         FastAPI Backend              │
│                                      │
│  ┌──────────────┐ ┌───────────────┐  │
│  │ Reddit       │ │ Prompt        │  │
│  │ Context      │ │ Engine        │  │
│  │              │ │               │  │
│  │ • .json API  │ │ • Template    │  │
│  │ • Comment    │ │   builder     │  │
│  │   tree parse │ │ • Tone inject │  │
│  │ • Subreddit  │ │ • Multi-angle │  │
│  │   sampling   │ │   prompts     │  │
│  └──────────────┘ └───────┬───────┘  │
│                           │          │
│  ┌──────────────┐ ┌───────┴───────┐  │
│  │ Tone         │ │ vLLM          │  │
│  │ Analyzer     │ │ Client        │  │
│  │              │ │               │  │
│  │ • Culture    │ │ • OpenAI-     │  │
│  │   profiling  │ │   compatible  │  │
│  │ • Style      │ │ • Streaming   │  │
│  │   extraction │ │ • Any model   │  │
│  └──────────────┘ └───────────────┘  │
└──────────────────────────────────────┘
```

### Data Flow

1. User browses Reddit, clicks extension icon
2. Content script scrapes current page (post title, body, visible comments, target comment)
3. Extension sends scraped context + current URL to FastAPI backend
4. Backend fetches full comment tree via Reddit `.json`, samples subreddit culture, builds prompt
5. Backend sends N drafts back to extension via streaming SSE
6. User picks a draft, clicks "Type It"
7. Content script's biometric typing engine physically types the reply into Reddit's comment box

## Chrome Extension Design

**Manifest V3** (required for Chrome Web Store distribution).

### Content Script (injected on `*.reddit.com`)

**DOM Scanner:**
- Extracts post title, body, flair, subreddit name
- Extracts comment chain up to the target reply box

**Biometric Typing Engine:**
- Base WPM configurable (default ~85 WPM)
- Per-character gaussian variance (+/- 30%)
- Bigram timing: common pairs ("th", "er", "in") get 20-40% speed boost; awkward pairs ("qx", "zp") get 30-50% penalty
- Word boundary pause: extra 50-150ms after space
- Micro-pauses: every 15-40 chars, 200-800ms pause
- Thinking pauses: every 80-200 chars, 1-3s pause
- Optional typo simulation (off by default): 1-2% error rate, type wrong adjacent key, backspace, retype
- Uses `document.execCommand('insertText', false, char)` for trusted input events
- Dispatches proper `KeyboardEvent`, `InputEvent` sequences for React compatibility
- No clipboard events, no DOM mutations outside reply box

**Comment Injector:**
- Focuses reply box, triggers typing, optional auto-submit toggle

### Popup UI (vanilla HTML/CSS/JS)

- Thread summary (post title, subreddit)
- Tone selector dropdown (Auto-detect, Professional, Casual, Concise, Meme-heavy)
- Draft count slider (1-5, default 3)
- Draft cards with selection
- "Regenerate" button per draft
- "Type It" button on selected draft
- Settings page: backend URL, API key, WPM config, auto-submit toggle

### Background Service Worker

- Routes messages between content script and popup
- Manages backend connection state
- Stores settings in `chrome.storage.local`

## FastAPI Backend Design

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/generate` | Receives context, returns N reply drafts (streaming SSE) |
| `POST` | `/api/analyze-tone` | Fetches subreddit samples, returns culture profile |
| `GET` | `/api/health` | Health check, confirms vLLM connection |
| `GET` | `/api/models` | Lists available models from vLLM endpoint |
| `PUT` | `/api/settings` | Update runtime settings (model, temperature, etc.) |

### Core Modules

**`reddit_context.py`** — fetches `<reddit_url>.json`, parses comment tree into structured format (author, score, depth, body, timestamp), samples top 10 comments from subreddit for culture profiling.

**`tone_analyzer.py`** — takes subreddit samples, extracts style features (avg sentence length, emoji usage, slang frequency, formality score). Returns culture profile dict injected into prompt.

**`prompt_engine.py`** — builds system prompt + user prompt per draft. Each of N drafts gets a different angle directive ("agree and expand", "respectful counterpoint", "personal anecdote", "humor/wit", "practical advice"). Injects tone profile and full thread context.

**`vllm_client.py`** — thin async wrapper around httpx calling OpenAI-compatible `/v1/chat/completions`. Supports streaming. Configurable endpoint URL, API key, model name, temperature, max tokens. Disables thinking mode for Qwen3.5 (`extra_body: {"chat_template_kwargs": {"enable_thinking": false}}`).

**`config.py`** — pydantic settings from env vars / `.env`. Defaults: model `qwen3.5:27b`, vLLM endpoint `http://localhost:8000/v1`, temperature 0.8, max_tokens 300, draft_count 3.

### Streaming Format

`/api/generate` returns Server-Sent Events:
```
event: draft
data: {"index": 0, "token": "I", "done": false}
...
event: draft
data: {"index": 0, "token": "", "done": true, "full_text": "I think..."}
```

## Project Structure

```
OpenRedditKarmaBot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── routers/
│   │   │   ├── generate.py
│   │   │   ├── tone.py
│   │   │   └── settings.py
│   │   ├── services/
│   │   │   ├── reddit_context.py
│   │   │   ├── tone_analyzer.py
│   │   │   ├── prompt_engine.py
│   │   │   └── vllm_client.py
│   │   └── models/
│   │       ├── requests.py
│   │       └── responses.py
│   ├── tests/
│   │   ├── test_reddit_context.py
│   │   ├── test_tone_analyzer.py
│   │   ├── test_prompt_engine.py
│   │   └── test_generate.py
│   ├── pyproject.toml
│   ├── .env.example
│   └── README.md
├── extension/
│   ├── manifest.json
│   ├── popup/
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   ├── content/
│   │   ├── scanner.js
│   │   ├── typing_engine.js
│   │   └── injector.js
│   ├── background/
│   │   └── service_worker.js
│   ├── utils/
│   │   └── bigram_timings.js
│   ├── icons/
│   └── README.md
├── docs/
│   └── plans/
├── .gitignore
├── LICENSE
└── README.md
```

### Backend Dependencies

- `fastapi`, `uvicorn` — web server
- `httpx` — async HTTP for vLLM + Reddit `.json`
- `pydantic-settings` — config management
- `sse-starlette` — Server-Sent Events
- `pytest`, `pytest-asyncio` — testing

### Extension Dependencies

None. Pure vanilla JS, no build step, no bundler. Load via `chrome://extensions` developer mode.
