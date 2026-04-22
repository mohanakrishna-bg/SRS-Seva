import sqlite3
import os

# Connect to the database
DB_PATH = 'backend/seva.db'

def cleanup():
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Find the items starting with "New Asset"
    cursor.execute("SELECT ItemId, Name, ImageLink FROM InventoryItem WHERE Name LIKE 'New Asset%'")
    items = cursor.fetchall()

    if not items:
        print("No items found starting with 'New Asset'.")
        conn.close()
        return

    print(f"Found {len(items)} items to remove.")
    for item_id, name, img in items:
        print(f"  Removing: {name} (Item ID: {item_id})")

    # Perform the deletion
    # We use Hard Delete as requested ("Remove them from the backend")
    cursor.execute("DELETE FROM InventoryItem WHERE Name LIKE 'New Asset%'")
    
    # Also clean up associated Audit Logs to avoid orphaned records
    item_ids = [str(i[0]) for i in items]
    cursor.execute(f"DELETE FROM InventoryAuditLog WHERE ItemId IN ({','.join(item_ids)})")

    conn.commit()
    print(f"\nSuccessfully removed {len(items)} items and their audit logs.")
    print("Physical images in the pending pool remain untouched.")
    
    conn.close()

if __name__ == "__main__":
    cleanup()
