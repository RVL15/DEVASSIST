from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from core.config import settings
from core.models import LoginRequest, LoginResponse
from services.auth_service import auth

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    token = auth.login(req.username, req.password)
    if not token:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": "Invalid credentials"},
        )

    payload = LoginResponse(ok=True, username=req.username, token=token, latency_ms=0.0).model_dump()
    resp = JSONResponse(content=payload)
    resp.set_cookie(
        key=settings.AUTH_SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        max_age=settings.AUTH_SESSION_TTL_SECONDS,
        path="/",
    )
    return resp


@router.post("/auth/logout")
async def logout(request: Request):
    token = request.cookies.get(settings.AUTH_SESSION_COOKIE)
    auth.logout(token)
    resp = JSONResponse(content={"ok": True})
    resp.delete_cookie(key=settings.AUTH_SESSION_COOKIE, path="/")
    return resp


@router.get("/auth/me")
async def me(request: Request):
    token = request.cookies.get(settings.AUTH_SESSION_COOKIE)
    username = auth.validate_session(token)
    if not username:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"error": "Unauthorized"})
    return {"username": username}

