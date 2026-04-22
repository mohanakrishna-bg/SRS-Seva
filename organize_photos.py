import os
import shutil
import re
import sqlite3

# Configuration
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "backend"))
DB_PATH = os.path.join(BASE_DIR, "seva.db")
PHOTOS_DIR = os.path.join(BASE_DIR, "uploads", "photos")
UNCAT_DIR = os.path.join(PHOTOS_DIR, "uncategorized")

def slugify(name):
    if not name: return "uncategorized"
    return re.sub(r'[^a-z0-9]+', '_', name.strip().lower())

def organize_photos():
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get all assets with an image link
    cursor.execute("SELECT ItemId, Name, Category, ImageLink FROM InventoryItem WHERE ItemType='asset' AND ImageLink IS NOT NULL AND ImageLink != ''")
    items = cursor.fetchall()
    
    moved_count = 0
    not_found_count = 0
    already_ok_count = 0

    print(f"🔍 Found {len(items)} items to check...")

    for item_id, name, category, image_link in items:
        # If image_link is just a filename
        filename = os.path.basename(image_link)
        cat_slug = slugify(category)
        target_dir = os.path.join(PHOTOS_DIR, cat_slug)
        os.makedirs(target_dir, exist_ok=True)
        
        target_path = os.path.join(target_dir, filename)
        
        # Check if it's already in the right place
        if os.path.exists(target_path):
            already_ok_count += 1
            # Ensure ImageLink in DB is just the filename for our new relative path logic
            cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (filename, item_id))
            continue

        # Check where it might be
        possible_sources = [
            os.path.join(UNCAT_DIR, filename),
            os.path.join(PHOTOS_DIR, filename),
            os.path.join(BASE_DIR, "uploads", filename) # Legacy root
        ]
        
        found_source = None
        for src in possible_sources:
            if os.path.exists(src):
                found_source = src
                break
        
        if found_source:
            print(f"📦 Moving {filename} -> {cat_slug}/")
            shutil.move(found_source, target_path)
            cursor.execute("UPDATE InventoryItem SET ImageLink = ? WHERE ItemId = ?", (filename, item_id))
            moved_count += 1
        else:
            # Maybe it's already in SOME other category folder?
            # Let's not hunt it down for now to avoid moving things incorrectly.
            not_found_count += 1

    conn.commit()
    conn.close()
    
    print("\n✅ Cleanup Complete!")
    print(f"✨ Moved: {moved_count}")
    print(f"👌 Already in place: {already_ok_count}")
    print(f"❓ Not found: {not_found_count}")

if __name__ == "__main__":
    organize_photos()
