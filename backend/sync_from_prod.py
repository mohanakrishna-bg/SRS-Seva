"""
Sync Master Data from Production to Local Database
Fetches the latest Sevas and Organization Settings from the live production API (Render)
and synchronizes them into the local SQLite database.
"""

import os
import sys
import json
import logging
import argparse
import urllib.request
from typing import Dict, Any, List

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db, Base, engine
from app.models.models import Settings, Seva

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("sync_from_prod")

DEFAULT_PROD_URL = "https://srs-seva.onrender.com/api"


def fetch_json(url: str) -> Any:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "SRS-Seva-SyncTool/1.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def sync_from_production(prod_base_url: str = DEFAULT_PROD_URL):
    logger.info(f"🌐 Connecting to production API at {prod_base_url}...")

    # 1. Fetch Sevas
    try:
        sevas_url = f"{prod_base_url.rstrip('/')}/sevas"
        sevas_data: List[Dict[str, Any]] = fetch_json(sevas_url)
        logger.info(f"✅ Fetched {len(sevas_data)} Sevas from production.")
    except Exception as e:
        logger.error(f"❌ Failed to fetch Sevas from production: {e}")
        return

    # 2. Fetch Settings
    try:
        settings_url = f"{prod_base_url.rstrip('/')}/settings/seva_org_settings"
        settings_data: Dict[str, Any] = fetch_json(settings_url)
        logger.info("✅ Fetched organization settings from production.")
    except Exception as e:
        logger.error(f"❌ Failed to fetch Settings from production: {e}")
        return

    # 3. Save canonical snapshot
    snapshot_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "app", "core", "canonical_prod_data.json"
    )
    try:
        with open(snapshot_path, "w", encoding="utf-8") as f:
            json.dump({"sevas": sevas_data, "settings": settings_data}, f, ensure_ascii=False, indent=2)
        logger.info(f"💾 Saved canonical snapshot to {snapshot_path}")
    except Exception as e:
        logger.warning(f"⚠️ Could not write canonical snapshot: {e}")

    # 4. Upsert into local database
    logger.info("💾 Updating local database...")
    Base.metadata.create_all(bind=engine)
    db_gen = get_db()
    db = next(db_gen)

    try:
        # Sync Settings
        setting_val = settings_data.get("value", {})
        db_setting = db.query(Settings).filter(Settings.key == "seva_org_settings").first()
        if db_setting:
            db_setting.value = setting_val
        else:
            db_setting = Settings(key="seva_org_settings", value=setting_val)
            db.add(db_setting)
        db.commit()
        logger.info(f"✅ Synced settings: {setting_val.get('orgName', 'SRS Matha')}")

        # Sync Sevas
        existing_sevas = {s.SevaCode: s for s in db.query(Seva).all()}
        inserted = 0
        updated = 0

        for s in sevas_data:
            code = s.get("SevaCode", "")
            if code in existing_sevas:
                curr = existing_sevas[code]
                curr.Description = s.get("Description", curr.Description)
                curr.DescriptionEn = s.get("DescriptionEn", curr.DescriptionEn)
                curr.Amount = s.get("Amount", curr.Amount)
                curr.TPQty = s.get("TPQty", curr.TPQty)
                curr.PrasadaAddonLimit = s.get("PrasadaAddonLimit", curr.PrasadaAddonLimit)
                curr.IsSpecialEvent = s.get("IsSpecialEvent", curr.IsSpecialEvent)
                curr.EventDate = s.get("EventDate", curr.EventDate)
                curr.StartTime = s.get("StartTime", curr.StartTime)
                curr.EndTime = s.get("EndTime", curr.EndTime)
                curr.IsAllDay = s.get("IsAllDay", curr.IsAllDay)
                curr.RecurrenceRule = s.get("RecurrenceRule", curr.RecurrenceRule)
                updated += 1
            else:
                new_s = Seva(
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
                db.add(new_s)
                existing_sevas[code] = new_s
                inserted += 1

        db.commit()
        logger.info(f"✅ Sevas sync complete: {inserted} added, {updated} updated (total {len(existing_sevas)} in local database).")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ Error applying changes to local database: {e}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Sync master tables from production to local database.")
    parser.add_argument(
        "--prod-url",
        default=DEFAULT_PROD_URL,
        help=f"Production API base URL (default: {DEFAULT_PROD_URL})"
    )
    args = parser.parse_args()
    sync_from_production(args.prod_url)


if __name__ == "__main__":
    main()
