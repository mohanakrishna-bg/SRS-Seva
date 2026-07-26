"""
Inventory Module — FastAPI Router
Full CRUD for assets, categories, materials, bullion rates, audit log, and dashboard summary.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
import datetime
import json
import os
import shutil
import re
import zipfile
import tempfile
import subprocess
import csv
import io
from fastapi.responses import StreamingResponse

from app import database
from app.models.inventory import (
    InventoryItem, InventoryCategory, InventoryMaterial, InventoryAuditLog, Location, Donation
)
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    CategoryCreate, CategoryResponse,
    MaterialCreate, MaterialUpdate, MaterialResponse,
    LocationCreate, LocationResponse,
    AuditLogResponse, InventorySummary, MaterialValuation, CategoryBreakdown,
    AcquisitionBreakdown,
    DonationCreate, DonationResponse
)

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def log_audit(db: Session, user: str, action: str, item_id: int, details: dict):
    """Write a row to the audit log."""
    entry = InventoryAuditLog(
        User=user, Action=action, ItemId=item_id,
        Details=details
    )
    db.add(entry)


# ─── Categories ───

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(for_type: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(InventoryCategory)
    if for_type:
        q = q.filter(InventoryCategory.ForType == for_type)
    return q.order_by(InventoryCategory.Name).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryCategory).filter(InventoryCategory.Name == payload.Name).first()
    if existing:
        raise HTTPException(400, "Category already exists")
    cat = InventoryCategory(Name=payload.Name, ForType=payload.ForType or 'asset')
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/categories/{cat_id}")
def delete_category(cat_id: int, db: Session = Depends(get_db)):
    cat = db.query(InventoryCategory).filter(InventoryCategory.Id == cat_id).first()
    if not cat:
        raise HTTPException(404, "Category not found")
    db.delete(cat)
    db.commit()
    return {"ok": True}


# ─── Materials ───

@router.get("/materials", response_model=List[MaterialResponse])
def list_materials(db: Session = Depends(get_db)):
    mats = db.query(InventoryMaterial).order_by(InventoryMaterial.Name).all()
    if not mats:
        defaults = [
            InventoryMaterial(Name="Gold (24K)", BullionRate=7450.00),
            InventoryMaterial(Name="Gold (22K)", BullionRate=6830.00),
            InventoryMaterial(Name="Silver", BullionRate=92.50),
            InventoryMaterial(Name="Platinum", BullionRate=3450.00),
            InventoryMaterial(Name="Brass", BullionRate=None),
            InventoryMaterial(Name="Copper", BullionRate=None),
            InventoryMaterial(Name="Bronze", BullionRate=None),
        ]
        db.add_all(defaults)
        db.commit()
        mats = db.query(InventoryMaterial).order_by(InventoryMaterial.Name).all()
    return mats

@router.post("/materials", response_model=MaterialResponse)
def create_material(payload: MaterialCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryMaterial).filter(InventoryMaterial.Name == payload.Name).first()
    if existing:
        raise HTTPException(400, "Material already exists")
    mat = InventoryMaterial(Name=payload.Name, BullionRate=payload.BullionRate)
    db.add(mat)
    db.commit()
    db.refresh(mat)
    return mat

@router.put("/materials/{mat_id}", response_model=MaterialResponse)
def update_material(mat_id: int, payload: MaterialUpdate, db: Session = Depends(get_db)):
    mat = db.query(InventoryMaterial).filter(InventoryMaterial.Id == mat_id).first()
    if not mat:
        raise HTTPException(404, "Material not found")
    if payload.BullionRate is not None:
        mat.BullionRate = payload.BullionRate
    db.commit()
    db.refresh(mat)
    
    # Trigger revaluation of items using this material
    revalue_all(db)
    
    return mat


@router.post("/bullion-rates-refresh")
def refresh_bullion_rates(db: Session = Depends(get_db)):
    """Mock fetching latest rates and revaluing the portfolio."""
    # In a real app, this would fetch from a Metals API.
    # For now, we'll simulate a 0.5% fluctuation for testing.
    import random
    mats = db.query(InventoryMaterial).filter(InventoryMaterial.Name.in_(['Gold', 'Silver'])).all()
    for m in mats:
        if m.BullionRate:
            change = 1 + (random.uniform(-0.01, 0.01))
            m.BullionRate = round(m.BullionRate * change, 2)
            
    db.commit()
    res = revalue_all(db)
    return {"ok": True, "updated_items": res["updated"], "new_rates": {m.Name: m.BullionRate for m in mats}}


# ─── Uncategorized Photos ───

@router.get("/uncategorized-images", response_model=List[str])
def list_uncategorized_images():
    """List images available in the uncategorized folder."""
    photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos", "uncategorized"))
    if not os.path.exists(photos_dir):
        os.makedirs(photos_dir, exist_ok=True)
        return []
    
    files = []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    for f in os.listdir(photos_dir):
        if os.path.isfile(os.path.join(photos_dir, f)) and not f.startswith('.'):
            if os.path.splitext(f)[1].lower() in valid_exts:
                files.append(f)
    return sorted(files)

@router.delete("/uncategorized-images/{filename}")
def delete_uncategorized_image(filename: str):
    """Permanently delete an image from the uncategorized/pending folder."""
    photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos", "uncategorized"))
    file_path = os.path.join(photos_dir, filename)
    
    # Path traversal check
    if not os.path.abspath(file_path).startswith(photos_dir):
        raise HTTPException(400, "Invalid filename")

    if os.path.exists(file_path):
        os.remove(file_path)
        return {"ok": True}
    raise HTTPException(404, "File not found")



@router.get("/browse-images", response_model=List[str])
def browse_images(category: Optional[str] = Query(None)):
    """List images in a specific category folder or uncategorized."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos"))
    
    if not category or category.lower() == 'uncategorized':
        target_dir = os.path.join(base_dir, "uncategorized")
    elif category.lower() == 'all':
        if not os.path.exists(base_dir):
            return []
        files = []
        valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
        for root, dirs, filenames in os.walk(base_dir):
            for f in filenames:
                if not f.startswith('.') and os.path.splitext(f)[1].lower() in valid_exts:
                    full_path = os.path.join(root, f)
                    rel_path = os.path.relpath(full_path, base_dir)
                    # For root-level files, prepend './' so frontend getImgSrc knows it's a relative path
                    if os.sep not in rel_path and '/' not in rel_path:
                        rel_path = f"./{rel_path}"
                    files.append(rel_path)
        return sorted(files)
    else:
        # Normalize category name for folder
        slug = re.sub(r'[^a-z0-9]+', '_', category.strip().lower())
        target_dir = os.path.join(base_dir, slug)
        
    if not os.path.exists(target_dir):
        return []
        
    files = []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    for f in os.listdir(target_dir):
        if os.path.isfile(os.path.join(target_dir, f)) and not f.startswith('.'):
            if os.path.splitext(f)[1].lower() in valid_exts:
                files.append(f)
    return sorted(files)


