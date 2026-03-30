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
