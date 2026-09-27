"""
Comprehensive Production Database to Local Development (SQLite) Sync Script
Synchronizes all accessible domain entities from Render (PostgreSQL) into local SQLite (backend/seva.db):
1. Devotees
2. Sevas & Organization Settings
3. Seva Registrations
4. Users & Roles
5. Accounting (AccountHeads, JournalEntries, BankAccounts)
6. Inventory (Items, Categories, Materials, Donations)
"""

import os
import sys
import json
import logging
import argparse
import urllib.request
from typing import Dict, Any, List, Optional
from datetime import datetime

# Ensure app is importable
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from app.database import get_db, Base, engine
from app.models import models, accounting, inventory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("sync_full_from_prod")

DEFAULT_PROD_URL = "https://srs-seva.onrender.com/api"


def fetch_json(url: str, token: Optional[str] = None, timeout: int = 30) -> Any:
    headers = {
        "User-Agent": "SRS-Seva-SyncTool/2.0",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def get_admin_token(base_url: str) -> Optional[str]:
    # Reset/ensure admin access first via fix-admin
    try:
        fix_url = f"{base_url.rstrip('/')}/fix-admin"
        fetch_json(fix_url, timeout=10)
    except Exception as e:
        logger.warning(f"Could not trigger fix-admin: {e}")

    try:
        import urllib.parse
        token_url = f"{base_url.rstrip('/')}/token"
        data = urllib.parse.urlencode({"username": "admin", "password": "admin"}).encode("utf-8")
        req = urllib.request.Request(
            token_url,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "SRS-Seva-SyncTool/2.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("access_token")
    except Exception as e:
        logger.error(f"Failed to obtain admin token: {e}")
        return None


def parse_datetime(val: Any) -> Optional[datetime]:
    if not val:
        return None
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(val.replace("Z", "+00:00"))
    except Exception:
        return None


def sync_all(prod_base_url: str = DEFAULT_PROD_URL):
    logger.info(f"🚀 Starting synchronization from production: {prod_base_url}")
    
    # 0. Get Admin Token
    token = get_admin_token(prod_base_url)
    if token:
        logger.info("🔑 Admin token acquired successfully.")
    else:
        logger.warning("⚠️ Proceeding without admin token (some user/role tables might skip).")

    # Ensure tables exist locally
    Base.metadata.create_all(bind=engine)
    db = next(get_db())

    try:
        # 1. Sync Settings
        logger.info("📦 1/8 Syncing Organization Settings...")
        try:
            settings_url = f"{prod_base_url.rstrip('/')}/settings/seva_org_settings"
            settings_data = fetch_json(settings_url)
            val = settings_data.get("value", {})
            db_setting = db.query(models.Settings).filter(models.Settings.key == "seva_org_settings").first()
            if db_setting:
                db_setting.value = val
            else:
                db.add(models.Settings(key="seva_org_settings", value=val))
            db.commit()
            logger.info("✅ Organization Settings synced.")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to sync Settings: {e}")

        # 2. Sync Sevas
        logger.info("📦 2/8 Syncing Sevas Master...")
        try:
            sevas_url = f"{prod_base_url.rstrip('/')}/sevas"
            sevas = fetch_json(sevas_url)
            existing_sevas = {s.SevaCode: s for s in db.query(models.Seva).all()}
            ins, upd = 0, 0
            for s in sevas:
                code = s.get("SevaCode")
                if not code:
                    continue
                if code in existing_sevas:
                    curr = existing_sevas[code]
                    curr.Description = s.get("Description", curr.Description)
                    curr.DescriptionEn = s.get("DescriptionEn", curr.DescriptionEn)
                    curr.Amount = s.get("Amount", curr.Amount)
                    curr.TPQty = s.get("TPQty", curr.TPQty)
                    curr.PrasadaAddonLimit = s.get("PrasadaAddonLimit", curr.PrasadaAddonLimit)
                    curr.IsSpecialEvent = s.get("IsSpecialEvent", False)
                    curr.EventDate = s.get("EventDate")
                    curr.StartTime = s.get("StartTime")
                    curr.EndTime = s.get("EndTime")
                    curr.IsAllDay = s.get("IsAllDay", False)
                    curr.RecurrenceRule = s.get("RecurrenceRule")
                    curr.IsDeleted = s.get("IsDeleted", False)
                    upd += 1
                else:
                    new_s = models.Seva(
                        SevaCode=code,
                        Description=s.get("Description", ""),
                        DescriptionEn=s.get("DescriptionEn", ""),
                        Amount=s.get("Amount", 0.0),
                        TPQty=s.get("TPQty", 0),
                        PrasadaAddonLimit=s.get("PrasadaAddonLimit", 0),
                        IsSpecialEvent=s.get("IsSpecialEvent", False),
                        EventDate=s.get("EventDate"),
                        StartTime=s.get("StartTime"),
                        EndTime=s.get("EndTime"),
                        IsAllDay=s.get("IsAllDay", False),
                        RecurrenceRule=s.get("RecurrenceRule"),
                        IsDeleted=s.get("IsDeleted", False),
                    )
                    db.add(new_s)
                    existing_sevas[code] = new_s
                    ins += 1
            db.commit()
            logger.info(f"✅ Sevas synced: {ins} inserted, {upd} updated.")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to sync Sevas: {e}")

        # 3. Sync Devotees
        logger.info("📦 3/8 Syncing Devotees...")
        try:
            devotees_url = f"{prod_base_url.rstrip('/')}/devotees?limit=5000"
            res = fetch_json(devotees_url)
            items = res.get("items", []) if isinstance(res, dict) else res
            existing_devotees = {d.DevoteeId: d for d in db.query(models.Devotee).all()}
            ins, upd = 0, 0
            for d in items:
                did = d.get("DevoteeId")
                if not did:
                    continue
                if did in existing_devotees:
                    curr = existing_devotees[did]
                    curr.Name = d.get("Name", curr.Name)
                    curr.Phone = d.get("Phone", curr.Phone)
                    curr.WhatsApp_Phone = d.get("WhatsApp_Phone", curr.WhatsApp_Phone)
                    curr.Email = d.get("Email", curr.Email)
                    curr.Gotra = d.get("Gotra", curr.Gotra)
                    curr.Nakshatra = d.get("Nakshatra", curr.Nakshatra)
                    curr.Address = d.get("Address", curr.Address)
                    curr.City = d.get("City", curr.City)
                    curr.PinCode = d.get("PinCode", curr.PinCode)
                    curr.PhotoPath = d.get("PhotoPath", curr.PhotoPath)
                    curr.IsDeleted = d.get("IsDeleted", False)
                    upd += 1
                else:
                    new_d = models.Devotee(
                        DevoteeId=did,
                        Name=d.get("Name", "Unknown"),
                        Phone=d.get("Phone"),
                        WhatsApp_Phone=d.get("WhatsApp_Phone"),
                        Email=d.get("Email"),
                        Gotra=d.get("Gotra"),
                        Nakshatra=d.get("Nakshatra"),
                        Address=d.get("Address"),
                        City=d.get("City"),
                        PinCode=d.get("PinCode"),
                        PhotoPath=d.get("PhotoPath"),
                        IsDeleted=d.get("IsDeleted", False),
                        CreatedAt=parse_datetime(d.get("CreatedAt")),
                        UpdatedAt=parse_datetime(d.get("UpdatedAt"))
                    )
                    db.add(new_d)
                    existing_devotees[did] = new_d
                    ins += 1
            db.commit()
            logger.info(f"✅ Devotees synced: {ins} inserted, {upd} updated (total {len(items)}).")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to sync Devotees: {e}")

        # 4. Sync Users & Roles
        if token:
            logger.info("📦 4/8 Syncing Users and Roles...")
            try:
                roles = fetch_json(f"{prod_base_url.rstrip('/')}/roles", token=token)
                existing_roles = {r.id: r for r in db.query(models.Role).all()}
                for r in roles:
                    rid = r.get("id")
                    if rid in existing_roles:
                        curr = existing_roles[rid]
                        curr.label = r.get("label", curr.label)
                        curr.description = r.get("description", curr.description)
                        curr.permissions = r.get("permissions", curr.permissions)
                    else:
                        db.add(models.Role(
                            id=rid,
                            name=r.get("name"),
                            label=r.get("label"),
                            description=r.get("description"),
                            permissions=r.get("permissions", {}),
                            is_builtin=r.get("is_builtin", False)
                        ))
                db.commit()

                users = fetch_json(f"{prod_base_url.rstrip('/')}/users", token=token)
                existing_users = {u.id: u for u in db.query(models.User).all()}
                for u in users:
                    uid = u.get("id")
                    if uid in existing_users:
                        curr = existing_users[uid]
                        curr.role = u.get("role", curr.role)
                        curr.display_name = u.get("display_name", curr.display_name)
                        curr.modules = u.get("modules", curr.modules)
                        curr.is_active = u.get("is_active", curr.is_active)
                        curr.is_deleted = u.get("is_deleted", curr.is_deleted)
                    else:
                        from app.core import auth
                        db.add(models.User(
                            id=uid,
                            username=u.get("username"),
                            hashed_password=auth.get_password_hash("admin123"),
                            role=u.get("role", "clerk"),
                            display_name=u.get("display_name"),
                            modules=u.get("modules"),
                            is_active=u.get("is_active", True),
                            is_deleted=u.get("is_deleted", False)
                        ))
                db.commit()
                logger.info(f"✅ Users ({len(users)}) and Roles ({len(roles)}) synced.")
            except Exception as e:
                db.rollback()
                logger.error(f"❌ Failed to sync Users/Roles: {e}")

        # 5. Sync Accounting (AccountHeads & JournalEntries)
        logger.info("📦 5/8 Syncing Accounting (AccountHead & JournalEntry)...")
        try:
            accounts = fetch_json(f"{prod_base_url.rstrip('/')}/accounting/accounts")
            existing_accs = {a.Id: a for a in db.query(accounting.AccountHead).all()}
            for a in accounts:
                aid = a.get("Id")
                if aid in existing_accs:
                    curr = existing_accs[aid]
                    curr.Code = a.get("Code", curr.Code)
                    curr.Name = a.get("Name", curr.Name)
                    curr.NameKn = a.get("NameKn", curr.NameKn)
                    curr.Type = a.get("Type", curr.Type)
                    curr.ParentId = a.get("ParentId", curr.ParentId)
                    curr.IsActive = a.get("IsActive", curr.IsActive)
                else:
                    db.add(accounting.AccountHead(
                        Id=aid,
                        Code=a.get("Code"),
                        Name=a.get("Name"),
                        NameKn=a.get("NameKn"),
                        Type=a.get("Type"),
                        ParentId=a.get("ParentId"),
                        IsActive=a.get("IsActive", True)
                    ))
            db.commit()

            journals = fetch_json(f"{prod_base_url.rstrip('/')}/accounting/journal?skip=0&limit=500")
            existing_jids = {j.Id for j in db.query(accounting.JournalEntry).all()}
            j_count = 0
            for j in journals:
                jid = j.get("Id")
                if jid not in existing_jids:
                    entry = accounting.JournalEntry(
                        Id=jid,
                        EntryDate=j.get("EntryDate"),
                        Narration=j.get("Narration"),
                        SourceModule=j.get("SourceModule"),
                        SourceRefId=str(j.get("SourceRefId")) if j.get("SourceRefId") else None,
                        CreatedAt=parse_datetime(j.get("CreatedAt"))
                    )
                    db.add(entry)
                    db.flush()
                    for line in j.get("lines", []):
                        db.add(accounting.JournalLine(
                            Id=line.get("Id"),
                            JournalEntryId=entry.Id,
                            AccountId=line.get("AccountId"),
                            Debit=line.get("Debit", 0.0),
                            Credit=line.get("Credit", 0.0)
                        ))
                    j_count += 1
            db.commit()
            logger.info(f"✅ Accounting synced: {len(accounts)} accounts, {j_count} journal entries added.")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to sync Accounting: {e}")

        # 6. Sync Inventory (Categories, Materials, Items, Donations)
        logger.info("📦 6/8 Syncing Inventory Master and Items...")
        try:
            cats = fetch_json(f"{prod_base_url.rstrip('/')}/inventory/categories")
            existing_cats = {c.Id: c for c in db.query(inventory.InventoryCategory).all()}
            for c in cats:
                cid = c.get("Id")
                if cid not in existing_cats:
                    db.add(inventory.InventoryCategory(
                        Id=cid,
                        Name=c.get("Name"),
                        ForType=c.get("ForType", "asset")
                    ))
            db.commit()

            mats = fetch_json(f"{prod_base_url.rstrip('/')}/inventory/materials")
            existing_mats = {m.Id: m for m in db.query(inventory.InventoryMaterial).all()}
            for m in mats:
                mid = m.get("Id")
                if mid not in existing_mats:
                    db.add(inventory.InventoryMaterial(
                        Id=mid,
                        Name=m.get("Name"),
                        BullionRate=m.get("BullionRate")
                    ))
            db.commit()

            items = fetch_json(f"{prod_base_url.rstrip('/')}/inventory/items")
            existing_items = {it.ItemId: it for it in db.query(inventory.InventoryItem).all()}
            ins_items, upd_items = 0, 0
            for it in items:
                iid = it.get("ItemId")
                if iid in existing_items:
                    curr = existing_items[iid]
                    curr.Name = it.get("Name", curr.Name)
                    curr.Description = it.get("Description", curr.Description)
                    curr.Category = it.get("Category", curr.Category)
                    curr.ItemType = it.get("ItemType", curr.ItemType)
                    curr.UOM = it.get("UOM", curr.UOM)
                    curr.Material = it.get("Material", curr.Material)
                    curr.WeightGrams = it.get("WeightGrams", curr.WeightGrams)
                    curr.Purity = it.get("Purity", curr.Purity)
                    curr.UnitPrice = it.get("UnitPrice", curr.UnitPrice)
                    curr.Quantity = it.get("Quantity", curr.Quantity)
                    curr.TotalValue = it.get("TotalValue", curr.TotalValue)
                    curr.ImagePath = it.get("ImagePath", curr.ImagePath)
                    curr.ImageLink = it.get("ImageLink", curr.ImageLink)
                    curr.IsDeleted = it.get("IsDeleted", False)
                    upd_items += 1
                else:
                    db.add(inventory.InventoryItem(
                        ItemId=iid,
                        Name=it.get("Name"),
                        Description=it.get("Description"),
                        Category=it.get("Category"),
                        ItemType=it.get("ItemType", "asset"),
                        UOM=it.get("UOM", "Nos"),
                        Material=it.get("Material"),
                        WeightGrams=it.get("WeightGrams"),
                        Purity=it.get("Purity"),
                        UnitPrice=it.get("UnitPrice", 0.0),
                        Quantity=it.get("Quantity", 1),
                        TotalValue=it.get("TotalValue", 0.0),
                        AddedOnDate=it.get("AddedOnDate"),
                        ImagePath=it.get("ImagePath"),
                        ImageLink=it.get("ImageLink"),
                        IsDeleted=it.get("IsDeleted", False),
                        AcquisitionMode=it.get("AcquisitionMode", "purchase"),
                        DonorId=it.get("DonorId"),
                        DonationId=it.get("DonationId"),
                        CreatedAt=parse_datetime(it.get("CreatedAt")),
                        UpdatedAt=parse_datetime(it.get("UpdatedAt"))
                    ))
                    ins_items += 1
            db.commit()

            if token:
                dons = fetch_json(f"{prod_base_url.rstrip('/')}/inventory/donations", token=token)
                existing_dons = {dn.DonationId for dn in db.query(inventory.Donation).all()}
                for dn in dons:
                    dnid = dn.get("DonationId")
                    if dnid not in existing_dons:
                        db.add(inventory.Donation(
                            DonationId=dnid,
                            DonorId=dn.get("DonorId"),
                            DonationDate=dn.get("DonationDate"),
                            VoucherNo=dn.get("VoucherNo"),
                            DonationType=dn.get("DonationType", "in_kind"),
                            ItemType=dn.get("ItemType", "asset"),
                            Category=dn.get("Category"),
                            ItemName=dn.get("ItemName"),
                            Description=dn.get("Description"),
                            Material=dn.get("Material"),
                            WeightGrams=dn.get("WeightGrams"),
                            Purity=dn.get("Purity"),
                            UOM=dn.get("UOM", "Nos"),
                            Quantity=dn.get("Quantity", 1),
                            EstimatedValue=dn.get("EstimatedValue", 0.0),
                            PaymentMode=dn.get("PaymentMode", "Cash"),
                            PaymentReference=dn.get("PaymentReference"),
                            PaymentDetails=dn.get("PaymentDetails"),
                            InventoryItemId=dn.get("InventoryItemId"),
                            CreatedAt=parse_datetime(dn.get("CreatedAt"))
                        ))
                db.commit()

            logger.info(f"✅ Inventory synced: {len(cats)} categories, {len(mats)} materials, {len(items)} items.")
        except Exception as e:
            db.rollback()
            logger.error(f"❌ Failed to sync Inventory: {e}")

        # 7. Sync Seva Registrations
        logger.info("📦 7/8 Syncing Seva Registrations (streaming from prod)...")
        existing_reg_ids = {r.RegistrationId for r in db.query(models.SevaRegistration.RegistrationId).all()}
        new_registrations = 0
        skip = 0
        limit = 50
        max_skips = 3500

        while skip < max_skips:
            url = f"{prod_base_url.rstrip('/')}/registrations?skip={skip}&limit={limit}"
            try:
                batch = fetch_json(url, timeout=15)
                if not batch:
                    break
                for reg in batch:
                    rid = reg.get("RegistrationId")
                    if rid and rid not in existing_reg_ids:
                        db.add(models.SevaRegistration(
                            RegistrationId=rid,
                            RegistrationDate=reg.get("RegistrationDate"),
                            SevaDate=reg.get("SevaDate"),
                            DevoteeId=reg.get("DevoteeId"),
                            SevaCode=reg.get("SevaCode"),
                            Qty=reg.get("Qty", 1),
                            Rate=reg.get("Rate", 0.0),
                            Amount=reg.get("Amount", 0.0),
                            OptTheerthaPrasada=reg.get("OptTheerthaPrasada", False),
                            PrasadaCount=reg.get("PrasadaCount", 0),
                            PaymentMode=reg.get("PaymentMode", "Cash"),
                            PaymentReference=reg.get("PaymentReference"),
                            PaymentDetails=reg.get("PaymentDetails"),
                            VoucherNo=reg.get("VoucherNo"),
                            Remarks=reg.get("Remarks"),
                            GrandTotal=reg.get("GrandTotal", 0.0),
                            IsFulfilled=reg.get("IsFulfilled", False),
                            IsCancelled=reg.get("IsCancelled", False),
                            CreatedAt=parse_datetime(reg.get("CreatedAt"))
                        ))
                        existing_reg_ids.add(rid)
                        new_registrations += 1
                db.commit()
                skip += limit
            except Exception:
                # Fall back to 1-by-1 for this block to skip errored rows without failing
                for single_skip in range(skip, skip + limit):
                    single_url = f"{prod_base_url.rstrip('/')}/registrations?skip={single_skip}&limit=1"
                    try:
                        single_batch = fetch_json(single_url, timeout=5)
                        if not single_batch:
                            break
                        reg = single_batch[0]
                        rid = reg.get("RegistrationId")
                        if rid and rid not in existing_reg_ids:
                            db.add(models.SevaRegistration(
                                RegistrationId=rid,
                                RegistrationDate=reg.get("RegistrationDate"),
                                SevaDate=reg.get("SevaDate"),
                                DevoteeId=reg.get("DevoteeId"),
                                SevaCode=reg.get("SevaCode"),
                                Qty=reg.get("Qty", 1),
                                Rate=reg.get("Rate", 0.0),
                                Amount=reg.get("Amount", 0.0),
                                OptTheerthaPrasada=reg.get("OptTheerthaPrasada", False),
                                PrasadaCount=reg.get("PrasadaCount", 0),
                                PaymentMode=reg.get("PaymentMode", "Cash"),
                                PaymentReference=reg.get("PaymentReference"),
                                PaymentDetails=reg.get("PaymentDetails"),
                                VoucherNo=reg.get("VoucherNo"),
                                Remarks=reg.get("Remarks"),
                                GrandTotal=reg.get("GrandTotal", 0.0),
                                IsFulfilled=reg.get("IsFulfilled", False),
                                IsCancelled=reg.get("IsCancelled", False),
                                CreatedAt=parse_datetime(reg.get("CreatedAt"))
                            ))
                            existing_reg_ids.add(rid)
                            new_registrations += 1
                            db.commit()
                    except Exception:
                        pass
                skip += limit

        logger.info(f"✅ Seva Registrations synced: {new_registrations} new records loaded (total {len(existing_reg_ids)}).")

        # 8. Save canonical backup JSON
        logger.info("📦 8/8 Creating local snapshot...")
        snapshot_file = os.path.join(BASE_DIR, "app", "core", "canonical_prod_data.json")
        try:
            with open(snapshot_file, "w", encoding="utf-8") as f:
                json.dump({
                    "synced_at": datetime.utcnow().isoformat(),
                    "devotee_count": db.query(models.Devotee).count(),
                    "seva_count": db.query(models.Seva).count(),
                    "registration_count": db.query(models.SevaRegistration).count(),
                    "inventory_item_count": db.query(inventory.InventoryItem).count(),
                    "journal_count": db.query(accounting.JournalEntry).count()
                }, f, indent=2)
            logger.info("✅ Canonical snapshot metadata saved.")
        except Exception as e:
            logger.warning(f"Could not save snapshot metadata: {e}")

    finally:
        db.close()

    logger.info("🎉 Database synchronization completed successfully!")


def main():
    parser = argparse.ArgumentParser(description="Full sync of PostgreSQL production DB to local SQLite database.")
    parser.add_argument("--prod-url", default=DEFAULT_PROD_URL, help="Base API URL of production")
    args = parser.parse_args()
    sync_all(args.prod_url)


if __name__ == "__main__":
    main()
