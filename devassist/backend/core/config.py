from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    VERSION: str = "1.0.0"

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "tinyllama"
    OLLAMA_TIMEOUT: int = 120
    OLLAMA_MAX_TOKENS: int = 2048
    OLLAMA_TEMPERATURE: float = 0.2

    # Cache
    CACHE_TTL: int = 300          # seconds
    CACHE_MAX_SIZE: int = 512

    # File
    MAX_FILE_CHARS: int = 12_000  # truncate large files

    # Session
    SESSION_MAX_HISTORY: int = 20

    # Auth (basic username/password -> signed session cookie)
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD: str = "admin"
    AUTH_SESSION_COOKIE: str = "devassist_session"
    AUTH_SESSION_TTL_SECONDS: int = 3600
    AUTH_COOKIE_SECURE: bool = False
    AUTH_COOKIE_SAMESITE: str = "lax"  # "lax" | "strict" | "none"
    AUTH_SIGNING_SECRET: str = "devassist_change_me"

    # CORS for browser clients (required for cookie-based auth)
    # Note: cannot use "*" with allow_credentials=True.
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
