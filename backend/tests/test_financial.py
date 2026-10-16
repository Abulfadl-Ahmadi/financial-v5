from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
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
        manager = get_user_model().objects.create_user(username='financial-manager', password='test-password', role=UserRole.ACCOUNTANT)
        token = str(RefreshToken.for_user(manager).access_token)
        self.auth = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

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
        response = self.client.post("/api/financial/receipts", data=payload, content_type="application/json", **self.auth)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["tracking_code"], "TRX-TEST-999")
        self.assertEqual(data["from_account"]["bank_name"], "بانک ملت")
        self.assertEqual(data["to_account"]["bank_name"], "بانک ملی ایران")

    def test_profitability_summary_excludes_outgoing_and_rejected_receipts(self):
        """Test Issue #6: Outgoing payroll and rejected receipts are not counted as workshop revenue."""
        # Clean any existing receipts
        Receipt.objects.all().delete()

        # 1. Create an outgoing sewing payroll receipt (10,000,000 Toman)
        Receipt.objects.create(
            tracking_code="TRX-PAYROLL-01",
            date_jalali="1405/01/01",
            from_account=self.acc2,
            to_account=self.acc1,
            amount=Decimal("10000000"),
            receipt_type=ReceiptType.SEWING_PAYROLL,
            status=ReceiptStatus.VERIFIED
        )

        # 2. Create a REJECTED receipt (20,000,000 Toman)
        Receipt.objects.create(
            tracking_code="TRX-REJECTED-02",
            date_jalali="1405/01/02",
            from_account=self.acc1,
            to_account=self.acc2,
            amount=Decimal("20000000"),
            receipt_type=ReceiptType.PRODUCER_PAYMENT,
            status=ReceiptStatus.REJECTED
        )

        # Query summary -> totalRevenue must be 0
        res = self.client.get("/api/financial/profitability-summary", **self.auth)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["totalRevenue"], 0.0)

        # 3. Add a valid VERIFIED producer payment receipt (15,000,000 Toman)
        Receipt.objects.create(
            tracking_code="TRX-PRODUCER-03",
            date_jalali="1405/01/03",
            from_account=self.acc1,
            to_account=self.acc2,
            amount=Decimal("15000000"),
            receipt_type=ReceiptType.PRODUCER_PAYMENT,
            status=ReceiptStatus.VERIFIED
        )

        res2 = self.client.get("/api/financial/profitability-summary", **self.auth)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["totalRevenue"], 15000000.0)
