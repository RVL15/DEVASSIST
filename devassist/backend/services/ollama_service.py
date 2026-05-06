import logging
from typing import List, Dict, AsyncGenerator
import httpx
from core.config import settings

logger = logging.getLogger(__name__)

class OllamaError(Exception):
    pass

class OllamaService:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url="https://api.groq.com/openai/v1",
            timeout=settings.GROQ_TIMEOUT,
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        )

    # ── Core ──────────────────────────────────────────────────────────────────

    async def complete(self, prompt: str, system: str = "", max_tokens: int | None = None) -> str:
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": settings.GROQ_TEMPERATURE,
            "max_tokens": max_tokens or settings.GROQ_MAX_TOKENS,
        }
        try:
            resp = await self._client.post("/chat/completions", json=payload)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except httpx.TimeoutException:
            raise OllamaError("Groq API request timed out. Please try again.")
        except httpx.ConnectError:
            raise OllamaError("Could not connect to Groq API. Check internet connection.")
        except httpx.HTTPError as e:
            try:
                body = resp.json()
                logger.error(f"Groq API error: {body}")
                raise OllamaError(f"Groq API failed: {body.get('error', {}).get('message', str(e))}")
            except:
                raise OllamaError(f"Groq API failed: {str(e) or 'Unknown HTTP error'}") from e

    async def chat(self, messages: List[Dict], system: str = "") -> str:
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": messages,
            "temperature": settings.GROQ_TEMPERATURE,
            "max_tokens": settings.GROQ_MAX_TOKENS,
        }
        try:
            resp = await self._client.post("/chat/completions", json=payload)
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except httpx.TimeoutException:
            raise OllamaError("Groq API chat timed out. Please try again.")
        except httpx.ConnectError:
            raise OllamaError("Could not connect to Groq API. Check internet connection.")
        except httpx.HTTPError as e:
            raise OllamaError(f"Groq API chat failed: {str(e) or 'Unknown HTTP error'}") from e

    async def stream(self, prompt: str, system: str = "") -> AsyncGenerator[str, None]:
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": settings.GROQ_TEMPERATURE,
            "max_tokens": settings.GROQ_MAX_TOKENS,
            "stream": True,
        }
        async with self._client.stream("POST", "/chat/completions", json=payload) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = __import__("json").loads(line[6:])
                        if chunk := data.get("choices", [{}])[0].get("delta", {}).get("content", ""):
                            yield chunk
                    except: pass

    async def health(self) -> bool:
        try:
            payload = {"model": settings.GROQ_MODEL, "messages": [{"role": "user", "content": "ok"}], "max_tokens": 1}
            resp = await self._client.post("/chat/completions", json=payload)
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self):
        await self._client.aclose()


# Singleton
ollama = OllamaService()
