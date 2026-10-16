from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
from apps.sewing.models import SewingJob, Cut
from apps.sewing.sam_models import GarmentOperation, SewingLineEfficiency
from apps.inventory.models import ClothRoll, FabricType
from decimal import Decimal

User = get_user_model()

class SAMEfficiencyTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            password="password",
            role=UserRole.SEWING_SUPERVISOR
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'
        self.fabric_type = FabricType.objects.create(name="Nylon")
        self.fabric = ClothRoll.objects.create(
            roll_code="R1", 
            fabric_type=self.fabric_type, 
            color="Red",
            length_meters=Decimal("10.0")
        )
        self.cut = Cut.objects.create(
            cut_code="CUT1", 
            owner=self.user, 
            model_name="Model X",
            model_code="MX1"
        )
        self.job = SewingJob.objects.create(job_code="JOB1", cut=self.cut, sewer=self.user, assigned_pieces=10, unit_sewing_price=10)
        
        self.operation = GarmentOperation.objects.create(
            name="دوخت یقه",
            apparel_type="مانتو",
            standard_minutes=Decimal("5.50")
        )

    def test_sam_efficiency_calculation(self):
        # Create an efficiency record where 10 units are sewn
        actual_units = 10
        earned_sam = actual_units * float(self.operation.standard_minutes)
        
        record = SewingLineEfficiency.objects.create(
            date_jalali="1402/05/05",
            sewer=self.user,
            job=self.job,
            actual_units=actual_units,
            earned_sam_minutes=Decimal(str(earned_sam)),
            available_work_minutes=480
        )
        
        expected_efficiency = (earned_sam / 480) * 100
        self.assertAlmostEqual(record.efficiency_percentage, expected_efficiency, places=2)

    def test_sam_api_report(self):
        actual_units = 10
        earned_sam = actual_units * float(self.operation.standard_minutes)
        SewingLineEfficiency.objects.create(
            date_jalali="1402/05/05",
            sewer=self.user,
            job=self.job,
            actual_units=actual_units,
            earned_sam_minutes=Decimal(str(earned_sam)),
            available_work_minutes=480
        )
        
        response = self.client.get("/api/sewing/efficiency?date_jalali=1402/05/05")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_earned_sam"], earned_sam)
        self.assertEqual(data["total_available_minutes"], 480)
        
        expected_workshop_eff = (earned_sam / 480) * 100
        self.assertAlmostEqual(data["workshop_efficiency_percentage"], expected_workshop_eff, places=2)
