import sqlite3
import os
import json

BASE_DIR = "/Users/bgm/my_Projects/SRS/Seva/backend"
DB_PATH = os.path.join(BASE_DIR, "seva.db")
IMAGE_MAP_PATH = os.path.join(BASE_DIR, "image_map.json")

def main():
    with open(IMAGE_MAP_PATH, "r") as f:
        image_map = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT ItemId, ImageLink FROM InventoryItem WHERE ImageLink IS NOT NULL AND ImageLink != ''")
    items = cursor.fetchall()
    
    # Reverse lookup for IDs already updated to lh3...
    id_to_base = {}
    for filename, fid in image_map.items():
        id_to_base[fid] = filename.split(".")[0].split("=")[0].strip()

    updated = 0
    for item_id, image_link in items:
        # If it was updated recently to lh3
        if image_link.startswith("https://lh3.googleusercontent.com/d/"):
            file_id = image_link.split("/")[-1]
            if file_id in id_to_base:
                # Use Google Drive endpoint
                new_link = f"https://drive.google.com/thumbnail?id={file_id}&sz=w1000"
                cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (new_link, item_id))
                updated += 1
            else:
                # One of the originals? Just rewrite it to use thumbnail anyway if it was a file id
                pass

    conn.commit()
    conn.close()
    print(f"Total updated to drive.google.com: {updated}")

if __name__ == "__main__":
    main()
