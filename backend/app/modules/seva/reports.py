"""
Reports Router for Seva Booking Module.

Provides comprehensive endpoints for:
1. Seva Bookings Report:
   - On-Demand: Grouped by Date & Seva (Devotee Name, Phone, Gothra, Nakshatra, Additional Hastodaka).
   - Daily: Grouped by Seva for Tomorrow/Selected Date (Devotee Name, Gothra, Nakshatra for Priests).
2. Hastodaka Count Report:
   - Daily: Tomorrow's Hastodaka count grouped by Seva (Included Free + Additional = Total Plates).
   - On-Demand: Day-wise Hastodaka distribution across a specified date range.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any
import datetime
from collections import defaultdict

from app.models import models
from app import database

router = APIRouter(prefix="/reports", tags=["reports"])

def normalize_to_iso(d_str: str) -> str:
    """Accepts either YYYY-MM-DD or DDMMYY and returns YYYY-MM-DD."""
    d_str = (d_str or "").strip()
    if len(d_str) == 6 and d_str.isdigit():
        dd = d_str[:2]
        mm = d_str[2:4]
        yy = d_str[4:6]
        return f"20{yy}-{mm}-{dd}"
    return d_str

def get_kannada_day(day_name: str) -> str:
    days = {
        "Monday": "ಸೋಮವಾರ (Monday)",
        "Tuesday": "ಮಂಗಳವಾರ (Tuesday)",
        "Wednesday": "ಬುಧವಾರ (Wednesday)",
        "Thursday": "ಗುರುವಾರ (Thursday)",
        "Friday": "ಶುಕ್ರವಾರ (Friday)",
        "Saturday": "ಶನಿವಾರ (Saturday)",
        "Sunday": "ಭಾನುವಾರ (Sunday)"
    }
    return days.get(day_name, day_name)


@router.get("/seva-bookings")
def get_seva_bookings_report(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD or DDMMYY"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD or DDMMYY (defaults to start_date)"),
    report_type: str = Query("on_demand_full", description="'on_demand_full' or 'daily_priest'"),
    date_type: str = Query("SevaDate", description="'SevaDate' or 'RegistrationDate'"),
    db: Session = Depends(database.get_db),
):
    """
    Returns seva bookings grouped by date and seva.
    - 'on_demand_full': includes Phone, Gothra, Nakshatra, Additional Hastodaka count.
    - 'daily_priest': tailored for priests (Devotee Name, Gothra, Nakshatra).
    """
    start_iso = normalize_to_iso(start_date)
    end_iso = normalize_to_iso(end_date or start_date)

    try:
        start_dt = datetime.date.fromisoformat(start_iso)
        end_dt = datetime.date.fromisoformat(end_iso)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD or DDMMYY.")

    if start_dt > end_dt:
        start_dt, end_dt = end_dt, start_dt

    # Generate dates map
    date_keys = {}
    curr = start_dt
    while curr <= end_dt:
        ddmmyy = curr.strftime("%d%m%y")
        date_keys[ddmmyy] = {
            "iso": curr.strftime("%Y-%m-%d"),
            "formatted": curr.strftime("%d/%m/%Y"),
            "day_name": curr.strftime("%A"),
            "day_kannada": get_kannada_day(curr.strftime("%A"))
        }
        curr += datetime.timedelta(days=1)

    target_column = models.SevaRegistration.RegistrationDate if date_type == "RegistrationDate" else models.SevaRegistration.SevaDate

    registrations = (
        db.query(models.SevaRegistration)
        .options(
            joinedload(models.SevaRegistration.devotee),
            joinedload(models.SevaRegistration.seva)
        )
        .filter(models.SevaRegistration.IsCancelled == False)
        .filter(target_column.in_(list(date_keys.keys())))
        .all()
    )

    # Group by Date -> SevaCode
    grouped_data: Dict[str, Dict[str, List[Any]]] = defaultdict(lambda: defaultdict(list))
    for reg in registrations:
        date_val = getattr(reg, date_type) or ""
        grouped_data[date_val][reg.SevaCode].append(reg)

    total_bookings = 0
    total_devotees = 0
    total_additional_hastodaka = 0

    days_result = []
    # Iterate through chronological date keys
    for ddmmyy, meta in sorted(date_keys.items(), key=lambda x: x[1]["iso"]):
        sevas_in_day = grouped_data.get(ddmmyy, {})
        day_bookings_count = 0
        day_additional_hastodaka = 0
        sevas_list = []

        for seva_code, reg_list in sevas_in_day.items():
            first_reg = reg_list[0]
            seva_obj = first_reg.seva
            seva_name = seva_obj.Description if seva_obj else (first_reg.Remarks or seva_code)
            seva_name_en = seva_obj.DescriptionEn if seva_obj else ""
            tp_qty = seva_obj.TPQty if seva_obj else 0

            seva_additional_hastodaka = 0
            bookings_list = []

            for r in reg_list:
                dev = r.devotee
                dev_name = dev.Name if dev else "Unknown Devotee"
                phone = dev.Phone if dev else ""
                gothra = dev.Gotra if dev else ""
                nakshatra = dev.Nakshatra if dev else ""
                extra_hastodaka = r.PrasadaCount or 0

                seva_additional_hastodaka += extra_hastodaka
                day_additional_hastodaka += extra_hastodaka
                total_additional_hastodaka += extra_hastodaka

                total_bookings += (r.Qty or 1)
                total_devotees += 1
                day_bookings_count += (r.Qty or 1)

                item: Dict[str, Any] = {
                    "registration_id": r.RegistrationId,
                    "voucher_no": r.VoucherNo or f"REG-{r.RegistrationId}",
                    "devotee_id": r.DevoteeId,
                    "devotee_name": dev_name,
                    "gothra": gothra or "—",
                    "nakshatra": nakshatra or "—",
                    "qty": r.Qty or 1,
                    "amount": r.Amount or 0.0,
                    "grand_total": r.GrandTotal or 0.0
                }

                if report_type == "on_demand_full":
                    item["phone"] = phone or "—"
                    item["additional_hastodaka"] = extra_hastodaka

                bookings_list.append(item)

            sevas_list.append({
                "seva_code": seva_code,
                "seva_name": seva_name,
                "seva_name_en": seva_name_en,
                "tp_qty_included": tp_qty,
                "total_bookings": len(reg_list),
                "total_additional_hastodaka": seva_additional_hastodaka,
                "bookings": bookings_list
            })

        # Sort sevas by name
        sevas_list.sort(key=lambda s: s["seva_name"])

        days_result.append({
            "ddmmyy": ddmmyy,
            "iso_date": meta["iso"],
            "formatted_date": meta["formatted"],
            "day_name": meta["day_name"],
            "day_kannada": meta["day_kannada"],
            "day_total_bookings": day_bookings_count,
            "day_total_additional_hastodaka": day_additional_hastodaka,
            "sevas_count": len(sevas_list),
            "sevas": sevas_list
        })

    return {
        "report_type": report_type,
        "date_type": date_type,
        "start_date": start_dt.strftime("%Y-%m-%d"),
        "end_date": end_dt.strftime("%Y-%m-%d"),
        "start_date_formatted": start_dt.strftime("%d/%m/%Y"),
        "end_date_formatted": end_dt.strftime("%d/%m/%Y"),
        "is_single_day": start_dt == end_dt,
        "total_bookings": total_bookings,
        "total_devotees": total_devotees,
        "total_additional_hastodaka": total_additional_hastodaka,
        "days": days_result
    }


@router.get("/hastodaka")
def get_hastodaka_report(
    start_date: str = Query(..., description="Start date in YYYY-MM-DD or DDMMYY"),
    end_date: Optional[str] = Query(None, description="End date in YYYY-MM-DD or DDMMYY"),
    db: Session = Depends(database.get_db),
):
    """
    Returns Hastodaka plate preparation count:
    - Included free count (Seva.TPQty * BookingQuantity)
    - Additional hastodaka count (PrasadaCount)
    - Total Hastodaka = Included + Additional
    - Grouped by Day and Seva.
    """
    start_iso = normalize_to_iso(start_date)
    end_iso = normalize_to_iso(end_date or start_date)

    try:
        start_dt = datetime.date.fromisoformat(start_iso)
        end_dt = datetime.date.fromisoformat(end_iso)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Expected YYYY-MM-DD or DDMMYY.")

    if start_dt > end_dt:
        start_dt, end_dt = end_dt, start_dt

    date_keys = {}
    curr = start_dt
    while curr <= end_dt:
        ddmmyy = curr.strftime("%d%m%y")
        date_keys[ddmmyy] = {
            "iso": curr.strftime("%Y-%m-%d"),
            "formatted": curr.strftime("%d/%m/%Y"),
            "day_name": curr.strftime("%A"),
            "day_kannada": get_kannada_day(curr.strftime("%A"))
        }
        curr += datetime.timedelta(days=1)

    registrations = (
        db.query(models.SevaRegistration)
        .options(
            joinedload(models.SevaRegistration.seva)
        )
        .filter(models.SevaRegistration.IsCancelled == False)
        .filter(models.SevaRegistration.SevaDate.in_(list(date_keys.keys())))
        .all()
    )

    # Group by SevaDate -> SevaCode
    grouped: Dict[str, Dict[str, List[Any]]] = defaultdict(lambda: defaultdict(list))
    for reg in registrations:
        date_val = reg.SevaDate or ""
        grouped[date_val][reg.SevaCode].append(reg)

    grand_total_bookings = 0
    grand_total_free_hastodaka = 0
    grand_total_additional_hastodaka = 0
    grand_total_hastodaka = 0

    days_result = []
    for ddmmyy, meta in sorted(date_keys.items(), key=lambda x: x[1]["iso"]):
        sevas_in_day = grouped.get(ddmmyy, {})
        day_bookings = 0
        day_free = 0
        day_additional = 0
        day_total = 0
        sevas_list = []

        for seva_code, reg_list in sevas_in_day.items():
            first_reg = reg_list[0]
            seva_obj = first_reg.seva
            seva_name = seva_obj.Description if seva_obj else (first_reg.Remarks or seva_code)
            seva_name_en = seva_obj.DescriptionEn if seva_obj else ""
            tp_qty = (seva_obj.TPQty if seva_obj and seva_obj.TPQty is not None else 0)

            booking_count = sum(r.Qty or 1 for r in reg_list)
            free_hastodaka = booking_count * tp_qty
            additional_hastodaka = sum(r.PrasadaCount or 0 for r in reg_list)
            total_seva_hastodaka = free_hastodaka + additional_hastodaka

            day_bookings += booking_count
            day_free += free_hastodaka
            day_additional += additional_hastodaka
            day_total += total_seva_hastodaka

            sevas_list.append({
                "seva_code": seva_code,
                "seva_name": seva_name,
                "seva_name_en": seva_name_en,
                "booking_count": booking_count,
                "tp_qty_per_booking": tp_qty,
                "free_hastodaka": free_hastodaka,
                "additional_hastodaka": additional_hastodaka,
                "total_hastodaka": total_seva_hastodaka
            })

        sevas_list.sort(key=lambda s: s["total_hastodaka"], reverse=True)

        grand_total_bookings += day_bookings
        grand_total_free_hastodaka += day_free
        grand_total_additional_hastodaka += day_additional
        grand_total_hastodaka += day_total

        days_result.append({
            "ddmmyy": ddmmyy,
            "iso_date": meta["iso"],
            "formatted_date": meta["formatted"],
            "day_name": meta["day_name"],
            "day_kannada": meta["day_kannada"],
            "day_bookings": day_bookings,
            "day_free_hastodaka": day_free,
            "day_additional_hastodaka": day_additional,
            "day_total_hastodaka": day_total,
            "sevas_count": len(sevas_list),
            "sevas": sevas_list
        })

    return {
        "start_date": start_dt.strftime("%Y-%m-%d"),
        "end_date": end_dt.strftime("%Y-%m-%d"),
        "start_date_formatted": start_dt.strftime("%d/%m/%Y"),
        "end_date_formatted": end_dt.strftime("%d/%m/%Y"),
        "is_single_day": start_dt == end_dt,
        "grand_total_bookings": grand_total_bookings,
        "grand_total_free_hastodaka": grand_total_free_hastodaka,
        "grand_total_additional_hastodaka": grand_total_additional_hastodaka,
        "grand_total_hastodaka": grand_total_hastodaka,
        "days": days_result
    }
