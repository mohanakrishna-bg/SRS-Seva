"""
Unit tests for Matha operational role taxonomy, aliases, and capability helpers.
"""
import unittest
from unittest.mock import MagicMock
from app.core import auth
from app.models import models

class TestRoleTaxonomyAndCapabilities(unittest.TestCase):
    def test_role_normalization_and_aliases(self):
        self.assertEqual(auth.normalize_role("clerk"), "cashier")
        self.assertEqual(auth.normalize_role("CLERK"), "cashier")
        self.assertEqual(auth.normalize_role("viewer"), "trustee")
        self.assertEqual(auth.normalize_role("VIEWER"), "trustee")
        self.assertEqual(auth.normalize_role("admin"), "admin")
        self.assertEqual(auth.normalize_role("cashier"), "cashier")
        self.assertEqual(auth.normalize_role("trustee"), "trustee")

    def test_can_cancel_receipts(self):
        admin_user = models.User(username="admin_user", role="admin")
        cashier_user = models.User(username="cashier_user", role="cashier")
        legacy_clerk = models.User(username="clerk_user", role="clerk")
        trustee_user = models.User(username="trustee_user", role="trustee")

        self.assertTrue(auth.can_cancel_receipts(admin_user))
        self.assertFalse(auth.can_cancel_receipts(cashier_user))
        self.assertFalse(auth.can_cancel_receipts(legacy_clerk))
        self.assertFalse(auth.can_cancel_receipts(trustee_user))
        self.assertFalse(auth.can_cancel_receipts(None))

    def test_can_export_financial_reports(self):
        admin_user = models.User(username="admin_user", role="admin")
        trustee_user = models.User(username="trustee_user", role="trustee")
        legacy_viewer = models.User(username="viewer_user", role="viewer")
        cashier_user = models.User(username="cashier_user", role="cashier")

        self.assertTrue(auth.can_export_financial_reports(admin_user))
        self.assertTrue(auth.can_export_financial_reports(trustee_user))
        self.assertTrue(auth.can_export_financial_reports(legacy_viewer))
        self.assertFalse(auth.can_export_financial_reports(cashier_user))

    def test_can_view_devotee_pii(self):
        admin_user = models.User(username="admin_user", role="admin")
        cashier_user = models.User(username="cashier_user", role="cashier")
        legacy_clerk = models.User(username="clerk_user", role="clerk")
        trustee_user = models.User(username="trustee_user", role="trustee")

        self.assertTrue(auth.can_view_devotee_pii(admin_user))
        self.assertTrue(auth.can_view_devotee_pii(cashier_user))
        self.assertTrue(auth.can_view_devotee_pii(legacy_clerk))
        self.assertFalse(auth.can_view_devotee_pii(trustee_user))

if __name__ == "__main__":
    unittest.main()
