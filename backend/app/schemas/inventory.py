"""
Inventory Module — Pydantic Schemas for API request/response validation.
"""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─── Category ───
class CategoryCreate(BaseModel):
    Name: str
    ForType: Optional[str] = 'asset'

class CategoryResponse(BaseModel):
    Id: int
    Name: str
    ForType: Optional[str] = 'asset'
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
    ItemType: Optional[str] = 'asset'
    UOM: Optional[str] = 'Nos'
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: Optional[float] = 0.0
    Quantity: Optional[int] = 1
    GSTRate: Optional[float] = 0.0
    HSNCode: Optional[str] = None
    IsMaintainable: Optional[bool] = False
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    NeedsReview: Optional[bool] = False
    AcquisitionMode: Optional[str] = 'purchase'
    DonorId: Optional[int] = None
    DonationId: Optional[int] = None
    UncategorizedFilename: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    Name: Optional[str] = None
    Description: Optional[str] = None
    Category: Optional[str] = None
    ItemType: Optional[str] = None
    UOM: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: Optional[float] = None
    Quantity: Optional[int] = None
    GSTRate: Optional[float] = None
    HSNCode: Optional[str] = None
    IsMaintainable: Optional[bool] = None
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    NeedsReview: Optional[bool] = None
    AcquisitionMode: Optional[str] = None
    DonorId: Optional[int] = None
    DonationId: Optional[int] = None
    UncategorizedFilename: Optional[str] = None

class InventoryItemResponse(BaseModel):
    ItemId: int
    Name: str
    Description: Optional[str] = None
    Category: Optional[str] = None
    ItemType: Optional[str] = 'asset'
    UOM: Optional[str] = 'Nos'
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UnitPrice: float
    Quantity: int
    TotalValue: float
    GSTRate: Optional[float] = 0.0
    HSNCode: Optional[str] = None
    IsMaintainable: Optional[bool] = False
    AddedOnDate: Optional[str] = None
    ImagePath: Optional[str] = None
    ImageLink: Optional[str] = None
    IsDeleted: bool
    NeedsReview: Optional[bool] = False
    AcquisitionMode: Optional[str] = 'purchase'
    DonorId: Optional[int] = None
    DonationId: Optional[int] = None
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

class AcquisitionBreakdown(BaseModel):
    mode: str
    count: int
    value: float

class InventorySummary(BaseModel):
    totalItems: int
    totalValuation: float
    byMaterial: List[MaterialValuation]
    byCategory: List[CategoryBreakdown]
    byAcquisition: Optional[List[AcquisitionBreakdown]] = None


# ─── Location ───
class LocationCreate(BaseModel):
    Name: str
    Description: Optional[str] = None

class LocationResponse(BaseModel):
    LocationId: int
    Name: str
    Description: Optional[str] = None
    class Config:
        from_attributes = True


# ─── Donation ───
class DonationCreate(BaseModel):
    DonorId: int
    DonationDate: Optional[str] = None
    DonationType: Optional[str] = 'in_kind'  # 'monetary' or 'in_kind'
    ItemType: Optional[str] = 'asset'
    Category: Optional[str] = None
    ItemName: str
    Description: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UOM: Optional[str] = 'Nos'
    Quantity: Optional[int] = 1
    EstimatedValue: Optional[float] = 0.0
    PANNumber: Optional[str] = None
    Remarks: Optional[str] = None
    ImageLink: Optional[str] = None
    PaymentMode: Optional[str] = 'Cash'
    PaymentReference: Optional[str] = None
    PaymentDetails: Optional[dict] = None

class DonationResponse(BaseModel):
    DonationId: int
    DonorId: int
    DonationDate: Optional[str] = None
    VoucherNo: Optional[str] = None
    DonationType: Optional[str] = 'in_kind'
    ItemType: Optional[str] = 'asset'
    Category: Optional[str] = None
    ItemName: str
    Description: Optional[str] = None
    Material: Optional[str] = None
    WeightGrams: Optional[float] = None
    UOM: Optional[str] = 'Nos'
    Quantity: Optional[int] = 1
    EstimatedValue: Optional[float] = 0.0
    PANNumber: Optional[str] = None
    Remarks: Optional[str] = None
    InventoryItemId: Optional[int] = None
    PaymentMode: Optional[str] = 'Cash'
    PaymentReference: Optional[str] = None
    PaymentDetails: Optional[dict] = None
    IsTest: Optional[bool] = True
    CreatedAt: Optional[datetime] = None
    class Config:
        from_attributes = True
