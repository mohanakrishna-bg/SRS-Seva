import os
import sqlite3
import shutil
import re

# Database and Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "seva.db")
PHOTOS_DIR = os.path.join(BACKEND_DIR, "uploads", "photos")

def sanitize(text):
    if not text:
        return ""
    text = text.lower()
    # Keep parentheses for disambiguation if they are now part of the name
    text = re.sub(r'[^a-z0-9\(\)]', '_', text)
    text = re.sub(r'_+', '_', text)
    return text.strip('_')

def get_descriptive_filename(item_id, name, material, description):
    parts = [sanitize(name)]
    
    if material:
        parts.append(sanitize(material))
    
    if description:
        # Take first 3 words of description
        desc_snippet = " ".join(description.split()[:3])
        parts.append(sanitize(desc_snippet))
        
    parts.append(str(item_id))
    
    filename = "_".join([p for p in parts if p]) + ".jpg"
    # Final cleanup to remove any double underscores or weirdness from parentheses
    filename = filename.replace('__', '_').replace('(_', '(').replace('_)', ')')
    return filename

def sync_filenames_with_disambiguated_names():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        SELECT ItemId, Name, Material, Description, ImageLink, ImagePath 
        FROM InventoryItem 
        WHERE ItemType='asset' AND IsDeleted=0
        AND (ImageLink IS NOT NULL AND ImageLink != '' OR ImagePath IS NOT NULL AND ImagePath != '')
    """)
    assets = cursor.fetchall()

    print(f"Syncing {len(assets)} assets...")

    stats = {"updated": 0, "skipped": 0, "errors": 0}

    for item_id, name, material, description, image_link, image_path in assets:
        current_file = image_link if image_link and not image_link.startswith('http') else image_path
        
        if not current_file or current_file.startswith('http'):
            stats["skipped"] += 1
            continue

        source_path = os.path.join(PHOTOS_DIR, current_file)
        new_filename = get_descriptive_filename(item_id, name, material, description)
        target_path = os.path.join(PHOTOS_DIR, new_filename)

        if not os.path.exists(source_path):
            if current_file == new_filename:
                stats["skipped"] += 1
                continue
            print(f"Source not found: {source_path} for Asset {item_id}")
            stats["errors"] += 1
            continue

        if current_file == new_filename:
            stats["skipped"] += 1
            continue

        try:
            # We RENAME (move) this time since we are syncing and want to clean up as we go
            # But wait, if multiple items share an image (which we solved earlier but let's be safe), 
            # we should still check. But we already established they are unique binaries now.
            shutil.copy2(source_path, target_path)
            
            cursor.execute("""
                UPDATE InventoryItem 
                SET ImageLink = ?, ImagePath = ? 
                WHERE ItemId = ?
            """, (new_filename, None, item_id))
            
            # Since we are "synced", we can eventually delete the source if it's different
            # but let's leave cleanup to the deep_cleanup script later.
            
            print(f"Synced Asset {item_id}: {new_filename}")
            stats["updated"] += 1
        except Exception as e:
            print(f"Error for Asset {item_id}: {e}")
            stats["errors"] += 1

    conn.commit()
    conn.close()
    print(f"\nSync Complete! Updated: {stats['updated']}")

if __name__ == "__main__":
    sync_filenames_with_disambiguated_names()
