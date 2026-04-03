#!/usr/bin/env python3
"""Run a local browser walkthrough against the browser-facing code."""

from __future__ import annotations

import argparse
import os
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def find_free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


def wait_for(url: str, attempts: int = 80, delay: float = 0.25) -> None:
    for _ in range(attempts):
        try:
            with urllib.request.urlopen(url, timeout=5):
                return
        except Exception:
            time.sleep(delay)
    raise RuntimeError(f"Timed out waiting for {url}")


def chrome_binary(explicit: str | None) -> str:
    candidates = [explicit, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"]
    for candidate in candidates:
        if candidate and shutil.which(candidate):
            return candidate
    raise RuntimeError("No Chrome/Chromium binary found")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-port", type=int, default=0)
    parser.add_argument("--static-port", type=int, default=0)
    parser.add_argument("--chrome-binary")
    args = parser.parse_args()

    api_port = args.api_port or find_free_port()
    static_port = args.static_port or find_free_port()
    chrome = chrome_binary(args.chrome_binary)

    env = os.environ.copy()
    env.setdefault("PYTHONUNBUFFERED", "1")

    api_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "127.0.0.1",
        "--port",
        str(api_port),
    ]
    static_cmd = [sys.executable, "-m", "http.server", str(static_port), "--bind", "127.0.0.1"]

    processes: list[subprocess.Popen] = []
    try:
        api_env = env | {"VLLM_BASE_URL": "http://127.0.0.1:9/v1", "VLLM_MODEL": "demo:local"}
        processes.append(subprocess.Popen(api_cmd, cwd=REPO_ROOT / "backend", env=api_env))
        processes.append(subprocess.Popen(static_cmd, cwd=REPO_ROOT, env=env))

        wait_for(f"http://127.0.0.1:{api_port}/api/models")
        wait_for(f"http://127.0.0.1:{static_port}/tests/e2e/walkthrough_harness.html")

        url = (
            f"http://127.0.0.1:{static_port}/tests/e2e/walkthrough_harness.html"
            f"?backend=http://127.0.0.1:{api_port}"
        )
        dom = subprocess.check_output(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--virtual-time-budget=60000",
                "--dump-dom",
                url,
            ],
            text=True,
        )

        if 'id="walkthrough-status" data-status="pass"' not in dom:
            print(dom)
            raise RuntimeError("Walkthrough harness did not report pass status")

        print("Local walkthrough passed.")
        return 0
    finally:
        for process in reversed(processes):
            process.terminate()
        for process in reversed(processes):
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
