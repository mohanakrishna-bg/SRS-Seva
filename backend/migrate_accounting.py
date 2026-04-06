import os
import shutil
from sqlalchemy.orm import Session
# Ensure base and models are all imported so tables get registered
from app.database import engine, DB_PATH, Base
from app.models import models, accounting

def backup_db():
    backup_path = DB_PATH.replace('.db', '_backup_before_accounting.db')
    if os.path.exists(DB_PATH):
        if not os.path.exists(backup_path):
            shutil.copy2(DB_PATH, backup_path)
            print(f"Backed up {DB_PATH} to {backup_path}")
        else:
            print(f"Backup already exists at {backup_path}")

def seed_accounts():
    with Session(engine) as db:
        if db.query(accounting.AccountHead).first() is not None:
            print("Accounts already seeded.")
            return

        # Create default chart of accounts
        account_data = [
            # ASSETS
            {"Code": "A001", "Name": "Cash-in-Hand", "Type": "Asset"},
            {"Code": "A002", "Name": "Bank", "Type": "Asset"},
            # LIABILITIES
            {"Code": "L001", "Name": "Sundry Creditors", "Type": "Liability"},
            # INCOME
            {"Code": "I001", "Name": "Seva Income", "Type": "Income"},
            {"Code": "I002", "Name": "Donation Income", "Type": "Income"},
            {"Code": "I003", "Name": "Prasada Income", "Type": "Income"},
            {"Code": "I004", "Name": "Other Income", "Type": "Income"},
            # EXPENSES
            {"Code": "E001", "Name": "Pooja Expenses", "Type": "Expense"},
            {"Code": "E002", "Name": "Prasada Expenses", "Type": "Expense"},
            {"Code": "E003", "Name": "Administrative", "Type": "Expense"},
            {"Code": "E004", "Name": "Other Expenses", "Type": "Expense"},
        ]

        for acc in account_data:
            a = accounting.AccountHead(**acc)
            db.add(a)

        db.commit()
        print("Seeded default account heads.")

if __name__ == "__main__":
    print("Starting accounting migration...")
    backup_db()
    print("Creating tables if they do not exist...")
    Base.metadata.create_all(bind=engine)
    seed_accounts()
    print("Migration complete.")
