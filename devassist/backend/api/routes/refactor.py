import time
import json
import logging
from fastapi import APIRouter
from core.models import RefactorRequest, RefactorResponse
from services.ollama_service import ollama
from prompts.templates import refactor_prompt, SYSTEM_BASE
from cache.lru_cache import cache

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/refactor", response_model=RefactorResponse)
async def refactor(req: RefactorRequest):
    goals_key = ",".join(sorted(req.goals))
    cached = cache.get(req.code, req.language, goals_key)
    if cached:
        data = json.loads(cached)
        return RefactorResponse(**data, latency_ms=0.0)

    prompt = refactor_prompt(req.code, req.language, req.goals)
    t0 = time.perf_counter()
    raw = await ollama.complete(prompt, system=SYSTEM_BASE)
    latency = (time.perf_counter() - t0) * 1000

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        data = json.loads(raw[start:end])
        refactored = data.get("refactored_code", req.code)
        changes = data.get("changes", [])
    except Exception as e:
        logger.warning(f"Refactor parse failed: {e}")
        refactored, changes = raw, ["Refactoring applied"]

    cache.set(req.code, req.language, goals_key,
              value=json.dumps({"refactored_code": refactored, "changes": changes}))
    return RefactorResponse(refactored_code=refactored, changes=changes, latency_ms=round(latency, 2))
