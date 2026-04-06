"""
Inventory Module — Pydantic Schemas for API request/response validation.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Category ───
class CategoryCreate(BaseModel):
    Name: str

class CategoryResponse(BaseModel):
    Id: int
    Name: str
    class Config:
        from_attributes = True


# ─── Material ───
class MaterialCreate(BaseModel):
    Name: str
    BullionRate: Optional[float] = None

class MaterialUpdate(BaseModel):
    BullionRate: Optional[float] = None

class MaterialResponse(BaseModel):
    Id: int
    Name: str
    BullionRate: Optional[float] = None
    class Config:
        from_attributes = True


# ─── Inventory Item ───
class InventoryItemCreate(BaseModel):
    Name: str
    Description: Optional[str] = None
    Category: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: Optional[float] = 0.0
    Quantity: Optional[int] = 1
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    NeedsReview: Optional[bool] = False

class InventoryItemUpdate(BaseModel):
    Name: Optional[str] = None
    Description: Optional[str] = None
    Category: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: Optional[float] = None
    Quantity: Optional[int] = None
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    NeedsReview: Optional[bool] = None

class InventoryItemResponse(BaseModel):
    ItemId: int
    Name: str
    Description: Optional[str] = None
    Category: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: float
    Quantity: int
    TotalValue: float
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    IsDeleted: bool
    NeedsReview: Optional[bool] = False
    CreatedAt: Optional[datetime] = None
    UpdatedAt: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Audit Log ───
class AuditLogResponse(BaseModel):
    Id: int
    Timestamp: Optional[datetime] = None
    User: Optional[str] = None
    Action: str
    ItemId: Optional[int] = None
    Details: Optional[dict] = None
    class Config:
        from_attributes = True


# ─── Dashboard Summary ───
class MaterialValuation(BaseModel):
    material: str
    itemCount: int
    totalValue: float

class CategoryBreakdown(BaseModel):
    category: str
    itemCount: int

class InventorySummary(BaseModel):
    totalItems: int
    totalValuation: float
    byMaterial: List[MaterialValuation]
    byCategory: List[CategoryBreakdown]
