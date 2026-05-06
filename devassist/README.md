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
│      Model: openai/gpt-oss-120b (current)              │
│         ~1-2sec inference | 25 req/day free             │
# DevAssist

DevAssist is a FastAPI + React AI developer assistant. The current app is Groq-backed, includes authenticated tool pages, and ships with a persistent chat experience, theme toggle, and polished output views.

## App Layout

- `devassist/backend` - FastAPI API and auth/session logic
- `frontend` - React + Vite web app
- `cli` - command-line tooling
- `vscode-extension` - editor integration
- `docker` - container setup

## What the app does

- Generate code from prompts
- Explain code
- Find and fix bugs
- Refactor code by goal
- Autocomplete code from prefix/suffix
- Chat with session memory and optional file context

## Run the app

### Backend

```powershell
cd c:\Users\Admin\Desktop\PROJECTS\devassist
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd devassist\backend
python main.py
```

Backend: `http://127.0.0.1:8010`

### Frontend

```powershell
cd c:\Users\Admin\Desktop\PROJECTS\devassist\frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Login

- Username: `admin`
- Password: `admin`

## Environment variables

Use `devassist/backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
CACHE_TTL=300
SESSION_MAX_HISTORY=20
AUTH_USERNAME=admin
AUTH_PASSWORD=admin
AUTH_SIGNING_SECRET=devassist_change_me
```

## Useful commands

### Backend

```bash
python main.py
pytest tests/ -v
```

### Frontend

```bash
npm run dev
npm run build
npm run typecheck
```

## API routes

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/auth/login` | Sign in |
| POST | `/api/v1/auth/logout` | Sign out |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/generate` | Code generation |
| POST | `/api/v1/explain` | Code explanation |
| POST | `/api/v1/bugfix` | Bug fixing |
| POST | `/api/v1/refactor` | Refactoring |
| POST | `/api/v1/autocomplete` | Autocomplete |
| POST | `/api/v1/chat` | Chat with memory |
| GET | `/health` | Health check |

## Notes

- The backend can serve the built frontend from `frontend/dist`.
- `devassist/backend/.env` is local-only and should not be committed.
cd backend
