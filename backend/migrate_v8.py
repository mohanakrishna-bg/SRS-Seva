import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "seva.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute("ALTER TABLE SevaRegistration ADD COLUMN IsFulfilled BOOLEAN DEFAULT 0;")
        print("Successfully added IsFulfilled column to SevaRegistration.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("Column IsFulfilled already exists.")
        else:
            print(f"Error: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
