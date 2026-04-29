import time
import json
import logging
from fastapi import APIRouter
from core.models import BugFixRequest, BugFixResponse, Bug
from services.ollama_service import ollama
from prompts.templates import bugfix_prompt, SYSTEM_BASE, autocomplete_prompt
from cache.lru_cache import cache

router = APIRouter()
logger = logging.getLogger(__name__)


def _parse_bugs(raw: str) -> list[Bug]:
    try:
        start = raw.find("[")
        end = raw.rfind("]") + 1
        data = json.loads(raw[start:end])
        return [Bug(**b) for b in data]
    except Exception as e:
        logger.warning(f"Bug parse failed: {e} | raw={raw[:200]}")
        return []


@router.post("/bugfix", response_model=BugFixResponse)
async def bugfix(req: BugFixRequest):
    ctx = req.file_context.content if req.file_context else ""
    lang = req.language

    cached = cache.get(req.code, lang, "bugs")
    if cached:
        bugs_raw, fixed = json.loads(cached)
        return BugFixResponse(bugs=[Bug(**b) for b in bugs_raw], fixed_code=fixed, latency_ms=0.0)

    t0 = time.perf_counter()

    # Step 1: detect bugs
    bugs_prompt = bugfix_prompt(req.code, lang, ctx)
    bugs_raw = await ollama.complete(bugs_prompt, system=SYSTEM_BASE)
    bugs = _parse_bugs(bugs_raw)

    # Step 2: generate fixed code
    fix_prompt = (
        f"Fix all bugs in this {lang} code and return ONLY the corrected code:\n\n"
        f"```{lang}\n{req.code}\n```\n\nFixed code:"
    )
    fixed_code = await ollama.complete(fix_prompt, system=SYSTEM_BASE)
    # strip markdown fences if present
    if "```" in fixed_code:
        lines = fixed_code.split("\n")
        fixed_code = "\n".join(l for l in lines if not l.startswith("```"))

    latency = (time.perf_counter() - t0) * 1000
    cache.set(req.code, lang, "bugs", value=json.dumps(([b.model_dump() for b in bugs], fixed_code)))
    return BugFixResponse(bugs=bugs, fixed_code=fixed_code.strip(), latency_ms=round(latency, 2))
