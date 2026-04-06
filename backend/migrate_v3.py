import sqlite3
import sys
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'seva.db')

def migrate():
    print("Starting migration to add Special Event fields to Seva table...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Add columns to Seva table
    new_columns = [
        ("IsSpecialEvent", "BOOLEAN DEFAULT False"),
        ("EventDate", "VARCHAR"),
        ("StartTime", "VARCHAR"),
        ("EndTime", "VARCHAR"),
        ("IsAllDay", "BOOLEAN DEFAULT False"),
        ("RecurrenceRule", "VARCHAR")
    ]

    for col_name, col_type in new_columns:
        try:
            cursor.execute(f"ALTER TABLE Seva ADD COLUMN {col_name} {col_type};")
            print(f"Added column {col_name} to Seva table.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                print(f"Column {col_name} already exists. Skipping.")
            else:
                print(f"Failed to add column {col_name}: {e}")
                
    # Initialize defaults where needed
    cursor.execute("UPDATE Seva SET IsSpecialEvent = False WHERE IsSpecialEvent IS NULL")
    cursor.execute("UPDATE Seva SET IsAllDay = False WHERE IsAllDay IS NULL")

    # 2. Create EventComposition table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS EventComposition (
        Id INTEGER PRIMARY KEY AUTOINCREMENT,
        ParentEventCode VARCHAR NOT NULL,
        ChildSevaCode VARCHAR NOT NULL,
        FOREIGN KEY(ParentEventCode) REFERENCES Seva(SevaCode),
        FOREIGN KEY(ChildSevaCode) REFERENCES Seva(SevaCode)
    )
    ''')
    
    # 3. Create index for fast lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_event_composition_parent ON EventComposition(ParentEventCode);")
    print("EventComposition table created.")

    conn.commit()
    conn.close()
    print("Migration v3 (Special Events) completed successfully.")

if __name__ == "__main__":
    migrate()
