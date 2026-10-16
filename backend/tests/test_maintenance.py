from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
from apps.inventory.maintenance_models import MachineAsset, MaintenanceLog, MachineType, MachineStatus, ServiceType
import datetime
from datetime import timedelta

User = get_user_model()

class MaintenanceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='operator1',
            password='password123',
            role=UserRole.WAREHOUSE_MANAGER
        )
        self.token = str(RefreshToken.for_user(self.user).access_token)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {self.token}'

        self.machine1 = MachineAsset.objects.create(
            serial_number='SN-001',
            machine_name='Sewing Machine 1',
            machine_type=MachineType.SEWING,
            status=MachineStatus.ACTIVE,
            assigned_operator=self.user
        )

        self.machine2 = MachineAsset.objects.create(
            serial_number='SN-002',
            machine_name='Sewing Machine 2',
            machine_type=MachineType.SEWING,
            status=MachineStatus.MAINTENANCE,
            assigned_operator=self.user
        )

        self.machine3 = MachineAsset.objects.create(
            serial_number='SN-003',
            machine_name='Serger 1',
            machine_type=MachineType.SERGER,
            status=MachineStatus.ACTIVE,
            assigned_operator=None
        )

    def test_machine_creation(self):
        self.assertEqual(MachineAsset.objects.count(), 3)
        self.assertEqual(self.machine1.status, MachineStatus.ACTIVE)

    def test_list_machinery(self):
        response = self.client.get("/api/inventory/machinery")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['serial_number'], 'SN-001')

    def test_create_maintenance_log(self):
        payload = {
            "service_type": ServiceType.OIL_CHANGE,
            "service_cost": 50000.0,
            "serviced_at_jalali": "1402/05/01",
            "next_service_due_jalali": "1402/06/01",
            "notes": "Regular oil change"
        }
        response = self.client.post(
            f"/api/inventory/machinery/{self.machine1.id}/maintenance",
            data=payload,
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

        self.assertEqual(MaintenanceLog.objects.count(), 1)
        log = MaintenanceLog.objects.first()
        self.assertEqual(log.machine, self.machine1)
        self.assertEqual(log.service_cost, 50000.0)

    def test_maintenance_due(self):
        today = datetime.date.today()
        due_date = today + timedelta(days=3)
        not_due_date = today + timedelta(days=10)

        MaintenanceLog.objects.create(
            machine=self.machine1,
            service_type=ServiceType.NEEDLE_REPLACEMENT,
            serviced_at_jalali=today.strftime("%Y/%m/%d"),
            next_service_due_jalali=due_date.strftime("%Y/%m/%d")
        )

        MaintenanceLog.objects.create(
            machine=self.machine3,
            service_type=ServiceType.OIL_CHANGE,
            serviced_at_jalali=today.strftime("%Y/%m/%d"),
            next_service_due_jalali=not_due_date.strftime("%Y/%m/%d")
        )

        response = self.client.get("/api/inventory/machinery/maintenance-due")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.machine1.id)
