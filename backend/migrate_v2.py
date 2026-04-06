"""
migrate_v2.py — Migrate legacy data to new schema
===================================================
Run:  python migrate_v2.py

This script:
1. Reads legacy Customer → Devotee (extracts phone from ID column)
2. Reads legacy Item → Seva
3. Reads legacy Invoice_Hdr + Invoice_Dtl → SevaRegistration
4. Logs migration failures to migration_v2_failures.csv
"""
import os
import sys
import re
import csv
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seva.db")
FAILURE_LOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "migration_v2_failures.csv")


def normalize_phone(raw: str) -> str:
    """Strip +91, spaces, dashes → 10-digit string or empty."""
    if not raw:
        return ""
    cleaned = re.sub(r"[\s\-\+]", "", raw)
    if cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    # Return cleaned digits; may not be exactly 10 for legacy data
    return cleaned


def extract_phone_from_id(legacy_id: str) -> str:
    """
    Legacy ID format: '9742287905-1' → '9742287905'
    Take everything before the first '-', strip non-digits.
    """
    if not legacy_id:
        return ""
    parts = legacy_id.split("-")
    digits = re.sub(r"\D", "", parts[0])
    return digits


def parse_legacy_date(date_str: str) -> str:
    """
    Convert legacy date formats to DDMMYY.
    Handles: '04/01/25 10:59:48', '04/12/25 00:00:00', ISO, etc.
    Returns DDMMYY or empty string on failure.
    """
    if not date_str or not date_str.strip():
        return ""
    date_str = date_str.strip()

    # Try common formats
    for fmt in [
        "%m/%d/%y %H:%M:%S",   # MM/DD/YY HH:MM:SS (Access export)
        "%m/%d/%y",             # MM/DD/YY
        "%Y-%m-%dT%H:%M:%S",   # ISO
        "%Y-%m-%d %H:%M:%S",   # ISO-ish
        "%Y-%m-%d",             # ISO date only
        "%d/%m/%Y",             # DD/MM/YYYY
        "%d/%m/%y",             # DD/MM/YY
    ]:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%d%m%y")
        except ValueError:
            continue
    return ""


def round_2(val) -> float:
    """Round to 2 decimal places for INR."""
    try:
        return round(float(val), 2)
    except (TypeError, ValueError):
        return 0.00


