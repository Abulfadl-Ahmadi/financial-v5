from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
from apps.sewing.models import ContractOrder, ContractOrderStatus
from decimal import Decimal

User = get_user_model()

class ContractOrderTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="contract_owner",
            password="password123",
            role=UserRole.OWNER
        )
        self.token = str(RefreshToken.for_user(self.owner).access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

        self.order = ContractOrder.objects.create(
            order_code="CO-TEST-001",
            client_name="شرکت آلفا",
            apparel_type="شلوار",
            total_received_pieces=500,
            unit_contractor_price=Decimal("45000"),
            received_date_jalali="1402/05/10",
            notes="آزمایشی"
        )

    def test_total_revenue_calculation(self):
        # 500 * 45000 = 22500000.0
        self.assertEqual(self.order.total_revenue, 22500000.0)

    def test_list_contract_orders_api(self):
        response = self.client.get("/api/sewing/contract-orders")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["order_code"], "CO-TEST-001")
        self.assertEqual(data[0]["total_revenue"], 22500000.0)

    def test_create_contract_order_api(self):
        payload = {
            "order_code": "CO-TEST-002",
            "client_name": "شرکت بتا",
            "apparel_type": "مانتو",
            "total_received_pieces": 200,
            "unit_contractor_price": 55000,
            "received_date_jalali": "1402/06/01",
            "notes": "فوری"
        }
        response = self.client.post("/api/sewing/contract-orders", data=payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["order_code"], "CO-TEST-002")
        self.assertEqual(data["total_revenue"], 11000000.0)
        self.assertEqual(data["status"], ContractOrderStatus.RECEIVED)

    def test_create_duplicate_order_code(self):
        payload = {
            "order_code": "CO-TEST-001", # Duplicate
            "client_name": "شرکت تست",
            "apparel_type": "پیراهن",
            "total_received_pieces": 100,
            "unit_contractor_price": 30000,
            "received_date_jalali": "1402/06/10"
        }
        response = self.client.post("/api/sewing/contract-orders", data=payload, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_get_contract_order_api(self):
        response = self.client.get(f"/api/sewing/contract-orders/{self.order.id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["client_name"], "شرکت آلفا")
        self.assertEqual(data["total_revenue"], 22500000.0)

    def test_update_contract_order_api(self):
        payload = {
            "status": "IN_PRODUCTION",
            "delivery_date_jalali": "1402/05/20",
            "notes": "برش خورد"
        }
        response = self.client.put(f"/api/sewing/contract-orders/{self.order.id}", data=payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], ContractOrderStatus.IN_PRODUCTION)
        self.assertEqual(data["delivery_date_jalali"], "1402/05/20")
        
        # Verify DB is actually updated
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, ContractOrderStatus.IN_PRODUCTION)
        self.assertEqual(self.order.delivery_date_jalali, "1402/05/20")
