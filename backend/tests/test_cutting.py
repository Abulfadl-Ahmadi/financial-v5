from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserRole
from apps.inventory.models import FabricType, ClothRoll, RollStatus
from apps.cutting.models import Cut, CutRollUsage, Sizes, CutStatus
from decimal import Decimal
from ninja_jwt.tokens import RefreshToken

User = get_user_model()

class CuttingTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="cut_owner", role=UserRole.WORKER)
        self.cutter = User.objects.create_user(username="cutter_pro", role=UserRole.CUTTING_SUPERVISOR)
        self.fabric = FabricType.objects.create(name="کرپ مازراتی")
        self.roll = ClothRoll.objects.create(
            roll_code="ROLL-CUT-101",
            fabric_type=self.fabric,
            color="مشکی",
            length_meters=Decimal("200.00")
        )
        self.cut = Cut.objects.create(
            cut_code="CUT-TEST-001",
            model_name="مانتو پاییزه",
            model_code="MANT-01",
            size=Sizes.TWO,
            owner=self.owner,
            cutter=self.cutter,
            lai_per_unit=40,
            product_per_layer=6,
            length_of_layers=Decimal("3.20"),
            cutting_price=Decimal("25000"),
            sewing_price=Decimal("65000"),
            cutting_price_raw=Decimal("40000"),
            sewing_price_raw=Decimal("95000"),
            status=CutStatus.IN_PROGRESS
        )
        self.usage = CutRollUsage.objects.create(
            cut=self.cut,
            roll=self.roll,
            used_meters=Decimal("128.00"),
            used_layers=40,
            produced_pieces=240
        )

    def test_margin_calculations(self):
        """Test total_products, cut_margin, sew_margin, and total_margin logic."""
        self.assertEqual(self.cut.total_products, 240)
        
        # cut_margin = (40000 - 25000) * 240 = 15000 * 240 = 3,600,000
        self.assertEqual(self.cut.cut_margin, 3600000.0)
        
        # sew_margin = (95000 - 65000) * 240 = 30000 * 240 = 7,200,000
        self.assertEqual(self.cut.sew_margin, 7200000.0)
        
        # total_margin = 3600000 + 7200000 = 10,800,000
        self.assertEqual(self.cut.total_margin, 10800000.0)

    def test_cut_detail_api(self):
        """Test Cut detail Ninja API endpoint with authentication and RBAC."""
        # Unauthenticated request is rejected with 401
        anon_res = self.client.get("/api/cutting/cuts/CUT-TEST-001")
        self.assertEqual(anon_res.status_code, 401)

        # Worker role is rejected with 403
        worker_token = str(RefreshToken.for_user(self.owner).access_token)
        forbidden_res = self.client.get(
            "/api/cutting/cuts/CUT-TEST-001",
            HTTP_AUTHORIZATION=f"Bearer {worker_token}"
        )
        self.assertEqual(forbidden_res.status_code, 403)

        # Authorized supervisor succeeds with 200
        cutter_token = str(RefreshToken.for_user(self.cutter).access_token)
        response = self.client.get(
            "/api/cutting/cuts/CUT-TEST-001",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["cut_code"], "CUT-TEST-001")
        self.assertEqual(data["total_products"], 240)
        self.assertEqual(data["total_margin"], 10800000.0)

    def test_create_cut_with_invalid_roll_rolls_back_completely(self):
        """Test Issue #3: If one roll is invalid, transaction rolls back completely and no Cut is left."""
        cutter_token = str(RefreshToken.for_user(self.cutter).access_token)
        payload = {
            "cut_code": "CUT-ATOMIC-FAIL-01",
            "model_name": "شومیز آزمایشی",
            "model_code": "SH-FAIL",
            "size": "FREE",
            "owner_id": self.owner.id,
            "cutter_id": self.cutter.id,
            "lai_per_unit": 20,
            "product_per_layer": 2,
            "length_of_layers": "2.00",
            "cutting_price": 10000,
            "sewing_price": 20000,
            "cutting_price_raw": 15000,
            "sewing_price_raw": 30000,
            "roll_usages": [
                {
                    "roll_id": self.roll.id, # Valid roll
                    "used_meters": "25.00",
                    "used_layers": 10,
                    "produced_pieces": 20
                },
                {
                    "roll_id": 999999, # Non-existent roll!
                    "used_meters": "25.00",
                    "used_layers": 10,
                    "produced_pieces": 20
                }
            ]
        }

        initial_roll_meters = self.roll.length_meters
        response = self.client.post(
            "/api/cutting/cuts",
            data=payload,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn("یافت نشد", response.json().get("detail", ""))

        # Zero orphaned records exist
        self.assertFalse(Cut.objects.filter(cut_code="CUT-ATOMIC-FAIL-01").exists())
        self.assertFalse(CutRollUsage.objects.filter(cut__cut_code="CUT-ATOMIC-FAIL-01").exists())

        # Roll length was NOT deducted
        self.roll.refresh_from_db()
        self.assertEqual(self.roll.length_meters, initial_roll_meters)

    def test_create_cut_deducts_inventory_and_exhausts_roll(self):
        """Test Issue #4: Creating a cut deducts meters from inventory and transitions status."""
        test_roll = ClothRoll.objects.create(
            roll_code="ROLL-INVENTORY-TEST",
            fabric_type=self.fabric,
            color="آبی کاربنی",
            length_meters=Decimal("100.00"),
            status=RollStatus.IN_STOCK
        )
        cutter_token = str(RefreshToken.for_user(self.cutter).access_token)

        # 1. Deduct 40 meters -> remaining 60 meters, status IN_CUTTING
        payload1 = {
            "cut_code": "CUT-INV-01",
            "model_name": "مدل اول",
            "model_code": "M-01",
            "size": "FREE",
            "owner_id": self.owner.id,
            "cutter_id": self.cutter.id,
            "lai_per_unit": 10,
            "product_per_layer": 2,
            "length_of_layers": "2.00",
            "cutting_price": 10000,
            "sewing_price": 20000,
            "cutting_price_raw": 15000,
            "sewing_price_raw": 30000,
            "roll_usages": [
                {
                    "roll_id": test_roll.id,
                    "used_meters": "40.00",
                    "used_layers": 10,
                    "produced_pieces": 20
                }
            ]
        }
        res1 = self.client.post(
            "/api/cutting/cuts",
            data=payload1,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(res1.status_code, 200)

        test_roll.refresh_from_db()
        self.assertEqual(test_roll.length_meters, Decimal("60.00"))
        self.assertEqual(test_roll.status, RollStatus.IN_CUTTING)

        # 2. Deduct remaining 60 meters -> remaining 0, status EXHAUSTED
        payload2 = {
            "cut_code": "CUT-INV-02",
            "model_name": "مدل دوم",
            "model_code": "M-02",
            "size": "FREE",
            "owner_id": self.owner.id,
            "cutter_id": self.cutter.id,
            "lai_per_unit": 10,
            "product_per_layer": 2,
            "length_of_layers": "2.00",
            "cutting_price": 10000,
            "sewing_price": 20000,
            "cutting_price_raw": 15000,
            "sewing_price_raw": 30000,
            "roll_usages": [
                {
                    "roll_id": test_roll.id,
                    "used_meters": "60.00",
                    "used_layers": 10,
                    "produced_pieces": 20
                }
            ]
        }
        res2 = self.client.post(
            "/api/cutting/cuts",
            data=payload2,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(res2.status_code, 200)

        test_roll.refresh_from_db()
        self.assertEqual(test_roll.length_meters, Decimal("0.00"))
        self.assertEqual(test_roll.status, RollStatus.EXHAUSTED)

        # 3. Attempting to consume from exhausted roll fails with 400
        payload3 = {
            "cut_code": "CUT-INV-03",
            "model_name": "مدل سوم",
            "model_code": "M-03",
            "size": "FREE",
            "owner_id": self.owner.id,
            "cutter_id": self.cutter.id,
            "lai_per_unit": 10,
            "product_per_layer": 2,
            "length_of_layers": "2.00",
            "cutting_price": 10000,
            "sewing_price": 20000,
            "cutting_price_raw": 15000,
            "sewing_price_raw": 30000,
            "roll_usages": [
                {
                    "roll_id": test_roll.id,
                    "used_meters": "10.00",
                    "used_layers": 10,
                    "produced_pieces": 20
                }
            ]
        }
        res3 = self.client.post(
            "/api/cutting/cuts",
            data=payload3,
            content_type="application/json",
            HTTP_AUTHORIZATION=f"Bearer {cutter_token}"
        )
        self.assertEqual(res3.status_code, 400)
        self.assertIn("تمام شده", res3.json().get("detail", ""))

