from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import re


# ─── Auth ───
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


# ─── Devotee ───
class DevoteeBase(BaseModel):
    Name: str
    Phone: Optional[str] = None
    WhatsApp_Phone: Optional[str] = None
    Email: Optional[str] = None
    Gotra: Optional[str] = None
    Nakshatra: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    PinCode: Optional[str] = None
    PhotoPath: Optional[str] = None

    @field_validator("Name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v

    @field_validator("Phone", "WhatsApp_Phone", mode="before")
    @classmethod
    def normalize_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        # Strip +91, spaces, dashes
        v = re.sub(r"[\s\-\+]", "", v)
        if v.startswith("91") and len(v) == 12:
            v = v[2:]
        if v and not re.match(r"^\d{10}$", v):
            # Don't reject — just store as-is for legacy data
            pass
        return v or None

    @field_validator("PinCode", mode="before")
    @classmethod
    def validate_pincode(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        v = v.strip()
        if v and not re.match(r"^\d{6}$", v):
            raise ValueError("PinCode must be exactly 6 digits")
        return v

    @field_validator("Email", mode="before")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        v = v.strip()
        if "@" not in v:
            return v  # Allow legacy invalid emails without throwing 500
        return v

class DevoteeCreate(DevoteeBase):
    pass

class DevoteeUpdate(DevoteeBase):
    Name: Optional[str] = None  # Allow partial updates

class Devotee(DevoteeBase):
    DevoteeId: int
    IsDeleted: Optional[bool] = False
    CreatedAt: Optional[datetime] = None
    UpdatedAt: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Event Composition Schema ───
class EventCompositionBase(BaseModel):
    ChildSevaCode: str

class EventComposition(EventCompositionBase):
    Id: int
    ParentEventCode: str
    class Config:
        from_attributes = True

# ─── Seva ───
class SevaBase(BaseModel):
    SevaCode: str
    Description: Optional[str] = None
    DescriptionEn: Optional[str] = None
    Amount: Optional[float] = None
    TPQty: Optional[int] = 0
    PrasadaAddonLimit: Optional[int] = 0
    
    # Special Event Fields
    IsSpecialEvent: Optional[bool] = False
    EventDate: Optional[str] = None         # DDMMYY
    StartTime: Optional[str] = None         # HH:MM
    EndTime: Optional[str] = None           # HH:MM
    IsAllDay: Optional[bool] = False
    RecurrenceRule: Optional[str] = None

    @field_validator("Amount", mode="before")
    @classmethod
    def round_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            return round(float(v), 2)
        return v

class SevaCreate(SevaBase):
    composite_sevas: Optional[List[str]] = None  # Expected list of ChildSevaCodes during creation/update

class Seva(SevaBase):
    composite_sevas: Optional[List[EventComposition]] = []
    
    class Config:
        from_attributes = True


# ─── Seva Registration ───
class SevaRegistrationBase(BaseModel):
    RegistrationDate: str           # DDMMYY
    SevaDate: Optional[str] = None  # DDMMYY
    DevoteeId: int
    SevaCode: str
    Qty: Optional[int] = 1
    Rate: Optional[float] = 0.0
    Amount: Optional[float] = 0.0
    OptTheerthaPrasada: Optional[bool] = False
    PrasadaCount: Optional[int] = 0
    PaymentMode: Optional[str] = "Cash"
    PaymentReference: Optional[str] = None
    PaymentDetails: Optional[Dict[str, Any]] = None
    VoucherNo: Optional[str] = None
    Remarks: Optional[str] = None
    GrandTotal: Optional[float] = 0.0

    @field_validator("Rate", "Amount", "GrandTotal", mode="before")
    @classmethod
    def round_currency(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            return round(float(v), 2)
        return v

    @field_validator("RegistrationDate", "SevaDate", mode="before")
    @classmethod
    def validate_date_format(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        v = v.strip()
        if v and not re.match(r"^\d{6}$", v):
            raise ValueError("Date must be in DDMMYY format (6 digits)")
        return v

class SevaRegistrationCreate(SevaRegistrationBase):
    pass

class SevaRegistration(SevaRegistrationBase):
    RegistrationId: int
    CreatedAt: Optional[datetime] = None
    class Config:
        from_attributes = True


# ─── Legacy Schemas (for backward compatibility during transition) ───
class LegacyCustomer(BaseModel):
    ID1: int
    ID: Optional[str] = None
    Name: Optional[str] = None
    Sgotra: Optional[str] = None
    SNakshatra: Optional[str] = None
    Address: Optional[str] = None
    City: Optional[str] = None
    Phone: Optional[str] = None
    WhatsApp_Phone: Optional[str] = None
    Email_ID: Optional[str] = None
    Google_Maps_Location: Optional[str] = None
    class Config:
        from_attributes = True

class LegacyItem(BaseModel):
    ItemCode: Optional[str] = None
    Description: Optional[str] = None
    Basic: Optional[float] = None
    TPQty: Optional[float] = None
    Prasada_Addon_Limit: Optional[int] = 0
    class Config:
        from_attributes = True

# ─── Payment Verification ───
class UPIVerificationRequest(BaseModel):
    gateway: str
    transaction_id: str

class UPIVerificationResponse(BaseModel):
    status: str
    message: str
    details: Optional[Dict[str, Any]] = None
