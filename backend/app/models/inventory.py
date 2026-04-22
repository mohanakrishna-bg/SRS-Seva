"""
Inventory Module — SQLAlchemy Models
Unified system for Fixed Assets + Consumables:
  - InventoryItem      → Master catalog (shared core)
  - InventoryCategory  → Categories with type filter (asset/consumable)
  - InventoryMaterial  → Materials + Bullion Rates
  - ConsumableDetail   → Stock tracking for consumables
  - ConsumableTransaction → Stock movement log
  - Location           → Shared storage locations
  - MaintenanceLog     → Future: maintenance tracking
  - InventoryAuditLog  → Audit trail
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from app.database import Base
import datetime


class InventoryCategory(Base):
    """Categories — separate for Fixed Assets and Consumables."""
    __tablename__ = "InventoryCategory"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, unique=True, nullable=False)
    ForType = Column(String, default="asset")  # 'asset' or 'consumable'


class InventoryMaterial(Base):
    """Materials like Gold, Silver, Brass, etc. with optional bullion rate."""
    __tablename__ = "InventoryMaterial"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, unique=True, nullable=False)
    BullionRate = Column(Float, nullable=True)  # Rs./gram — only for precious metals


class InventoryItem(Base):
    """Master catalog — one row per item (asset or consumable)."""
    __tablename__ = "InventoryItem"
    ItemId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, nullable=False)
    Description = Column(String, nullable=True)
    Category = Column(String, nullable=True)
    ItemType = Column(String, default="asset")            # 'asset' or 'consumable'
    UOM = Column(String, default="Nos")                   # Unit of Measure
    Material = Column(String, nullable=True)
    WeightGrams = Column(Float, nullable=True)
    UnitPrice = Column(Float, default=0.0)
    Quantity = Column(Integer, default=1)
    TotalValue = Column(Float, default=0.0)
    GSTRate = Column(Float, default=0.0)
    HSNCode = Column(String, nullable=True)
    IsMaintainable = Column(Boolean, default=False)
    AddedOnDate = Column(String, nullable=True)
    ImagePath = Column(String, nullable=True)
    ImageLink = Column(String, nullable=True)
    IsDeleted = Column(Boolean, default=False)
    NeedsReview = Column(Boolean, default=False)
    AcquisitionMode = Column(String, default="purchase")   # 'purchase' or 'donation'
    DonorId = Column(Integer, nullable=True)                # FK → Devotee.DevoteeId (if donated)
    DonationId = Column(Integer, nullable=True)             # FK → Donation.DonationId
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Location(Base):
    """Shared storage locations for both assets and consumables."""
    __tablename__ = "Location"
    LocationId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, unique=True, nullable=False)
    Description = Column(String, nullable=True)


class ConsumableDetail(Base):
    """Stock tracking for consumable items."""
    __tablename__ = "ConsumableDetail"
    ConsumableId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ItemId = Column(Integer, nullable=False)              # FK → InventoryItem.ItemId
    QuantityOnHand = Column(Float, default=0)
    ReorderLevel = Column(Float, default=0)
    LastPurchasePrice = Column(Float, default=0)
    ExpiryDate = Column(String, nullable=True)
    LocationId = Column(Integer, nullable=True)           # FK → Location.LocationId


class ConsumableTransaction(Base):
    """Stock movement log for consumables."""
    __tablename__ = "ConsumableTransaction"
    TxnId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ConsumableId = Column(Integer, nullable=False)        # FK → ConsumableDetail.ConsumableId
    TxnType = Column(String, nullable=False)              # purchase, donation, consumption, adjustment, waste
    Quantity = Column(Float, nullable=False)              # +ve inflow, -ve outflow
    UnitPrice = Column(Float, nullable=True)
    TxnDate = Column(String, nullable=False)
    VendorName = Column(String, nullable=True)
    InvoiceRef = Column(String, nullable=True)
    Notes = Column(String, nullable=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)


class MaintenanceLog(Base):
    """Future: maintenance tracking for maintainable items."""
    __tablename__ = "MaintenanceLog"
    LogId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ItemId = Column(Integer, nullable=False)              # FK → InventoryItem.ItemId
    ServiceDate = Column(String, nullable=True)
    ServiceType = Column(String, nullable=True)           # routine, repair, inspection
    TechnicianName = Column(String, nullable=True)
    Cost = Column(Float, nullable=True)
    Notes = Column(String, nullable=True)
    NextServiceDue = Column(String, nullable=True)


class InventoryAuditLog(Base):
    """Audit trail for every change to inventory items."""
    __tablename__ = "InventoryAuditLog"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    User = Column(String, default="System")
    Action = Column(String, nullable=False)
    ItemId = Column(Integer, nullable=True)
    Details = Column(JSON, nullable=True)


class Donation(Base):
    """Records individual donation transactions from Devotees (Donors)."""
    __tablename__ = "Donation"
    DonationId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    DonorId = Column(Integer, nullable=False)              # FK → Devotee.DevoteeId
    DonationDate = Column(String, nullable=True)           # DD/MM/YYYY
    VoucherNo = Column(String, nullable=True)              # DON-<timestamp>
    DonationType = Column(String, default="in_kind")       # 'monetary' or 'in_kind'
    ItemType = Column(String, default="asset")             # 'asset' or 'consumable'
    Category = Column(String, nullable=True)
    ItemName = Column(String, nullable=False)
    Description = Column(String, nullable=True)
    Material = Column(String, nullable=True)               # For asset donations
    WeightGrams = Column(Float, nullable=True)             # For precious metal donations
    UOM = Column(String, default="Nos")                    # For consumable donations
    Quantity = Column(Integer, default=1)
    EstimatedValue = Column(Float, default=0.0)            # Donor-stated or appraised value
    PANNumber = Column(String, nullable=True)              # For 80G tax certificates (monetary donations)
    Remarks = Column(Text, nullable=True)
    PaymentMode = Column(String, default="Cash")           # Cash/UPI/Cheque/DD/Netbanking
    PaymentReference = Column(String, nullable=True)
    PaymentDetails = Column(JSON, nullable=True)           # Detailed attributes for modes
    InventoryItemId = Column(Integer, nullable=True)       # FK → InventoryItem.ItemId (after item is created)
    IsTest = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
