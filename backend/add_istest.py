import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "seva.db")
    print(f"Migrating database at {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # We add IsTest with DEFAULT 0 (False) so all existing data is marked as NON-test (legacy/real).
    # New rows inserted by SQLAlchemy will use its own default=True.
    tables = [
        "Devotee",
        "SevaRegistration",
        "JournalEntry",
        "JournalLine",
        "BankTransaction"
    ]
    
    for table in tables:
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN IsTest BOOLEAN DEFAULT 0;")
            print(f"Successfully added 'IsTest' to {table}.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column 'IsTest' already exists in {table}.")
            else:
                print(f"Error altering {table}: {e}")
                
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    migrate()
