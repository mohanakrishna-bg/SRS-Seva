"""
SQLite → PostgreSQL Data Migration Script

Usage:
    # 1. Ensure PostgreSQL is running (docker compose up -d postgres)
    # 2. Set DATABASE_URL environment variable
    # 3. Run: python migrate_to_postgres.py

This script:
1. Reads all data from the local SQLite seva.db
2. Creates tables in PostgreSQL using Alembic/SQLAlchemy
3. Bulk-inserts all rows into PostgreSQL
4. Resets PostgreSQL auto-increment sequences
5. Validates row counts match
"""

import os
import sys
import sqlite3

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from app.database import Base, engine as pg_engine
from app.core.config import get_settings

# Import all models to register them on Base.metadata
from app.models import models
from app.models import accounting
from app.models import inventory


def get_sqlite_path():
    """Locate the SQLite database file."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(base_dir, "seva.db"),
        os.path.join(base_dir, "app", "seva.db"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    raise FileNotFoundError(f"seva.db not found. Searched: {candidates}")


def migrate():
    settings = get_settings()

    if not settings.is_postgres:
        print("ERROR: DATABASE_URL is not set to a PostgreSQL URL.")
        print(f"  Current: {settings.resolved_database_url}")
        print("  Set DATABASE_URL=postgresql://user:pass@host:5432/dbname")
        sys.exit(1)

    sqlite_path = get_sqlite_path()
    print(f"📦 Source SQLite: {sqlite_path}")
    print(f"🐘 Target PostgreSQL: {settings.resolved_database_url}")
    print()

    # ─── Step 1: Create tables in PostgreSQL ───
    print("Step 1: Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=pg_engine)
    print("  ✅ Tables created.")

    # ─── Step 2: Read all data from SQLite ───
    print("\nStep 2: Reading data from SQLite...")
    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    # Get all table names from SQLite
    sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'alembic_%'")
    sqlite_tables = [row["name"] for row in sqlite_cursor.fetchall()]
    print(f"  Found {len(sqlite_tables)} tables: {', '.join(sqlite_tables)}")

    # Get all table names that exist in our SQLAlchemy models (PostgreSQL target)
    pg_inspector = inspect(pg_engine)
    pg_tables = set(pg_inspector.get_table_names())

    # ─── Step 3: Migrate each table ───
    print("\nStep 3: Migrating data...")
    PgSession = sessionmaker(bind=pg_engine)
    pg_session = PgSession()

    row_counts = {}

    for table_name in sqlite_tables:
        if table_name not in pg_tables:
            print(f"  ⏭️  Skipping '{table_name}' — not in PostgreSQL schema")
            continue

        # Read all rows from SQLite
        try:
            sqlite_cursor.execute(f'SELECT * FROM "{table_name}"')
        except Exception as e:
            print(f"  ⚠️  Error reading '{table_name}': {e}")
            continue

        rows = sqlite_cursor.fetchall()
        if not rows:
            print(f"  📭 '{table_name}' — 0 rows (empty)")
            row_counts[table_name] = 0
            continue

        # Get column names from SQLite result
        columns = [desc[0] for desc in sqlite_cursor.description]

        # Filter to only columns that exist in the PostgreSQL table
        pg_columns = set(c["name"] for c in pg_inspector.get_columns(table_name))
        valid_columns = [c for c in columns if c in pg_columns]

        if not valid_columns:
            print(f"  ⚠️  '{table_name}' — no matching columns found")
            continue

        # Clear existing data in target table
        pg_session.execute(text(f'DELETE FROM "{table_name}"'))

        # Bulk insert
        col_names = ", ".join(f'"{c}"' for c in valid_columns)
        placeholders = ", ".join(f":{c}" for c in valid_columns)
        insert_sql = text(f'INSERT INTO "{table_name}" ({col_names}) VALUES ({placeholders})')

        batch = []
        for row in rows:
            row_dict = {c: row[c] for c in valid_columns}
            batch.append(row_dict)

        try:
            pg_session.execute(insert_sql, batch)
            pg_session.commit()
            row_counts[table_name] = len(batch)
            print(f"  ✅ '{table_name}' — {len(batch)} rows migrated")
        except Exception as e:
            pg_session.rollback()
            print(f"  ❌ '{table_name}' — Error: {e}")
            row_counts[table_name] = -1

    # ─── Step 4: Reset auto-increment sequences ───
    print("\nStep 4: Resetting PostgreSQL sequences...")
    for table_name in pg_tables:
        try:
            # Find primary key columns
            pk_cols = pg_inspector.get_pk_constraint(table_name).get("constrained_columns", [])
            for pk_col in pk_cols:
                col_info = [c for c in pg_inspector.get_columns(table_name) if c["name"] == pk_col]
                if col_info and hasattr(col_info[0].get("type"), "python_type"):
                    if col_info[0]["type"].python_type in (int,):
                        seq_name = f"{table_name}_{pk_col}_seq"
                        pg_session.execute(text(
                            f"SELECT setval(pg_get_serial_sequence('{table_name}', '{pk_col}'), "
                            f"COALESCE((SELECT MAX(\"{pk_col}\") FROM \"{table_name}\"), 0) + 1, false)"
                        ))
        except Exception:
            pass  # Not all tables have auto-increment PKs

    pg_session.commit()
    print("  ✅ Sequences reset.")

    # ─── Step 5: Validate ───
    print("\nStep 5: Validation...")
    errors = 0
    for table_name, expected in row_counts.items():
        if expected < 0:
            errors += 1
            continue
        try:
            result = pg_session.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
            actual = result.scalar()
            status = "✅" if actual == expected else "❌ MISMATCH"
            if actual != expected:
                errors += 1
            print(f"  {status} '{table_name}': SQLite={expected}, PostgreSQL={actual}")
        except Exception as e:
            print(f"  ❌ '{table_name}': Validation error — {e}")
            errors += 1

    pg_session.close()
    sqlite_conn.close()

    print()
    if errors == 0:
        print("🎉 Migration completed successfully!")
    else:
        print(f"⚠️  Migration completed with {errors} error(s). Please review above.")

    return errors == 0


if __name__ == "__main__":
    migrate()
