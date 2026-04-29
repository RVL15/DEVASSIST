import json
import logging
import time
from typing import AsyncGenerator, List, Dict

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class OllamaError(Exception):
    pass


class OllamaService:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=settings.OLLAMA_BASE_URL,
            timeout=settings.OLLAMA_TIMEOUT,
        )

    # ── Core ──────────────────────────────────────────────────────────────────

    async def complete(self, prompt: str, system: str = "", max_tokens: int | None = None) -> str:
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {
                "temperature": settings.OLLAMA_TEMPERATURE,
                "num_predict": max_tokens or settings.OLLAMA_MAX_TOKENS,
            },
        }
        try:
            resp = await self._client.post("/api/generate", json=payload)
            resp.raise_for_status()
            return resp.json()["response"].strip()
        except httpx.HTTPError as e:
            raise OllamaError(f"Ollama request failed: {e}") from e

    async def chat(self, messages: List[Dict], system: str = "") -> str:
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": messages,
            "system": system,
            "stream": False,
            "options": {
                "temperature": settings.OLLAMA_TEMPERATURE,
                "num_predict": settings.OLLAMA_MAX_TOKENS,
            },
        }
        try:
            resp = await self._client.post("/api/chat", json=payload)
            resp.raise_for_status()
            return resp.json()["message"]["content"].strip()
        except httpx.HTTPError as e:
            raise OllamaError(f"Ollama chat failed: {e}") from e

    async def stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        payload = {
            "model": settings.OLLAMA_MODEL,
            "prompt": prompt,
            "system": system,
            "stream": True,
            "options": {"temperature": settings.OLLAMA_TEMPERATURE},
        }
        async with self._client.stream("POST", "/api/generate", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line:
                    data = json.loads(line)
                    if token := data.get("response"):
                        yield token
                    if data.get("done"):
                        break

    async def health(self) -> bool:
        try:
            resp = await self._client.get("/api/tags")
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self):
        await self._client.aclose()


# Singleton
ollama = OllamaService()
