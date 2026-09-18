"""
Master Seed Module for SRS-Seva
Provides canonical Organization Settings and the authentic 42-Seva catalog.
Ensures zero data discrepancy between local SQLite and production Neon PostgreSQL deployments.
Strictly idempotent: never overwrites existing custom data.
"""

import os
import json
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from app.models.models import Settings, Seva

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────
# CANONICAL ORGANIZATION SETTINGS
# ─────────────────────────────────────────────────────────────
DEFAULT_ORG_SETTINGS: Dict[str, Any] = {
    "orgName": "ಶ್ರೀ ಗುರು  ರಾಘವೇಂದ್ರ ಸೇವಾ ಟ್ರಸ್ಟ್ (ರಿ.) ",
    "orgNameEn": "Sri Guru Raghavendra Seva Trust (Regd.)",
    "address": "ನಂ. ಟಿ- 1, 10 ನೆಯ ಮುಖ್ಯ ರಸ್ತೆ, 4 ನೆಯ ಹಂತ, ತೊಣಚಿಕೊಪ್ಪಲು ಬಡಾವಣೆ, ಮೈಸೂರು 570009 ",
    "addressEn": "# T-1, 10th Main Road, 4th Stage,\nT.K. Layout, Mysuru 570009",
    "phone": "9876543210",
    "whatsapp": "9999999999",
    "website": "https://srigururaghavendrasevatrust.org",
    "foodServiceCharges": "200, 220, 240, 260, 280, 300",
    "standardSchedule": [
        {"id": 1, "title": "ಅಭಿಷೇಕ", "time": "6:30", "period": "AM"},
        {"id": 2, "title": "ಬೆಳಗಿನ ಪೂಜೆ", "time": "8:00", "period": "AM"},
        {"id": 3, "title": "ಮಹಾಮಂಗಳಾರತಿ", "time": "12:30", "period": "PM"},
        {"id": 4, "title": "ತೀರ್ಥ ಪ್ರಸಾದ", "time": "1:00", "period": "PM"},
        {"id": 5, "title": "ಸಂಜೆ ಪೂಜೆ", "time": "6:30", "period": "PM"},
        {"id": 6, "title": "ರಾತ್ರಿ ಮಂಗಳಾರತಿ", "time": "8:00", "period": "PM"},
    ]
}


def _load_canonical_data() -> tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Load settings and sevas from canonical JSON if present, else fallback to hardcoded."""
    json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "canonical_prod_data.json")
    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                sevas = data.get("sevas", [])
                settings_val = data.get("settings", {}).get("value", DEFAULT_ORG_SETTINGS)
                return settings_val, sevas
        except Exception as e:
            logger.warning(f"Failed to read canonical_prod_data.json: {e}")
    return DEFAULT_ORG_SETTINGS, []


def seed_master_settings(db: Session) -> bool:
    """
    Ensure 'seva_org_settings' exists in the settings table.
    If missing, inserts the canonical organization settings.
    Does NOT overwrite if already present.
    """
    try:
        existing = db.query(Settings).filter(Settings.key == "seva_org_settings").first()
        if not existing:
            canonical_settings, _ = _load_canonical_data()
            new_setting = Settings(key="seva_org_settings", value=canonical_settings)
            db.add(new_setting)
            db.commit()
            logger.info("✅ Canonical organization settings successfully seeded.")
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding organization settings: {e}")
        return False


def seed_master_sevas(db: Session) -> int:
    """
    Ensure the canonical 42 Sevas exist in the Seva table.
    Any missing SevaCode is inserted; existing Sevas are untouched.
    """
    try:
        _, canonical_sevas = _load_canonical_data()
        if not canonical_sevas:
            logger.info("No canonical sevas catalog found to seed.")
            return 0

        existing_codes = set(code for (code,) in db.query(Seva.SevaCode).all())
        inserted = 0

        for s in canonical_sevas:
            code = s.get("SevaCode", "")
            if code not in existing_codes:
                new_seva = Seva(
                    SevaCode=code,
                    Description=s.get("Description", ""),
                    DescriptionEn=s.get("DescriptionEn", ""),
                    Amount=s.get("Amount", 0.0),
                    TPQty=s.get("TPQty", 0),
                    PrasadaAddonLimit=s.get("PrasadaAddonLimit", 0),
                    IsDeleted=s.get("IsDeleted", False),
                    IsSpecialEvent=s.get("IsSpecialEvent", False),
                    EventDate=s.get("EventDate"),
                    StartTime=s.get("StartTime"),
                    EndTime=s.get("EndTime"),
                    IsAllDay=s.get("IsAllDay", False),
                    RecurrenceRule=s.get("RecurrenceRule")
                )
                db.add(new_seva)
                existing_codes.add(code)
                inserted += 1

        if inserted > 0:
            db.commit()
            logger.info(f"✅ Successfully seeded {inserted} missing Sevas into master catalog.")
        return inserted
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding master sevas: {e}")
        return 0


def seed_master_data(db: Session):
    """Seed both settings and master sevas catalog."""
    seed_master_settings(db)
    seed_master_sevas(db)


if __name__ == "__main__":
    # Can run standalone
    from app.database import get_db
    db_gen = get_db()
    db = next(db_gen)
    try:
        print("🌱 Seeding master settings and Seva catalog...")
        seed_master_data(db)
        print("Done!")
    finally:
        db.close()
