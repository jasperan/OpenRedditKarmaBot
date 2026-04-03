#!/usr/bin/env python3
"""Tiny OpenAI-compatible mock server for local walkthroughs."""

from __future__ import annotations

import argparse
import json
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def build_mock_reply(payload: dict) -> str:
    model = payload.get("model", "mock-model")
    messages = payload.get("messages", [])
    user_prompt = next(
        (message.get("content", "") for message in reversed(messages) if message.get("role") == "user"),
        "",
    )
    subreddit = "this thread"
    for line in user_prompt.splitlines():
        if line.lower().startswith("subreddit: r/"):
            subreddit = line.split("r/", 1)[1].strip()
            break

    if "practical tip" in user_prompt.lower() or "practical_advice" in user_prompt.lower():
        opener = "Practical take:"
    elif "counterpoint" in user_prompt.lower():
        opener = "Counterpoint:"
    else:
        opener = "Mock reply:"

    return f"{opener} for r/{subreddit}, the local walkthrough is working via {model}."


class MockHandler(BaseHTTPRequestHandler):
    server_version = "OpenRedditMockLLM/0.1"

    def _send_json(self, body: dict, status: HTTPStatus = HTTPStatus.OK):
        encoded = json.dumps(body).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self):
        if self.path == "/v1/models":
            self._send_json({"data": [{"id": "mock-qwen"}]})
            return
        self._send_json({"error": "not found"}, status=HTTPStatus.NOT_FOUND)

    def do_POST(self):
        if self.path != "/v1/chat/completions":
            self._send_json({"error": "not found"}, status=HTTPStatus.NOT_FOUND)
            return

        length = int(self.headers.get("Content-Length", "0"))
        payload = json.loads(self.rfile.read(length) or b"{}")
        content = build_mock_reply(payload)
        self._send_json(
            {
                "id": "mock-chatcmpl-1",
                "object": "chat.completion",
                "choices": [
                    {
                        "index": 0,
                        "message": {"role": "assistant", "content": content},
                        "finish_reason": "stop",
                    }
                ],
            }
        )

    def log_message(self, format: str, *args):
        return


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8011)
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), MockHandler)
    print(f"mock-openai-server listening on http://{args.host}:{args.port}/v1")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
