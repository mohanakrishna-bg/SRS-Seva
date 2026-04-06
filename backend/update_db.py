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

add_column_if_not_exists(c, 'Invoice_Hdr', 'Date', 'DATETIME')
add_column_if_not_exists(c, 'Invoice_Hdr', 'VoucherNo', 'TEXT')
add_column_if_not_exists(c, 'Invoice_Hdr', 'CustomerCode', 'TEXT')
add_column_if_not_exists(c, 'Invoice_Hdr', 'TotalAmount', 'REAL')
add_column_if_not_exists(c, 'Invoice_Hdr', 'Payment_Mode', "TEXT DEFAULT 'Cash'")
add_column_if_not_exists(c, 'Invoice_Hdr', 'Payment_Reference', 'TEXT')
add_column_if_not_exists(c, 'Invoice_Hdr', 'Family_Members', 'INTEGER DEFAULT 0')
add_column_if_not_exists(c, 'Invoice_Hdr', 'Opt_Theertha_Prasada', 'BOOLEAN DEFAULT 0')

conn.commit()
conn.close()
