import time
from fastapi import APIRouter
from core.models import ExplainRequest, ExplainResponse
from services.ollama_service import ollama
from prompts.templates import explain_prompt, SYSTEM_BASE
from cache.lru_cache import cache

router = APIRouter()


from fastapi.responses import StreamingResponse

@router.post("/explain")
async def explain(req: ExplainRequest):
    cached = cache.get(req.code, req.language, req.detail_level)
    if cached:
        # We can yield the cached result as a single chunk
        async def cached_stream():
            yield cached
        return StreamingResponse(cached_stream(), media_type="text/plain")

    prompt = explain_prompt(req.code, req.language, req.detail_level)
    
    # We won't cache streamed responses directly here to keep it simple and fast
    # but you could collect it in a background task if needed.
    return StreamingResponse(ollama.stream(prompt, system=SYSTEM_BASE), media_type="text/plain")
