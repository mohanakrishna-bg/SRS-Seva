"""
Inventory Module — Database Migration Script
Creates tables and seeds default categories + materials with bullion rates.
Run: python3 migrate_inventory.py
"""

import sqlite3
import os
import sys

# Match the path used by database.py: backend/seva.db
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "seva.db")
if not os.path.exists(DB_PATH):
    DB_PATH = os.path.join(BASE_DIR, "app", "seva.db")
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at expected paths.")
        sys.exit(1)

print(f"Using database: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# ─── Create Tables ───
print("\n--- Creating Inventory tables ---")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS InventoryCategory (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT UNIQUE NOT NULL
    )
""")
print("  ✓ InventoryCategory")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS InventoryMaterial (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT UNIQUE NOT NULL,
        BullionRate REAL
    )
""")
print("  ✓ InventoryMaterial")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS InventoryItem (
        ItemId INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Description TEXT,
        Category TEXT,
        Material TEXT,
        WeightGrams REAL,
        UnitPrice REAL DEFAULT 0.0,
        Quantity INTEGER DEFAULT 1,
        TotalValue REAL DEFAULT 0.0,
        AddedOnDate TEXT,
        ImagePath TEXT,
        ImageLink TEXT,
        IsDeleted BOOLEAN DEFAULT 0,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
""")
print("  ✓ InventoryItem")

cursor.execute("""
    CREATE TABLE IF NOT EXISTS InventoryAuditLog (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        User TEXT DEFAULT 'System',
        Action TEXT NOT NULL,
        ItemId INTEGER,
        Details TEXT
    )
""")
print("  ✓ InventoryAuditLog")

# ─── Seed Categories ───
print("\n--- Seeding categories ---")
categories = [
    "Pooja Items", "Kitchen Utensils", "Electrical",
    "Furniture", "Idol", "Ornament", "Photo"
]
for cat in categories:
    try:
        cursor.execute("INSERT INTO InventoryCategory (Name) VALUES (?)", (cat,))
        print(f"  + {cat}")
    except sqlite3.IntegrityError:
        print(f"  - {cat} (already exists)")

# ─── Seed Materials with Bullion Rates ───
print("\n--- Seeding materials ---")
materials = [
    ("Gold", 6650.0),
    ("Silver", 93.5),
    ("Brass", None),
    ("Bronze", None),
    ("S. Steel", None),
    ("Wood", None),
    ("Plastic", None),
    ("Steel", None),
]
for name, rate in materials:
    try:
        cursor.execute("INSERT INTO InventoryMaterial (Name, BullionRate) VALUES (?, ?)", (name, rate))
        rate_str = f"₹{rate}/gm" if rate else "N/A"
        print(f"  + {name} (Rate: {rate_str})")
    except sqlite3.IntegrityError:
        print(f"  - {name} (already exists)")

conn.commit()
conn.close()

print("\n✅ Inventory migration complete!")
