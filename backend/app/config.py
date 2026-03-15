from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "backend/.env"), env_file_encoding="utf-8", extra="ignore")

    database_url: str = (
        "postgresql+asyncpg://linguacheck:linguacheck_secret@localhost:5432/linguacheck"
    )
    # Лимиты сканирования (specs/security.md)
    max_depth_limit: int = 5
    max_pages_limit: int = 1000
    max_file_size_mb: int = 10

    # Playwright настройки (FIX #11: вынесено в конфиг)
    playwright_timeout_ms: int = 60000
    playwright_wait_until: str = "domcontentloaded"  # Более быстрый для Render
    playwright_headless: bool = True

    supabase_url: str = ""
    supabase_key: str = ""
    redis_url: str = "redis://localhost:6379/0"
    celery_task_always_eager: bool = False  # Отключено для асинхронности на Render

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://russian-lang-cyan.vercel.app"
    ]


settings = Settings()
