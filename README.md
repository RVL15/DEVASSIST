# DevAssist

DevAssist is a full-stack AI coding assistant with a FastAPI backend and a React + Vite frontend. The app now uses Groq Cloud for fast online LLM responses, with tool pages for Generate, Explain, Bugfix, Refactor, Autocomplete, and Chat.

## What’s in the app

- Backend API in `devassist/backend`
- React web UI in `frontend`
- Auth-protected tool pages
- Groq-backed AI features instead of Ollama/local inference
- Theme toggle for light and dark mode

## How to run on Windows

### 1. Backend

```powershell
cd c:\Users\Admin\Desktop\PROJECTS\devassist
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd devassist\backend
python main.py
```

Backend runs at `http://127.0.0.1:8010`.

### 2. Frontend

Open a second terminal:

```powershell
cd c:\Users\Admin\Desktop\PROJECTS\devassist\frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### 3. Open the app

Go to `http://localhost:5173` in your browser.

## Default login

- Username: `admin`
- Password: `admin`

## Environment variables

Set these in `devassist/backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
CACHE_TTL=300
SESSION_MAX_HISTORY=20
```

## Useful commands

### Frontend

```bash
npm run dev
npm run build
npm run typecheck
```

### Backend

```bash
python main.py
python -m pytest tests/
```

## API overview

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/generate`
- `POST /api/v1/explain`
- `POST /api/v1/bugfix`
- `POST /api/v1/refactor`
- `POST /api/v1/autocomplete`
- `POST /api/v1/chat`
- `GET /health`

## Notes

- The backend can also serve the built frontend from `frontend/dist` when production assets are present.
- Keep `devassist/backend/.env` out of Git because it contains your Groq key.