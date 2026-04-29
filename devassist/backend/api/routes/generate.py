import time
import json
import logging
from fastapi import APIRouter
from core.models import GenerateRequest, GenerateResponse
from services.ollama_service import ollama
from prompts.templates import generate_prompt, SYSTEM_BASE

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    ctx = req.file_context.content if req.file_context else ""
    prompt = generate_prompt(req.prompt, req.language, ctx)

    t0 = time.perf_counter()
    raw = await ollama.complete(prompt, system=SYSTEM_BASE)
    latency = (time.perf_counter() - t0) * 1000

    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        data = json.loads(raw[start:end])
        code = data.get("code", "")
        explanation = data.get("explanation", "")
    except Exception as e:
        logger.warning(f"Generate parse failed: {e}")
        code, explanation = raw, ""

    return GenerateResponse(code=code, explanation=explanation, latency_ms=round(latency, 2))
