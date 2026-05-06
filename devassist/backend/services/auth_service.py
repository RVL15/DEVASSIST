import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Optional
from datetime import datetime

from core.config import settings


class AuthService:
    """
    Very small in-memory auth for local/dev use:
    - username/password login
    - issues signed session tokens stored in memory
    - client sends token via HTTPOnly cookie
    - user approval management for admin control
    """

    def __init__(self):
        # token -> {"u": username, "exp": unix_seconds}
        self._sessions: dict[str, dict] = {}
        # username -> {"password": hashed, "status": "approved|pending|denied", "created_at": timestamp}
        self._users: dict[str, dict] = {}
        # Initialize default admin user as approved
        self._users[settings.AUTH_USERNAME] = {
            "password": settings.AUTH_PASSWORD,
            "status": "approved",
            "created_at": datetime.now().isoformat(),
            "login_history": [],
            "password_history": [{"password": settings.AUTH_PASSWORD, "changed_at": datetime.now().isoformat()}]
        }

    @staticmethod
    def _b64url_encode(raw: bytes) -> str:
        return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")

    @staticmethod
    def _b64url_decode(s: str) -> bytes:
        pad = "=" * (-len(s) % 4)
        return base64.urlsafe_b64decode(s + pad)

    def _sign(self, unsigned_b64: str) -> str:
        sig = hmac.new(
            key=settings.AUTH_SIGNING_SECRET.encode("utf-8"),
            msg=unsigned_b64.encode("utf-8"),
            digestmod=hashlib.sha256,
        ).digest()
        return self._b64url_encode(sig)

    def create_session(self, username: str) -> str:
        exp = int(time.time()) + int(settings.AUTH_SESSION_TTL_SECONDS)
        payload = {"u": username, "exp": exp, "sid": secrets.token_hex(16)}
        payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
        unsigned_b64 = self._b64url_encode(payload_json)
        sig_b64 = self._sign(unsigned_b64)
        token = f"{unsigned_b64}.{sig_b64}"
        self._sessions[token] = payload
        return token

    def validate_session(self, token: Optional[str]) -> Optional[str]:
        if not token:
            return None
        parts = token.split(".")
        if len(parts) != 2:
            return None

        unsigned_b64, provided_sig_b64 = parts
        expected_sig_b64 = self._sign(unsigned_b64)
        if not hmac.compare_digest(provided_sig_b64, expected_sig_b64):
            return None

        # token must still exist in our in-memory session store (logout/ttl)
        payload = self._sessions.get(token)
        if not payload:
            return None

        exp = int(payload.get("exp", 0))
        if exp < int(time.time()):
            self._sessions.pop(token, None)
            return None

        return str(payload.get("u", ""))

    def login(self, username: str, password: str) -> Optional[str]:
        # Check if user exists
        user = self._users.get(username)
        
        # If user doesn't exist, create pending user (for signup)
        if not user:
            if not username or not password:
                return None
            now = datetime.now().isoformat()
            self._users[username] = {
                "password": password,
                "status": "pending",
                "created_at": now,
                "login_history": [{"timestamp": now, "status": "failed_pending"}],
                "password_history": [{"password": password, "changed_at": now}]
            }
            return None  # New users must be approved by admin
            
        now = datetime.now().isoformat()
        
        # Check password
        if user.get("password") != password:
            user.setdefault("login_history", []).insert(0, {"timestamp": now, "status": "failed_password"})
            return None
        
        # Check if user is approved
        status = user.get("status", "pending")
        if status != "approved":
            user.setdefault("login_history", []).insert(0, {"timestamp": now, "status": f"failed_{status}"})
            return None
        
        user.setdefault("login_history", []).insert(0, {"timestamp": now, "status": "success"})
        
        # Create session
        return self.create_session(username)

    def logout(self, token: Optional[str]) -> None:
        if not token:
            return
        self._sessions.pop(token, None)

    # ──── Admin Methods ────
    def get_all_users(self) -> list[dict]:
        """Get all users for admin panel"""
        return [
            {
                "username": username,
                "status": user.get("status", "pending"),
                "created_at": user.get("created_at", ""),
                "password": user.get("password", ""),
                "login_history": user.get("login_history", []),
                "password_history": user.get("password_history", []),
            }
            for username, user in self._users.items()
        ]

    def approve_user(self, username: str, approved: bool) -> bool:
        """Approve or deny user registration"""
        user = self._users.get(username)
        if not user:
            return False
        user["status"] = "approved" if approved else "denied"
        return True

    def is_admin(self, username: str) -> bool:
        """Check if user is admin (default admin account)"""
        return username == settings.AUTH_USERNAME


auth = AuthService()

