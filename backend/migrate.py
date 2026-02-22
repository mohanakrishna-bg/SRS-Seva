import os
import subprocess
import sqlite3
import pandas as pd
import io
import re

ACCESS_DB = "/Users/bgm/my_Projects/SRS/Seva/RMutt_Tables-2025-26.accdb"
SQLITE_DB = "/Users/bgm/my_Projects/SRS/Seva/backend/seva.db"

def get_tables(db_path):
    tables = subprocess.check_output(["mdb-tables", "-1", db_path]).decode().splitlines()
    return [t for t in tables if t.strip()]

def clean_phone(phone_str):
    if pd.isna(phone_str):
        return None
    cleaned = re.sub(r'\D', '', str(phone_str))
    return cleaned if len(cleaned) >= 10 else None

def clean_and_migrate():
    if os.path.exists(SQLITE_DB):
        os.remove(SQLITE_DB)
    
    conn = sqlite3.connect(SQLITE_DB)
    tables = get_tables(ACCESS_DB)
    
    print(f"Found {len(tables)} tables to migrate.")
    anomalies = []
    
    for table in tables:
        print(f"Migrating table: {table}...")
        try:
            csv_data = subprocess.check_output(["mdb-export", ACCESS_DB, table])
            df = pd.read_csv(io.BytesIO(csv_data))
            
            # Global Column Cleanup
            df.columns = [c.replace(' ', '_').replace('-', '_').replace('(', '').replace(')', '').replace('/', '_') for c in df.columns]
            
            # Specific Cleanup Rules
            if table == "Customer":
                # Ensure new columns exist for the updated requirements
                if 'Phone' not in df.columns: df['Phone'] = None
                if 'WhatsApp_Phone' not in df.columns: df['WhatsApp_Phone'] = None
                if 'Email_ID' not in df.columns: df['Email_ID'] = None
                if 'Google_Maps_Location' not in df.columns: df['Google_Maps_Location'] = None
                
                # Flag anomalies
                for index, row in df.iterrows():
                    if pd.isna(row.get('Name')) or str(row.get('Name')).strip() == "":
                        anomalies.append({"Table": "Customer", "ID": row.get('ID1'), "Issue": "Missing Name"})
            
            if table == "Item": # Sevas
                if 'Prasada_Addon_Limit' not in df.columns: df['Prasada_Addon_Limit'] = 0
            
            if table == "Invoice_Hdr":
                if 'Payment_Mode' not in df.columns: df['Payment_Mode'] = 'Cash' # Default assumption
                
            df.to_sql(table, conn, index=False, if_exists='replace')
            print(f"Successfully migrated {len(df)} rows for {table}.")
            
        except Exception as e:
            print(f"Error migrating {table}: {e}")
            
    # Save Anomalies Report
    if anomalies:
        pd.DataFrame(anomalies).to_csv("backend/migration_anomalies.csv", index=False)
        print(f"WARNING: Found {len(anomalies)} anomalous records requiring human review. Check backend/migration_anomalies.csv")
        
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    clean_and_migrate()
