from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Query
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
import os
import shutil
import datetime
import difflib

def fuzzy_search_records(query: str, records: list, name_attr: str = "Name", limit: int = 50):
    q_str = query.strip().lower()
    scored = []
    for r in records:
        name = getattr(r, name_attr, "")
        if not name:
            continue
        name_lower = name.lower()
        if q_str in name_lower:
            scored.append((1.0, r))
            continue
        
        score = difflib.SequenceMatcher(None, q_str, name_lower).ratio()
        words = name_lower.split()
        if words:
            best_w = max(difflib.SequenceMatcher(None, q_str, w).ratio() for w in words)
            score = max(score, best_w * 0.9)
            
        if score > 0.55:
            scored.append((score, r))
            
    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:limit]]

from fastapi.staticfiles import StaticFiles

from app.models import models
from app.schemas import schemas
from app import database
from app.core import auth
from app.api.accounting import router as accounting_router
from app.api.test_data import router as test_data_router
from app.api.inventory import router as inventory_router
from app.api.image_sync import router as image_sync_router

from fastapi.middleware.cors import CORSMiddleware

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Seva Modern Intranet")
app.include_router(accounting_router)
app.include_router(test_data_router)
app.include_router(inventory_router)
app.include_router(image_sync_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
PHOTO_DIR = os.path.join(UPLOAD_DIR, "photos")
for d in [UPLOAD_DIR, PHOTO_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ─── Health ───
@app.get("/api/health")
def health_check():
    return {"status": "ok", "db": database.DB_PATH}


# ─── Auth ───
@app.post("/api/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(database.get_db),
):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# ═══════════════════════════════════════════════════════════
# DEVOTEE CRUD
# ═══════════════════════════════════════════════════════════

@app.get("/api/devotees", response_model=List[schemas.Devotee])
def list_devotees(
    skip: int = 0,
    limit: int = 2000,
    include_deleted: bool = False,
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Devotee)
    if not include_deleted:
        q = q.filter(or_(models.Devotee.IsDeleted == False, models.Devotee.IsDeleted == None))
    return q.order_by(models.Devotee.Name).offset(skip).limit(limit).all()


@app.post("/api/devotees", response_model=schemas.Devotee)
def create_devotee(devotee: schemas.DevoteeCreate, db: Session = Depends(database.get_db)):
    db_devotee = models.Devotee(**devotee.model_dump())
    try:
        db.add(db_devotee)
        db.commit()
        db.refresh(db_devotee)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return db_devotee


@app.get("/api/devotees/{devotee_id}", response_model=schemas.Devotee)
def get_devotee(devotee_id: int, db: Session = Depends(database.get_db)):
    devotee = db.query(models.Devotee).filter(models.Devotee.DevoteeId == devotee_id).first()
    if not devotee:
        raise HTTPException(status_code=404, detail="Devotee not found")
    return devotee


@app.put("/api/devotees/{devotee_id}", response_model=schemas.Devotee)
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


@app.delete("/api/devotees/{devotee_id}")
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


@app.post("/api/devotees/cleanup")
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


@app.get("/api/devotees/search/basic", response_model=List[schemas.Devotee])
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


@app.get("/api/devotees/search/advanced", response_model=List[schemas.Devotee])
def search_devotees_advanced(
    name: Optional[str] = None,
    phone: Optional[str] = None,
    pin_code: Optional[str] = None,
    gotra: Optional[str] = None,
    nakshatra: Optional[str] = None,
    seva_codes: Optional[str] = None,  # comma-separated
    date_from: Optional[str] = None,   # DDMMYY
    date_to: Optional[str] = None,     # DDMMYY
    db: Session = Depends(database.get_db),
):
    """
    Advanced search with multiple criteria (AND logic).
    seva_codes: comma-separated list of SevaCode values.
    date_from/date_to: DDMMYY range for seva registration.
    """
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

    # Filter by seva registration (requires subquery join)
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

@app.post("/api/devotees/{devotee_id}/photo")
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

@app.get("/api/sevas", response_model=List[schemas.Seva])
def list_sevas(db: Session = Depends(database.get_db)):
    return db.query(models.Seva).order_by(models.Seva.SevaCode).all()


@app.post("/api/sevas", response_model=schemas.Seva)
def create_seva(seva: schemas.SevaCreate, db: Session = Depends(database.get_db)):
    data_dict = seva.model_dump(exclude={"composite_sevas"})
    db_seva = models.Seva(**data_dict)
    try:
        db.add(db_seva)
        db.commit()
        
        # Add composite children if any
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



@app.put("/api/sevas/{seva_code}", response_model=schemas.Seva)
def update_seva(seva_code: str, data: schemas.SevaCreate, db: Session = Depends(database.get_db)):
    seva = db.query(models.Seva).filter(models.Seva.SevaCode == seva_code).first()
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
        
    data_dict = data.model_dump(exclude={"composite_sevas"}, exclude_unset=True)
    for key, value in data_dict.items():
        setattr(seva, key, value)
        
    # Update composite relationships
    if data.composite_sevas is not None:
        db.query(models.EventComposition).filter(models.EventComposition.ParentEventCode == seva_code).delete()
        for child_code in data.composite_sevas:
            db.add(models.EventComposition(ParentEventCode=seva_code, ChildSevaCode=child_code))
            
    db.commit()
    db.refresh(seva)
    return seva

@app.delete("/api/sevas/{seva_code}")
def delete_seva(seva_code: str, db: Session = Depends(database.get_db)):
    seva = db.query(models.Seva).filter(models.Seva.SevaCode == seva_code).first()
    if not seva:
        raise HTTPException(status_code=404, detail="Seva not found")
        
    # Cascade delete links
    db.query(models.EventComposition).filter(models.EventComposition.ParentEventCode == seva_code).delete()
    
    db.delete(seva)
    db.commit()
    return {"detail": "Seva deleted"}


# ═══════════════════════════════════════════════════════════
# EVENTS CALENDAR
# ═══════════════════════════════════════════════════════════

@app.get("/api/events/calendar", response_model=List[schemas.Seva])
def get_daily_events(date: str, db: Session = Depends(database.get_db)):
    """
    Get all active Special Events occurring on a specific date (DDMMYY).
    Handles basic recurrence matching.
    """
    # Just fetch all special events for now. Real recurrence expansion can be done in python or frontend.
    events = db.query(models.Seva).filter(models.Seva.IsSpecialEvent == True).all()
    
    active_events = []
    # Simplified recurrence check
    # DDMMYY mapping: DD = date[:2], MM = date[2:4], YY = date[4:]
    for e in events:
        if not e.EventDate:
            continue
            
        if e.RecurrenceRule == 'Daily':
            active_events.append(e)
        elif e.RecurrenceRule == 'Monthly':
            if e.EventDate[:2] == date[:2]: # Same day of month
                active_events.append(e)
        elif e.RecurrenceRule == 'Yearly':
            if e.EventDate[:4] == date[:4]: # Same day and month
                active_events.append(e)
        elif e.RecurrenceRule == 'Weekly':
            # Simplified: checking weekday requires full date conversion
            try:
                dt_target = datetime.datetime.strptime(date, "%d%m%y")
                dt_event = datetime.datetime.strptime(e.EventDate, "%d%m%y")
                if dt_target.weekday() == dt_event.weekday():
                    active_events.append(e)
            except:
                pass
        else:
            # Ad-Hoc / None / Exact Date
            if e.EventDate == date:
                active_events.append(e)
                
    return active_events

# ═══════════════════════════════════════════════════════════
# SEVA REGISTRATION
# ═══════════════════════════════════════════════════════════

@app.get("/api/registrations", response_model=List[schemas.SevaRegistration])
def list_registrations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
):
    return (
        db.query(models.SevaRegistration)
        .order_by(models.SevaRegistration.RegistrationId.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@app.post("/api/registrations", response_model=schemas.SevaRegistration)
def create_registration(reg: schemas.SevaRegistrationCreate, db: Session = Depends(database.get_db)):
    db_reg = models.SevaRegistration(**reg.model_dump())
    try:
        db.add(db_reg)
        db.flush()
        
        # Auto-post to accounting if enabled and accounts exist
        from app.api.accounting import auto_post_journal
        auto_post_journal(db, db_reg)

        db.commit()
        db.refresh(db_reg)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    return db_reg


@app.get("/api/registrations/by-devotee/{devotee_id}", response_model=List[schemas.SevaRegistration])
def registrations_by_devotee(devotee_id: int, db: Session = Depends(database.get_db)):
    return (
        db.query(models.SevaRegistration)
        .filter(models.SevaRegistration.DevoteeId == devotee_id)
        .order_by(models.SevaRegistration.RegistrationId.desc())
        .all()
    )


# ─── Stats ───

@app.get("/api/stats/daily")
def get_daily_stats(date: str, db: Session = Depends(database.get_db)):
    """
    Get registration stats for a given date (DDMMYY format).
    Returns counts per SevaCode.
    """
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


# ─── Lookup tables ───

@app.get("/api/lookups/gotra")
def list_gotra(db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    rows = db.execute(text("SELECT GotraCode FROM Gotra ORDER BY GotraCode")).fetchall()
    return [r[0] for r in rows if r[0]]


@app.get("/api/lookups/nakshatra")
def list_nakshatra(db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    rows = db.execute(text("SELECT SNakshatra, SRaashi FROM Nakshatra_Raashi ORDER BY SNakshatra")).fetchall()
    return [{"nakshatra": r[0], "raashi": r[1]} for r in rows if r[0]]


# ─── Legacy compatibility (kept for existing frontend until transition is complete) ───

@app.get("/api/customers", response_model=List[schemas.LegacyCustomer])
def read_customers_legacy(skip: int = 0, limit: int = 2000, db: Session = Depends(database.get_db)):
    customers = db.query(models.LegacyCustomer).offset(skip).limit(limit).all()
    return [c for c in customers if c is not None]


@app.get("/api/customers/search", response_model=List[schemas.LegacyCustomer])
def search_customers_legacy(q: str = "", db: Session = Depends(database.get_db)):
    if not q.strip():
        return []
        
    q_str = q.strip().lower()
    # If the search query looks like a phone number, use strict matching
    if q_str.replace(" ", "").replace("+", "").isdigit():
        term = f"%{q_str.replace(' ', '')}%"
        return db.query(models.LegacyCustomer).filter(
            or_(
                models.LegacyCustomer.Phone.ilike(term),
                models.LegacyCustomer.WhatsApp_Phone.ilike(term),
            )
        ).limit(50).all()

    # Otherwise, it's a name search: fetch all and use fuzzy match
    all_customers = db.query(models.LegacyCustomer).filter(
        models.LegacyCustomer.Name != None, models.LegacyCustomer.Name != ""
    ).all()
    
    return fuzzy_search_records(q_str, all_customers, name_attr="Name", limit=50)


@app.get("/api/items", response_model=List[schemas.LegacyItem])
def read_items_legacy(db: Session = Depends(database.get_db)):
    items = db.query(models.LegacyItem).filter(models.LegacyItem.ItemCode != None).all()
    return [i for i in items if i is not None]


# ─── Upload ───

@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "status": "success"}


# ─── Payment Verification ───

@app.post("/api/payments/verify-upi", response_model=schemas.UPIVerificationResponse)
async def verify_upi_payment(req: schemas.UPIVerificationRequest):
    """
    Mock UPI verification logic.
    For demonstration, any transaction ID starting with 'FAIL' is rejected,
    otherwise it's considered success.
    """
    import random
    
    # Simulate network delay
    # time.sleep(random.uniform(0.5, 1.5))
    
    if req.transaction_id.upper().startswith("FAIL"):
        return {
            "status": "failure",
            "message": f"ವಹಿವಾಟು ವಿಫಲವಾಗಿದೆ (Transaction failed with {req.gateway})",
            "details": {"error_code": "TRS_001", "bank_response": "Insufficient funds or invalid ID"}
        }
    
    # Some gateways might have specific validation
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


# ─── Startup ───

@app.on_event("startup")
def startup_event():
    db = next(database.get_db())
    if not db.query(models.User).filter(models.User.username == "admin").first():
        admin_user = models.User(
            username="admin",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin",
        )
        db.add(admin_user)
        db.commit()
