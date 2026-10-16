from django.test import TestCase, Client
from apps.users.models import User, UserRole
from ninja_jwt.tokens import RefreshToken
from apps.cutting.models import Cut
from apps.sewing.models import SewingJob
from apps.sewing.incentive_services import calculate_incentive_payroll, get_tailor_payroll_summary

class IncentiveCalculationTests(TestCase):
    def setUp(self):
        # Create users (Tailors and Ironers)
        self.tailor1 = User.objects.create_user(
            username="tailor1", role=UserRole.WORKER, first_name="Ali", last_name="Tailor"
        )
        self.tailor2 = User.objects.create_user(
            username="tailor2", role=UserRole.WORKER, first_name="Reza", last_name="Ironer"
        )
        
        # Create dummy cut for sewing job foreign keys
        self.cut = Cut.objects.create(
            cut_code="C1",
            model_name="Shirt",
            model_code="SH01",
            owner=self.tailor1,
            lai_per_unit=1,
            product_per_layer=1000
        )

    def test_calculate_incentive_payroll_no_bonus(self):
        # 100 completed, 100 target, 5 rejected
        # Base: 100 * 50 = 5000
        # No quota bonus (100 is not > 100)
        # No zero defect bonus (rejected > 0)
        result = calculate_incentive_payroll(
            completed_pieces=100, 
            unit_price=50.0, 
            daily_target=100, 
            rejected_pieces=5
        )
        self.assertEqual(result["base_payroll"], 5000.0)
        self.assertEqual(result["quota_bonus"], 0.0)
        self.assertEqual(result["zero_defect_bonus"], 0.0)
        self.assertEqual(result["total_payable"], 5000.0)

    def test_calculate_incentive_payroll_quota_bonus(self):
        # 120 completed, 100 target, 2 rejected
        # Base: 120 * 50 = 6000
        # Quota bonus: (120 - 100) * (50 * 0.1) = 20 * 5 = 100
        result = calculate_incentive_payroll(
            completed_pieces=120, 
            unit_price=50.0, 
            daily_target=100, 
            rejected_pieces=2
        )
        self.assertEqual(result["base_payroll"], 6000.0)
        self.assertEqual(result["quota_bonus"], 100.0)
        self.assertEqual(result["zero_defect_bonus"], 0.0)
        self.assertEqual(result["total_payable"], 6100.0)

    def test_calculate_incentive_payroll_zero_defect_bonus(self):
        # 100 completed, 100 target, 0 rejected
        # Base: 100 * 50 = 5000
        # Zero defect bonus: 5000 * 0.05 = 250
        result = calculate_incentive_payroll(
            completed_pieces=100, 
            unit_price=50.0, 
            daily_target=100, 
            rejected_pieces=0
        )
        self.assertEqual(result["base_payroll"], 5000.0)
        self.assertEqual(result["quota_bonus"], 0.0)
        self.assertEqual(result["zero_defect_bonus"], 250.0)
        self.assertEqual(result["total_payable"], 5250.0)

    def test_calculate_incentive_payroll_both_bonuses(self):
        # 120 completed, 100 target, 0 rejected
        # Base: 120 * 50 = 6000
        # Quota bonus: 20 * 5 = 100
        # Zero defect bonus: 6000 * 0.05 = 300
        # Total: 6000 + 100 + 300 = 6400
        result = calculate_incentive_payroll(
            completed_pieces=120, 
            unit_price=50.0, 
            daily_target=100, 
            rejected_pieces=0
        )
        self.assertEqual(result["base_payroll"], 6000.0)
        self.assertEqual(result["quota_bonus"], 100.0)
        self.assertEqual(result["zero_defect_bonus"], 300.0)
        self.assertEqual(result["total_payable"], 6400.0)

    def test_get_tailor_payroll_summary_and_api(self):
        # Assign job to tailor1 with bonuses
        SewingJob.objects.create(
            job_code="J1",
            cut=self.cut,
            sewer=self.tailor1,
            assigned_pieces=150,
            completed_pieces=120,
            rejected_pieces=0,
            unit_sewing_price=50.0
        )
        
        # Assign job to tailor2 without bonuses
        SewingJob.objects.create(
            job_code="J2",
            cut=self.cut,
            sewer=self.tailor2,
            assigned_pieces=100,
            completed_pieces=90,
            rejected_pieces=5,
            unit_sewing_price=50.0
        )
        
        # Test Service
        summary = get_tailor_payroll_summary(daily_target=100)
        
        self.assertEqual(len(summary), 2)
        
        t1_summary = next(s for s in summary if s["sewer_id"] == self.tailor1.id)
        self.assertEqual(t1_summary["total_payable"], 6400.0) # Base: 6000 + Quota: 100 + Quality: 300
        
        t2_summary = next(s for s in summary if s["sewer_id"] == self.tailor2.id)
        self.assertEqual(t2_summary["total_payable"], 4500.0) # Base: 4500
        
        # Test API - unauthenticated is rejected with 401
        client = Client()
        anon_res = client.get('/api/sewing/tailors/payroll-summary?daily_target=100')
        self.assertEqual(anon_res.status_code, 401)

        # Authenticated financial manager succeeds with 200
        manager = User.objects.create_user(username="payroll_manager_test", role=UserRole.ACCOUNTANT)
        token = str(RefreshToken.for_user(manager).access_token)
        response = client.get(
            '/api/sewing/tailors/payroll-summary?daily_target=100',
            HTTP_AUTHORIZATION=f'Bearer {token}'
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(len(data), 2)
        
        t1_data = next(d for d in data if d["sewer_id"] == self.tailor1.id)
        self.assertEqual(t1_data["total_payable"], 6400.0)
        self.assertEqual(t1_data["zero_defect_bonus"], 300.0)
        self.assertEqual(t1_data["quota_bonus"], 100.0)
