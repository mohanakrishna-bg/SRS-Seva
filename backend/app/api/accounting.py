from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime

from app import database
from app.models import accounting
from app.schemas import accounting as schemas
from app.core.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/api/accounting", tags=["accounting"])

def check_date_locked(entry_date: str, db: Session):
    is_locked = db.query(accounting.ClosedDay).filter(accounting.ClosedDay.Date == entry_date).first()
    if is_locked:
        raise HTTPException(
            status_code=403,
            detail="Transaction Locked: This date's books have been signed off. Modifications are disabled."
        )

def check_edit_grace_period(created_at, current_user: User):
    if current_user and current_user.role != "admin":
        import datetime as dt
        created_datetime = datetime.strptime(created_at, "%Y-%m-%d %H:%M:%S") if isinstance(created_at, str) else created_at
        if datetime.utcnow() - created_datetime > dt.timedelta(hours=2):
            raise HTTPException(
                status_code=403,
                detail="Transaction Locked: Rolling 2-hour edit grace period has expired. Please contact an Administrator to unlock this transaction."
            )


# ─── Accounts ───

@router.get("/accounts", response_model=List[schemas.AccountHead])
def list_accounts(db: Session = Depends(database.get_db), active_only: bool = True):
    query = db.query(accounting.AccountHead)
    if active_only:
        query = query.filter(accounting.AccountHead.IsActive == True)
    return query.all()

@router.post("/accounts", response_model=schemas.AccountHead)
def create_account(account: schemas.AccountHeadCreate, db: Session = Depends(database.get_db)):
    db_acc = accounting.AccountHead(**account.model_dump())
    db.add(db_acc)
    db.commit()
    db.refresh(db_acc)
    return db_acc

@router.put("/accounts/{id}", response_model=schemas.AccountHead)
def update_account(id: int, account: schemas.AccountHeadCreate, db: Session = Depends(database.get_db)):
    db_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Id == id).first()
    if not db_acc:
        raise HTTPException(status_code=404, detail="Account not found")
    
    for key, value in account.model_dump().items():
        setattr(db_acc, key, value)
    
    db.commit()
    db.refresh(db_acc)
    return db_acc

@router.delete("/accounts/{id}")
def deactivate_account(id: int, db: Session = Depends(database.get_db)):
    db_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Id == id).first()
    if not db_acc:
        raise HTTPException(status_code=404, detail="Account not found")
    db_acc.IsActive = False
    db.commit()
    return {"status": "success"}


# ─── Journal Entries ───

@router.get("/journal", response_model=List[schemas.JournalEntry])
def list_journal(
    from_date: Optional[str] = None, 
    to_date: Optional[str] = None, 
    account_id: Optional[int] = None,
    limit: int = 100, 
    skip: int = 0,
    db: Session = Depends(database.get_db)
):
    query = db.query(accounting.JournalEntry)
    
    if from_date:
        query = query.filter(accounting.JournalEntry.EntryDate >= from_date)
    if to_date:
        query = query.filter(accounting.JournalEntry.EntryDate <= to_date)
    if account_id:
        query = query.join(accounting.JournalLine).filter(accounting.JournalLine.AccountId == account_id)
        
    entries = query.order_by(accounting.JournalEntry.Id.desc()).offset(skip).limit(limit).all()
    return entries

