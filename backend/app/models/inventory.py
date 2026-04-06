"""
Inventory Module — SQLAlchemy Models
Mirrors the Google Sheets Fixed Asset Register structure:
  - InventoryItem      → InventoryMain sheet
  - InventoryCategory  → Dictionaries/Category column
  - InventoryMaterial  → Dictionaries/Material + Bullion Rates columns
  - InventoryAuditLog  → Audit Log sheet
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON
from app.database import Base
import datetime


class InventoryCategory(Base):
    """Categories like Ornament, Pooja Items, Kitchen Utensils, etc."""
    __tablename__ = "InventoryCategory"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, unique=True, nullable=False)


class InventoryMaterial(Base):
    """Materials like Gold, Silver, Brass, etc. with optional bullion rate."""
    __tablename__ = "InventoryMaterial"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, unique=True, nullable=False)
    BullionRate = Column(Float, nullable=True)  # Rs./gram — only for precious metals


class InventoryItem(Base):
    """Core asset register — one row per physical item."""
    __tablename__ = "InventoryItem"
    ItemId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, nullable=False)
    Description = Column(String, nullable=True)         # Size in inches or freetext
    Category = Column(String, nullable=True)             # FK-like to InventoryCategory.Name
    Material = Column(String, nullable=True)             # FK-like to InventoryMaterial.Name
    WeightGrams = Column(Float, nullable=True)           # Weight in grams
    UnitPrice = Column(Float, default=0.0)               # INR
    Quantity = Column(Integer, default=1)
    TotalValue = Column(Float, default=0.0)              # UnitPrice × Quantity
    AddedOnDate = Column(String, nullable=True)          # Date string (DD/MM/YYYY or ISO)
    ImagePath = Column(String, nullable=True)            # Local upload path
    ImageLink = Column(String, nullable=True)            # Original Google Drive link
    IsDeleted = Column(Boolean, default=False)
    NeedsReview = Column(Boolean, default=False)       # True for photo-only stubs from sync
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class InventoryAuditLog(Base):
    """Audit trail for every change to inventory items."""
    __tablename__ = "InventoryAuditLog"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    User = Column(String, default="System")
    Action = Column(String, nullable=False)              # Addition, Modification, Hard Delete
    ItemId = Column(Integer, nullable=True)
    Details = Column(JSON, nullable=True)                # Snapshot / diff as JSON
