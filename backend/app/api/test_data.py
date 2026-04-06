from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime
import random

from app import database
from app.models import models, accounting
from app.api.accounting import auto_post_journal

router = APIRouter(prefix="/api/test", tags=["test_data"])

@router.post("/simulate")
def simulate_test_data(db: Session = Depends(database.get_db)):
    """Generates extremely realistic test data using existing data permutations."""
    today = datetime.datetime.now()
    
    # 1. Simulate Seva Registrations recursively using real Master Data
    devotees = db.query(models.Devotee).filter(models.Devotee.IsDeleted == False).limit(50).all()
    sevas = db.query(models.Seva).limit(20).all()
    
    if not devotees or not sevas:
        raise HTTPException(status_code=400, detail="Missing Devotee or Seva master data to permute.")
        
    payment_modes = ["Cash", "UPI", "Cheque", "Online"]
    
    generated_count = 0
    for i in range(15):
        # Pick random devotee and seva
        d = random.choice(devotees)
        s = random.choice(sevas)
        pm = random.choice(payment_modes)
        
        # Pick a random date within the last 5 days
        past_date = today - datetime.timedelta(days=random.randint(0, 5))
        date_str = past_date.strftime("%d%m%y")
        journal_date = past_date.strftime("%Y-%m-%d")
        
        qty = random.randint(1, 3)
        amount = (s.Amount or 100.0) * qty
        
        reg = models.SevaRegistration(
            RegistrationDate=date_str,
            SevaDate=date_str,
            DevoteeId=d.DevoteeId,
            SevaCode=s.SevaCode,
            Qty=qty,
            Rate=s.Amount or 100.0,
            Amount=amount,
            GrandTotal=amount,
            PaymentMode=pm,
            Remarks="Simulated test booking",
            IsTest=True
        )
        db.add(reg)
        db.commit()
        db.refresh(reg)
        
        # Force the auto journal explicitly with the past date
        auto_post_journal(db, reg)
        
        # Overwrite the auto-journal date with our simulated realistic past date
        je = db.query(accounting.JournalEntry).filter(
            accounting.JournalEntry.SourceModule == "Seva",
            accounting.JournalEntry.SourceRefId == str(reg.RegistrationId)
        ).first()
        if je:
            je.EntryDate = journal_date
            je.IsTest = True
            db.commit()
            
        generated_count += 1
        
    # 2. Simulate Expenses (Electricity, Salary)
    expense_head = db.query(accounting.AccountHead).filter(accounting.AccountHead.Type == "Expense").first()
    bank_head = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == "A002", accounting.AccountHead.Name == "Bank").first()
    
    if expense_head and bank_head:
        for _ in range(3):
            exp_date = (today - datetime.timedelta(days=random.randint(1, 15))).strftime("%Y-%m-%d")
            amt = float(random.choice([1200, 5000, 350, 4200]))
            
            je = accounting.JournalEntry(
                EntryDate=exp_date,
                Narration=f"Payment for {expense_head.Name}",
                SourceModule="Manual",
                IsTest=True
            )
            db.add(je)
            db.commit()
            db.refresh(je)
            
            # Debit Expense
            db.add(accounting.JournalLine(JournalEntryId=je.Id, AccountId=expense_head.Id, Debit=amt, IsTest=True))
            # Credit Bank
            db.add(accounting.JournalLine(JournalEntryId=je.Id, AccountId=bank_head.Id, Credit=amt, IsTest=True))
            db.commit()

    # 3. Simulate Bank Transactions (Cash Deposit)
    bank_acct = db.query(accounting.BankAccount).first()
    if bank_acct:
        bt = accounting.BankTransaction(
            BankAccountId=bank_acct.Id,
            TransactionDate=today.strftime("%Y-%m-%d"),
            Type="Deposit",
            Mode="Cash",
            Amount=5000.0,
            Narration="Cash collection deposit into bank",
            IsReconciled=False,
            IsTest=True
        )
        bank_acct.CurrentBalance += 5000.0
        db.add(bt)
        
        # We need a Journal Entry for this deposit too
        cash_head = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == "A001").first()
        if bank_head and cash_head:
            je = accounting.JournalEntry(
                EntryDate=today.strftime("%Y-%m-%d"),
                Narration="Bank Remittance (Cash)",
                SourceModule="Bank",
                IsTest=True
            )
            db.add(je)
            db.commit()
            db.refresh(je)
            
            db.add(accounting.JournalLine(JournalEntryId=je.Id, AccountId=bank_head.Id, Debit=5000.0, IsTest=True))
            db.add(accounting.JournalLine(JournalEntryId=je.Id, AccountId=cash_head.Id, Credit=5000.0, IsTest=True))
            
            bt.JournalEntryId = je.Id
            
        db.commit()

    return {"message": f"Successfully simulated {generated_count} valid real-world scenarios across the system.", "success": True}

@router.delete("/cleanup")
def cleanup_test_data(db: Session = Depends(database.get_db)):
    """Strictly deletes all rows marked as IsTest=True."""
    
    deleted = {}
    
    # 1. Bank Transactions
    bt_deleted = db.query(accounting.BankTransaction).filter(accounting.BankTransaction.IsTest == True).delete()
    
    # 2. Journal Lines
    jl_deleted = db.query(accounting.JournalLine).filter(accounting.JournalLine.IsTest == True).delete()
    
    # 3. Journal Entries
    je_deleted = db.query(accounting.JournalEntry).filter(accounting.JournalEntry.IsTest == True).delete()
    
    # 4. Seva Registrations
    sr_deleted = db.query(models.SevaRegistration).filter(models.SevaRegistration.IsTest == True).delete()
    
    # 5. Devotee
    dev_deleted = db.query(models.Devotee).filter(models.Devotee.IsTest == True).delete()
    
    db.commit()
    
    return {
        "message": "Cleanup complete.",
        "deleted_counts": {
            "BankTransaction": bt_deleted,
            "JournalLine": jl_deleted,
            "JournalEntry": je_deleted,
            "SevaRegistration": sr_deleted,
            "Devotee": dev_deleted
        }
    }
