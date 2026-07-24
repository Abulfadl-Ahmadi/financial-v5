from django.test import TestCase
from apps.financial.models import Account, Receipt, ReceiptType, ReceiptStatus
from decimal import Decimal

class FinancialTestCase(TestCase):
    def setUp(self):
        self.acc1 = Account.objects.create(
            f_name="مریم",
            l_name="احمدی",
            card_number="6037997112345678"
        )
        self.acc2 = Account.objects.create(
            f_name="رضا",
            l_name="مرادی",
            card_number="6104331122334455"
        )

    def test_bin_bank_detection(self):
        """Test BIN card auto-detection of bank names."""
        self.assertEqual(self.acc1.bank_name, "بانک ملی ایران")
        self.assertEqual(self.acc2.bank_name, "بانک ملت")
        self.assertEqual(self.acc1.formatted_card_number, "6037-9971-1234-5678")

    def test_create_receipt_api(self):
        """Test Receipt creation via Ninja API endpoint."""
        payload = {
            "tracking_code": "TRX-TEST-999",
            "date_jalali": "1405/05/03",
            "from_account_id": self.acc2.id,
            "to_account_id": self.acc1.id,
            "amount": "5000000",
            "receipt_type": "SEWING_PAYROLL",
            "notes": "تسویه حساب فاز ۱"
        }
        response = self.client.post("/api/financial/receipts", data=payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["tracking_code"], "TRX-TEST-999")
        self.assertEqual(data["from_account"]["bank_name"], "بانک ملت")
        self.assertEqual(data["to_account"]["bank_name"], "بانک ملی ایران")