@router.get("/journal/{id}", response_model=schemas.JournalEntry)
def get_journal(id: int, db: Session = Depends(database.get_db)):
    entry = db.query(accounting.JournalEntry).filter(accounting.JournalEntry.Id == id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry

@router.post("/journal", response_model=schemas.JournalEntry)
def create_journal(entry: schemas.JournalEntryCreate, db: Session = Depends(database.get_db)):
    # Day Close lock check
    check_date_locked(entry.EntryDate, db)

    # Validate double entry balance
    total_debit = sum(line.Debit for line in entry.lines)
    total_credit = sum(line.Credit for line in entry.lines)
    
    if abs(total_debit - total_credit) > 0.01:
        raise HTTPException(status_code=400, detail="Debits and Credits must be equal")
    
    db_entry = accounting.JournalEntry(
        EntryDate=entry.EntryDate,
        Narration=entry.Narration,
        SourceModule=entry.SourceModule or 'Manual',
        SourceRefId=entry.SourceRefId
    )
    db.add(db_entry)
    db.flush() 
    
    for line in entry.lines:
        db_line = accounting.JournalLine(
            JournalEntryId=db_entry.Id,
            AccountId=line.AccountId,
            Debit=line.Debit,
            Credit=line.Credit
        )
        db.add(db_line)
        
    db.commit()
    db.refresh(db_entry)
    return db_entry


# ─── Bank Accounts ───

@router.get("/bank-accounts", response_model=List[schemas.BankAccount])
def list_bank_accounts(db: Session = Depends(database.get_db)):
    return db.query(accounting.BankAccount).all()

@router.post("/bank-accounts", response_model=schemas.BankAccount)
def create_bank_account(account: schemas.BankAccountCreate, db: Session = Depends(database.get_db)):
    db_acc = accounting.BankAccount(**account.model_dump())
    db.add(db_acc)
    db.commit()
    db.refresh(db_acc)
    return db_acc

@router.put("/bank-accounts/{id}", response_model=schemas.BankAccount)
def update_bank_account(id: int, account: schemas.BankAccountCreate, db: Session = Depends(database.get_db)):
    db_acc = db.query(accounting.BankAccount).filter(accounting.BankAccount.Id == id).first()
    if not db_acc:
        raise HTTPException(status_code=404, detail="Bank account not found")
        
    for key, value in account.model_dump().items():
        setattr(db_acc, key, value)
        
    db.commit()
    db.refresh(db_acc)
    return db_acc


# ─── Bank Transactions ───

@router.get("/bank-transactions", response_model=List[schemas.BankTransaction])
def list_bank_transactions(
    bank_id: Optional[int] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(database.get_db)
):
    query = db.query(accounting.BankTransaction)
    
    if bank_id:
        query = query.filter(accounting.BankTransaction.BankAccountId == bank_id)
    if from_date:
        query = query.filter(accounting.BankTransaction.TransactionDate >= from_date)
    if to_date:
        query = query.filter(accounting.BankTransaction.TransactionDate <= to_date)
        
    return query.order_by(accounting.BankTransaction.TransactionDate.desc(), accounting.BankTransaction.Id.desc()).offset(skip).limit(limit).all()

@router.post("/bank-transactions", response_model=schemas.BankTransaction)
def create_bank_transaction(txn: schemas.BankTransactionCreate, db: Session = Depends(database.get_db)):
    # Day Close lock check
    check_date_locked(txn.TransactionDate, db)

    bank_acc = db.query(accounting.BankAccount).filter(accounting.BankAccount.Id == txn.BankAccountId).first()
    if not bank_acc:
        raise HTTPException(status_code=404, detail="Bank account not found")

    is_reconciled = (txn.Status == "Reconciled" or txn.IsReconciled)
    if is_reconciled:
        if txn.Type in ['Deposit', 'Online']:
            bank_acc.CurrentBalance += txn.Amount
        elif txn.Type in ['Withdrawal', 'Transfer']:
            bank_acc.CurrentBalance -= txn.Amount

    db_txn = accounting.BankTransaction(
        BankAccountId=txn.BankAccountId,
        TransactionDate=txn.TransactionDate,
        Type=txn.Type,
        Mode=txn.Mode,
        Amount=txn.Amount,
        Reference=txn.Reference,
        Narration=txn.Narration,
        IsReconciled=is_reconciled,
        Status=txn.Status,
        JournalEntryId=txn.JournalEntryId
    )
    db.add(db_txn)
    db.commit()
    db.refresh(db_txn)
    return db_txn

@router.post("/bank-transactions/{id}/reconcile")
def reconcile_transaction(id: int, status: str = "Reconciled", db: Session = Depends(database.get_db)):
    txn = db.query(accounting.BankTransaction).filter(accounting.BankTransaction.Id == id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Day Close lock check
    check_date_locked(txn.TransactionDate, db)

    bank_acc = db.query(accounting.BankAccount).filter(accounting.BankAccount.Id == txn.BankAccountId).first()
    if not bank_acc:
        raise HTTPException(status_code=404, detail="Bank account not found")

    # Reverse previous balance mutations if status was Reconciled
    if txn.Status == "Reconciled":
        if txn.Type in ['Deposit', 'Online']:
            bank_acc.CurrentBalance -= txn.Amount
        elif txn.Type in ['Withdrawal', 'Transfer']:
            bank_acc.CurrentBalance += txn.Amount

    # Apply new balance mutations if new status is Reconciled
    if status == "Reconciled":
        if txn.Type in ['Deposit', 'Online']:
            bank_acc.CurrentBalance += txn.Amount
        elif txn.Type in ['Withdrawal', 'Transfer']:
            bank_acc.CurrentBalance -= txn.Amount

    txn.Status = status
    txn.IsReconciled = (status == "Reconciled")
    db.commit()
    return {"status": "success", "is_reconciled": txn.IsReconciled, "transaction_status": txn.Status}

# ─── Reports ───

@router.get("/reports/income-expenditure", response_model=schemas.IncomeExpenditureResponse)
def get_income_expenditure(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(
        accounting.AccountHead.Code,
        accounting.AccountHead.Name,
        accounting.AccountHead.Type,
        func.sum(accounting.JournalLine.Debit).label('total_debit'),
        func.sum(accounting.JournalLine.Credit).label('total_credit')
    ).join(accounting.JournalLine, accounting.AccountHead.Id == accounting.JournalLine.AccountId) \
     .join(accounting.JournalEntry, accounting.JournalLine.JournalEntryId == accounting.JournalEntry.Id)
     
    if from_date:
        query = query.filter(accounting.JournalEntry.EntryDate >= from_date)
    if to_date:
        query = query.filter(accounting.JournalEntry.EntryDate <= to_date)
        
    query = query.filter(accounting.AccountHead.Type.in_(['Income', 'Expense']))
    query = query.group_by(accounting.AccountHead.Id).all()

    income_items = []
    expense_items = []
    total_income = 0.0
    total_expense = 0.0

    for row in query:
        if row.Type == 'Income':
            amt = (row.total_credit or 0.0) - (row.total_debit or 0.0)
            if amt != 0:
                income_items.append(schemas.IncomeExpenditureItem(AccountCode=row.Code, AccountName=row.Name, Amount=amt))
                total_income += amt
        elif row.Type == 'Expense':
            amt = (row.total_debit or 0.0) - (row.total_credit or 0.0)
            if amt != 0:
                expense_items.append(schemas.IncomeExpenditureItem(AccountCode=row.Code, AccountName=row.Name, Amount=amt))
                total_expense += amt

    return schemas.IncomeExpenditureResponse(
        Income=income_items,
        Expenditure=expense_items,
        TotalIncome=total_income,
        TotalExpenditure=total_expense,
        SurplusDeficit=total_income - total_expense
    )

@router.get("/reports/balance-sheet", response_model=schemas.BalanceSheetResponse)
def get_balance_sheet(
    as_of: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(
        accounting.AccountHead.Code,
        accounting.AccountHead.Name,
        accounting.AccountHead.Type,
        func.sum(accounting.JournalLine.Debit).label('total_debit'),
        func.sum(accounting.JournalLine.Credit).label('total_credit')
    ).join(accounting.JournalLine, accounting.AccountHead.Id == accounting.JournalLine.AccountId) \
     .join(accounting.JournalEntry, accounting.JournalLine.JournalEntryId == accounting.JournalEntry.Id)
     
    if as_of:
        query = query.filter(accounting.JournalEntry.EntryDate <= as_of)
        
    query = query.filter(accounting.AccountHead.Type.in_(['Asset', 'Liability']))
    query = query.group_by(accounting.AccountHead.Id).all()

    asset_items = []
    liability_items = []
    total_assets = 0.0
    total_liabilities = 0.0

    for row in query:
        if row.Type == 'Asset':
            amt = (row.total_debit or 0.0) - (row.total_credit or 0.0)
            if amt != 0:
                asset_items.append(schemas.BalanceSheetItem(AccountCode=row.Code, AccountName=row.Name, Amount=amt))
                total_assets += amt
        elif row.Type == 'Liability':
            amt = (row.total_credit or 0.0) - (row.total_debit or 0.0)
            if amt != 0:
                liability_items.append(schemas.BalanceSheetItem(AccountCode=row.Code, AccountName=row.Name, Amount=amt))
                total_liabilities += amt

    # Incorporate surplus/deficit into Liabilities
    ie_resp = get_income_expenditure(None, as_of, db)
    if ie_resp.SurplusDeficit != 0:
        liability_items.append(schemas.BalanceSheetItem(AccountCode="EQ01", AccountName="Reserves & Surplus", Amount=ie_resp.SurplusDeficit))
        total_liabilities += ie_resp.SurplusDeficit

    return schemas.BalanceSheetResponse(
        Assets=asset_items,
        Liabilities=liability_items,
        TotalAssets=total_assets,
        TotalLiabilities=total_liabilities
    )

@router.get("/reports/bank-reconciliation", response_model=schemas.BankReconResponse)
def get_bank_reconciliation(
    bank_id: int,
    db: Session = Depends(database.get_db)
):
    bank = db.query(accounting.BankAccount).filter(accounting.BankAccount.Id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank account not found")

    unreconciled = db.query(accounting.BankTransaction).filter(
        accounting.BankTransaction.BankAccountId == bank_id,
        accounting.BankTransaction.IsReconciled == False
    ).all()

    deposits = []
    withdrawals = []
    bounced = []
    unreconciled_dep_amt = 0.0
    unreconciled_with_amt = 0.0

    for txn in unreconciled:
        item = schemas.BankReconItem(
            Date=txn.TransactionDate,
            Description=txn.Narration or f"{txn.Type} - {txn.Reference or ''}",
            Amount=txn.Amount,
            Type=txn.Type
        )
        if txn.Status == "Bounced":
            bounced.append(item)
        elif txn.Type in ['Deposit', 'Online']:
            deposits.append(item)
            unreconciled_dep_amt += txn.Amount
        else:
            withdrawals.append(item)
            unreconciled_with_amt += txn.Amount

    # Balance as per bank = Balance as per books + Unpresented Cheques (Withdrawals) - Uncleared Deposits
    balance_as_per_bank = bank.CurrentBalance + unreconciled_with_amt - unreconciled_dep_amt

    return schemas.BankReconResponse(
        BalanceAsPerBooks=bank.CurrentBalance,
        UnreconciledDeposits=deposits,
        UnreconciledWithdrawals=withdrawals,
        UnreconciledBounced=bounced,
        BalanceAsPerBank=balance_as_per_bank
    )

# ─── Collection Summary & Receipts/Payments ───

@router.get("/reports/collection", response_model=schemas.CollectionSummaryResponse)
def get_collection_summary(
    from_date: str,
    to_date: str,
    db: Session = Depends(database.get_db)
):
    from app.models import models
    
    query = db.query(
        models.SevaRegistration.RegistrationDate.label('Date'),
        models.SevaRegistration.PaymentMode.label('PaymentMode'),
        models.SevaRegistration.SevaCode.label('SevaCode'),
        func.sum(models.SevaRegistration.GrandTotal).label('TotalAmount'),
        func.count(models.SevaRegistration.RegistrationId).label('Count')
    ).filter(
        models.SevaRegistration.RegistrationDate >= from_date,
        models.SevaRegistration.RegistrationDate <= to_date
    ).group_by(
        models.SevaRegistration.RegistrationDate,
        models.SevaRegistration.PaymentMode,
        models.SevaRegistration.SevaCode
    ).all()
    
    items = []
    total = 0.0
    for row in query:
        amt = float(row.TotalAmount or 0.0)
        items.append(schemas.CollectionSummaryItem(
            Date=row.Date,
            PaymentMode=row.PaymentMode or "Cash",
            SevaCode=row.SevaCode,
            TotalAmount=amt,
            Count=row.Count
        ))
        total += amt
        
    return schemas.CollectionSummaryResponse(items=items, total=total)

@router.get("/reports/receipts-payments")
def get_receipts_payments(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(
        accounting.AccountHead.Name,
        func.sum(accounting.JournalLine.Debit).label('receipts'),
        func.sum(accounting.JournalLine.Credit).label('payments')
    ).join(accounting.JournalLine, accounting.AccountHead.Id == accounting.JournalLine.AccountId) \
     .join(accounting.JournalEntry, accounting.JournalLine.JournalEntryId == accounting.JournalEntry.Id)
     
    if from_date:
        query = query.filter(accounting.JournalEntry.EntryDate >= from_date)
    if to_date:
        query = query.filter(accounting.JournalEntry.EntryDate <= to_date)
        
    query = query.group_by(accounting.AccountHead.Name).all()
    
    receipts = []
    payments = []
    
    for row in query:
        if row.receipts and float(row.receipts) > 0:
            receipts.append({"account": row.Name, "amount": float(row.receipts)})
        if row.payments and float(row.payments) > 0:
            payments.append({"account": row.Name, "amount": float(row.payments)})
            
    return {"receipts": receipts, "payments": payments}


# ─── Compliance & Export (Stubs) ───

@router.get("/compliance/12a")
def get_12a_report(fy: str):
    return {"message": "Section 12A compliance data export will be generated here.", "fy": fy}

@router.get("/compliance/80g")
def get_80g_report(fy: str):
    return {"message": "80G donation receipts export will be generated here.", "fy": fy}

@router.get("/accounts/expenses", response_model=List[schemas.AccountHead])
def list_expense_accounts(db: Session = Depends(database.get_db)):
    return db.query(accounting.AccountHead).filter(
        accounting.AccountHead.Type == "Expense",
        accounting.AccountHead.IsActive == True
    ).all()

@router.post("/expenses")
def create_expense_voucher(voucher: schemas.ExpenseVoucherCreate, db: Session = Depends(database.get_db)):
    # Day Close lock check
    check_date_locked(voucher.Date, db)
    
    if voucher.Amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    # Balanced Double entry: Debit Expense Head, Credit Source Head (Cash/Bank Asset)
    db_entry = accounting.JournalEntry(
        EntryDate=voucher.Date,
        Narration=voucher.Narration,
        SourceModule="Inventory",
        SourceRefId=voucher.Reference
    )
    db.add(db_entry)
    db.flush()

    # 1. Debit selected expense account
    jl_debit = accounting.JournalLine(
        JournalEntryId=db_entry.Id,
        AccountId=voucher.ExpenseAccountId,
        Debit=voucher.Amount,
        Credit=0.0
    )
    # 2. Credit source asset account (Cash drawer or Bank account)
    jl_credit = accounting.JournalLine(
        JournalEntryId=db_entry.Id,
        AccountId=voucher.SourceAccountId,
        Debit=0.0,
        Credit=voucher.Amount
    )
    db.add_all([jl_debit, jl_credit])

    # If Source Account is a Bank Asset, automatically create matching BankTransaction
    source_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Id == voucher.SourceAccountId).first()
    if source_acc and source_acc.Code == "A002":
        # Find active BankAccount
        bank_acc = db.query(accounting.BankAccount).filter(accounting.BankAccount.IsActive == True).first()
        if bank_acc:
            db_txn = accounting.BankTransaction(
                BankAccountId=bank_acc.Id,
                TransactionDate=voucher.Date,
                Type="Withdrawal",
                Mode="NEFT",  # default Mode
                Amount=voucher.Amount,
                Reference=voucher.Reference,
                Narration=voucher.Narration,
                IsReconciled=False,
                Status="Pending",
                JournalEntryId=db_entry.Id
            )
            db.add(db_txn)

    db.commit()
    db.refresh(db_entry)
    return {"status": "success", "journal_entry_id": db_entry.Id}

@router.post("/close-day", response_model=schemas.ClosedDay)
def close_day(closed: schemas.ClosedDayCreate, db: Session = Depends(database.get_db)):
    db_closed = accounting.ClosedDay(Date=closed.Date)
    db.add(db_closed)
    db.commit()
    db.refresh(db_closed)
    return db_closed

@router.get("/ledger/{account_key}")
def get_ledger_drilldown(account_key: str, db: Session = Depends(database.get_db)):
    # Resolve by numeric ID or string code
    if account_key.isdigit():
        acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Id == int(account_key)).first()
    else:
        acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == account_key).first()

    if not acc:
        raise HTTPException(status_code=404, detail="Account head not found")

    lines = db.query(accounting.JournalLine).filter(
        accounting.JournalLine.AccountId == acc.Id
    ).join(accounting.JournalEntry).order_by(
        accounting.JournalEntry.EntryDate.asc(),
        accounting.JournalLine.Id.asc()
    ).all()
    
    response_data = []
    running_balance = 0.0
    for line in lines:
        entry = line.journal_entry
        running_balance += line.Debit - line.Credit
        response_data.append({
            "Id": line.Id,
            "Date": entry.EntryDate,
            "Narration": entry.Narration,
            "SourceModule": entry.SourceModule,
            "SourceRefId": entry.SourceRefId,
            "Debit": line.Debit,
            "Credit": line.Credit,
            "Balance": running_balance
        })
    return response_data

import csv
import io
from fastapi.responses import StreamingResponse

@router.get("/reports/export")
def export_report(type: str, db: Session = Depends(database.get_db)):
    output = io.StringIO()
    writer = csv.writer(output)

    if type == "ledger":
        writer.writerow(["Date", "Account Code", "Account Name", "Debit", "Credit", "Narration"])
        lines = db.query(accounting.JournalLine).join(accounting.JournalEntry).join(accounting.AccountHead).order_by(accounting.JournalEntry.EntryDate.desc()).all()
        for line in lines:
            writer.writerow([
                line.journal_entry.EntryDate,
                line.account.Code,
                line.account.Name,
                line.Debit,
                line.Credit,
                line.journal_entry.Narration
            ])
    elif type == "bank":
        writer.writerow(["Date", "Bank Account", "Type", "Mode", "Amount", "Reference", "Status", "Narration"])
        txns = db.query(accounting.BankTransaction).join(accounting.BankAccount).order_by(accounting.BankTransaction.TransactionDate.desc()).all()
        for txn in txns:
            writer.writerow([
                txn.TransactionDate,
                txn.bank_account.AccountName,
                txn.Type,
                txn.Mode,
                txn.Amount,
                txn.Reference,
                txn.Status,
                txn.Narration
            ])
    else:
        # Default journal export
        writer.writerow(["Date", "Journal ID", "Narration", "Source Module", "Source Ref"])
        entries = db.query(accounting.JournalEntry).order_by(accounting.JournalEntry.EntryDate.desc()).all()
        for entry in entries:
            writer.writerow([
                entry.EntryDate,
                entry.Id,
                entry.Narration,
                entry.SourceModule,
                entry.SourceRefId
            ])

    output.seek(0)
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={type}_report.csv"}
    )


# ─── Shared Utilities ───

def auto_post_journal(db: Session, db_reg: any):
    """Automatically posts a double-entry journal for a Seva Registration"""
    import datetime
    
    income_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == "I001").first()
    
    is_cash = db_reg.PaymentMode and db_reg.PaymentMode.lower() == "cash"
    asset_code = "A001" if is_cash else "A002"
    asset_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == asset_code).first()
    
    if income_acc and asset_acc and db_reg.GrandTotal and db_reg.GrandTotal > 0:
        is_test = getattr(db_reg, 'IsTest', True)
        
        je = accounting.JournalEntry(
            EntryDate=datetime.datetime.now().strftime("%Y-%m-%d"),
            Narration=f"Seva Booking {db_reg.RegistrationId} for {db_reg.SevaCode} ({db_reg.PaymentMode})",
            SourceModule="Seva",
            SourceRefId=str(db_reg.RegistrationId),
            IsTest=is_test
        )
        db.add(je)
        db.flush()
        
        jl_asset = accounting.JournalLine(JournalEntryId=je.Id, AccountId=asset_acc.Id, Debit=db_reg.GrandTotal, Credit=0.0, IsTest=is_test)
        jl_income = accounting.JournalLine(JournalEntryId=je.Id, AccountId=income_acc.Id, Debit=0.0, Credit=db_reg.GrandTotal, IsTest=is_test)
        db.add_all([jl_asset, jl_income])
        db.flush()
