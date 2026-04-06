"""
Migration v5: Add NeedsReview column to InventoryItem.
Items synced from photos (without full details) will have NeedsReview=True.
"""
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "seva.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if column already exists
    cursor.execute("PRAGMA table_info(InventoryItem)")
    columns = [col[1] for col in cursor.fetchall()]

    if "NeedsReview" not in columns:
        cursor.execute("ALTER TABLE InventoryItem ADD COLUMN NeedsReview BOOLEAN DEFAULT 0")
        print("✅ Added NeedsReview column to InventoryItem")
    else:
        print("ℹ️  NeedsReview column already exists")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
