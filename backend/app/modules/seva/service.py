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
    def __init__(self, journal_gateway: JournalPostingGateway = None):
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

        # Check fiscal lock through gateway seam if gateway is provided
        if self.journal_gateway:
            self.journal_gateway.check_date_locked(db, formatted_date)

        db_reg = models.SevaRegistration(**reg.model_dump())
        try:
            db.add(db_reg)
            db.flush()

            # Auto-post to accounting through gateway seam if gateway is provided
            if self.journal_gateway:
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

    def sweep_deemed_fulfillment(self, db: Session) -> int:
        """
        Sweep all past non-cancelled sevas whose SevaDate has passed and mark them as DeemedFulfillment.
        """
        today = dt.date.today()
        candidates = db.query(models.SevaRegistration).filter(
            models.SevaRegistration.IsCancelled == False,
            models.SevaRegistration.IsExigencyCancelled == False,
            models.SevaRegistration.IsFulfilled == False,
        ).all()

        updated_count = 0
        now = dt.datetime.utcnow()
        for reg in candidates:
            # Check SevaDate or fallback to RegistrationDate
            target_str = reg.SevaDate or reg.RegistrationDate
            if target_str and len(target_str) == 6 and target_str.isdigit():
                try:
                    s_date = dt.datetime.strptime(target_str, "%d%m%y").date()
                    if s_date < today:
                        reg.IsFulfilled = True
                        reg.DeemedFulfilledAt = now
                        updated_count += 1
                except Exception:
                    continue

        if updated_count > 0:
            db.commit()
        return updated_count

    def log_exigency_cancellation(
        self,
        db: Session,
        registration_id: int,
        reason: str,
        staff_name: str = "Office Staff",
        action: str = "reschedule"
    ) -> models.SevaRegistration:
        """
        Record emergency non-fulfillment for a seva due to unforeseen exigencies.
        Requires a non-empty reason.
        """
        if not reason or not reason.strip():
            raise HTTPException(status_code=400, detail="A valid reason is required for exigency cancellation")

        reg = db.query(models.SevaRegistration).filter(
            models.SevaRegistration.RegistrationId == registration_id
        ).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Registration not found")
        if reg.IsCancelled:
            raise HTTPException(status_code=400, detail="Registration is already cancelled")

        reg.IsCancelled = True
        reg.IsFulfilled = False
        reg.IsExigencyCancelled = True
        reg.ExigencyReason = reason.strip()
        reg.ExigencyStaffName = staff_name.strip() if staff_name else "Office Staff"
        reg.ExigencyAction = action

        db.commit()
        db.refresh(reg)
        return reg


def get_registration_service(
    gateway: JournalPostingGateway = Depends(get_journal_gateway)
) -> SevaRegistrationService:
    return SevaRegistrationService(journal_gateway=gateway)


def sweep_deemed_fulfillment(db: Session) -> int:
    return SevaRegistrationService().sweep_deemed_fulfillment(db)


def log_exigency_cancellation(
    db: Session,
    registration_id: int,
    reason: str,
    staff_name: str = "Office Staff",
    action: str = "reschedule"
) -> models.SevaRegistration:
    return SevaRegistrationService().log_exigency_cancellation(
        db=db,
        registration_id=registration_id,
        reason=reason,
        staff_name=staff_name,
        action=action
    )

