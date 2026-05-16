from pydantic import BaseModel
from typing import Any, Optional
from datetime import datetime

class SettingsBase(BaseModel):
    key: str
    value: Any

class SettingsCreate(SettingsBase):
    pass

class Settings(SettingsBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
