import sqlite3
import os

# DB_PATH is in the same directory as this script
DB_PATH = os.path.join(os.path.dirname(__file__), 'seva.db')

def migrate():
    print("Starting migration to add missing columns to SevaRegistration...")
    if not os.path.exists(DB_PATH):
        print(f"Error: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Check SevaRegistration columns
        cursor.execute("PRAGMA table_info(SevaRegistration)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'PaymentDetails' not in columns:
            cursor.execute("ALTER TABLE SevaRegistration ADD COLUMN PaymentDetails JSON;")
            print("Added column PaymentDetails to SevaRegistration table.")
        else:
            print("Column PaymentDetails already exists in SevaRegistration.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    else:
        conn.commit()
        print("Migration completed successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
