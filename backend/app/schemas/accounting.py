from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

# ─── Account Head ───
class AccountHeadBase(BaseModel):
    Code: str
    Name: str
    NameKn: Optional[str] = None
    Type: str  # Income, Expense, Asset, Liability
    ParentId: Optional[int] = None
    IsActive: bool = True

class AccountHeadCreate(AccountHeadBase):
    pass

class AccountHead(AccountHeadBase):
    Id: int
    model_config = ConfigDict(from_attributes=True)


# ─── Journal Line ───
class JournalLineBase(BaseModel):
    AccountId: int
    Debit: float = 0.0
    Credit: float = 0.0

class JournalLineCreate(JournalLineBase):
    pass

class JournalLine(JournalLineBase):
    Id: int
    JournalEntryId: int
    model_config = ConfigDict(from_attributes=True)


# ─── Journal Entry ───
class JournalEntryBase(BaseModel):
    EntryDate: str  # YYYY-MM-DD
    Narration: Optional[str] = None
    SourceModule: Optional[str] = None
    SourceRefId: Optional[str] = None

class JournalEntryCreate(JournalEntryBase):
    lines: List[JournalLineCreate]

class JournalEntry(JournalEntryBase):
    Id: int
    CreatedAt: Optional[datetime] = None
    lines: List[JournalLine] = []
    model_config = ConfigDict(from_attributes=True)


# ─── Bank Account ───
class BankAccountBase(BaseModel):
    AccountName: str
    BankName: str
    IFSC: Optional[str] = None
    AccountNumber: Optional[str] = None
    CurrentBalance: float = 0.0
    IsActive: bool = True

class BankAccountCreate(BankAccountBase):
    pass

class BankAccount(BankAccountBase):
    Id: int
    model_config = ConfigDict(from_attributes=True)


# ─── Bank Transaction ───
class BankTransactionBase(BaseModel):
    BankAccountId: int
    TransactionDate: str  # YYYY-MM-DD
    Type: str             # 'Deposit', 'Withdrawal', 'Transfer', 'Online'
    Mode: str             # 'Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque'
    Amount: float
    Reference: Optional[str] = None
    Narration: Optional[str] = None
    IsReconciled: bool = False
    JournalEntryId: Optional[int] = None

class BankTransactionCreate(BankTransactionBase):
    pass

class BankTransaction(BankTransactionBase):
    Id: int
    model_config = ConfigDict(from_attributes=True)


# ─── Report Schemas ───
class CollectionSummaryItem(BaseModel):
    Date: str
    PaymentMode: str
    SevaCode: Optional[str] = None
    TotalAmount: float
    Count: int

class CollectionSummaryResponse(BaseModel):
    items: List[CollectionSummaryItem]
    total: float

class IncomeExpenditureItem(BaseModel):
    AccountCode: str
    AccountName: str
    Amount: float

class IncomeExpenditureResponse(BaseModel):
    Income: List[IncomeExpenditureItem]
    Expenditure: List[IncomeExpenditureItem]
    TotalIncome: float
    TotalExpenditure: float
    SurplusDeficit: float

class BalanceSheetItem(BaseModel):
    AccountCode: str
    AccountName: str
    Amount: float

class BalanceSheetResponse(BaseModel):
    Assets: List[BalanceSheetItem]
    Liabilities: List[BalanceSheetItem]
    TotalAssets: float
    TotalLiabilities: float

class BankReconItem(BaseModel):
    Date: str
    Description: str
    Amount: float
    Type: str

class BankReconResponse(BaseModel):
    BalanceAsPerBooks: float
    UnreconciledDeposits: List[BankReconItem]
    UnreconciledWithdrawals: List[BankReconItem]
    BalanceAsPerBank: float

