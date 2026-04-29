import time
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from core.models import AutocompleteRequest, AutocompleteResponse
from services.ollama_service import ollama
from prompts.templates import autocomplete_prompt, SYSTEM_BASE
from cache.lru_cache import cache

router = APIRouter()


@router.post("/autocomplete", response_model=AutocompleteResponse)
async def autocomplete(req: AutocompleteRequest):
    ctx = req.file_context.content if req.file_context else ""
    lang = req.file_context.language if req.file_context else "auto"

    cached = cache.get(req.prefix, req.suffix, ctx, lang)
    if cached:
        return AutocompleteResponse(completion=cached, latency_ms=0.0)

    prompt = autocomplete_prompt(req.prefix, req.suffix, ctx, lang)
    t0 = time.perf_counter()
    completion = await ollama.complete(prompt, system=SYSTEM_BASE, max_tokens=req.max_tokens)
    latency = (time.perf_counter() - t0) * 1000

    cache.set(req.prefix, req.suffix, ctx, lang, value=completion)
    return AutocompleteResponse(completion=completion, latency_ms=round(latency, 2))


@router.post("/autocomplete/stream")
async def autocomplete_stream(req: AutocompleteRequest):
    ctx = req.file_context.content if req.file_context else ""
    lang = req.file_context.language if req.file_context else "auto"
    prompt = autocomplete_prompt(req.prefix, req.suffix, ctx, lang)

    async def token_gen():
        async for token in ollama.stream(prompt, system=SYSTEM_BASE):
            yield token

    return StreamingResponse(token_gen(), media_type="text/plain")
