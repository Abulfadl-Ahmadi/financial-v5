from django.test import TestCase
from apps.inventory.models import FabricType, ClothRoll, RollStatus
from decimal import Decimal

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

    def test_roll_creation(self):
        """Test FabricType and ClothRoll models."""
        self.assertEqual(self.roll.status, RollStatus.IN_STOCK)
        self.assertEqual(self.roll.length_meters, Decimal("150.50"))
        self.assertIn("ROLL-TEST-01", str(self.roll))

    def test_list_rolls_api(self):
        """Test list rolls Ninja API endpoint."""
        response = self.client.get("/api/inventory/rolls")
        self.assertEqual(response.status_code, 200)
        rolls_list = response.json()
        self.assertGreaterEqual(len(rolls_list), 1)
        self.assertEqual(rolls_list[0]["roll_code"], "ROLL-TEST-01")

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
