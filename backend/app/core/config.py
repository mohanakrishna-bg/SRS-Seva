"""
Centralized application configuration via Pydantic Settings.

Reads from environment variables with sensible defaults for local dev.
In production, set these via docker-compose environment or .env file.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = ""  # Empty = auto-detect (SQLite fallback)

    # Auth / JWT
    SECRET_KEY: str = "your-secret-key"  # MUST override in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours for intranet use

    # Module Deployment Filter
    # Comma-separated list of modules to mount. Empty = all modules.
    # Example: "accounting,auth" to run only accounting + auth endpoints.
    MODULE_FILTER: str = ""

    # File Uploads
    UPLOAD_DIR: str = "uploads"

    # CORS
    CORS_ORIGINS: list[str] = ["*"]

    @property
    def active_modules(self) -> list[str]:
        """Parse MODULE_FILTER into a list of module names."""
        if not self.MODULE_FILTER.strip():
            return []  # Empty = all modules enabled
        return [m.strip().lower() for m in self.MODULE_FILTER.split(",") if m.strip()]

    @property
    def resolved_database_url(self) -> str:
        """
        Resolve the database URL with SQLite fallback for local development.
        If DATABASE_URL is set (e.g., postgresql://...), use it directly.
        Otherwise, fall back to the local SQLite file.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL

        # SQLite fallback — same path as the original database.py
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        db_path = os.path.join(base_dir, "seva.db")
        return f"sqlite:///{db_path}"

    @property
    def is_postgres(self) -> bool:
        return self.resolved_database_url.startswith("postgresql")

    @property
    def is_sqlite(self) -> bool:
        return self.resolved_database_url.startswith("sqlite")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Cached singleton for app settings."""
    return Settings()
