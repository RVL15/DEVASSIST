import time
from fastapi import APIRouter
from core.models import ExplainRequest, ExplainResponse
from services.ollama_service import ollama
from prompts.templates import explain_prompt, SYSTEM_BASE
from cache.lru_cache import cache

router = APIRouter()


@router.post("/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest):
    cached = cache.get(req.code, req.language, req.detail_level)
    if cached:
        return ExplainResponse(explanation=cached, latency_ms=0.0)

    prompt = explain_prompt(req.code, req.language, req.detail_level)
    t0 = time.perf_counter()
    explanation = await ollama.complete(prompt, system=SYSTEM_BASE)
    latency = (time.perf_counter() - t0) * 1000

    cache.set(req.code, req.language, req.detail_level, value=explanation)
    return ExplainResponse(explanation=explanation, latency_ms=round(latency, 2))
