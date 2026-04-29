import time
import uuid
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.responses import FileResponse

from api.routes import autocomplete, explain, bugfix, refactor, generate, chat, auth as auth_routes
from core.config import settings
from utils.logger import setup_logging
from services.auth_service import auth as auth_service

# backend/main.py is at: <repo>/devassist/backend/main.py
# frontend/dist is at:  <repo>/frontend/dist
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("DevAssist backend starting...")
    yield
    logger.info("DevAssist backend shutdown.")


app = FastAPI(
    title="DevAssist API",
    version="1.0.0",
    description="Production-grade AI developer assistant powered by local LLMs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logger(request: Request, call_next):
    req_id = str(uuid.uuid4())[:8]
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(f"[{req_id}] {request.method} {request.url.path} -> {response.status_code} ({elapsed:.1f}ms)")
    response.headers["X-Request-ID"] = req_id
    response.headers["X-Response-Time"] = f"{elapsed:.1f}ms"
    return response


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """
    Protect all tool endpoints under /api/v1/* using HTTPOnly session cookie.
    """
    path = request.url.path
    if not path.startswith("/api/v1/"):
        return await call_next(request)

    # Public auth endpoints
    if path in {"/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/me"}:
        return await call_next(request)

    token = request.cookies.get(settings.AUTH_SESSION_COOKIE)
    username = auth_service.validate_session(token)
    if not username:
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"error": "Unauthorized"})

    request.state.username = username
    return await call_next(request)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={"error": str(exc)})


app.include_router(autocomplete.router, prefix="/api/v1", tags=["autocomplete"])
app.include_router(explain.router,     prefix="/api/v1", tags=["explain"])
app.include_router(bugfix.router,      prefix="/api/v1", tags=["bugfix"])
app.include_router(refactor.router,    prefix="/api/v1", tags=["refactor"])
app.include_router(generate.router,    prefix="/api/v1", tags=["generate"])
app.include_router(chat.router,        prefix="/api/v1", tags=["chat"])
app.include_router(auth_routes.router,  prefix="/api/v1", tags=["auth"])


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}


@app.get("/")
async def root():
    if FRONTEND_DIST_DIR.exists():
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
    return {
        "name": "DevAssist API",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }


if FRONTEND_DIST_DIR.exists():
    # Serve built assets at /assets so the React app can load its JS/CSS.
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        # Let FastAPI own its special routes.
        if full_path.startswith("api/") or full_path.startswith("api/v1/"):
            return JSONResponse(status_code=404, content={"error": "Not found"})
        if full_path in {"health"}:
            return JSONResponse(status_code=404, content={"error": "Not found"})
        if full_path in {"docs", "redoc", "openapi.json"}:
            return JSONResponse(status_code=404, content={"error": "Not found"})

        # SPA fallback: serve the React index.html for all other frontend routes.
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
