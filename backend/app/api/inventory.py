"""
Inventory Module — FastAPI Router
Full CRUD for assets, categories, materials, bullion rates, audit log, and dashboard summary.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
import datetime
import json

from app import database
from app.models.inventory import InventoryItem, InventoryCategory, InventoryMaterial, InventoryAuditLog
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, InventoryItemResponse,
    CategoryCreate, CategoryResponse,
    MaterialCreate, MaterialUpdate, MaterialResponse,
    AuditLogResponse, InventorySummary, MaterialValuation, CategoryBreakdown
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
def list_categories(db: Session = Depends(get_db)):
    return db.query(InventoryCategory).order_by(InventoryCategory.Name).all()

@router.post("/categories", response_model=CategoryResponse)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryCategory).filter(InventoryCategory.Name == payload.Name).first()
    if existing:
        raise HTTPException(400, "Category already exists")
    cat = InventoryCategory(Name=payload.Name)
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
    return db.query(InventoryMaterial).order_by(InventoryMaterial.Name).all()

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
    return mat


# ─── Items ───

@router.get("/items", response_model=List[InventoryItemResponse])
def list_items(
    search: Optional[str] = None,
    category: Optional[str] = None,
    material: Optional[str] = None,
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
    return q.order_by(InventoryItem.ItemId).all()


@router.get("/items/{item_id}", response_model=InventoryItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")
    return item


@router.post("/items", response_model=InventoryItemResponse)
def create_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
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
        Material=payload.Material,
        WeightGrams=payload.WeightGrams,
        UnitPrice=unit_price,
        Quantity=qty,
        TotalValue=total_value,
        AddedOnDate=payload.AddedOnDate or datetime.date.today().strftime("%d/%m/%Y"),
        ImagePath=payload.ImagePath,
        ImageLink=payload.ImageLink,
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

    changes = {}
    for field in ["Name", "Description", "Category", "Material", "WeightGrams",
                   "UnitPrice", "Quantity", "AddedOnDate", "ImagePath", "ImageLink", "NeedsReview"]:
        new_val = getattr(payload, field, None)
        if new_val is not None:
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

    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}")
def delete_item(item_id: int, hard: bool = False, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.ItemId == item_id).first()
    if not item:
        raise HTTPException(404, "Item not found")

    action = "Hard Delete" if hard else "Soft Delete"
    snapshot = {
        "name": item.Name, "category": item.Category,
        "material": item.Material, "unitPrice": item.UnitPrice,
        "quantity": item.Quantity, "totalValue": item.TotalValue
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
def get_summary(db: Session = Depends(get_db)):
    items = db.query(InventoryItem).filter(InventoryItem.IsDeleted == False).all()

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

    return InventorySummary(
        totalItems=total_items,
        totalValuation=total_valuation,
        byMaterial=by_material,
        byCategory=by_category
    )
