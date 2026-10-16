from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole

User = get_user_model()


class GlobalSecurityAndRBACTestCase(TestCase):
    """Regression test suite for Issue #1: Global JWT protection and RBAC guards."""

    def setUp(self):
        self.owner = User.objects.create_user(
            username="sec_owner", password="password123", role=UserRole.OWNER
        )
        self.accountant = User.objects.create_user(
            username="sec_accountant", password="password123", role=UserRole.ACCOUNTANT
        )
        self.cutter = User.objects.create_user(
            username="sec_cutter", password="password123", role=UserRole.CUTTING_SUPERVISOR
        )
        self.sewer = User.objects.create_user(
            username="sec_sewer", password="password123", role=UserRole.WORKER
        )

        self.owner_token = str(RefreshToken.for_user(self.owner).access_token)
        self.accountant_token = str(RefreshToken.for_user(self.accountant).access_token)
        self.cutter_token = str(RefreshToken.for_user(self.cutter).access_token)
        self.sewer_token = str(RefreshToken.for_user(self.sewer).access_token)

    def test_anonymous_requests_are_rejected_with_401(self):
        """All managerial and financial routes reject unauthenticated requests."""
        endpoints = [
            "/api/users/",
            "/api/users/me",
            "/api/users/parties",
            "/api/financial/receipts",
            "/api/financial/expenses",
            "/api/financial/accounts",
            "/api/cutting/cuts",
            "/api/sewing/jobs",
            "/api/sewing/contract-orders",
            "/api/sewing/tailors/payroll-summary",
            "/api/inventory/rolls",
            "/api/inventory/fabric-types",
            "/api/inventory/machinery",
        ]
        for url in endpoints:
            with self.subTest(url=url):
                res = self.client.get(url)
                self.assertEqual(
                    res.status_code,
                    401,
                    f"Expected 401 for anonymous access to {url}, got {res.status_code}",
                )

    def test_public_login_routes_accessible_without_token(self):
        """Public auth endpoints are accessible without a JWT token."""
        # /api/users/login with bad credentials returns 401 Invalid username/password, not JWT missing
        res = self.client.post(
            "/api/users/login",
            data={"username": "nonexistent", "password": "bad"},
            content_type="application/json",
        )
        self.assertEqual(res.status_code, 401)
        self.assertIn("Invalid username or password", str(res.json()))

        # Portal client login
        res_portal = self.client.post(
            "/api/users/portal/client/login",
            data={"username": "nonexistent", "password": "bad"},
            content_type="application/json",
        )
        self.assertEqual(res_portal.status_code, 401)
        self.assertIn("Invalid credentials", str(res_portal.json()))

    def test_privilege_escalation_prevention(self):
        """Workers and supervisors cannot access unauthorized modules (403 Forbidden)."""
        # Worker cannot read user list or financial receipts
        worker_auth = {"HTTP_AUTHORIZATION": f"Bearer {self.sewer_token}"}
        res_users = self.client.get("/api/users/", **worker_auth)
        self.assertEqual(res_users.status_code, 403)

        res_receipts = self.client.get("/api/financial/receipts", **worker_auth)
        self.assertEqual(res_receipts.status_code, 403)

        res_cuts = self.client.get("/api/cutting/cuts", **worker_auth)
        self.assertEqual(res_cuts.status_code, 403)

        # Cutting supervisor can access cuts, but not financial or user administration
        cutter_auth = {"HTTP_AUTHORIZATION": f"Bearer {self.cutter_token}"}
        res_cutter_cuts = self.client.get("/api/cutting/cuts", **cutter_auth)
        self.assertEqual(res_cutter_cuts.status_code, 200)

        res_cutter_fin = self.client.get("/api/financial/receipts", **cutter_auth)
        self.assertEqual(res_cutter_fin.status_code, 403)

        res_cutter_users = self.client.get("/api/users/", **cutter_auth)
        self.assertEqual(res_cutter_users.status_code, 403)

        # Accountant can access financial, but cannot delete users (requires owner)
        acc_auth = {"HTTP_AUTHORIZATION": f"Bearer {self.accountant_token}"}
        res_acc_fin = self.client.get("/api/financial/receipts", **acc_auth)
        self.assertEqual(res_acc_fin.status_code, 200)

        res_acc_del = self.client.delete(f"/api/users/{self.sewer.id}", **acc_auth)
        self.assertEqual(res_acc_del.status_code, 403)

        # Owner has full administrative authority
        owner_auth = {"HTTP_AUTHORIZATION": f"Bearer {self.owner_token}"}
        res_owner_users = self.client.get("/api/users/", **owner_auth)
        self.assertEqual(res_owner_users.status_code, 200)
