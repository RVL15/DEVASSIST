import time
from fastapi import APIRouter
from core.models import ChatRequest, ChatResponse
from services.ollama_service import ollama
from services.session_service import memory
from prompts.templates import chat_system

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    ctx = req.file_context.content if req.file_context else ""
    system = chat_system(ctx)

    memory.add(req.session_id, "user", req.message)
    messages = memory.get(req.session_id)

    t0 = time.perf_counter()
    reply = await ollama.chat(messages, system=system)
    latency = (time.perf_counter() - t0) * 1000

    memory.add(req.session_id, "assistant", reply)
    return ChatResponse(session_id=req.session_id, reply=reply, latency_ms=round(latency, 2))


@router.delete("/chat/{session_id}")
async def clear_session(session_id: str):
    memory.clear(session_id)
    return {"cleared": session_id}
