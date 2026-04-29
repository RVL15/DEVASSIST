# DevAssist

A comprehensive development assistant application with backend API, frontend interface, CLI tool, and VSCode extension.

## 📋 Project Structure

```
devassist/
├── backend/              # Python FastAPI backend
│   ├── api/             # API routes
│   │   ├── auth.py
│   │   ├── autocomplete.py
│   │   ├── bugfix.py
│   │   ├── chat.py
│   │   ├── explain.py
│   │   ├── generate.py
│   │   └── refactor.py
│   ├── services/        # Business logic
│   ├── core/            # Config & models
│   ├── utils/           # Utilities & logging
│   ├── cache/           # LRU cache
│   ├── prompts/         # Prompt templates
│   ├── tests/           # Unit tests
│   ├── main.py
│   └── requirements.txt
├── frontend/            # React + Vite frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── cli/                 # Command-line tool
├── docker/              # Docker configuration
└── vscode-extension/    # VSCode extension
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn
- Virtual environment (recommended)

### 1. Setup Backend

```powershell
# Navigate to project
cd c:\Users\Admin\Desktop\devassist\devassist

# Install dependencies
pip install -r backend/requirements.txt

# Run backend
python backend/main.py
```

Backend will run on `http://127.0.0.1:8010`

### 2. Setup Frontend

```powershell
# Open new terminal, navigate to frontend
cd c:\Users\Admin\Desktop\devassist\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 3. Access Application

Open your browser and go to: `http://localhost:5173`

## 📚 API Endpoints

The backend provides the following endpoints:

- **POST** `/api/auth/login` - User authentication
- **POST** `/api/autocomplete` - Code autocomplete
- **POST** `/api/bugfix` - Bug fixing assistance
- **POST** `/api/chat` - Chat interface
- **POST** `/api/explain` - Code explanation
- **POST** `/api/generate` - Code generation
- **POST** `/api/refactor` - Code refactoring

## 🛠️ Available Commands

### Frontend

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript type checking
npm run lint         # Linting (if configured)
```

### Backend

```bash
python backend/main.py       # Start API server
python -m pytest tests/       # Run tests
```

## 🐳 Docker

To run the application with Docker:

```bash
cd docker
docker-compose up
```

## 📝 Features

- **Authentication** - Secure user login
- **Code Autocomplete** - AI-powered code suggestions
- **Bug Fixing** - Automatic bug detection and fixes
- **Chat Interface** - Interactive development assistant
- **Code Explanation** - Explain code functionality
- **Code Generation** - Generate code from descriptions
- **Code Refactoring** - Improve code quality

## 🔧 Configuration

- Backend proxy in `frontend/vite.config.ts` routes `/api` and `/health` to backend
- TypeScript configuration in `frontend/tsconfig.json`
- Backend config in `devassist/core/config.py`

## 📦 Dependencies

### Backend
- FastAPI
- Python 3.11+
- Dependencies listed in `backend/requirements.txt`

### Frontend
- React 19
- Vite 8
- TypeScript 6
- React Router DOM 7

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

ISC

## 🆘 Troubleshooting

### Backend won't start
- Ensure you're in the correct directory: `c:\Users\Admin\Desktop\devassist\devassist`
- Check Python version: `python --version`
- Install dependencies: `pip install -r backend/requirements.txt`

### Frontend won't start
- Ensure Node.js is installed: `node --version`
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `npm install`

### Connection issues
- Verify backend is running on `http://127.0.0.1:8010`
- Check that port 5173 is not in use
- Review `frontend/vite.config.ts` proxy settings

## 📞 Support

For issues or questions, please check the documentation or create an issue in the repository.

Here are the step-by-step instructions for Windows PowerShell (which you're using):

Start Backend (Terminal 1)
# Navigate to project root
cd c:\Users\Admin\Desktop\devassist

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies (if needed)
pip install -r backend/requirements.txt

# Run backend
python backend/main.

You should see the API running at http://127.0.0.1:8010

Start Frontend (Terminal 2)

# Open a new PowerShell terminal

# Navigate to frontend
cd c:\Users\Admin\Desktop\devassist\frontend

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

You should see output like:

➜ Local:   http://localhost:5173/

Alternative: CMD (Command Prompt)
If you prefer CMD instead of PowerShell:

:: Terminal 1 - Backend
cd c:\Users\Admin\Desktop\devassist
.venv\Scripts\activate.bat
python backend/main.py

:: Terminal 2 - Frontend
cd c:\Users\Admin\Desktop\devassist\frontend
npm install
npm run dev

Open in Browser
Once both are running, open: http://localhost:5173