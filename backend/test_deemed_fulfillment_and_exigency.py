"""
Unit and integration tests for Deemed Fulfillment, Exigency Exception Workflow,
and Operations Dispatch 7:30 PM Cutoff.
"""
import unittest
import datetime
from fastapi import HTTPException
from app import database
from app.models import models
from app.schemas import schemas
from app.modules.seva.service import sweep_deemed_fulfillment, log_exigency_cancellation
from app.modules.seva.reports import get_exigency_exceptions_report, get_seva_bookings_report


class TestDeemedFulfillmentAndExigency(unittest.TestCase):
    def setUp(self):
        self.db = next(database.get_db())

        # Ensure a test devotee exists
        self.devotee = self.db.query(models.Devotee).filter(models.Devotee.Phone == "9911223344").first()
        if not self.devotee:
            self.devotee = models.Devotee(
                Name="Deemed Test Devotee",
                Phone="9911223344",
                Gotra="Bharadwaja",
                Nakshatra="Rohini",
            )
            self.db.add(self.devotee)
            self.db.commit()
            self.db.refresh(self.devotee)

        # Ensure a test seva exists
        self.seva = self.db.query(models.Seva).filter(models.Seva.SevaCode == "SV_DEEMED_TEST").first()
        if not self.seva:
            self.seva = models.Seva(
                SevaCode="SV_DEEMED_TEST",
                Description="ಪರೀಕ್ಷಾರ್ಥ ಸೇವೆ",
                Amount=100.0,
                TPQty=1,
            )
            self.db.add(self.seva)
            self.db.commit()
            self.db.refresh(self.seva)

    def test_sweep_deemed_fulfillment(self):
        # Create a past registration (yesterday)
        yesterday_dt = datetime.date.today() - datetime.timedelta(days=1)
        yesterday_str = yesterday_dt.strftime("%d%m%y")

        reg = models.SevaRegistration(
            DevoteeId=self.devotee.DevoteeId,
            SevaCode=self.seva.SevaCode,
            RegistrationDate=yesterday_str,
            SevaDate=yesterday_str,
            Qty=1,
            Amount=100.0,
            GrandTotal=100.0,
            PaymentMode="Cash",
            VoucherNo=f"VCH-DEEMED-{Date_now_id()}",
            IsFulfilled=False,
            IsCancelled=False,
            IsExigencyCancelled=False,
        )
        self.db.add(reg)
        self.db.commit()
        self.db.refresh(reg)

        # Run sweep
        swept_count = sweep_deemed_fulfillment(self.db)
        self.assertGreaterEqual(swept_count, 1)

        # Verify registration is now deemed fulfilled
        self.db.refresh(reg)
        self.assertTrue(reg.IsFulfilled)
        self.assertIsNotNone(reg.DeemedFulfilledAt)

    def test_log_exigency_cancellation(self):
        today_str = datetime.date.today().strftime("%d%m%y")
        reg = models.SevaRegistration(
            DevoteeId=self.devotee.DevoteeId,
            SevaCode=self.seva.SevaCode,
            RegistrationDate=today_str,
            SevaDate=today_str,
            Qty=1,
            Amount=100.0,
            GrandTotal=100.0,
            PaymentMode="Cash",
            VoucherNo=f"VCH-EXIGENCY-{Date_now_id()}",
            IsFulfilled=False,
            IsCancelled=False,
            IsExigencyCancelled=False,
        )
        self.db.add(reg)
        self.db.commit()
        self.db.refresh(reg)

        # Test empty reason validation failure
        with self.assertRaises(HTTPException) as ctx:
            log_exigency_cancellation(
                self.db,
                reg.RegistrationId,
                reason="   ",
                staff_name="Staff A",
                action="reschedule"
            )
        self.assertEqual(ctx.exception.status_code, 400)

        # Test successful exigency logging
        updated = log_exigency_cancellation(
            self.db,
            reg.RegistrationId,
            reason="Heavy unseasonal rain flooded the temple courtyard",
            staff_name="Senior Clerk",
            action="reschedule"
        )
        self.assertTrue(updated.IsExigencyCancelled)
        self.assertFalse(updated.IsFulfilled)
        self.assertEqual(updated.ExigencyReason, "Heavy unseasonal rain flooded the temple courtyard")
        self.assertEqual(updated.ExigencyStaffName, "Senior Clerk")
        self.assertEqual(updated.ExigencyAction, "reschedule")

        # Test appearance in Exigency Exceptions report
        today_iso = datetime.date.today().strftime("%Y-%m-%d")
        report = get_exigency_exceptions_report(start_date=today_iso, end_date=today_iso, db=self.db)
        self.assertGreaterEqual(report["total_exceptions"], 1)
        item_ids = [it["registration_id"] for it in report["items"]]
        self.assertIn(reg.RegistrationId, item_ids)

    def test_late_addition_flag(self):
        # Next-day seva booked today at 20:00 (past 19:30 cutoff)
        tomorrow_dt = datetime.date.today() + datetime.timedelta(days=1)
        tomorrow_str = tomorrow_dt.strftime("%d%m%y")
        tomorrow_iso = tomorrow_dt.strftime("%Y-%m-%d")

        reg_late = models.SevaRegistration(
            DevoteeId=self.devotee.DevoteeId,
            SevaCode=self.seva.SevaCode,
            RegistrationDate=datetime.date.today().strftime("%d%m%y"),
            SevaDate=tomorrow_str,
            Qty=1,
            Amount=100.0,
            GrandTotal=100.0,
            PaymentMode="Cash",
            VoucherNo=f"VCH-LATE-{Date_now_id()}",
            CreatedAt=datetime.datetime.combine(datetime.date.today(), datetime.time(20, 0)),
            IsFulfilled=False,
            IsCancelled=False,
            IsExigencyCancelled=False,
        )
        self.db.add(reg_late)
        self.db.commit()

        # Query priest report for tomorrow
        report = get_seva_bookings_report(
            start_date=tomorrow_iso,
            end_date=tomorrow_iso,
            report_type="daily_priest",
            date_type="SevaDate",
            db=self.db
        )

        found_booking = None
        for day in report.get("days", []):
            for seva in day.get("sevas", []):
                for b in seva.get("bookings", []):
                    if b.get("registration_id") == reg_late.RegistrationId:
                        found_booking = b
                        break

        self.assertIsNotNone(found_booking)
        self.assertTrue(found_booking.get("is_late_addition"))


def Date_now_id():
    import time
    return int(time.time() * 1000) % 1000000


if __name__ == "__main__":
    unittest.main()
