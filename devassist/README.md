# DevAssist — Fast Online AI Developer Assistant

> Production-grade AI coding assistant powered by **Groq API** (free & fast). Cloud-based, no local setup needed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Clients: CLI  │  VS Code Extension  │  Web UI        │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────┐
│               FastAPI Backend (Python)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │Autocmplt │ │ Explain  │ │ Bug Fix  │ │ Refactor  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────┘  │
│  ┌──────────┐ ┌──────────┐                              │
│  │ Generate │ │  Chat    │  ← Session Memory            │
│  └──────────┘ └──────────┘                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Prompt Engineering Layer (templates.py)         │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS (async)
┌────────────────────────▼────────────────────────────────┐
│              Groq Cloud API (Free)                       │
│         Model: Mixtral-8x7b (ultra-fast)                │
│         ~1-2sec inference | 25 req/day free             │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Get Free Groq API Key
Visit https://console.groq.com/keys and sign up (free)

### 2. Setup & Run
```bash
cd devassist/backend

# Create .env file with your API key
echo "GROQ_API_KEY=your_key_here" > .env

# Install & start
pip install -r requirements.txt
python main.py
# API: http://localhost:8010/
# Docs: http://localhost:8010/docs
```

### 3. Start website (React)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
#
# If your backend is not on 8000, set:
#   VITE_BACKEND_URL=http://localhost:8000
```

### 4. Use CLI
```bash
cd cli
pip install rich httpx

# Explain a file
python devassist.py explain --file mycode.py

# Detect and fix bugs (auto-write fixed code)
python devassist.py bugfix mycode.py --write

# Refactor for performance + readability
python devassist.py refactor mycode.py --goals readability,performance --write

# Generate code from prompt
python devassist.py generate "binary search tree with insert and search" --lang python

# Chat mode
python devassist.py chat --context mycode.py
```

### 4. Docker
```bash
cd docker
docker compose up --build
# Pull model inside container:
docker exec devassist-ollama-1 ollama pull llama3
```

### 5. VS Code Extension
```bash
cd vscode-extension
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login (sets HTTPOnly session cookie) |
| POST | `/api/v1/auth/logout` | Logout (clears session cookie) |
| GET | `/api/v1/auth/me` | Current logged-in user |
| POST | `/api/v1/autocomplete` | Cursor-aware code completion |
| POST | `/api/v1/autocomplete/stream` | Streaming completion |
| POST | `/api/v1/explain` | Explain selected code |
| POST | `/api/v1/bugfix` | Detect bugs + generate fix |
| POST | `/api/v1/refactor` | Refactor with goal selection |
| POST | `/api/v1/generate` | Generate code from prompt |
| POST | `/api/v1/chat` | Multi-turn chat with memory |
| DELETE | `/api/v1/chat/{session_id}` | Clear session |
| GET | `/health` | Health check |

---

## Run Tests
```bash
cd backend
pytest tests/ -v
```

## Run Benchmarks
```bash
cd backend
python utils/benchmark.py
```

---

## Project Structure
```
devassist/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── core/
│   │   ├── config.py        # Settings (env-based)
│   │   └── models.py        # Pydantic request/response models
│   ├── api/routes/          # One file per feature
│   ├── services/
│   │   ├── ollama_service.py  # LLM service layer
│   │   └── session_service.py # Chat memory
│   ├── prompts/
│   │   └── templates.py     # All prompt engineering
│   ├── cache/
│   │   └── lru_cache.py     # LRU cache with TTL
│   ├── utils/
│   │   ├── logger.py
│   │   └── benchmark.py
│   └── tests/
│       └── test_api.py
├── cli/
│   └── devassist.py         # Rich CLI tool
├── vscode-extension/
│   └── src/extension.ts     # Full VS Code extension
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

## VS Code Extension Features
- **Inline autocomplete** — triggers on pause (debounced 600ms)
- **Right-click → Explain** — explains selected code in side panel
- **Right-click → Bugfix** — scans file, shows bugs, offers 1-click apply
- **Right-click → Refactor** — multi-goal picker, applies in-editor
- **Cmd+Shift+G** — generate code from input box, inserts at cursor
- **Chat panel** — persistent chat with file context awareness

## Environment Variables
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_TIMEOUT=120
CACHE_TTL=300
SESSION_MAX_HISTORY=20

# Auth (website + protected tool routes)
AUTH_USERNAME=admin
AUTH_PASSWORD=admin
AUTH_SIGNING_SECRET=devassist_change_me

# If running the website from another origin:
# CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```
