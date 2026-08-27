"""
Archive and Clean Script

This script safely archives the current state of the database to offline CSV storage, 
and optionally cleans up all transaction data to provide a clean slate for production.

USAGE:
    1. To simply archive all tables (master and transaction) without deleting anything:
       $ python3 archive_and_clean.py
       
    2. To archive everything AND clear out only the transaction tables (SevaRegistration, UserAuditLog):
       $ python3 archive_and_clean.py --clear-transactions

NOTE:
    When using the --clear-transactions flag, the script will ALWAYS perform a full backup
    first before deleting any data, ensuring no data is accidentally lost. It will also 
    prompt for a final y/n confirmation before dropping records.
"""

import os
import sys
import argparse
import logging

# Add the parent directory to sys.path to allow importing from app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.backup_manager import backup_master, backup_transaction
from app.database import SessionLocal
from app.models.models import SevaRegistration, UserAuditLog

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def archive_all():
    logger.info("Starting complete archive of all tables...")
    backup_master()
    backup_transaction()
    logger.info("Archive completed successfully.")

def clear_transaction_tables():
    logger.info("Clearing transaction tables to start with a clean slate...")
    db = SessionLocal()
    try:
        # Delete all records from transaction tables
        deleted_regs = db.query(SevaRegistration).delete()
        deleted_audits = db.query(UserAuditLog).delete()
        
        db.commit()
        logger.info(f"Successfully cleared {deleted_regs} records from SevaRegistration.")
        logger.info(f"Successfully cleared {deleted_audits} records from UserAuditLog.")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to clear transaction tables: {e}")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(description="Archive database tables for offline storage and optionally clean transaction data.")
    parser.add_argument(
        '--clear-transactions', 
        action='store_true', 
        help="Clear all data from transaction tables (SevaRegistration, UserAuditLog) after archiving to start with a clean slate."
    )
    
    args = parser.parse_args()
    
    # 1. Always archive first for safety
    archive_all()
    
    # 2. Optionally clear transaction tables
    if args.clear_transactions:
        confirm = input("\nWARNING: You have selected to CLEAR all transaction data.\nThis will delete all registrations and audit logs. Are you sure you want to proceed? (yes/no): ").strip().lower()
        if confirm in ['yes', 'y']:
            clear_transaction_tables()
        else:
            logger.info("Transaction clearing cancelled by user.")

if __name__ == "__main__":
    main()
