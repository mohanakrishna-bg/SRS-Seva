import sqlite3
import os
import json
import urllib.parse

BASE_DIR = "/Users/bgm/my_Projects/SRS/Seva/backend"
DB_PATH = os.path.join(BASE_DIR, "seva.db")
IMAGE_MAP_PATH = os.path.join(BASE_DIR, "image_map.json")

def main():
    pass

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # I will rely on the fact that I stored the ID mapping in image_map.json
    # So if it's currently a Google Drive URL, I'll map its ID back to the filename!
    with open(IMAGE_MAP_PATH, "r") as f:
        image_map = json.load(f)

    # Reverse lookup map: id -> filename
    reverse_map = {v: k for k, v in image_map.items()}

    cursor.execute("SELECT ItemId, ImageLink FROM InventoryItem WHERE ImageLink LIKE '%drive.google.com%' OR ImageLink LIKE '%lh3.googleusercontent.com%'")
    items = cursor.fetchall()
    
    updated = 0
    for item_id, image_link in items:
        # Extract ID
        file_id = ""
        if "lh3.googleusercontent.com/d/" in image_link:
            file_id = image_link.split("/")[-1]
        elif "drive.google.com/thumbnail" in image_link:
            parsed = urllib.parse.urlparse(image_link)
            qs = urllib.parse.parse_qs(parsed.query)
            if 'id' in qs:
                file_id = qs['id'][0]
        
        if file_id and file_id in reverse_map:
            original_filename = reverse_map[file_id]
            cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (original_filename, item_id))
            updated += 1
            
    conn.commit()
    conn.close()
    print(f"Total reverted to filenames: {updated}")

if __name__ == "__main__":
    main()
