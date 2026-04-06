import sqlite3
import os

BASE_DIR = "/Users/bgm/my_Projects/SRS/Seva/backend"
DB_PATH = os.path.join(BASE_DIR, "seva.db")

def main():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. Check if ID 1 exists
    cursor.execute("SELECT ItemId, Name, IsDeleted FROM InventoryItem WHERE ItemId=1")
    item1 = cursor.fetchone()
    if item1:
        print(f"Found Item 1: {item1[1]} (Deleted: {item1[2]})")
        # Hard delete it to make room
        cursor.execute("DELETE FROM InventoryItem WHERE ItemId=1")
        print("Deleted existing Item 1 row.")
        
    # 2. Find 'Bangarada Kireeta' (ID 103)
    cursor.execute("SELECT ItemId, Name FROM InventoryItem WHERE Name='Bangarada Kireeta'")
    kireeta = cursor.fetchone()
    if not kireeta:
        print("Bangarada Kireeta not found in database!")
        conn.close()
        return
        
    old_id = kireeta[0]
    print(f"Moving Bangarada Kireeta from ID {old_id} to ID 1")
    
    # 3. Update ItemId to 1
    cursor.execute("UPDATE InventoryItem SET ItemId=1 WHERE ItemId=?", (old_id,))
    
    # 4. Update Audit logs
    cursor.execute("UPDATE InventoryAuditLog SET ItemId=1 WHERE ItemId=?", (old_id,))
    print(f"Updated {cursor.rowcount} audit log entries.")
    
    conn.commit()
    conn.close()
    print("Success!")

if __name__ == "__main__":
    main()
