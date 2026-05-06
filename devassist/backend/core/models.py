from typing import Optional, List, Literal
from pydantic import BaseModel, Field


Language = Literal["python", "javascript", "typescript", "cpp", "java", "go", "rust", "auto"]


class FileContext(BaseModel):
    content: str = Field(..., description="Full file content")
    language: Language = "auto"
    filename: Optional[str] = None


# ── Autocomplete ──────────────────────────────────────────────────────────────
class AutocompleteRequest(BaseModel):
    prefix: str = Field(..., description="Code before cursor")
    suffix: str = Field("", description="Code after cursor")
    file_context: Optional[FileContext] = None
    max_tokens: int = 256


class AutocompleteResponse(BaseModel):
    completion: str
    latency_ms: float


# ── Explain ───────────────────────────────────────────────────────────────────
class ExplainRequest(BaseModel):
    code: str
    language: Language = "auto"
    detail_level: Literal["brief", "detailed"] = "detailed"


class ExplainResponse(BaseModel):
    explanation: str
    latency_ms: float


# ── Bug Detection ─────────────────────────────────────────────────────────────
class Bug(BaseModel):
    line: Optional[int] = None
    type: str
    description: str
    fix: str


class BugFixRequest(BaseModel):
    code: str
    language: Language = "auto"
    file_context: Optional[FileContext] = None


class BugFixResponse(BaseModel):
    bugs: List[Bug]
    fixed_code: str
    latency_ms: float


# ── Refactor ──────────────────────────────────────────────────────────────────
class RefactorRequest(BaseModel):
    code: str
    language: Language = "auto"
    goals: List[Literal["readability", "performance", "security", "dry"]] = ["readability"]


class RefactorResponse(BaseModel):
    refactored_code: str
    changes: List[str]
    latency_ms: float


# ── Generate ──────────────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    prompt: str
    language: Language = "python"
    file_context: Optional[FileContext] = None


class GenerateResponse(BaseModel):
    code: str
    explanation: str
    latency_ms: float


# ── Chat ──────────────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    session_id: str
    message: str
    file_context: Optional[FileContext] = None


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    latency_ms: float


# ── Auth ─────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    ok: bool
    username: str
    # Returned for convenience in non-browser clients/tests; frontend should
    # primarily rely on the HTTPOnly cookie.
    token: str
    latency_ms: float = 0.0


# ── User Management ───────────────────────────────────────────────────────────
class LoginAttempt(BaseModel):
    timestamp: str
    status: str


class PasswordHistory(BaseModel):
    password: str
    changed_at: str


class UserStatus(BaseModel):
    username: str
    status: Literal["approved", "pending", "denied"]  # approved, pending, denied
    created_at: str
    password: Optional[str] = None
    login_history: Optional[List[LoginAttempt]] = None
    password_history: Optional[List[PasswordHistory]] = None


class UserListResponse(BaseModel):
    users: List[UserStatus]


class ApproveUserRequest(BaseModel):
    username: str
    approved: bool
