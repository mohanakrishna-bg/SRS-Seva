import os
import sqlite3

# Database and Paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BACKEND_DIR, "seva.db")
PHOTOS_DIR = os.path.join(BACKEND_DIR, "uploads", "photos")

def deep_cleanup():
    if not os.path.exists(DB_PATH):
        print("Database not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Step 1: Collect ALL strings from ALL columns in ALL tables
    referenced_files = set()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall()]
    
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            for row in rows:
                for val in row:
                    if isinstance(val, str):
                        # Add the string if it looks like a filename in our folder
                        referenced_files.add(val)
        except:
            continue

    # Step 2: List all files in the directory
    files_in_dir = os.listdir(PHOTOS_DIR)
    
    deleted_count = 0
    for f in files_in_dir:
        # Ignore hidden files like .DS_Store
        if f.startswith('.'):
            continue
            
        full_path = os.path.join(PHOTOS_DIR, f)
        if os.path.isdir(full_path):
            continue

        # If the filename or the full path isn't referenced in any table, it's garbage
        is_referenced = False
        if f in referenced_files:
            is_referenced = True
        else:
            # Also check if it's referenced with a leading slash or something
            for ref in referenced_files:
                if f in ref:
                    is_referenced = True
                    break
                    
        if not is_referenced:
            try:
                os.remove(full_path)
                print(f"Purged orphan: {f}")
                deleted_count += 1
            except Exception as e:
                print(f"Error purging {f}: {e}")
        else:
            print(f"Keeping: {f}")

    conn.close()
    print(f"\nDeep Cleanup Complete! Purged {deleted_count} files.")

if __name__ == "__main__":
    deep_cleanup()
