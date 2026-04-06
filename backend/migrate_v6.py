#!/usr/bin/env python3
"""
Migration v6 — Create SyncConfig table with default settings.
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seva.db")

DEFAULTS = {
    "watch_folder": "sync_inbox",
    "default_category": "Uncategorized",
    "auto_archive_zips": "true",
}


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS SyncConfig (
            Key   TEXT PRIMARY KEY,
            Value TEXT NOT NULL
        )
    """)

    # Seed defaults (only if not already set)
    for key, value in DEFAULTS.items():
        cursor.execute(
            "INSERT OR IGNORE INTO SyncConfig (Key, Value) VALUES (?, ?)",
            (key, value)
        )

    conn.commit()
    conn.close()
    print("✅ Migration v6 complete: SyncConfig table created with defaults")
    for k, v in DEFAULTS.items():
        print(f"   {k} = {v}")


if __name__ == "__main__":
    migrate()
