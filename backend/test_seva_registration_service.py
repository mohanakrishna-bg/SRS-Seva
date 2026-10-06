"""
Unit tests for SevaRegistrationService and JournalPostingGateway seam.
"""
import unittest
import datetime
from fastapi import HTTPException
from app import database
from app.models import models
from app.schemas import schemas
from app.modules.seva.journal_gateway import NoopJournalAdapter
from app.modules.seva.service import SevaRegistrationService


class TestSevaRegistrationService(unittest.TestCase):
    def setUp(self):
        self.db = next(database.get_db())

        # Ensure a test devotee exists
        self.devotee = self.db.query(models.Devotee).filter(models.Devotee.Phone == "9988776655").first()
        if not self.devotee:
            self.devotee = models.Devotee(
                Name="Seam Test Devotee",
                Phone="9988776655",
                Gotra="Kashyapa",
                Nakshatra="Ashwini",
            )
            self.db.add(self.devotee)
            self.db.commit()
            self.db.refresh(self.devotee)

        # Ensure a test seva exists
        self.seva = self.db.query(models.Seva).filter(models.Seva.SevaCode == "SV_SEAM_TEST").first()
        if not self.seva:
            self.seva = models.Seva(
                SevaCode="SV_SEAM_TEST",
                Description="ಸೀಮ್ ಪರೀಕ್ಷಾ ಸೇವೆ",
                Amount=250.0,
                TPQty=1,
            )
            self.db.add(self.seva)
            self.db.commit()
            self.db.refresh(self.seva)

    def test_registration_with_noop_gateway_succeeds(self):
        gateway = NoopJournalAdapter()
        service = SevaRegistrationService(journal_gateway=gateway)

        today_str = datetime.date.today().strftime("%d%m%y")
        tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime("%d%m%y")

        reg_data = schemas.SevaRegistrationCreate(
            DevoteeId=self.devotee.DevoteeId,
            SevaCode=self.seva.SevaCode,
            RegistrationDate=today_str,
            SevaDate=tomorrow_str,
            Qty=1,
            Amount=250.0,
            GrandTotal=250.0,
            PaymentMode="Cash",
            VoucherNo="VCH-SEAM-001",
        )

        db_reg = service.register_seva(self.db, reg_data)

        self.assertIsNotNone(db_reg.RegistrationId)
        self.assertEqual(db_reg.DevoteeId, self.devotee.DevoteeId)
        self.assertEqual(db_reg.SevaCode, "SV_SEAM_TEST")
        # Verify journal gateway was invoked without accounting ledger coupling
        self.assertEqual(len(gateway.posted_registrations), 1)
        self.assertEqual(gateway.posted_registrations[0].RegistrationId, db_reg.RegistrationId)

    def test_registration_blocked_when_date_is_locked(self):
        gateway = NoopJournalAdapter(should_lock=True)
        service = SevaRegistrationService(journal_gateway=gateway)

        reg_data = schemas.SevaRegistrationCreate(
            DevoteeId=self.devotee.DevoteeId,
            SevaCode=self.seva.SevaCode,
            RegistrationDate="010126",
            SevaDate="020126",
            Qty=1,
            Amount=250.0,
            GrandTotal=250.0,
            PaymentMode="Cash",
            VoucherNo="VCH-LOCKED-001",
        )

        with self.assertRaises(HTTPException) as ctx:
            service.register_seva(self.db, reg_data)

        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("locked", ctx.exception.detail)
        self.assertEqual(len(gateway.posted_registrations), 0)


if __name__ == "__main__":
    unittest.main()