def convert_heic_to_jpg(src_path: str, dest_path: str) -> bool:
    """Convert HEIC/HEIF to JPEG using macOS sips."""
    try:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", src_path, "--out", dest_path],
            check=True, capture_output=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


@router.post("/uncategorized-upload")
async def upload_uncategorized_files(files: List[UploadFile] = File(...)):
    """Accept images or ZIP files and place images in the uncategorized folder."""
    photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos", "uncategorized"))
    os.makedirs(photos_dir, exist_ok=True)
    
    saved_count = 0
    errors = []
    
    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    heic_extensions = {".heic", ".heif"}

    for f in files:
        if not f.filename: continue
        ext = os.path.splitext(f.filename)[1].lower()
        
        if ext == ".zip":
            # Process ZIP
            with tempfile.TemporaryDirectory() as tmpdir:
                zip_path = os.path.join(tmpdir, f.filename)
                with open(zip_path, "wb") as buffer:
                    shutil.copyfileobj(f.file, buffer)
                
                try:
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        for member in zip_ref.namelist():
                            if member.startswith('__MACOSX') or member.startswith('.'): continue
                            m_ext = os.path.splitext(member)[1].lower()
                            
                            if m_ext in image_extensions or m_ext in heic_extensions:
                                filename = os.path.basename(member)
                                if not filename: continue
                                
                                # If HEIC, change target extension to .jpg
                                if m_ext in heic_extensions:
                                    filename = os.path.splitext(filename)[0] + ".jpg"

                                dest_path = os.path.join(photos_dir, filename)
                                # Handle collision
                                counter = 1
                                base, e = os.path.splitext(filename)
                                while os.path.exists(dest_path):
                                    dest_path = os.path.join(photos_dir, f"{base}_{counter}{e}")
                                    counter += 1
                                
                                if m_ext in heic_extensions:
                                    # Temporary save then convert
                                    m_tmp_path = os.path.join(tmpdir, "m_tmp" + m_ext)
                                    with zip_ref.open(member) as source, open(m_tmp_path, "wb") as target:
                                        shutil.copyfileobj(source, target)
                                    if convert_heic_to_jpg(m_tmp_path, dest_path):
                                        saved_count += 1
                                    else:
                                        errors.append(f"Conversion failed for {member}")
                                else:
                                    with zip_ref.open(member) as source, open(dest_path, "wb") as target:
                                        shutil.copyfileobj(source, target)
                                    saved_count += 1
                except Exception as e:
                    errors.append(f"Error extracting {f.filename}: {str(e)}")
        
        elif ext in image_extensions or ext in heic_extensions:
            # Direct Image / HEIC
            filename = os.path.basename(f.filename)
            target_ext = ".jpg" if ext in heic_extensions else ext
            
            if ext in heic_extensions:
                filename = os.path.splitext(filename)[0] + ".jpg"

            dest_path = os.path.join(photos_dir, filename)
            counter = 1
            base, e = os.path.splitext(filename)
            while os.path.exists(dest_path):
                dest_path = os.path.join(photos_dir, f"{base}_{counter}{e}")
                counter += 1
            
            if ext in heic_extensions:
                with tempfile.NamedTemporaryFile(suffix=ext) as tmp:
                    shutil.copyfileobj(f.file, tmp)
                    if convert_heic_to_jpg(tmp.name, dest_path):
                        saved_count += 1
                    else:
                        errors.append(f"Conversion failed for {f.filename}")
            else:
                with open(dest_path, "wb") as buffer:
                    shutil.copyfileobj(f.file, buffer)
                saved_count += 1
        
        else:
            errors.append(f"Unsupported file type: {f.filename}")
            
    return {"count": saved_count, "errors": errors}


