"""
Database engine and session management.

Supports both PostgreSQL (production) and SQLite (local dev fallback)
based on the DATABASE_URL environment variable.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import get_settings

settings = get_settings()

# ─── Resolve connection URL and engine kwargs ───

_db_url = settings.resolved_database_url

if settings.is_sqlite:
    # SQLite-specific: allow multi-threaded access
    _engine_kwargs = {"connect_args": {"check_same_thread": False}}
else:
    # PostgreSQL: connection pooling
    _engine_kwargs = {
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,  # Reconnect stale connections
    }

engine = create_engine(_db_url, **_engine_kwargs)

# ─── SQLite PRAGMAs (only when using SQLite) ───

if settings.is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

# ─── Keep legacy DB_PATH export for health check compatibility ───
import os
DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "..", "seva.db"
) if settings.is_sqlite else _db_url

# ─── Session factory ───

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
