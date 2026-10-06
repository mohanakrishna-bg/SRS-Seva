"""
Journal Posting Gateway Seam.
Decouples Seva booking operations from Accounting domain logic and schema constraints.
"""
from abc import ABC, abstractmethod
from typing import Any
from sqlalchemy.orm import Session


class JournalPostingGateway(ABC):
    """Abstract port for accounting integration during seva booking."""

    @abstractmethod
    def check_date_locked(self, db: Session, date_str: str) -> None:
        """Verify whether the specified calendar date has been closed/locked in accounting."""
        pass

    @abstractmethod
    def post_registration_journal(self, db: Session, db_reg: Any) -> None:
        """Post automated journal vouchers for the confirmed seva registration."""
        pass


class AccountingJournalAdapter(JournalPostingGateway):
    """Production adapter delegating to live accounting services."""

    def check_date_locked(self, db: Session, date_str: str) -> None:
        from app.api.accounting import check_date_locked
        check_date_locked(date_str, db)

    def post_registration_journal(self, db: Session, db_reg: Any) -> None:
        from app.api.accounting import auto_post_journal
        auto_post_journal(db, db_reg)


class NoopJournalAdapter(JournalPostingGateway):
    """Test-isolation adapter allowing booking tests to run without accounting ledger dependencies."""

    def __init__(self, should_lock: bool = False):
        self.should_lock = should_lock
        self.posted_registrations = []

    def check_date_locked(self, db: Session, date_str: str) -> None:
        if self.should_lock:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=f"Date {date_str} is locked by Day Close")

    def post_registration_journal(self, db: Session, db_reg: Any) -> None:
        self.posted_registrations.append(db_reg)


def get_journal_gateway() -> JournalPostingGateway:
    """FastAPI dependency provider for JournalPostingGateway."""
    return AccountingJournalAdapter()
