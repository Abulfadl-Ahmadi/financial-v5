from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
from apps.inventory.models import FabricType, ClothRoll, RollStatus
from decimal import Decimal

User = get_user_model()

class InventoryTestCase(TestCase):
    def setUp(self):
        self.fabric = FabricType.objects.create(name="نخ پنبه")
        self.roll = ClothRoll.objects.create(
            roll_code="ROLL-TEST-01",
            fabric_type=self.fabric,
            color="مشکی",
            shade="SH-01",
            length_meters=Decimal("150.50"),
            status=RollStatus.IN_STOCK,
            supplier_name="نساجی اصفهان"
        )
        self.manager = User.objects.create_user(
            username="wh_manager_test",
            password="password123",
            role=UserRole.WAREHOUSE_MANAGER
        )
        self.token = str(RefreshToken.for_user(self.manager).access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

    def test_roll_creation(self):
        """Test FabricType and ClothRoll models."""
        self.assertEqual(self.roll.status, RollStatus.IN_STOCK)
        self.assertEqual(self.roll.length_meters, Decimal("150.50"))
        self.assertIn("ROLL-TEST-01", str(self.roll))

    def test_list_rolls_api_and_rbac(self):
        """Test list rolls Ninja API endpoint with authentication and RBAC."""
        # Authorized warehouse manager gets 200
        response = self.client.get("/api/inventory/rolls")
        self.assertEqual(response.status_code, 200)
        rolls_list = response.json()
        self.assertGreaterEqual(len(rolls_list), 1)
        self.assertEqual(rolls_list[0]["roll_code"], "ROLL-TEST-01")

        # Unauthenticated request rejected with 401
        self.client.defaults.pop('HTTP_AUTHORIZATION')
        anon_res = self.client.get("/api/inventory/rolls")
        self.assertEqual(anon_res.status_code, 401)

        # Worker role rejected with 403
        worker = User.objects.create_user(username="worker_inv", role=UserRole.WORKER)
        worker_token = str(RefreshToken.for_user(worker).access_token)
        forbidden_res = self.client.get(
            "/api/inventory/rolls",
            HTTP_AUTHORIZATION=f"Bearer {worker_token}"
        )
        self.assertEqual(forbidden_res.status_code, 403)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

    def test_create_duplicate_roll_code(self):
        """Test API prevents duplicate roll codes."""
        payload = {
            "roll_code": "ROLL-TEST-01",
            "fabric_type_id": self.fabric.id,
            "color": "سرمه‌ای",
            "length_meters": "100.00"
        }
        response = self.client.post("/api/inventory/rolls", data=payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)
