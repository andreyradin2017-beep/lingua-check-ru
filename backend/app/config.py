from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = (
        "postgresql+asyncpg://linguacheck:linguacheck_secret@localhost:5432/linguacheck"
    )
    # Лимиты сканирования (specs/security.md)
    max_depth_limit: int = 5
    max_pages_limit: int = 500
    max_file_size_mb: int = 10

    supabase_url: str = ""
    supabase_key: str = ""

    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://127.0.0.1:5173"
    ]


settings = Settings()
