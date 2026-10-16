from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserRole
from apps.cutting.models import Cut, Sizes
from apps.sewing.models import SewingJob, SewingStatus
from decimal import Decimal
from ninja_jwt.tokens import RefreshToken

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
            sewing_price_raw=Decimal("100000"),
            lai_per_unit=50,
            product_per_layer=2
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
        """Test PATCH progress API endpoint with auth and RBAC."""
        payload = {
            "completed_pieces": 98,
            "rejected_pieces": 2,
            "status": "COMPLETED"
        }

        # Unauthenticated rejected with 401
        anon_res = self.client.patch(
            f"/api/sewing/jobs/{self.job.id}/progress",
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(anon_res.status_code, 401)

        # Other unrelated worker rejected with 403
        other_worker = User.objects.create_user(username="other_tailor", role=UserRole.WORKER)
        other_token = str(RefreshToken.for_user(other_worker).access_token)
        forbidden_res = self.client.patch(
            f"/api/sewing/jobs/{self.job.id}/progress",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {other_token}"
        )
        self.assertEqual(forbidden_res.status_code, 403)

        # Assigned supervisor / sewer succeeds with 200
        sewer_token = str(RefreshToken.for_user(self.sewer).access_token)
        response = self.client.patch(
            f"/api/sewing/jobs/{self.job.id}/progress",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {sewer_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["completed_pieces"], 98)
        self.assertEqual(data["rejected_pieces"], 2)
        self.assertEqual(data["status"], "COMPLETED")
        self.assertEqual(data["total_payable_amount"], 6860000.0)

    def test_sewing_job_capacity_and_completion_limits(self):
        """Test Issue #5: Enforce assigned_pieces <= remaining cut capacity and completed+rejected <= assigned."""
        sewer_token = str(RefreshToken.for_user(self.sewer).access_token)

        # self.cut has total_products = 50 * 2 = 100, and self.job already took 100.
        # 1. Attempting to create another job exceeding remaining capacity fails with 400
        overflow_payload = {
            "job_code": "SEW-OVERFLOW-JOB",
            "cut_code": self.cut.cut_code,
            "sewer_id": self.sewer.id,
            "assigned_pieces": 10,
            "unit_sewing_price": 50000
        }
        res_overflow = self.client.post(
            "/api/sewing/jobs",
            data=overflow_payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {sewer_token}"
        )
        self.assertEqual(res_overflow.status_code, 400)
        self.assertIn("ظرفیت", res_overflow.json().get("detail", ""))

        # 2. Attempting to PATCH progress with completed + rejected > assigned_pieces fails with 400
        invalid_progress_payload = {
            "completed_pieces": 95,
            "rejected_pieces": 10, # 95 + 10 = 105 > 100
            "status": "COMPLETED"
        }
        res_invalid_progress = self.client.patch(
            f"/api/sewing/jobs/{self.job.id}/progress",
            data=invalid_progress_payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {sewer_token}"
        )
        self.assertEqual(res_invalid_progress.status_code, 400)
        self.assertIn("نمی‌تواند از تعداد کل قطعات تحویلی", res_invalid_progress.json().get("detail", ""))
