from fastapi import APIRouter, Request, status
from fastapi.responses import JSONResponse

from core.config import settings
from core.models import LoginRequest, LoginResponse, UserListResponse, ApproveUserRequest
from services.auth_service import auth

router = APIRouter()


@router.post("/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    token = auth.login(req.username, req.password)
    if not token:
        # Check if user exists but not approved
        user = auth._users.get(req.username)
        if user and user.get("status") == "pending":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Account pending admin approval"},
            )
        elif user and user.get("status") == "denied":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Account has been denied access"},
            )
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
    is_admin = auth.is_admin(username)
    return {"username": username, "is_admin": is_admin}


@router.get("/auth/users", response_model=UserListResponse)
async def get_users(request: Request):
    """Get all users (admin only)"""
    token = request.cookies.get(settings.AUTH_SESSION_COOKIE)
    username = auth.validate_session(token)
    if not username or not auth.is_admin(username):
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden"})
    
    users = auth.get_all_users()
    return {"users": users}


@router.post("/auth/users/{username}/approve")
async def approve_user(username: str, req: ApproveUserRequest, request: Request):
    """Approve or deny user (admin only)"""
    token = request.cookies.get(settings.AUTH_SESSION_COOKIE)
    admin_username = auth.validate_session(token)
    if not admin_username or not auth.is_admin(admin_username):
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"error": "Forbidden"})
    
    success = auth.approve_user(username, req.approved)
    if not success:
        return JSONResponse(status_code=404, content={"error": "User not found"})
    
    return {"ok": True, "username": username, "approved": req.approved}

