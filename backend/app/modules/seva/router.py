"""
Seva Domain Module Router.

Contains all endpoints for:
- Devotee CRUD + search + photo upload
- Seva CRUD
- Events Calendar
- Seva Registration (with accounting auto-post)
- Daily Stats
- Lookup tables (Gotra, Nakshatra)
- Legacy compatibility endpoints
- File upload
- UPI payment verification
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, File, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional
import os
import shutil
import datetime

from app.models import models
from app.schemas import schemas
from app import database
from app.core import auth
from app.shared.fuzzy_search import fuzzy_search_records

router = APIRouter(prefix="/api", tags=["seva"])

UPLOAD_DIR = "uploads"
PHOTO_DIR = os.path.join(UPLOAD_DIR, "photos")


# ═══════════════════════════════════════════════════════════
# DEVOTEE CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/devotees", response_model=schemas.PaginatedDevotees)
def list_devotees(
    skip: int = 0,
    limit: int = 2000,
    include_deleted: bool = False,
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Devotee)
    if not include_deleted:
        q = q.filter(or_(models.Devotee.IsDeleted == False, models.Devotee.IsDeleted == None))
    total = q.count()
    items = q.order_by(models.Devotee.Name).offset(skip).limit(limit).all()
    return {"items": items, "total": total}


@router.post("/devotees", response_model=schemas.Devotee)
def create_devotee(devotee: schemas.DevoteeCreate, db: Session = Depends(database.get_db)):
    db_devotee = models.Devotee(**devotee.model_dump())
    try:
        db.add(db_devotee)
        db.commit()
        db.refresh(db_devotee)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database operation failed")
    return db_devotee


@router.get("/devotees/{devotee_id}", response_model=schemas.Devotee)
def get_devotee(devotee_id: int, db: Session = Depends(database.get_db)):
    devotee = db.query(models.Devotee).filter(models.Devotee.DevoteeId == devotee_id).first()
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")
    return devotee


@router.put("/devotees/{devotee_id}", response_model=schemas.Devotee)
def update_devotee(devotee_id: int, data: schemas.DevoteeUpdate, db: Session = Depends(database.get_db)):
    devotee = db.query(models.Devotee).filter(models.Devotee.DevoteeId == devotee_id).first()
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(devotee, key, value)
    devotee.UpdatedAt = datetime.datetime.utcnow()
    db.commit()
    db.refresh(devotee)
    return devotee


@router.delete("/devotees/{devotee_id}")
def delete_devotee(devotee_id: int, permanent: bool = False, db: Session = Depends(database.get_db)):
    devotee = db.query(models.Devotee).filter(models.Devotee.DevoteeId == devotee_id).first()
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")
    if permanent:
        db.delete(devotee)
    else:
        devotee.IsDeleted = True
        devotee.UpdatedAt = datetime.datetime.utcnow()
    db.commit()
    return {"detail": "Devotee deleted" if permanent else "Devotee soft-deleted"}


@router.post("/devotees/cleanup")
def cleanup_deleted_devotees(db: Session = Depends(database.get_db)):
    """Permanently purge all soft-deleted devotees."""
    count = db.query(models.Devotee).filter(models.Devotee.IsDeleted == True).count()
    db.query(models.Devotee).filter(models.Devotee.IsDeleted == True).delete()
    db.commit()
    return {"detail": f"Permanently purged {count} devotees"}


# ─── Devotee Search ───

def deduplicate_devotees(devotees: List[models.Devotee]) -> List[models.Devotee]:
    def score_devotee(d: models.Devotee) -> int:
        score = 0
        if d.Phone: score += 1
        if d.WhatsApp_Phone: score += 1
        if d.Gotra: score += 1
        if d.Nakshatra: score += 1
        if d.Address: score += 1
        if d.City: score += 1
        if d.Email: score += 1
        return score

    unique_map = {}
    for d in devotees:
        name_key = (d.Name or "").strip().lower()
        phone_key = "".join(filter(str.isdigit, str(d.Phone or "")))
        key = f"{name_key}_{phone_key}"
        
        if key not in unique_map:
            unique_map[key] = d
        else:
            if score_devotee(d) > score_devotee(unique_map[key]):
                unique_map[key] = d

    return list(unique_map.values())


@router.get("/devotees/search/basic", response_model=List[schemas.Devotee])
def search_devotees_basic(q: str = "", db: Session = Depends(database.get_db)):
    """Basic search by Name or Phone."""
    if not q.strip():
        return []
        
    q_str = q.strip().lower()
    if q_str.replace(" ", "").replace("+", "").isdigit():
        term = f"%{q_str.replace(' ', '')}%"
        results = db.query(models.Devotee).filter(
            or_(models.Devotee.IsDeleted == False, models.Devotee.IsDeleted == None),
            or_(
                models.Devotee.Phone.ilike(term),
                models.Devotee.WhatsApp_Phone.ilike(term),
            )
        ).limit(200).all()
        return deduplicate_devotees(results)[:50]

    # Otherwise fuzzy name search
    all_devotees = db.query(models.Devotee).filter(
        or_(models.Devotee.IsDeleted == False, models.Devotee.IsDeleted == None)
    ).all()
    
    results = fuzzy_search_records(q_str, all_devotees, name_attr="Name", limit=200)
    return deduplicate_devotees(results)[:50]


@router.get("/devotees/search/advanced", response_model=List[schemas.Devotee])
def search_devotees_advanced(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    pin_code: Optional[str] = None,
    gotra: Optional[str] = None,
    nakshatra: Optional[str] = None,
    seva_codes: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """Advanced search with multiple criteria (AND logic)."""
    q = db.query(models.Devotee).filter(or_(models.Devotee.IsDeleted == False, models.Devotee.IsDeleted == None))

    if name:
        q = q.filter(models.Devotee.Name.ilike(f"%{name.strip()}%"))
    if phone:
        q = q.filter(models.Devotee.Phone.ilike(f"%{phone.strip()}%"))
    if pin_code:
        q = q.filter(models.Devotee.PinCode == pin_code.strip())
    if gotra:
        q = q.filter(models.Devotee.Gotra.ilike(f"%{gotra.strip()}%"))
    if nakshatra:
        q = q.filter(models.Devotee.Nakshatra.ilike(f"%{nakshatra.strip()}%"))

    if seva_codes:
        codes = [c.strip() for c in seva_codes.split(",") if c.strip()]
        if codes:
            reg_query = db.query(models.SevaRegistration.DevoteeId).filter(
                models.SevaRegistration.SevaCode.in_(codes)
            )
            if date_from:
                reg_query = reg_query.filter(models.SevaRegistration.RegistrationDate >= date_from)
            if date_to:
                reg_query = reg_query.filter(models.SevaRegistration.RegistrationDate <= date_to)
            devotee_ids = [r[0] for r in reg_query.distinct().all()]
            q = q.filter(models.Devotee.DevoteeId.in_(devotee_ids))

    results = q.limit(400).all()
    return deduplicate_devotees(results)[:200]


# ─── Devotee Photo ───

@router.post("/devotees/{devotee_id}/photo")
async def upload_devotee_photo(
    devotee_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
):
    devotee = db.query(models.Devotee).filter(models.Devotee.DevoteeId == devotee_id).first()
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"devotee_{devotee_id}{ext}"
    file_path = os.path.join(PHOTO_DIR, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    devotee.PhotoPath = f"/uploads/photos/{filename}"
    devotee.UpdatedAt = datetime.datetime.utcnow()
    db.commit()
    db.refresh(devotee)

    return {"filename": filename, "photo_path": devotee.PhotoPath}


# ═══════════════════════════════════════════════════════════
# SEVA CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/sevas", response_model=List[schemas.Seva])
def list_sevas(db: Session = Depends(database.get_db)):
    return db.query(models.Seva).order_by(models.Seva.SevaCode).all()


@router.post("/sevas", response_model=schemas.Seva)
def create_seva(seva: schemas.SevaCreate, db: Session = Depends(database.get_db)):
    data_dict = seva.model_dump(exclude={"composite_sevas"})
    db_seva = models.Seva(**data_dict)
    try:
        db.add(db_seva)
        db.commit()
        
        if seva.composite_sevas:
            for child_code in seva.composite_sevas:
                comp = models.EventComposition(ParentEventCode=db_seva.SevaCode, ChildSevaCode=child_code)
                db.add(comp)
            db.commit()
            
        db.refresh(db_seva)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return db_seva


@router.put("/sevas/{seva_code}", response_model=schemas.Seva)
def update_seva(seva_code: str, data: schemas.SevaCreate, db: Session = Depends(database.get_db)):
    seva = db.query(models.Seva).filter(models.Seva.SevaCode == seva_code).first()
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
        
    data_dict = data.model_dump(exclude={"composite_sevas"}, exclude_unset=True)
    for key, value in data_dict.items():
        setattr(seva, key, value)
        
    if data.composite_sevas is not None:
        db.query(models.EventComposition).filter(models.EventComposition.ParentEventCode == seva_code).delete()
        for child_code in data.composite_sevas:
            db.add(models.EventComposition(ParentEventCode=seva_code, ChildSevaCode=child_code))
            
    db.commit()
    db.refresh(seva)
    return seva


@router.delete("/sevas/{seva_code}")
def delete_seva(seva_code: str, db: Session = Depends(database.get_db)):
    seva = db.query(models.Seva).filter(models.Seva.SevaCode == seva_code).first()
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
    db.query(models.EventComposition).filter(models.EventComposition.ParentEventCode == seva_code).delete()
    db.delete(seva)
    db.commit()
    return {"detail": "Seva deleted"}


# ═══════════════════════════════════════════════════════════
# EVENTS CALENDAR
# ═══════════════════════════════════════════════════════════

@router.get("/events/calendar", response_model=List[schemas.Seva])
def get_daily_events(date: str, db: Session = Depends(database.get_db)):
    """Get all active Special Events occurring on a specific date (DDMMYY)."""
    events = db.query(models.Seva).filter(models.Seva.IsSpecialEvent == True).all()
    
    active_events = []
    for e in events:
        if not e.EventDate:
            continue
        if e.RecurrenceRule == 'Daily':
            active_events.append(e)
        elif e.RecurrenceRule == 'Monthly':
            if e.EventDate[:2] == date[:2]:
                active_events.append(e)
        elif e.RecurrenceRule == 'Yearly':
            if e.EventDate[:4] == date[:4]:
                active_events.append(e)
        elif e.RecurrenceRule == 'Weekly':
            try:
                dt_target = datetime.datetime.strptime(date, "%d%m%y")
                dt_event = datetime.datetime.strptime(e.EventDate, "%d%m%y")
                if dt_target.weekday() == dt_event.weekday():
                    active_events.append(e)
            except:
                pass
        else:
            if e.EventDate == date:
                active_events.append(e)
                
    return active_events


# ═══════════════════════════════════════════════════════════
# SEVA REGISTRATION
# ═══════════════════════════════════════════════════════════

@router.get("/registrations", response_model=List[schemas.SevaRegistration])
def list_registrations(
    skip: int = 0,
    limit: int = 100,
    date: Optional[str] = None,
    date_type: Optional[str] = "SevaDate",
    db: Session = Depends(database.get_db),
):
    query = db.query(models.SevaRegistration)
    if date:
        if date_type == "RegistrationDate":
            query = query.filter(models.SevaRegistration.RegistrationDate == date)
        else:
            query = query.filter(models.SevaRegistration.SevaDate == date)
    
    return (
        query
        .order_by(models.SevaRegistration.RegistrationId.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

@router.get("/registrations/by-date/{date}", response_model=List[schemas.SevaRegistration])
def registrations_by_date(date: str, date_type: Optional[str] = "SevaDate", db: Session = Depends(database.get_db)):
    query = db.query(models.SevaRegistration)
    if date_type == "RegistrationDate":
        query = query.filter(models.SevaRegistration.RegistrationDate == date)
    else:
        query = query.filter(models.SevaRegistration.SevaDate == date)
    
    return query.order_by(models.SevaRegistration.RegistrationId.desc()).all()



@router.post("/registrations/receipt/save")
def save_receipt_pdf(voucher_no: str, file: UploadFile = File(...), db: Session = Depends(database.get_db)):
    from app.core.config import get_settings
    settings = get_settings()
    receipts_dir = settings.RECEIPTS_DIR
    if not os.path.isabs(receipts_dir):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        receipts_dir = os.path.join(base_dir, receipts_dir)
    os.makedirs(receipts_dir, exist_ok=True)
    
    file_path = os.path.join(receipts_dir, f"Receipt-{voucher_no}.pdf")
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return {"status": "success", "path": file_path}

@router.post("/registrations", response_model=schemas.SevaRegistration)
def create_registration(reg: schemas.SevaRegistrationCreate, db: Session = Depends(database.get_db)):
    # Day Close lock check (cross-module call to Accounting)
    from app.api.accounting import check_date_locked, auto_post_journal
    import datetime as dt
    try:
        reg_dt = dt.datetime.strptime(reg.RegistrationDate, "%d%m%y")
        formatted_date = reg_dt.strftime("%Y-%m-%d")
    except Exception:
        formatted_date = reg.RegistrationDate
    check_date_locked(formatted_date, db)

    db_reg = models.SevaRegistration(**reg.model_dump())
    try:
        db.add(db_reg)
        db.flush()
        
        # Auto-post to accounting (cross-module integration)
        auto_post_journal(db, db_reg)

        db.commit()
        db.refresh(db_reg)
    except HTTPException:
        db.rollback()
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database operation failed")
    return db_reg


@router.get("/registrations/by-devotee/{devotee_id}", response_model=List[schemas.SevaRegistration])
def registrations_by_devotee(devotee_id: int, db: Session = Depends(database.get_db)):
    return (
        db.query(models.SevaRegistration)
        .filter(models.SevaRegistration.DevoteeId == devotee_id)
        .order_by(models.SevaRegistration.RegistrationId.desc())
        .all()
    )


@router.put("/registrations/{registration_id}/fulfil", response_model=schemas.SevaRegistration)
def fulfil_registration(registration_id: int, is_fulfilled: bool = True, db: Session = Depends(database.get_db)):
    reg = db.query(models.SevaRegistration).filter(models.SevaRegistration.RegistrationId == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    reg.IsFulfilled = is_fulfilled
    db.commit()
    db.refresh(reg)
    return reg


@router.put("/registrations/{registration_id}/modify", response_model=schemas.SevaRegistration)
def modify_registration(
    registration_id: int, 
    data: schemas.SevaRegistrationModify, 
    db: Session = Depends(database.get_db)
):
    import datetime as dt
    reg = db.query(models.SevaRegistration).filter(models.SevaRegistration.RegistrationId == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    if reg.IsCancelled:
        raise HTTPException(status_code=400, detail="Cannot modify a cancelled registration")

    additional_voucher_no = None
    update_data = data.model_dump(exclude_unset=True)
    
    # ── Handle Hastodaka increase ──
    new_prasada_count = update_data.pop("PrasadaCount", None)
    additional_amount = update_data.pop("AdditionalAmount", None)
    additional_payment_mode = update_data.pop("AdditionalPaymentMode", None)
    
    if new_prasada_count is not None:
        if new_prasada_count < (reg.PrasadaCount or 0):
            raise HTTPException(status_code=400, detail="Hastodaka count can only be increased, not decreased")
        
        old_count = reg.PrasadaCount or 0
        delta_count = new_prasada_count - old_count
        
        if delta_count > 0:
            # Calculate per-head rate from existing data
            if old_count > 0 and reg.Amount is not None:
                per_head_rate = ((reg.GrandTotal or 0) - (reg.Amount or 0)) / old_count
            else:
                # Fallback: use seva TPQty rate from the Seva master
                seva = db.query(models.Seva).filter(models.Seva.SevaCode == reg.SevaCode).first()
                per_head_rate = 200.0  # default fallback
                if seva and seva.Amount and reg.Amount:
                    # If the original registration has a base amount that differs,
                    # the per-head rate was encoded in the GrandTotal
                    per_head_rate = 200.0  # Use standard rate
            
            calculated_additional = round(delta_count * per_head_rate, 2)
            
            # Use the explicitly passed additional amount if provided, else calculated
            if additional_amount is not None:
                actual_additional = round(additional_amount, 2)
            else:
                actual_additional = calculated_additional
            
            reg.PrasadaCount = new_prasada_count
            reg.OptTheerthaPrasada = True
            reg.GrandTotal = round((reg.GrandTotal or 0) + actual_additional, 2)
            
            # Generate additional payment voucher
            additional_voucher_no = f"VCH-ADD-{reg.RegistrationId}-{dt.datetime.now().strftime('%H%M%S')}"
            
            # Post journal entry for additional amount
            if actual_additional > 0 and additional_payment_mode:
                from app.api.accounting import get_account_by_name_or_create
                from app.models import accounting
                
                income_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == "I001").first()
                is_cash = additional_payment_mode.lower() == "cash"
                asset_code = "A001" if is_cash else "A002"
                asset_acc = db.query(accounting.AccountHead).filter(accounting.AccountHead.Code == asset_code).first()
                
                if income_acc and asset_acc:
                    is_test = getattr(reg, 'IsTest', True)
                    je = accounting.JournalEntry(
                        EntryDate=dt.datetime.now().strftime("%Y-%m-%d"),
                        VoucherNo=additional_voucher_no,
                        Narration=f"Hastodaka Increase for Seva Reg #{reg.RegistrationId} (+{delta_count} heads, {additional_payment_mode})",
                        SourceModule="Seva",
                        SourceRefId=str(reg.RegistrationId),
                        IsTest=is_test
                    )
                    db.add(je)
                    db.flush()
                    
                    jl_asset = accounting.JournalLine(JournalEntryId=je.Id, AccountId=asset_acc.Id, Debit=actual_additional, Credit=0.0, IsTest=is_test)
                    jl_income = accounting.JournalLine(JournalEntryId=je.Id, AccountId=income_acc.Id, Debit=0.0, Credit=actual_additional, IsTest=is_test)
                    db.add_all([jl_asset, jl_income])
                    db.flush()
    
    # Apply remaining simple field updates (Remarks, SevaDate, DevoteeId, OptTheerthaPrasada)
    skip_fields = {"AdditionalAmount", "AdditionalPaymentMode", "PrasadaCount"}
    for key, value in update_data.items():
        if key not in skip_fields and value is not None:
            setattr(reg, key, value)
            
    db.commit()
    db.refresh(reg)
    return reg


@router.put("/registrations/{registration_id}/cancel", response_model=schemas.SevaRegistration)
def cancel_registration(
    registration_id: int, 
    data: schemas.SevaRegistrationCancel,
    db: Session = Depends(database.get_db)
):
    reg = db.query(models.SevaRegistration).filter(models.SevaRegistration.RegistrationId == registration_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    if reg.IsCancelled:
        raise HTTPException(status_code=400, detail="Registration is already cancelled")

    # Mark as cancelled
    reg.IsCancelled = True
    
    # Process Refund Accounting Entry if refund is provided
    if data.refund_amount and data.refund_amount > 0:
        from app.api.accounting import get_account_by_name_or_create
        from app.models import accounting
        import datetime as dt
        
        # 1. Reverse the Income (Debit Income Account)
        income_account = get_account_by_name_or_create(db, "Seva Income", "Income")
        
        # 2. Credit the Payment Mode Account (Cash or Bank)
        payment_acc_name = "Cash" if data.refund_mode == "Cash" else "Bank Account"
        payment_account = get_account_by_name_or_create(db, payment_acc_name, "Asset")
        
        # Create Journal Entry
        entry = accounting.JournalEntry(
            EntryDate=dt.datetime.now().strftime("%Y-%m-%d"),
            VoucherNo=f"REF-{reg.RegistrationId}-{dt.datetime.now().strftime('%H%M%S')}",
            Narration=f"Refund for cancelled Seva Reg #{reg.RegistrationId} (Amount: {data.refund_amount})",
            IsSystemGenerated=True
        )
        db.add(entry)
        db.flush()
        
        # Debit Income
        db.add(accounting.JournalLine(
            EntryId=entry.Id,
            AccountId=income_account.Id,
            Debit=data.refund_amount,
            Credit=0.0
        ))
        
        # Credit Asset (Refund payout)
        db.add(accounting.JournalLine(
            EntryId=entry.Id,
            AccountId=payment_account.Id,
            Debit=0.0,
            Credit=data.refund_amount
        ))

    db.commit()
    db.refresh(reg)
    return reg


# ─── Stats ───

@router.get("/stats/daily")
def get_daily_stats(
    date: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get registration stats for a given date (DDMMYY format)."""
    try:
        results = (
            db.query(
                models.SevaRegistration.SevaCode,
                func.count(models.SevaRegistration.RegistrationId).label("sevakarta_count"),
                func.sum(models.SevaRegistration.PrasadaCount).label("total_prasada"),
            )
            .filter(models.SevaRegistration.SevaDate == date)
            .group_by(models.SevaRegistration.SevaCode)
            .all()
        )

        stats = {}
        for row in results:
            stats[row.SevaCode] = {
                "sevakartas": row.sevakarta_count,
                "prasada": int(row.total_prasada or 0),
            }
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/daily-summary")
def get_daily_summary(
    date: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get financial summary for a given date (DDMMYY format)."""
    try:
        results = (
            db.query(
                models.SevaRegistration.PaymentMode,
                func.sum(models.SevaRegistration.GrandTotal).label("total_amount"),
                func.count(models.SevaRegistration.RegistrationId).label("count"),
            )
            .filter(models.SevaRegistration.RegistrationDate == date)
            .group_by(models.SevaRegistration.PaymentMode)
            .all()
        )

        payment_breakdown: dict = {}
        total_income = 0.0
        total_registrations = 0

        for row in results:
            mode = row.PaymentMode or "Cash"
            amt = float(row.total_amount or 0.0)
            cnt = int(row.count or 0)
            payment_breakdown[mode] = {"total": amt, "count": cnt}
            total_income += amt
            total_registrations += cnt

        # Get expenses for this date (cross-module call to Accounting)
        import datetime as dt
        try:
            date_dt = dt.datetime.strptime(date, "%d%m%y")
            formatted_date = date_dt.strftime("%Y-%m-%d")
        except Exception:
            formatted_date = date

        from app.models import accounting
        expenses = db.query(func.sum(accounting.JournalLine.Debit)).join(accounting.JournalEntry).filter(
            accounting.JournalEntry.EntryDate == formatted_date,
            accounting.JournalLine.Debit > 0.0,
            accounting.JournalLine.AccountId.in_(
                db.query(accounting.AccountHead.Id).filter(accounting.AccountHead.Type == "Expense")
            )
        ).scalar() or 0.0

        return {
            "date": date,
            "total_registrations": total_registrations,
            "total_income": total_income,
            "total_expense": expenses,
            "payment_breakdown": payment_breakdown,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Lookup tables ───

@router.get("/lookups/gotra")
def list_gotra(db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    rows = db.execute(text("SELECT GotraCode FROM Gotra ORDER BY GotraCode")).fetchall()
    return [r[0] for r in rows if r[0]]


@router.get("/lookups/nakshatra")
def list_nakshatra(db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    rows = db.execute(text("SELECT SNakshatra, SRaashi FROM Nakshatra_Raashi ORDER BY SNakshatra")).fetchall()
    return [{"nakshatra": r[0], "raashi": r[1]} for r in rows if r[0]]


# ─── Legacy compatibility ───

@router.get("/customers", response_model=List[schemas.LegacyCustomer])
def read_customers_legacy(skip: int = 0, limit: int = 2000, db: Session = Depends(database.get_db)):
    customers = db.query(models.LegacyCustomer).offset(skip).limit(limit).all()
    return [c for c in customers if c is not None]


@router.get("/customers/search", response_model=List[schemas.LegacyCustomer])
def search_customers_legacy(q: str = "", db: Session = Depends(database.get_db)):
    if not q.strip():
        return []
    q_str = q.strip().lower()
    if q_str.replace(" ", "").replace("+", "").isdigit():
        term = f"%{q_str.replace(' ', '')}%"
        return db.query(models.LegacyCustomer).filter(
            or_(
                models.LegacyCustomer.Phone.ilike(term),
                models.LegacyCustomer.WhatsApp_Phone.ilike(term),
            )
        ).limit(50).all()

    all_customers = db.query(models.LegacyCustomer).filter(
        models.LegacyCustomer.Name != None, models.LegacyCustomer.Name != ""
    ).all()
    return fuzzy_search_records(q_str, all_customers, name_attr="Name", limit=50)


@router.get("/items", response_model=List[schemas.LegacyItem])
def read_items_legacy(db: Session = Depends(database.get_db)):
    items = db.query(models.LegacyItem).filter(models.LegacyItem.ItemCode != None).all()
    return [i for i in items if i is not None]


# ─── Upload ───

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    uncategorized_dir = os.path.join(PHOTO_DIR, "uncategorized")
    os.makedirs(uncategorized_dir, exist_ok=True)
    file_path = os.path.join(uncategorized_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": f"uncategorized/{file.filename}", "status": "success"}


# ─── Payment Verification ───

@router.post("/payments/verify-upi", response_model=schemas.UPIVerificationResponse)
async def verify_upi_payment(req: schemas.UPIVerificationRequest):
    """Mock UPI verification logic."""
    if req.transaction_id.upper().startswith("FAIL"):
        return {
            "status": "failure",
            "message": f"ವಹಿವಾಟು ವಿಫಲವಾಗಿದೆ (Transaction failed with {req.gateway})",
            "details": {"error_code": "TRS_001", "bank_response": "Insufficient funds or invalid ID"}
        }
    
    if not req.gateway:
        raise HTTPException(status_code=400, detail="Gateway identification is required")

    return {
        "status": "success",
        "message": f"ವಹಿವಾಟು ಯಶಸ್ವಿಯಾಗಿದೆ (Transaction Verified via {req.gateway})",
        "details": {
            "utr": req.transaction_id,
            "timestamp": datetime.datetime.now().isoformat(),
            "amount_verified": True
        }
    }
