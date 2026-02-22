from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="staff") # admin, staff, viewer

class Customer(Base):
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

class Item(Base):
    __tablename__ = "Item"
    ItemCode = Column(String, primary_key=True, index=True)
    Description = Column(String)
    Basic = Column(Float)
    TPQty = Column(Float)
    Prasada_Addon_Limit = Column(Integer, default=0)

class InvoiceHdr(Base):
    __tablename__ = "Invoice_Hdr"
    Id = Column(Integer, primary_key=True, index=True)
    Date = Column(DateTime)
    VoucherNo = Column(String)
    CustomerCode = Column(String)
    TotalAmount = Column(Float)
    Payment_Mode = Column(String, default="Cash")

class InvoiceDtl(Base):
    __tablename__ = "Invoice_Dtl"
    Id = Column(Integer, primary_key=True, index=True)
    ParentId = Column(Integer)
    ItemCode = Column(String)
    Qty = Column(Float)
    Rate = Column(Float)
    Amount = Column(Float)
