from django.test import TestCase
from django.contrib.auth import get_user_model
from django.db.models import ProtectedError
from ninja_jwt.tokens import RefreshToken
from decimal import Decimal
from apps.users.models import UserRole
from apps.cutting.models import Cut, Sizes, CutStatus
from apps.sewing.models import SewingJob, SewingStatus

User = get_user_model()

class UsersModelAndApiTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner_user",
            password="password123",
            first_name="مدیر",
            last_name="مجموعه",
            role=UserRole.OWNER,
            phone_number="09121111111"
        )
        self.cutter = User.objects.create_user(
            username="cutter_user",
            password="password123",
            first_name="رضا",
            last_name="مرادی",
            role=UserRole.CUTTING_SUPERVISOR,
            phone_number="09122222222"
        )

    def test_user_creation_and_roles(self):
        """Test User model creation and role assignment."""
        self.assertEqual(self.owner.role, UserRole.OWNER)
        self.assertEqual(self.cutter.role, UserRole.CUTTING_SUPERVISOR)
        self.assertIn("مدیر مجموعه", str(self.owner))
        self.assertIn("رضا مرادی", str(self.cutter))

    def test_user_login_api(self):
        """Test login Ninja API endpoint."""
        response = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "password123"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)
        self.assertEqual(data["user"]["role"], UserRole.OWNER)

    def test_invalid_login(self):
        """Test login with wrong password."""
        response = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "wrongpassword"},
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 401)

    def test_jwt_auth_get_current_user(self):
        """Test login token successfully authenticates GET /users/me."""
        login_res = self.client.post(
            "/api/users/login",
            data={"username": "owner_user", "password": "password123"},
            content_type="application/json"
        )
        token = login_res.json()["access"]

        # Valid Bearer token succeeds
        me_res = self.client.get("/api/users/me", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["username"], "owner_user")

        # Anonymous request is rejected with 401
        anon_res = self.client.get("/api/users/me")
        self.assertEqual(anon_res.status_code, 401)

        # Invalid token is rejected with 401
        invalid_res = self.client.get("/api/users/me", HTTP_AUTHORIZATION="Bearer invalid-token")
        self.assertEqual(invalid_res.status_code, 401)

    def test_delete_user_soft_deletes_and_preserves_records(self):
        """Test Issue #2: Soft deletion preserves cuts, sewing jobs, and wage records, while hard-delete is protected."""
        sewer = User.objects.create_user(
            username="sewer_protect_test",
            password="password123",
            first_name="علی",
            last_name="خیاطی",
            role=UserRole.WORKER,
            phone_number="09123333333"
        )
        cut = Cut.objects.create(
            cut_code="CUT-PROTECT-01",
            model_name="پیراهن کارگاهی",
            model_code="PIR-01",
            size=Sizes.FREE,
            owner=self.owner,
            cutter=self.cutter,
            lai_per_unit=10,
            product_per_layer=2,
            length_of_layers=Decimal("2.50"),
            cutting_price=Decimal("15000"),
            sewing_price=Decimal("35000"),
            cutting_price_raw=Decimal("20000"),
            sewing_price_raw=Decimal("45000"),
            status=CutStatus.IN_PROGRESS
        )
        job = SewingJob.objects.create(
            job_code="JOB-PROTECT-01",
            cut=cut,
            sewer=sewer,
            assigned_pieces=20,
            completed_pieces=20,
            unit_sewing_price=Decimal("35000"),
            status=SewingStatus.COMPLETED
        )

        owner_token = str(RefreshToken.for_user(self.owner).access_token)
        cutter_token = str(RefreshToken.for_user(self.cutter).access_token)

        # Anonymous cannot delete user (401)
        anon_res = self.client.delete(f"/api/users/{sewer.id}")
        self.assertEqual(anon_res.status_code, 401)

        # Non-owner cannot delete user (403)
        cutter_res = self.client.delete(
            f"/api/users/{sewer.id}",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(cutter_res.status_code, 403)

        # Owner soft-deletes user: archived flag returned, is_active=False
        owner_res = self.client.delete(
            f"/api/users/{sewer.id}",
            HTTP_AUTHORIZATION=f"Bearer {owner_token}"
        )
        self.assertEqual(owner_res.status_code, 200)
        self.assertEqual(owner_res.json(), {"success": True, "archived": True})

        sewer.refresh_from_db()
        self.assertFalse(sewer.is_active)

        # Records are NOT cascaded or lost
        self.assertTrue(Cut.objects.filter(pk=cut.pk).exists())
        self.assertTrue(SewingJob.objects.filter(id=job.id).exists())
        self.assertEqual(job.total_payable_amount, 700000.0)

        # Direct hard deletion via ORM is blocked by ProtectedError
        with self.assertRaises(ProtectedError):
            sewer.delete()

        # Hard deleting cut owner also raises ProtectedError
        with self.assertRaises(ProtectedError):
            self.owner.delete()

    def test_bulk_toggle_and_delete_users(self):
        """Test Issue #10: Real backend mutations for user bulk toggle-active and bulk soft delete."""
        u1 = User.objects.create_user(username="bulk_u1", role=UserRole.WORKER)
        u2 = User.objects.create_user(username="bulk_u2", role=UserRole.WORKER)
        owner_token = str(RefreshToken.for_user(self.owner).access_token)
        owner_auth = {"HTTP_AUTHORIZATION": f"Bearer {owner_token}"}

        # 1. Bulk toggle active (deactivate)
        toggle_res = self.client.post(
            "/api/users/bulk-toggle-active",
            data={"ids": [u1.id, u2.id]},
            content_type="application/json",
            **owner_auth
        )
        self.assertEqual(toggle_res.status_code, 200)
        u1.refresh_from_db()
        u2.refresh_from_db()
        self.assertFalse(u1.is_active)
        self.assertFalse(u2.is_active)

        # 2. Bulk delete (soft-delete)
        u1.is_active = True
        u1.save()
        del_res = self.client.post(
            "/api/users/bulk-delete",
            data={"ids": [u1.id, u2.id]},
            content_type="application/json",
            **owner_auth
        )
        self.assertEqual(del_res.status_code, 200)
        u1.refresh_from_db()
        u2.refresh_from_db()
        self.assertFalse(u1.is_active)
        self.assertFalse(u2.is_active)


