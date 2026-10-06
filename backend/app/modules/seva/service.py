"""
Seva Registration Domain Service.
Encapsulates transaction boundaries, fiscal validation, and journal posting delegation.
"""
import datetime as dt
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.models import models
from app.schemas import schemas
from .journal_gateway import JournalPostingGateway, get_journal_gateway


class SevaRegistrationService:
    def __init__(self, journal_gateway: JournalPostingGateway):
        self.journal_gateway = journal_gateway

    def register_seva(
        self,
        db: Session,
        reg: schemas.SevaRegistrationCreate
    ) -> models.SevaRegistration:
        """
        Record seva registration and delegate journal posting via gateway seam in an atomic transaction.
        """
        try:
            reg_dt = dt.datetime.strptime(reg.RegistrationDate, "%d%m%y")
            formatted_date = reg_dt.strftime("%Y-%m-%d")
        except Exception:
            formatted_date = reg.RegistrationDate

        # Check fiscal lock through gateway seam
        self.journal_gateway.check_date_locked(db, formatted_date)

        db_reg = models.SevaRegistration(**reg.model_dump())
        try:
            db.add(db_reg)
            db.flush()

            # Auto-post to accounting through gateway seam
            self.journal_gateway.post_registration_journal(db, db_reg)

            db.commit()
            db.refresh(db_reg)
            return db_reg
        except HTTPException:
            db.rollback()
            raise
        except SQLAlchemyError:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database operation failed")


def get_registration_service(
    gateway: JournalPostingGateway = Depends(get_journal_gateway)
) -> SevaRegistrationService:
    return SevaRegistrationService(journal_gateway=gateway)