def run_migration():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    failures = []  # List of (table, legacy_id, reason)

    # ─── Step 0: Create new tables ───
    print("Creating new tables...")
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS Devotee (
            DevoteeId   INTEGER PRIMARY KEY AUTOINCREMENT,
            Name        TEXT NOT NULL,
            Phone       TEXT,
            WhatsApp_Phone TEXT,
            Email       TEXT,
            Gotra       TEXT,
            Nakshatra   TEXT,
            Address     TEXT,
            City        TEXT,
            PinCode     TEXT,
            PhotoPath   TEXT,
            IsDeleted   INTEGER DEFAULT 0,
            CreatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
            UpdatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS Seva (
            SevaCode        TEXT PRIMARY KEY,
            Description     TEXT,
            DescriptionEn   TEXT,
            Amount          REAL,
            TPQty           INTEGER DEFAULT 0,
            PrasadaAddonLimit INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS SevaRegistration (
            RegistrationId      INTEGER PRIMARY KEY AUTOINCREMENT,
            RegistrationDate    TEXT NOT NULL,
            SevaDate            TEXT,
            DevoteeId           INTEGER NOT NULL REFERENCES Devotee(DevoteeId),
            SevaCode            TEXT NOT NULL REFERENCES Seva(SevaCode),
            Qty                 INTEGER DEFAULT 1,
            Rate                REAL DEFAULT 0.0,
            Amount              REAL DEFAULT 0.0,
            OptTheerthaPrasada  INTEGER DEFAULT 0,
            PrasadaCount        INTEGER DEFAULT 0,
            PaymentMode         TEXT DEFAULT 'Cash',
            PaymentReference    TEXT,
            VoucherNo           TEXT,
            Remarks             TEXT,
            GrandTotal          REAL DEFAULT 0.0,
            CreatedAt           DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # ─── Step 1: Migrate Customer → Devotee ───
    print("Migrating Customers → Devotees...")
    customers = cur.execute("SELECT * FROM Customer").fetchall()
    # Map legacy ID1 → new DevoteeId
    id_map = {}  # legacy_ID1 -> new_DevoteeId
    # Also map legacy ID (phone-N) → new_DevoteeId (for invoice lookup)
    legacy_id_map = {}  # legacy_ID string -> new_DevoteeId

    migrated_devotees = 0
    for c in customers:
        try:
            name = (c["Name"] or "").strip()
            if not name:
                failures.append(("Customer", c["ID1"], "Empty name"))
                continue

            # Extract phone: prefer explicit Phone column, fall back to ID
            phone = normalize_phone(c["Phone"] or "")
            if not phone:
                phone = extract_phone_from_id(c["ID"] or "")

            whatsapp = normalize_phone(c["WhatsApp_Phone"] or "")
            email = (c["Email_ID"] or "").strip() or None
            gotra = (c["Sgotra"] or "").strip() or None
            nakshatra = (c["SNakshatra"] or "").strip() or None
            address = (c["Address"] or "").strip().replace("\r\n", ", ").replace("\n", ", ") or None
            city = (c["City"] or "").strip() or None

            cur.execute("""
                INSERT INTO Devotee (Name, Phone, WhatsApp_Phone, Email, Gotra, Nakshatra, Address, City)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (name, phone or None, whatsapp or None, email, gotra, nakshatra, address, city))

            new_id = cur.lastrowid
            id_map[c["ID1"]] = new_id
            if c["ID"]:
                legacy_id_map[c["ID"]] = new_id

            migrated_devotees += 1

        except Exception as e:
            failures.append(("Customer", c["ID1"], str(e)))

    print(f"  ✓ Migrated {migrated_devotees}/{len(customers)} customers")

    # ─── Step 2: Migrate Item → Seva ───
    print("Migrating Items → Sevas...")
    items = cur.execute("SELECT * FROM Item WHERE ItemCode IS NOT NULL AND ItemCode != ''").fetchall()
    migrated_sevas = 0
    for item in items:
        try:
            code = (item["ItemCode"] or "").strip()
            if not code:
                continue
            desc = (item["Description"] or "").strip() or None
            amount = round_2(item["Basic"])
            tp_qty = int(item["TPQty"] or 0)
            addon = int(item["Prasada_Addon_Limit"] if "Prasada_Addon_Limit" in item.keys() else 0)

            cur.execute("""
                INSERT OR REPLACE INTO Seva (SevaCode, Description, Amount, TPQty, PrasadaAddonLimit)
                VALUES (?, ?, ?, ?, ?)
            """, (code, desc, amount, tp_qty, addon))
            migrated_sevas += 1
        except Exception as e:
            failures.append(("Item", item["ItemCode"], str(e)))

    print(f"  ✓ Migrated {migrated_sevas}/{len(items)} items")

    # ─── Step 3: Migrate Invoice_Hdr + Invoice_Dtl → SevaRegistration ───
    print("Migrating Invoices → SevaRegistrations...")
    invoices = cur.execute("SELECT * FROM Invoice_Hdr").fetchall()
    # Build invoice detail lookup: InvoiceNo → list of details
    details = cur.execute("SELECT * FROM Invoice_Dtl").fetchall()
    dtl_map = {}
    for d in details:
        inv_no = d["InvoiceNo"]
        if inv_no not in dtl_map:
            dtl_map[inv_no] = []
        dtl_map[inv_no].append(d)

    migrated_regs = 0
    for inv in invoices:
        try:
            inv_no = inv["InvoiceNo"] or ""

            # Resolve devotee
            legacy_cust_id = inv["ID"] or ""
            devotee_id = legacy_id_map.get(legacy_cust_id)
            if not devotee_id:
                failures.append(("Invoice_Hdr", inv_no, f"Devotee not found for ID={legacy_cust_id}"))
                continue

            # Parse dates
            reg_date = parse_legacy_date(inv["InvoiceDate"] or "")
            seva_date = parse_legacy_date(inv["PO_Date"] or "")
            if not reg_date:
                reg_date = datetime.now().strftime("%d%m%y")  # fallback

            payment_mode = (inv["PaymentCode"] or "Cash").strip()
            # Normalize payment modes
            if payment_mode.lower() in ("paytm", "online pmt"):
                payment_mode = "UPI"

            cheque_no = (inv["ChqNo"] or "").strip() or None
            remarks = (inv["Remarks"] or "").strip() or None
            grand_total = round_2(inv["GrandTotal"] or inv["ItemRateTotal"] or 0)
            tp_qty_total = int(inv["TotalTPQty"] or 0)

            # Get invoice details for this invoice
            inv_details = dtl_map.get(inv_no, [])

            if inv_details:
                # Create one registration per detail line
                for dtl in inv_details:
                    seva_code = (dtl["ItemCode"] or "").strip()
                    if not seva_code:
                        continue
                    qty = int(dtl["TotalQty"] or 1)
                    rate = round_2(dtl["Basic"])
                    amount = round_2(dtl["Amount"])
                    tp_qty = int(dtl["TPQty"] or 0)

                    cur.execute("""
                        INSERT INTO SevaRegistration
                        (RegistrationDate, SevaDate, DevoteeId, SevaCode, Qty, Rate, Amount,
                         OptTheerthaPrasada, PrasadaCount, PaymentMode, PaymentReference,
                         VoucherNo, Remarks, GrandTotal)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        reg_date, seva_date, devotee_id, seva_code, qty, rate, amount,
                        1 if tp_qty > 0 else 0, tp_qty,
                        payment_mode, cheque_no, inv_no, remarks, amount
                    ))
                    migrated_regs += 1
            else:
                # No detail lines — create a single registration with header data
                cur.execute("""
                    INSERT INTO SevaRegistration
                    (RegistrationDate, SevaDate, DevoteeId, SevaCode, Qty, Rate, Amount,
                     OptTheerthaPrasada, PrasadaCount, PaymentMode, PaymentReference,
                     VoucherNo, Remarks, GrandTotal)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    reg_date, seva_date, devotee_id, "S000", 1, grand_total, grand_total,
                    1 if tp_qty_total > 0 else 0, tp_qty_total,
                    payment_mode, cheque_no, inv_no, remarks, grand_total
                ))
                migrated_regs += 1

        except Exception as e:
            failures.append(("Invoice_Hdr", inv.get("InvoiceNo", "?"), str(e)))

    print(f"  ✓ Migrated {migrated_regs} registration records from {len(invoices)} invoices")

    # ─── Step 4: Commit ───
    conn.commit()

    # ─── Step 5: Report ───
    print(f"\n{'='*60}")
    print(f"MIGRATION SUMMARY")
    print(f"{'='*60}")
    print(f"  Devotees:       {migrated_devotees}")
    print(f"  Sevas:          {migrated_sevas}")
    print(f"  Registrations:  {migrated_regs}")
    print(f"  Failures:       {len(failures)}")

    if failures:
        print(f"\nWriting failure log to {FAILURE_LOG}")
        with open(FAILURE_LOG, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Source Table", "Legacy ID", "Reason"])
            for table, lid, reason in failures:
                writer.writerow([table, lid, reason])
        print(f"  → {len(failures)} failures logged. Review {FAILURE_LOG}")
    else:
        print("\n  ✓ No failures! Migration complete.")

    # ─── Step 6: Verify counts ───
    print(f"\nVerification:")
    for table in ["Devotee", "Seva", "SevaRegistration"]:
        count = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        print(f"  {table}: {count} rows")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    run_migration()
