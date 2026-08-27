import os
import sys
import csv

# Add the parent directory to sys.path to allow importing from app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.models import Devotee, Seva, EventComposition, User, Role, Settings, SevaRegistration, UserAuditLog

TABLE_MAP = {
    'Devotee': Devotee,
    'Seva': Seva,
    'EventComposition': EventComposition,
    'users': User,
    'roles': Role,
    'settings': Settings,
    'SevaRegistration': SevaRegistration,
    'user_audit_log': UserAuditLog
}

def restore_from_csv(file_path, table_name):
    if table_name not in TABLE_MAP:
        print(f"Error: Unknown table '{table_name}'")
        return
        
    model = TABLE_MAP[table_name]
    db = SessionLocal()
    try:
        with open(file_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            # Clear existing data (optional, but usually required for full restore)
            print(f"Clearing existing data in {table_name}...")
            db.query(model).delete()
            
            # Insert new data
            records = []
            for row in reader:
                # Handle boolean and numeric conversions as needed, though SQLAlchemy is quite permissive
                for k, v in row.items():
                    if v == 'True': row[k] = True
                    elif v == 'False': row[k] = False
                    elif v == 'None' or v == '': row[k] = None
                records.append(model(**row))
                
            if records:
                db.bulk_save_objects(records)
                db.commit()
                print(f"Successfully restored {len(records)} records to {table_name}")
            else:
                print(f"No records found in {file_path}")
    except Exception as e:
        db.rollback()
        print(f"Restore failed for {table_name}: {e}")
    finally:
        db.close()

def main():
    print("Restore Database from CSV Backup")
    backup_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backups")
    if not os.path.exists(backup_dir):
        print("No backups directory found!")
        return
        
    folders = [f for f in os.listdir(backup_dir) if os.path.isdir(os.path.join(backup_dir, f))]
    if not folders:
        print("No backup folders found!")
        return
        
    for i, folder in enumerate(folders):
        print(f"{i+1}. {folder}")
        
    try:
        folder_idx = int(input("Select backup folder to restore from (number): ").strip()) - 1
        selected_folder = folders[folder_idx]
    except (ValueError, IndexError):
        print("Invalid selection.")
        return
        
    full_path = os.path.join(backup_dir, selected_folder)
    csv_files = [f for f in os.listdir(full_path) if f.endswith('.csv')]
    
    if not csv_files:
        print(f"No CSV files found in {selected_folder}")
        return
        
    print(f"\nFiles found in {selected_folder}:")
    for f in csv_files:
        print(f"- {f}")
        
    confirm = input("This will overwrite existing data. Are you sure? (y/N): ").strip().lower()
    if confirm != 'y':
        print("Restore cancelled.")
        return
        
    for file in csv_files:
        table_name = file.replace('.csv', '')
        restore_from_csv(os.path.join(full_path, file), table_name)
        
if __name__ == "__main__":
    main()
