from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.users.models import UserRole
from apps.inventory.models import FabricType, ClothRoll
from apps.cutting.models import Cut, CutRollUsage, Sizes, CutStatus
from decimal import Decimal

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
        """Test Cut detail Ninja API endpoint."""
        response = self.client.get("/api/cutting/cuts/CUT-TEST-001")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["cut_code"], "CUT-TEST-001")
        self.assertEqual(data["total_products"], 240)
        self.assertEqual(data["total_margin"], 10800000.0)
