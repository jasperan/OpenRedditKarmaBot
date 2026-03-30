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
