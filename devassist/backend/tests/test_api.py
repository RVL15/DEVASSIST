import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

# Patch ollama before import
with patch("services.ollama_service.OllamaService") as _:
    from main import app

client = TestClient(app)


# ── Fixtures ──────────────────────────────────────────────────────────────────

SAMPLE_CODE = "def add(a, b):\n    return a + b"


@pytest.fixture(autouse=True)
def mock_ollama(monkeypatch):
    async def fake_complete(prompt, system="", max_tokens=None):
        if "JSON" in prompt or "json" in prompt.lower():
            if "bug" in prompt.lower():
                return '[{"line": 1, "type": "logical", "description": "test bug", "fix": "fixed"}]'
            if "refactor" in prompt.lower():
                return '{"refactored_code": "def add(a,b): return a+b", "changes": ["Shortened"]}'
            return '{"code": "print(1)", "explanation": "prints 1"}'
        return "# completed"

    monkeypatch.setattr("services.ollama_service.ollama.complete", fake_complete)
    monkeypatch.setattr("services.ollama_service.ollama.chat",
                        AsyncMock(return_value="Hello!"))


@pytest.fixture(autouse=True)
def auth_login():
    # Default credentials from backend/core/config.py
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin"})
    assert r.status_code == 200


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_autocomplete():
    r = client.post("/api/v1/autocomplete", json={
        "prefix": "def hello(", "suffix": "):", "max_tokens": 64
    })
    assert r.status_code == 200
    assert "completion" in r.json()


def test_explain():
    r = client.post("/api/v1/explain", json={
        "code": SAMPLE_CODE, "language": "python"
    })
    assert r.status_code == 200
    assert "explanation" in r.json()


def test_bugfix():
    r = client.post("/api/v1/bugfix", json={
        "code": SAMPLE_CODE, "language": "python"
    })
    assert r.status_code == 200
    data = r.json()
    assert "bugs" in data
    assert "fixed_code" in data


def test_refactor():
    r = client.post("/api/v1/refactor", json={
        "code": SAMPLE_CODE, "language": "python", "goals": ["readability"]
    })
    assert r.status_code == 200
    assert "refactored_code" in r.json()


def test_generate():
    r = client.post("/api/v1/generate", json={
        "prompt": "print hello world", "language": "python"
    })
    assert r.status_code == 200
    assert "code" in r.json()


def test_chat():
    r = client.post("/api/v1/chat", json={
        "session_id": "test-session",
        "message": "What is a list?"
    })
    assert r.status_code == 200
    assert "reply" in r.json()


def test_chat_clear():
    r = client.delete("/api/v1/chat/test-session")
    assert r.status_code == 200


def test_protected_requires_auth():
    client.cookies.clear()
    r = client.post("/api/v1/generate", json={"prompt": "print hello world", "language": "python"})
    assert r.status_code == 401


def test_login_invalid_credentials():
    client.cookies.clear()
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrong"})
    assert r.status_code == 401
