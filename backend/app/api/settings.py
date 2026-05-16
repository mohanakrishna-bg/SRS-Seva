from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any
from app.database import get_db
from app.models.models import Settings
from app.schemas.settings import Settings as SettingsSchema, SettingsCreate

router = APIRouter()

@router.get("/", response_model=List[SettingsSchema])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(Settings).all()

@router.get("/{key}", response_model=SettingsSchema)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(Settings).filter(Settings.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.post("/", response_model=SettingsSchema)
def update_setting(setting_in: SettingsCreate, db: Session = Depends(get_db)):
    db_setting = db.query(Settings).filter(Settings.key == setting_in.key).first()
    if db_setting:
        db_setting.value = setting_in.value
    else:
        db_setting = Settings(key=setting_in.key, value=setting_in.value)
        db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting
