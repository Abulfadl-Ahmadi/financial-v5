from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserRole
from apps.cutting.models import Cut, Sizes
from apps.sewing.models import SewingJob, SewingStatus
from decimal import Decimal

User = get_user_model()

class SewingTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="sew_owner")
        self.sewer = User.objects.create_user(username="sewer_pro", role=UserRole.SEWING_SUPERVISOR)
        self.cut = Cut.objects.create(
            cut_code="CUT-SEW-001",
            model_name="کت زنانه",
            model_code="COAT-10",
            size=Sizes.FREE,
            owner=self.owner,
            cutting_price=Decimal("30000"),
            sewing_price=Decimal("70000"),
            cutting_price_raw=Decimal("50000"),
            sewing_price_raw=Decimal("100000")
        )
        self.job = SewingJob.objects.create(
            job_code="SEW-JOB-TEST-1",
            cut=self.cut,
            sewer=self.sewer,
            assigned_pieces=100,
            completed_pieces=80,
            unit_sewing_price=Decimal("70000"),
            status=SewingStatus.IN_PROGRESS
        )

    def test_sewing_payable_calculation(self):
        """Test total payable amount for completed sewing pieces."""
        # 80 pieces * 70,000 تومان = 5,600,000 تومان
        self.assertEqual(self.job.total_payable_amount, 5600000.0)

    def test_update_sewing_progress_api(self):
        """Test PATCH progress API endpoint."""
        payload = {
            "completed_pieces": 100,
            "rejected_pieces": 1,
            "status": "COMPLETED"
        }
        response = self.client.patch(
            f"/api/sewing/jobs/{self.job.id}/progress",
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["completed_pieces"], 100)
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["total_payable_amount"], 7000000.0)
