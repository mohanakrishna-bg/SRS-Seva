from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    role: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class CustomerBase(BaseModel):
    Name: Optional[str] = None
    Sgotra: Optional[str] = None
    SNakshatra: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    Phone: Optional[str] = None
    WhatsApp_Phone: Optional[str] = None
    Email_ID: Optional[str] = None
    Google_Maps_Location: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    ID1: int
    ID: Optional[str] = None
    class Config:
        from_attributes = True

class ItemBase(BaseModel):
    Description: Optional[str] = None
    Basic: Optional[float] = None
    ItemCode: Optional[str] = None
    TPQty: Optional[float] = None
    Prasada_Addon_Limit: Optional[int] = 0

class Item(ItemBase):
    class Config:
        from_attributes = True

class InvoiceHdrBase(BaseModel):
    Date: datetime
    VoucherNo: str
    CustomerCode: str
    TotalAmount: float
    Payment_Mode: str
    Payment_Reference: Optional[str] = None
    Family_Members: Optional[int] = 0
    Opt_Theertha_Prasada: Optional[bool] = False

class InvoiceHdrCreate(InvoiceHdrBase):
    pass

class InvoiceHdr(InvoiceHdrBase):
    Id: int
    class Config:
        from_attributes = True
