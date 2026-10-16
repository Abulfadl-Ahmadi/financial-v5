from django.test import TestCase
from apps.users.models import User
from apps.sewing.models import ContractOrder, SewingJob
from apps.inventory.models import ClothRoll, FabricType
from apps.cutting.models import Cut

class ClientPortalTestCase(TestCase):
    def test_client_orders_auth(self):
        user = User.objects.create_user(username="contractor1", password="pw", brand_name="Brand X")
        
        # Test client login
        res = self.client.post("/api/users/portal/client/login", {"username": "contractor1", "password": "pw"}, content_type="application/json")
        self.assertEqual(res.status_code, 200)
        token = res.json()["access"]
        
        ContractOrder.objects.create(
            order_code="C1",
            client_name="Brand X",
            apparel_type="Shirt",
            total_received_pieces=100,
            unit_contractor_price=5000,
            received_date_jalali="1402/01/01"
        )
        ContractOrder.objects.create(
            order_code="C2",
            client_name="Brand Y",
            apparel_type="Pants",
            total_received_pieces=200,
            unit_contractor_price=6000,
            received_date_jalali="1402/01/02"
        )
        
        # Test orders list
        res2 = self.client.get("/api/sewing/portal/client/orders", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res2.status_code, 200)
        data = res2.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["order_code"], "C1")

    def test_worker_jobs_auth(self):
        user = User.objects.create_user(username="worker1", password="pw", role="WORKER")
        
        # Test worker login
        res = self.client.post("/api/users/portal/worker/login", {"username": "worker1", "password": "pw"}, content_type="application/json")
        self.assertEqual(res.status_code, 200)
        token = res.json()["access"]
        
        owner = User.objects.create_user(username="owner1", password="pw", role="OWNER")
        fabric = FabricType.objects.create(name="Cotton")
        roll = ClothRoll.objects.create(roll_code="R1", fabric_type=fabric, color="Red", length_meters=10)
        cut = Cut.objects.create(cut_code="CUT1", model_name="Shirt", model_code="S1", owner=owner)
        
        SewingJob.objects.create(
            job_code="J1",
            cut=cut,
            sewer=user,
            assigned_pieces=50,
            unit_sewing_price=1000
        )
        
        # Test jobs list
        res2 = self.client.get("/api/sewing/portal/worker/jobs", HTTP_AUTHORIZATION=f"Bearer {token}")
        self.assertEqual(res2.status_code, 200)
        data = res2.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["job_code"], "J1")