# ─── Quick Capture (Mobile Camera) ───

@router.post("/quick-capture")
async def quick_capture(
    file: UploadFile = File(...),
    item_name: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
):
    """Accept a camera capture from mobile and save to the image repository.
    
    This endpoint replaces the manual Google Photos workflow:
      Phone camera → Google Photos album → Download ZIP → Sync
    With a single step:
      Phone camera → Quick Capture → Repository
    
    The photo is saved to uploads/photos/uncategorized/ with a descriptive
    filename derived from the item name (if provided) or a timestamp.
    """
    photos_dir = os.path.abspath(os.path.join(
        os.path.dirname(__file__), "..", "..", "uploads", "photos", "uncategorized"
    ))
    os.makedirs(photos_dir, exist_ok=True)

    image_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    heic_extensions = {".heic", ".heif"}

    if not file.filename:
        raise HTTPException(400, "No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in image_extensions and ext not in heic_extensions:
        raise HTTPException(400, f"Unsupported image format: {ext}")

    # Build a descriptive filename from item_name or use timestamp
    if item_name and item_name.strip():
        # Slugify: lowercase, replace non-alphanum with underscore
        slug = re.sub(r'[^\w\s-]', '', item_name.strip().lower())
        slug = re.sub(r'[\s-]+', '_', slug).strip('_')
        if not slug:
            slug = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    else:
        slug = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")

    target_ext = ".jpg" if ext in heic_extensions else ext
    filename = f"{slug}{target_ext}"

    dest_path = os.path.join(photos_dir, filename)
    counter = 1
    base = slug
    while os.path.exists(dest_path):
        filename = f"{base}_{counter}{target_ext}"
        dest_path = os.path.join(photos_dir, filename)
        counter += 1

    if ext in heic_extensions:
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name
        if convert_heic_to_jpg(tmp_path, dest_path):
            os.unlink(tmp_path)
        else:
            os.unlink(tmp_path)
            raise HTTPException(500, "Failed to convert HEIC image")
    else:
        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    return {
        "ok": True,
        "filename": filename,
        "path": f"uncategorized/{filename}",
        "item_name": item_name,
        "category": category,
        "notes": notes,
    }


# ─── Items ───

@router.get("/items", response_model=List[InventoryItemResponse])
def list_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    material: Optional[str] = None,
    item_type: Optional[str] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    q = db.query(InventoryItem)
    if not include_deleted:
        q = q.filter(InventoryItem.IsDeleted == False)
    if search:
        q = q.filter(InventoryItem.Name.ilike(f"%{search}%"))
    if category:
        q = q.filter(InventoryItem.Category == category)
    if material:
        q = q.filter(InventoryItem.Material == material)
    if item_type:
        q = q.filter(InventoryItem.ItemType == item_type)
    return q.order_by(InventoryItem.ItemId).all()


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.post("/items", response_model=InventoryItemResponse)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    image_link = payload.ImageLink
    
    # Process Uncategorized Image Move if present
    if payload.UncategorizedFilename:
        if not payload.Category:
            raise HTTPException(400, "Category is required when adding an item from uncategorized photos.")
            
        # Normalize category name
        normalized_category = re.sub(r'[^a-zA-Z0-9]', '_', payload.Category.lower())
        normalized_category = re.sub(r'_+', '_', normalized_category).strip('_')
        
        base_photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos"))
        uncat_dir = os.path.join(base_photos_dir, "uncategorized")
        cat_dir = os.path.join(base_photos_dir, normalized_category)
        
        src_path = os.path.join(uncat_dir, payload.UncategorizedFilename)
        if not os.path.exists(src_path):
            raise HTTPException(404, "Uncategorized photo not found")
            
        os.makedirs(cat_dir, exist_ok=True)
        dest_path = os.path.join(cat_dir, payload.UncategorizedFilename)
        
        shutil.copy2(src_path, dest_path)
        os.remove(src_path)
        
        image_link = f"{normalized_category}/{payload.UncategorizedFilename}"

    # Auto-calculate unit price for precious metals
    unit_price = payload.UnitPrice or 0.0
    if payload.Material and payload.WeightGrams:
        mat = db.query(InventoryMaterial).filter(InventoryMaterial.Name == payload.Material).first()
        if mat and mat.BullionRate:
            unit_price = payload.WeightGrams * mat.BullionRate

    qty = payload.Quantity or 1
    total_value = unit_price * qty

    item = InventoryItem(
        Name=payload.Name,
        Description=payload.Description,
        Category=payload.Category,
        ItemType=payload.ItemType or 'asset',
        UOM=payload.UOM or 'Nos',
        Material=payload.Material,
        WeightGrams=payload.WeightGrams,
        UnitPrice=unit_price,
        Quantity=qty,
        TotalValue=total_value,
        GSTRate=payload.GSTRate or 0.0,
        HSNCode=payload.HSNCode,
        IsMaintainable=payload.IsMaintainable or False,
        AddedOnDate=payload.AddedOnDate or datetime.date.today().strftime("%d/%m/%Y"),
        ImagePath=payload.ImagePath,
        ImageLink=image_link,
        NeedsReview=payload.NeedsReview or False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    log_audit(db, "UI", "Addition", item.ItemId, {
        "name": item.Name, "category": item.Category,
        "material": item.Material, "unitPrice": unit_price,
        "quantity": qty, "totalValue": total_value
    })
    db.commit()

    return item


@router.put("/items/{item_id}", response_model=InventoryItemResponse)
def update_item(item_id: int, payload: InventoryItemUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    # Get data from payload, excluding unset fields
    update_data = payload.dict(exclude_unset=True)
    
    # We'll specifically handle UncategorizedFilename separately for file moving
    uncat_file = update_data.pop('UncategorizedFilename', None)
    
    changes = {}
    for field, new_val in update_data.items():
        if hasattr(item, field):
            old_val = getattr(item, field)
            if old_val != new_val:
                changes[field] = {"old": old_val, "new": new_val}
                setattr(item, field, new_val)

    # Recalculate price if weight or material changed
    if item.Material and item.WeightGrams:
        mat = db.query(InventoryMaterial).filter(InventoryMaterial.Name == item.Material).first()
        if mat and mat.BullionRate:
            new_price = item.WeightGrams * mat.BullionRate
            if item.UnitPrice != new_price:
                changes["UnitPrice"] = {"old": item.UnitPrice, "new": new_price}
                item.UnitPrice = new_price

    item.TotalValue = (item.UnitPrice or 0) * (item.Quantity or 1)
    item.UpdatedAt = datetime.datetime.utcnow()

    # Auto-clear NeedsReview when meaningful fields are filled in
    if item.NeedsReview and any(f in changes for f in ["Name", "Material", "WeightGrams", "Description", "Category"]):
        item.NeedsReview = False
        changes["NeedsReview"] = {"old": True, "new": False}

    if changes:
        log_audit(db, "UI", "Modification", item.ItemId, {
            "itemTitle": item.Name, "changes": changes
        })

    # Handle image move if picking from uncategorized during edit
    if uncat_file:
        photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "photos"))
        uncat_dir = os.path.join(photos_dir, "uncategorized")
        
        # New category folder
        cat_slug = re.sub(r'[^a-z0-9]+', '_', (item.Category or "uncategorized").strip().lower())
        cat_dir = os.path.join(photos_dir, cat_slug)
        os.makedirs(cat_dir, exist_ok=True)
        
        src_path = os.path.join(uncat_dir, uncat_file)
        if os.path.exists(src_path):
            dest_filename = uncat_file
            dest_path = os.path.join(cat_dir, dest_filename)
            
            # Handle collision
            counter = 1
            base, ext = os.path.splitext(dest_filename)
            while os.path.exists(dest_path):
                dest_path = os.path.join(cat_dir, f"{base}_{counter}{ext}")
                dest_filename = f"{base}_{counter}{ext}"
                counter += 1
            
            shutil.move(src_path, dest_path)
            item.ImageLink = dest_filename

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, hard: bool = False, reason: Optional[str] = Query(None), db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    action = "Hard Delete" if hard else "Soft Delete"
    snapshot = {
        "name": item.Name, "category": item.Category,
        "material": item.Material, "unitPrice": item.UnitPrice,
        "quantity": item.Quantity, "totalValue": item.TotalValue,
        "reason": reason
    }

    if hard:
        log_audit(db, "UI", action, item.ItemId, snapshot)
        db.delete(item)
    else:
        item.IsDeleted = True
        item.UpdatedAt = datetime.datetime.utcnow()
        log_audit(db, "UI", action, item.ItemId, snapshot)

    db.commit()
    return {"ok": True, "action": action}


@router.put("/items/{item_id}/restore")
def restore_item(item_id: int, db: Session = Depends(get_db)):
    """Restore a soft-deleted item."""
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    if not item.IsDeleted:
        raise HTTPException(400, "Item is not deleted")

    item.IsDeleted = False
    item.UpdatedAt = datetime.datetime.utcnow()
    log_audit(db, "UI", "Restoration", item.ItemId, {
        "name": item.Name, "category": item.Category,
        "material": item.Material, "totalValue": item.TotalValue
    })
    db.commit()
    db.refresh(item)
    return {"ok": True, "item": item.Name}


# ─── Revaluation ───

@router.post("/revalue")
def revalue_all(db: Session = Depends(get_db)):
    """Recalculate all precious metal items against current bullion rates."""
    materials = db.query(InventoryMaterial).filter(InventoryMaterial.BullionRate.isnot(None)).all()
    rate_map = {m.Name: m.BullionRate for m in materials}

    items = db.query(InventoryItem).filter(
        InventoryItem.IsDeleted == False,
        InventoryItem.Material.in_(list(rate_map.keys())),
        InventoryItem.WeightGrams.isnot(None)
    ).all()

    updated = 0
    for item in items:
        rate = rate_map.get(item.Material)
        if not rate or not item.WeightGrams:
            continue
        new_price = item.WeightGrams * rate
        old_price = item.UnitPrice or 0
        if abs(new_price - old_price) > 0.01:
            item.UnitPrice = new_price
            item.TotalValue = new_price * (item.Quantity or 1)
            item.UpdatedAt = datetime.datetime.utcnow()
            log_audit(db, "System", "Revaluation", item.ItemId, {
                "material": item.Material, "rate": rate,
                "oldPrice": old_price, "newPrice": new_price,
                "oldTotal": old_price * (item.Quantity or 1),
                "newTotal": item.TotalValue
            })
            updated += 1

    db.commit()
    return {"ok": True, "updated": updated, "rates": rate_map}


# ─── Audit Log ───

@router.get("/audit-log", response_model=List[AuditLogResponse])
def list_audit_log(
    item_id: Optional[int] = None,
    action: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(InventoryAuditLog).order_by(InventoryAuditLog.Timestamp.desc())
    if item_id:
        q = q.filter(InventoryAuditLog.ItemId == item_id)
    if action:
        q = q.filter(InventoryAuditLog.Action == action)
    return q.limit(limit).all()


# ─── Dashboard Summary ───

@router.get("/summary", response_model=InventorySummary)
def get_summary(item_type: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(InventoryItem).filter(InventoryItem.IsDeleted == False)
    if item_type:
        q = q.filter(InventoryItem.ItemType == item_type)
    items = q.all()

    total_items = len(items)
    total_valuation = sum(i.TotalValue or 0 for i in items)

    # By Material
    mat_map = {}
    for i in items:
        m = i.Material or "Unknown"
        if m not in mat_map:
            mat_map[m] = {"count": 0, "value": 0.0}
        mat_map[m]["count"] += 1
        mat_map[m]["value"] += i.TotalValue or 0

    by_material = [
        MaterialValuation(material=k, itemCount=v["count"], totalValue=v["value"])
        for k, v in sorted(mat_map.items(), key=lambda x: -x[1]["value"])
    ]

    # By Category
    cat_map = {}
    for i in items:
        c = i.Category or "Unknown"
        if c not in cat_map:
            cat_map[c] = 0
        cat_map[c] += 1

    by_category = [
        CategoryBreakdown(category=k, itemCount=v)
        for k, v in sorted(cat_map.items(), key=lambda x: -x[1])
    ]

    # By Acquisition Mode
    acq_map = {}
    for i in items:
        mode = getattr(i, 'AcquisitionMode', None) or 'purchase'
        if mode not in acq_map:
            acq_map[mode] = {"count": 0, "value": 0.0}
        acq_map[mode]["count"] += 1
        acq_map[mode]["value"] += i.TotalValue or 0

    by_acquisition = [
        AcquisitionBreakdown(mode=k, count=v["count"], value=v["value"])
        for k, v in acq_map.items()
    ]

    return InventorySummary(
        totalItems=total_items,
        totalValuation=total_valuation,
        byMaterial=by_material,
        byCategory=by_category,
        byAcquisition=by_acquisition
    )


# ─── Test Data ───

@router.delete("/test-data")
def clear_test_data(db: Session = Depends(get_db)):
    """Clear all items tagged as Test Data."""
    items = db.query(InventoryItem).filter(InventoryItem.Category == "Test Data").all()
    deleted_count = 0
    for item in items:
        db.delete(item)
        deleted_count += 1
    db.commit()
    return {"ok": True, "deleted": deleted_count}


# ─── Locations ───

@router.get("/locations", response_model=List[LocationResponse])
def list_locations(db: Session = Depends(get_db)):
    return db.query(Location).order_by(Location.Name).all()

@router.post("/locations", response_model=LocationResponse)
def create_location(payload: LocationCreate, db: Session = Depends(get_db)):
    existing = db.query(Location).filter(Location.Name == payload.Name).first()
    if existing:
        raise HTTPException(400, "Location already exists")
    loc = Location(Name=payload.Name, Description=payload.Description)
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc

@router.delete("/locations/{loc_id}")
def delete_location(loc_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.LocationId == loc_id).first()
    if not loc:
        raise HTTPException(404, "Location not found")
    db.delete(loc)
    db.commit()
    return {"ok": True}


# ─── Donations ───

@router.post("/donations", response_model=DonationResponse)
def create_donation(payload: DonationCreate, db: Session = Depends(get_db)):
    """Record a donation — creates Donation record + auto-creates InventoryItem linked to donor."""
    import time
    voucher = f"DON-{int(time.time())}"

    # Calculate value: auto-calculate for precious metals, allow donor override
    unit_price = payload.EstimatedValue or 0.0
    if payload.Material and payload.WeightGrams:
        mat = db.query(InventoryMaterial).filter(InventoryMaterial.Name == payload.Material).first()
        if mat and mat.BullionRate:
            auto_value = payload.WeightGrams * mat.BullionRate
            # Use auto-calculated value as default, unless donor explicitly stated a value
            if not payload.EstimatedValue or payload.EstimatedValue <= 0:
                unit_price = auto_value

    qty = payload.Quantity or 1
    total_value = unit_price * qty

    # 1. Create InventoryItem
    item = InventoryItem(
        Name=payload.ItemName,
        Description=payload.Description,
        Category=payload.Category,
        ItemType=payload.ItemType or 'asset',
        UOM=payload.UOM or 'Nos',
        Material=payload.Material,
        WeightGrams=payload.WeightGrams,
        UnitPrice=unit_price,
        Quantity=qty,
        TotalValue=total_value,
        AddedOnDate=payload.DonationDate,
        ImageLink=payload.ImageLink,
        AcquisitionMode='donation',
        DonorId=payload.DonorId,
    )
    db.add(item)
    db.flush()  # Get the ItemId

    # 2. Create Donation record
    donation = Donation(
        DonorId=payload.DonorId,
        DonationDate=payload.DonationDate,
        VoucherNo=voucher,
        DonationType=payload.DonationType or 'in_kind',
        ItemType=payload.ItemType or 'asset',
        Category=payload.Category,
        ItemName=payload.ItemName,
        Description=payload.Description,
        Material=payload.Material,
        WeightGrams=payload.WeightGrams,
        UOM=payload.UOM or 'Nos',
        Quantity=qty,
        EstimatedValue=unit_price,
        PANNumber=payload.PANNumber,
        Remarks=payload.Remarks,
        PaymentMode=payload.PaymentMode or 'Cash',
        PaymentReference=payload.PaymentReference,
        PaymentDetails=payload.PaymentDetails,
        InventoryItemId=item.ItemId,
    )
    db.add(donation)
    db.flush()

    # 3. Back-link the DonationId to the item
    item.DonationId = donation.DonationId

    # 4. Audit trail
    log_audit(db, "System", "Donation", item.ItemId, {
        "donorId": payload.DonorId,
        "donationId": donation.DonationId,
        "itemName": payload.ItemName,
        "value": unit_price,
        "voucherNo": voucher
    })

    db.commit()
    db.refresh(donation)
    return donation


@router.get("/donations", response_model=List[DonationResponse])
def list_donations(
    donor_id: Optional[int] = None,
    item_type: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    limit: int = 200,
    db: Session = Depends(get_db)
):
    q = db.query(Donation).order_by(Donation.DonationId.desc())
    if donor_id:
        q = q.filter(Donation.DonorId == donor_id)
    if item_type:
        q = q.filter(Donation.ItemType == item_type)
    if from_date:
        q = q.filter(Donation.DonationDate >= from_date)
    if to_date:
        q = q.filter(Donation.DonationDate <= to_date)
    return q.limit(limit).all()


@router.get("/donations/{donation_id}", response_model=DonationResponse)
def get_donation(donation_id: int, db: Session = Depends(get_db)):
    don = db.query(Donation).filter(Donation.DonationId == donation_id).first()
    if not don:
        raise HTTPException(404, "Donation not found")
    return don


# ─── Reports ───

@router.get("/reports/export")
def export_inventory_report(
    item_type: Optional[str] = "asset",
    category: Optional[str] = None,
    material: Optional[str] = None,
    search: Optional[str] = None,
    include_deleted: bool = False,
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "Item ID", "Name", "Description", "Category", 
        "Material", "Weight (g)", "Unit Price (INR)", "Quantity", 
        "Total Value (INR)", "UOM", "Acquisition Mode", "Added On", 
        "Needs Review", "Is Deleted"
    ])

    # Fetch and filter items
    q = db.query(InventoryItem)
    if not include_deleted:
        q = q.filter(InventoryItem.IsDeleted == False)
    if item_type:
        q = q.filter(InventoryItem.ItemType == item_type)
    if category:
        q = q.filter(InventoryItem.Category == category)
    if material:
        q = q.filter(InventoryItem.Material == material)
    if search:
        q = q.filter(InventoryItem.Name.ilike(f"%{search}%"))

    items = q.order_by(InventoryItem.ItemId).all()

    # Write rows
    for item in items:
        writer.writerow([
            item.ItemId,
            item.Name,
            item.Description or "",
            item.Category or "",
            item.Material or "",
            item.WeightGrams if item.WeightGrams is not None else "",
            item.UnitPrice,
            item.Quantity,
            item.TotalValue,
            item.UOM or "Nos",
            getattr(item, 'AcquisitionMode', 'purchase'),
            item.AddedOnDate or "",
            "Yes" if item.NeedsReview else "No",
            "Yes" if item.IsDeleted else "No"
        ])

    output.seek(0)
    
    label = "fixed_assets" if item_type == "asset" else "consumables"
    today_str = datetime.date.today().strftime('%Y%m%d')
    filename = f"{label}_report_{today_str}.csv"
    
    return StreamingResponse(
        io.StringIO(output.getvalue()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
