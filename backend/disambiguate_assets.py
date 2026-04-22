import os
import sqlite3
import re

# Database and Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "seva.db")

def extract_size(desc):
    if not desc:
        return 0.0
    # Search for numbers (including decimals)
    match = re.search(r"(\d+(\.\d+)?)", desc)
    if match:
        return float(match.group(1))
    return 0.0

def disambiguate_names():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Fetch all assets that share names
    cursor.execute("""
        SELECT Name FROM InventoryItem 
        WHERE ItemType='asset' AND IsDeleted=0 
        GROUP BY Name HAVING COUNT(*) > 1
    """)
    duplicate_names = [r[0] for r in cursor.fetchall()]

    print(f"Found {len(duplicate_names)} name groups to disambiguate.")

    for name in duplicate_names:
        cursor.execute("""
            SELECT ItemId, Name, WeightGrams, Description 
            FROM InventoryItem 
            WHERE Name = ? AND ItemType='asset' AND IsDeleted=0
        """, (name,))
        items = cursor.fetchall()

        # Sort items: WeightGrams first, then extracted size, then ItemId
        # items = (ItemId, Name, WeightGrams, Description)
        sorted_items = sorted(
            items, 
            key=lambda x: (x[2] if x[2] is not None else 0.0, extract_size(x[3]), x[0])
        )

        for i, item in enumerate(sorted_items, start=1):
            item_id = item[0]
            new_name = f"{name} ({i})"
            cursor.execute("UPDATE InventoryItem SET Name = ? WHERE ItemId = ?", (new_name, item_id))
            print(f"Updated: {name} [ID {item_id}] -> {new_name}")

    conn.commit()
    conn.close()
    print("\nDisambiguation Complete!")

if __name__ == "__main__":
    disambiguate_names()
