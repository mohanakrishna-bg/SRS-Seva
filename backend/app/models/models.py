from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


# ─── Auth ───
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="staff")  # admin, staff, viewer


# ─── Master: Devotee ───
class Devotee(Base):
    __tablename__ = "Devotee"
    DevoteeId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    Name = Column(String, nullable=False)
    Phone = Column(String, nullable=True)
    WhatsApp_Phone = Column(String, nullable=True)
    Email = Column(String, nullable=True)
    Gotra = Column(String, nullable=True)       # Kannada
    Nakshatra = Column(String, nullable=True)    # Kannada
    Address = Column(Text, nullable=True)
    City = Column(String, nullable=True)
    PinCode = Column(String, nullable=True)      # 6-digit
    PhotoPath = Column(String, nullable=True)
    IsDeleted = Column(Boolean, default=False)
    IsTest = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)
    UpdatedAt = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    registrations = relationship("SevaRegistration", back_populates="devotee")


# ─── Master: Seva ───
class Seva(Base):
    __tablename__ = "Seva"
    SevaCode = Column(String, primary_key=True, index=True)
    Description = Column(String, nullable=True)      # Kannada
    DescriptionEn = Column(String, nullable=True)     # English
    Amount = Column(Float, nullable=True)             # INR, 2 decimal
    TPQty = Column(Integer, default=0)                # Default eligible prasada heads
    PrasadaAddonLimit = Column(Integer, default=0)    # Max additional prasada

    # Special Event Fields
    IsSpecialEvent = Column(Boolean, default=False)
    EventDate = Column(String, nullable=True)         # DDMMYY (Date for Ad-Hoc, Start Date for Recurring)
    StartTime = Column(String, nullable=True)         # HH:MM (24-hour)
    EndTime = Column(String, nullable=True)           # HH:MM (24-hour)
    IsAllDay = Column(Boolean, default=False)
    RecurrenceRule = Column(String, nullable=True)    # Ad-Hoc, Daily, Weekly, Monthly, Yearly

    registrations = relationship("SevaRegistration", back_populates="seva")
    # Associated granular sevas (if this is a composite event)
    composite_sevas = relationship("EventComposition", back_populates="parent_event", foreign_keys="[EventComposition.ParentEventCode]")


# ─── Event Composition ───
class EventComposition(Base):
    __tablename__ = "EventComposition"
    Id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ParentEventCode = Column(String, ForeignKey("Seva.SevaCode"), nullable=False)
    ChildSevaCode = Column(String, ForeignKey("Seva.SevaCode"), nullable=False)

    parent_event = relationship("Seva", back_populates="composite_sevas", foreign_keys=[ParentEventCode])
    child_seva = relationship("Seva", foreign_keys=[ChildSevaCode])


# ─── Transaction: Seva Registration ───
class SevaRegistration(Base):
    __tablename__ = "SevaRegistration"
    RegistrationId = Column(Integer, primary_key=True, index=True, autoincrement=True)
    RegistrationDate = Column(String, nullable=False)  # DDMMYY
    SevaDate = Column(String, nullable=True)           # DDMMYY
    DevoteeId = Column(Integer, ForeignKey("Devotee.DevoteeId"), nullable=False)
    SevaCode = Column(String, ForeignKey("Seva.SevaCode"), nullable=False)
    Qty = Column(Integer, default=1)
    Rate = Column(Float, default=0.0)                  # INR, 2 decimal
    Amount = Column(Float, default=0.0)                # INR, 2 decimal
    OptTheerthaPrasada = Column(Boolean, default=False)
    PrasadaCount = Column(Integer, default=0)          # Additional heads above TPQty
    PaymentMode = Column(String, default="Cash")       # Cash/UPI/Cheque/DD/Netbanking
    PaymentReference = Column(String, nullable=True)
    PaymentDetails = Column(JSON, nullable=True)  # Store captured metadata (Transaction ID, Check Date, etc.)
    VoucherNo = Column(String, nullable=True)
    Remarks = Column(Text, nullable=True)
    GrandTotal = Column(Float, default=0.0)            # INR, 2 decimal
    IsTest = Column(Boolean, default=True)
    CreatedAt = Column(DateTime, default=datetime.datetime.utcnow)

    devotee = relationship("Devotee", back_populates="registrations")
    seva = relationship("Seva", back_populates="registrations")


# ─── Legacy Tables (kept for migration reference, read-only) ───
class LegacyCustomer(Base):
    __tablename__ = "Customer"
    ID1 = Column(Integer, primary_key=True, index=True)
    ID = Column(String)
    Name = Column(String)
    Sgotra = Column(String)
    SNakshatra = Column(String)
    Address = Column(String)
    City = Column(String)
    Phone = Column(String)
    WhatsApp_Phone = Column(String)
    Email_ID = Column(String)
    Google_Maps_Location = Column(String)


class LegacyItem(Base):
    __tablename__ = "Item"
    ItemCode = Column(String, primary_key=True, index=True)
    Description = Column(String)
    Basic = Column(Float)
    TPQty = Column(Float)
    Prasada_Addon_Limit = Column(Integer, default=0)


class LegacyInvoiceHdr(Base):
    __tablename__ = "Invoice_Hdr"
    # Use rowid as primary key to avoid conflict with legacy InvoiceNo
    Id = Column("rowid", Integer, primary_key=True)
    InvoiceNo = Column(String)
    InvoiceDate = Column(String)
    ID = Column(String)                    # Legacy customer ID (phone-N)
    PO_Date = Column(String)
    EntryTime = Column(String)
    Remarks = Column(String)
    ItemRateTotal = Column(Float)
    TotalTPQty = Column(Float)
    GrandTotal = Column(Float)
    PaymentCode = Column(String)
    ChqNo = Column(String)
    # New columns added in earlier iterations
    Payment_Mode = Column(String)
    Date = Column(DateTime)
    VoucherNo = Column(String)
    CustomerCode = Column(String)
    TotalAmount = Column(Float)
    Payment_Reference = Column(String)
    Family_Members = Column(Integer, default=0)
    Opt_Theertha_Prasada = Column(Boolean, default=False)
    ItemCode = Column(String)


class LegacyInvoiceDtl(Base):
    __tablename__ = "Invoice_Dtl"
    Id = Column("rowid", Integer, primary_key=True)
    InvoiceNo = Column(String)
    ItemCode = Column(String)
    TotalQty = Column(Integer)
    Basic = Column(Float)
    TPQty = Column(Float)
    Amount = Column(Float)
