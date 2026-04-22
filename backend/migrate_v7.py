#!/usr/bin/env python3
"""
Migration v7 — Unified Inventory Foundation

Additive-only changes: extends existing tables, creates new ones, breaks nothing.

1. Add columns to InventoryItem: ItemType, UOM, GSTRate, HSNCode, IsMaintainable
2. Add ForType column to InventoryCategory
3. Create Location table + seed temple locations
4. Create ConsumableDetail table
5. Create ConsumableTransaction table
6. Create MaintenanceLog table
7. Seed consumable categories (ForType='consumable')
8. Set all existing items to ItemType='asset', categories to ForType='asset'
"""

import os
import sqlite3
import shutil
import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seva.db")


def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def table_exists(cursor, table):
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table,))
    return cursor.fetchone() is not None


def migrate():
    # ─── Backup ───
    backup_path = DB_PATH.replace(".db", f"_backup_before_v7_{datetime.date.today().isoformat()}.db")
    if not os.path.exists(backup_path):
        shutil.copy2(DB_PATH, backup_path)
        print(f"✅ Backed up to {os.path.basename(backup_path)}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # ─── 1. Extend InventoryItem ───
    new_cols = [
        ("ItemType",       "TEXT DEFAULT 'asset'"),
        ("UOM",            "TEXT DEFAULT 'Nos'"),
        ("GSTRate",        "REAL DEFAULT 0"),
        ("HSNCode",        "TEXT"),
        ("IsMaintainable", "BOOLEAN DEFAULT 0"),
    ]
    for col_name, col_def in new_cols:
        if not column_exists(cursor, "InventoryItem", col_name):
            cursor.execute(f"ALTER TABLE InventoryItem ADD COLUMN {col_name} {col_def}")
            print(f"  ✅ Added InventoryItem.{col_name}")
        else:
            print(f"  ⏭️  InventoryItem.{col_name} already exists")

    # Set all existing items to 'asset'
    cursor.execute("UPDATE InventoryItem SET ItemType = 'asset' WHERE ItemType IS NULL")
    cursor.execute("UPDATE InventoryItem SET UOM = 'Nos' WHERE UOM IS NULL")

    # ─── 2. Extend InventoryCategory ───
    if not column_exists(cursor, "InventoryCategory", "ForType"):
        cursor.execute("ALTER TABLE InventoryCategory ADD COLUMN ForType TEXT DEFAULT 'asset'")
        print("  ✅ Added InventoryCategory.ForType")
    else:
        print("  ⏭️  InventoryCategory.ForType already exists")

    # Set all existing categories to 'asset'
    cursor.execute("UPDATE InventoryCategory SET ForType = 'asset' WHERE ForType IS NULL")

    # ─── 3. Create Location table ───
    if not table_exists(cursor, "Location"):
        cursor.execute("""
            CREATE TABLE Location (
                LocationId  INTEGER PRIMARY KEY AUTOINCREMENT,
                Name        TEXT NOT NULL UNIQUE,
                Description TEXT
            )
        """)
        print("  ✅ Created Location table")

        # Seed temple locations
        locations = [
            ("ಗರ್ಭಗುಡಿ (Main Sanctum)", "Primary deity area"),
            ("ಉಗ್ರಾಣ (Store Room)", "General storage"),
            ("ಅಡುಗೆಮನೆ (Kitchen)", "Food preparation area"),
            ("ಕಚೇರಿ (Office)", "Administrative office"),
            ("ರಥ ಮಂದಿರ (Ratha Mandira)", "Chariot storage"),
            ("ಹೊರ ಪ್ರಾಕಾರ (Outer Compound)", "Outer premises"),
        ]
        cursor.executemany(
            "INSERT OR IGNORE INTO Location (Name, Description) VALUES (?, ?)",
            locations
        )
        print(f"  ✅ Seeded {len(locations)} locations")
    else:
        print("  ⏭️  Location table already exists")

    # ─── 4. Create ConsumableDetail table ───
    if not table_exists(cursor, "ConsumableDetail"):
        cursor.execute("""
            CREATE TABLE ConsumableDetail (
                ConsumableId       INTEGER PRIMARY KEY AUTOINCREMENT,
                ItemId             INTEGER NOT NULL REFERENCES InventoryItem(ItemId),
                QuantityOnHand     REAL DEFAULT 0,
                ReorderLevel       REAL DEFAULT 0,
                LastPurchasePrice  REAL DEFAULT 0,
                ExpiryDate         TEXT,
                LocationId         INTEGER REFERENCES Location(LocationId)
            )
        """)
        print("  ✅ Created ConsumableDetail table")
    else:
        print("  ⏭️  ConsumableDetail table already exists")

    # ─── 5. Create ConsumableTransaction table ───
    if not table_exists(cursor, "ConsumableTransaction"):
        cursor.execute("""
            CREATE TABLE ConsumableTransaction (
                TxnId        INTEGER PRIMARY KEY AUTOINCREMENT,
                ConsumableId INTEGER NOT NULL REFERENCES ConsumableDetail(ConsumableId),
                TxnType      TEXT NOT NULL,
                Quantity     REAL NOT NULL,
                UnitPrice    REAL,
                TxnDate      TEXT NOT NULL,
                VendorName   TEXT,
                InvoiceRef   TEXT,
                Notes        TEXT,
                CreatedAt    DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print("  ✅ Created ConsumableTransaction table")
    else:
        print("  ⏭️  ConsumableTransaction table already exists")

    # ─── 6. Create MaintenanceLog table ───
    if not table_exists(cursor, "MaintenanceLog"):
        cursor.execute("""
            CREATE TABLE MaintenanceLog (
                LogId           INTEGER PRIMARY KEY AUTOINCREMENT,
                ItemId          INTEGER NOT NULL REFERENCES InventoryItem(ItemId),
                ServiceDate     TEXT,
                ServiceType     TEXT,
                TechnicianName  TEXT,
                Cost            REAL,
                Notes           TEXT,
                NextServiceDue  TEXT
            )
        """)
        print("  ✅ Created MaintenanceLog table")
    else:
        print("  ⏭️  MaintenanceLog table already exists")

    # ─── 7. Seed consumable categories ───
    consumable_cats = [
        "Deepam Supplies",
        "Prasadam Ingredients",
        "Pooja Consumables",
        "Flowers & Garlands",
        "Cleaning Supplies",
        "Stationery",
        "Kitchen Consumables",
    ]
    for cat in consumable_cats:
        cursor.execute(
            "INSERT OR IGNORE INTO InventoryCategory (Name, ForType) VALUES (?, 'consumable')",
            (cat,)
        )
    print(f"  ✅ Seeded {len(consumable_cats)} consumable categories")

    conn.commit()
    conn.close()
    print("\n✅ Migration v7 complete: Unified Inventory Foundation ready")


if __name__ == "__main__":
    migrate()
