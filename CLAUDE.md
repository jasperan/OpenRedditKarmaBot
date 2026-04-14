# CLAUDE.md

AI-powered Reddit reply bot: FastAPI backend generates context-aware, tone-matched replies via any OpenAI-compatible LLM, Chrome extension types them with biometric keystroke simulation.

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic, httpx, uvicorn, SSE
- **Extension**: Vanilla JS, Chrome Manifest V3 (no build step, no node_modules)
- **LLM**: vLLM, Ollama, or any OpenAI-compatible endpoint (default: `qwen3.5:27b`)
- **Testing**: pytest, pytest-asyncio, pytest-httpx, respx

## Environment Setup

```bash
conda create -n openredditkarmabot python=3.12
conda activate openredditkarmabot
cd backend
pip install -e ".[dev]"
cp .env.example .env
# Edit .env: set VLLM_BASE_URL, VLLM_MODEL (use "demo:local" for offline testing)
```

## Run

```bash
# Backend
cd backend
uvicorn app.main:app --reload
# Serves at http://localhost:8000; demo thread at http://127.0.0.1:8000/demo/thread

# Extension
# chrome://extensions -> Developer mode -> Load unpacked -> select extension/

# Full browser walkthrough (starts backend + Chrome automation)
bash scripts/run_local_walkthrough.sh
```

## Test

```bash
cd backend
pytest tests/ -v
# 31 tests across: config, demo flow, generate, prompt engine, reddit context, tone analyzer, vllm client
```

## Architecture

```
backend/
  app/
    main.py          # FastAPI app, CORS, router registration
    config.py        # pydantic-settings config (reads .env)
    routers/         # generate, tone, settings, demo
    services/        # vllm_client, tone_analyzer, prompt_engine, reddit_context
    models/          # Pydantic request/response schemas
  tests/             # pytest suite (asyncio_mode=auto)
  pyproject.toml

extension/
  manifest.json      # MV3
  background/        # service worker
  content/           # DOM scanner, context extractor, comment injector
  popup/             # popup UI
  utils/             # biometric typing engine
```

## Key Patterns

- `asyncio_mode = "auto"` in pytest config -- all tests are async by default
- `pytest-httpx` + `respx` for mocking HTTP calls to LLM backends
- Extension communicates with backend via `http://localhost:8000` (configurable in popup settings)
- `demo:local` model ID bypasses LLM calls entirely -- backend returns canned drafts; use for offline dev/testing
- API token forwarded from extension as `X-Model-Api-Key` header for secured endpoints
- SSE (`sse-starlette`) used for streaming generation responses

## Configuration (.env)

| Key | Default | Description |
|-----|---------|-------------|
| `VLLM_BASE_URL` | `http://localhost:8000` | LLM endpoint base URL |
| `VLLM_MODEL` | `qwen3.5:27b` | Model ID (use `demo:local` for offline) |

## Extension Config (popup)

| Setting | Default |
|---------|---------|
| Backend URL | `http://localhost:8000` |
| WPM | `85` |
| Draft Count | `3` |
| Temperature | `0.8` |
| Max tokens | `300` |
