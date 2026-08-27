import os
import sys

# Add the parent directory to sys.path to allow importing from app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.backup_manager import backup_master, backup_transaction

def run_backup():
    print("Select backup type:")
    print("1. Master Tables")
    print("2. Transaction Tables")
    print("3. Both")
    
    choice = input("Enter choice (1/2/3): ").strip()
    
    if choice == '1':
        print("Running manual backup of Master tables...")
        backup_master()
        print("Done!")
    elif choice == '2':
        print("Running manual backup of Transaction tables...")
        backup_transaction()
        print("Done!")
    elif choice == '3':
        print("Running manual backup of all tables...")
        backup_master()
        backup_transaction()
        print("Done!")
    else:
        print("Invalid choice. Exiting.")

if __name__ == "__main__":
    run_backup()
