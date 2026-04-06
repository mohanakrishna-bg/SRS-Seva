import sqlite3

def add_column_if_not_exists(cursor, table, column_name, column_type):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    if column_name not in columns:
        print(f"Adding {column_name} to {table}")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column_name} {column_type}")
    else:
        print(f"Column {column_name} already exists in {table}")

conn = sqlite3.connect('seva.db')
c = conn.cursor()

add_column_if_not_exists(c, 'Customer', 'WhatsApp_Phone', 'TEXT')
add_column_if_not_exists(c, 'Customer', 'Email_ID', 'TEXT')
add_column_if_not_exists(c, 'Customer', 'Google_Maps_Location', 'TEXT')

conn.commit()
conn.close()
