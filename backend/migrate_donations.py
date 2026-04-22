"""
Migration: Donation Management System
- Adds AcquisitionMode, DonorId, DonationId columns to InventoryItem
- Creates the Donation table
- Backfills existing items with AcquisitionMode='purchase'
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "seva.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # --- 1. Add columns to InventoryItem ---
    existing_cols = {row[1] for row in cur.execute("PRAGMA table_info(InventoryItem)").fetchall()}

    if "AcquisitionMode" not in existing_cols:
        cur.execute("ALTER TABLE InventoryItem ADD COLUMN AcquisitionMode TEXT DEFAULT 'purchase'")
        print("  ✅ Added AcquisitionMode to InventoryItem")
    else:
        print("  ⏭️  AcquisitionMode already exists")

    if "DonorId" not in existing_cols:
        cur.execute("ALTER TABLE InventoryItem ADD COLUMN DonorId INTEGER")
        print("  ✅ Added DonorId to InventoryItem")
    else:
        print("  ⏭️  DonorId already exists")

    if "DonationId" not in existing_cols:
        cur.execute("ALTER TABLE InventoryItem ADD COLUMN DonationId INTEGER")
        print("  ✅ Added DonationId to InventoryItem")
    else:
        print("  ⏭️  DonationId already exists")

    # --- 2. Backfill existing items ---
    cur.execute("UPDATE InventoryItem SET AcquisitionMode = 'purchase' WHERE AcquisitionMode IS NULL")
    affected = cur.rowcount
    if affected > 0:
        print(f"  ✅ Backfilled {affected} items with AcquisitionMode='purchase'")

    # --- 3. Create Donation table ---
    cur.execute("""
        CREATE TABLE IF NOT EXISTS Donation (
            DonationId INTEGER PRIMARY KEY AUTOINCREMENT,
            DonorId INTEGER NOT NULL,
            DonationDate TEXT,
            VoucherNo TEXT,
            DonationType TEXT DEFAULT 'in_kind',
            ItemType TEXT DEFAULT 'asset',
            Category TEXT,
            ItemName TEXT NOT NULL,
            Description TEXT,
            Material TEXT,
            WeightGrams REAL,
            UOM TEXT DEFAULT 'Nos',
            Quantity INTEGER DEFAULT 1,
            EstimatedValue REAL DEFAULT 0.0,
            PANNumber TEXT,
            Remarks TEXT,
            InventoryItemId INTEGER,
            IsTest INTEGER DEFAULT 1,
            CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("  ✅ Donation table created (or already exists)")

    conn.commit()
    conn.close()
    print("\n🎉 Donation migration complete!")


if __name__ == "__main__":
    print("🔄 Running Donation Management migration...")
    migrate()
