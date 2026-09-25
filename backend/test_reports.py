"""
Direct unit tests for Seva Reports module functions.
"""
import unittest
import datetime
from app import database
from app.models import models
from app.modules.seva.reports import get_seva_bookings_report, get_hastodaka_report

class TestSevaReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = next(database.get_db())
        
        # Test Devotee
        cls.devotee = cls.db.query(models.Devotee).filter(models.Devotee.Phone == "9876543210").first()
        if not cls.devotee:
            cls.devotee = models.Devotee(
                Name="ಭಕ್ತ ರಾಮಚಂದ್ರ (Test Devotee)",
                Phone="9876543210",
                Gotra="ಕೌಶಿಕ (Koushika)",
                Nakshatra="ರೋಹಿಣಿ (Rohini)"
            )
            cls.db.add(cls.devotee)
            cls.db.commit()
            cls.db.refresh(cls.devotee)

        # Test Seva
        cls.seva = cls.db.query(models.Seva).filter(models.Seva.SevaCode == "SV_TEST_REP").first()
        if not cls.seva:
            cls.seva = models.Seva(
                SevaCode="SV_TEST_REP",
                Description="ವಿಶೇಷ ಪಂಚಾಮೃತ ಅಭಿಷೇಕ",
                DescriptionEn="Special Panchamrutha Abhisheka",
                Amount=500.0,
                TPQty=2,
                PrasadaAddonLimit=0
            )
            cls.db.add(cls.seva)
            cls.db.commit()
            cls.db.refresh(cls.seva)

        # Test date in DDMMYY format
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        cls.test_date_iso = tomorrow.strftime("%Y-%m-%d")
        cls.test_date_ddmmyy = tomorrow.strftime("%d%m%y")

        # Test registration
        cls.reg = models.SevaRegistration(
            DevoteeId=cls.devotee.DevoteeId,
            SevaCode=cls.seva.SevaCode,
            RegistrationDate=datetime.date.today().strftime("%d%m%y"),
            SevaDate=cls.test_date_ddmmyy,
            Qty=2,
            Amount=500.0,
            PrasadaCount=3,  # 3 additional hastodakas
            GrandTotal=1000.0,
            PaymentMode="Cash",
            VoucherNo="VCH-REP-TEST-001",
            IsCancelled=False
        )
        cls.db.add(cls.reg)
        cls.db.commit()
        cls.db.refresh(cls.reg)

    @classmethod
    def tearDownClass(cls):
        if hasattr(cls, 'reg') and cls.reg:
            cls.db.query(models.SevaRegistration).filter(
                models.SevaRegistration.RegistrationId == cls.reg.RegistrationId
            ).delete()
        if hasattr(cls, 'seva') and cls.seva:
            cls.db.query(models.Seva).filter(models.Seva.SevaCode == "SV_TEST_REP").delete()
        cls.db.commit()
        cls.db.close()

    def test_daily_priest_report(self):
        """Test priest sankalpa report for tomorrow."""
        data = get_seva_bookings_report(
            start_date=self.test_date_iso,
            end_date=self.test_date_iso,
            report_type="daily_priest",
            date_type="SevaDate",
            db=self.db
        )
        self.assertEqual(data["report_type"], "daily_priest")
        self.assertGreaterEqual(data["total_bookings"], 2)
        
        day = data["days"][0]
        self.assertEqual(day["ddmmyy"], self.test_date_ddmmyy)
        
        found_seva = next((s for s in day["sevas"] if s["seva_code"] == "SV_TEST_REP"), None)
        self.assertIsNotNone(found_seva, "Test seva not found in priest report")
        self.assertGreaterEqual(found_seva["total_bookings"], 1)

        booking = found_seva["bookings"][0]
        self.assertEqual(booking["devotee_name"], "ಭಕ್ತ ರಾಮಚಂದ್ರ (Test Devotee)")
        self.assertEqual(booking["gothra"], "ಕೌಶಿಕ (Koushika)")
        self.assertEqual(booking["nakshatra"], "ರೋಹಿಣಿ (Rohini)")
        self.assertNotIn("phone", booking, "Phone should not be in priest report")

    def test_on_demand_full_report(self):
        """Test full on-demand report with phone and extra hastodaka."""
        data = get_seva_bookings_report(
            start_date=self.test_date_iso,
            end_date=self.test_date_iso,
            report_type="on_demand_full",
            date_type="SevaDate",
            db=self.db
        )
        self.assertEqual(data["report_type"], "on_demand_full")
        self.assertGreaterEqual(data["total_additional_hastodaka"], 3)

        day = data["days"][0]
        found_seva = next((s for s in day["sevas"] if s["seva_code"] == "SV_TEST_REP"), None)
        self.assertIsNotNone(found_seva)

        booking = found_seva["bookings"][0]
        self.assertEqual(booking["phone"], "9876543210")
        self.assertEqual(booking["additional_hastodaka"], 3)

    def test_kitchen_hastodaka_report(self):
        """Test kitchen hastodaka plate count computation: Free + Additional = Total."""
        data = get_hastodaka_report(
            start_date=self.test_date_iso,
            end_date=self.test_date_iso,
            db=self.db
        )
        self.assertTrue(data["is_single_day"])

        day = data["days"][0]
        found_seva = next((s for s in day["sevas"] if s["seva_code"] == "SV_TEST_REP"), None)
        self.assertIsNotNone(found_seva)

        # Qty = 2, TPQty = 2 => Free = 4
        # Additional = 3 => Total = 7
        self.assertEqual(found_seva["booking_count"], 2)
        self.assertEqual(found_seva["tp_qty_per_booking"], 2)
        self.assertEqual(found_seva["free_hastodaka"], 4)
        self.assertEqual(found_seva["additional_hastodaka"], 3)
        self.assertEqual(found_seva["total_hastodaka"], 7)

if __name__ == "__main__":
    unittest.main()
