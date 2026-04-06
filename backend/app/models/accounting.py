from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
import datetime
from app.database import Base

class AccountHead(Base):
    __tablename__ = "AccountHead"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Code = Column(String, unique=True, index=True, nullable=False)
    Name = Column(String, nullable=False)
    NameKn = Column(String, nullable=True)
    Type = Column(String, nullable=False)  # 'Income', 'Expense', 'Asset', 'Liability'
    ParentId = Column(Integer, ForeignKey("AccountHead.Id"), nullable=True)
    IsActive = Column(Boolean, default=True)

    parent = relationship("AccountHead", remote_side=[Id])


class JournalEntry(Base):
    __tablename__ = "JournalEntry"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    EntryDate = Column(String, nullable=False)  # YYYY-MM-DD
    Narration = Column(Text, nullable=True)
    SourceModule = Column(String, nullable=True)  # 'Seva', 'Manual', 'Bank', 'HR', 'Inventory'
    SourceRefId = Column(String, nullable=True)   # Links to RegistrationId, etc.
    IsTest = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    lines = relationship("JournalLine", back_populates="journal_entry", cascade="all, delete-orphan")


class JournalLine(Base):
    __tablename__ = "JournalLine"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    JournalEntryId = Column(Integer, ForeignKey("JournalEntry.Id"), nullable=False)
    AccountId = Column(Integer, ForeignKey("AccountHead.Id"), nullable=False)
    Debit = Column(Float, default=0.0)
    Credit = Column(Float, default=0.0)
    IsTest = Column(Boolean, default=True)

    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("AccountHead")


class BankAccount(Base):
    __tablename__ = "BankAccount"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    AccountName = Column(String, nullable=False)
    BankName = Column(String, nullable=False)
    IFSC = Column(String, nullable=True)
    AccountNumber = Column(String, nullable=True)
    CurrentBalance = Column(Float, default=0.0)
    IsActive = Column(Boolean, default=True)


class BankTransaction(Base):
    __tablename__ = "BankTransaction"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    BankAccountId = Column(Integer, ForeignKey("BankAccount.Id"), nullable=False)
    TransactionDate = Column(String, nullable=False)  # YYYY-MM-DD
    Type = Column(String, nullable=False)  # 'Deposit', 'Withdrawal', 'Transfer', 'Online'
    Mode = Column(String, nullable=False)  # 'Cash', 'UPI', 'NEFT', 'RTGS', 'Cheque'
    Amount = Column(Float, nullable=False)
    Reference = Column(String, nullable=True)
    Narration = Column(Text, nullable=True)
    IsReconciled = Column(Boolean, default=False)
    IsTest = Column(Boolean, default=True)
    JournalEntryId = Column(Integer, ForeignKey("JournalEntry.Id"), nullable=True)

    bank_account = relationship("BankAccount")
    journal_entry = relationship("JournalEntry")
