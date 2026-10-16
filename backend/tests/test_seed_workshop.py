from django.test import TestCase
from django.core.management import call_command
from django.contrib.auth import get_user_model
from apps.inventory.maintenance_models import MachineAsset, MachineType
from apps.financial.models import Account

User = get_user_model()

class SeedWorkshopCommandTest(TestCase):
    def test_seed_workshop_command(self):
        # Run command once
        call_command('seed_workshop')

        # Check Users
        self.assertEqual(User.objects.filter(role='WORKER').count(), 7) # 6 tailors + 1 ironer
        self.assertEqual(User.objects.filter(role='CLIENT').count(), 1)
        self.assertEqual(User.objects.filter(role='OWNER').count(), 1)
        self.assertEqual(User.objects.filter(role='ACCOUNTANT').count(), 1)

        contractor = User.objects.get(username='contractor1')
        self.assertEqual(contractor.first_name, 'پیمانکار نمونه (تولیدی پوشاک ایده‌آل)')

        # Check Machinery
        self.assertEqual(MachineAsset.objects.filter(machine_type=MachineType.SEWING).count(), 11) # 10 sewing + 1 janome
        self.assertEqual(MachineAsset.objects.filter(machine_type=MachineType.SERGER).count(), 2)
        self.assertEqual(MachineAsset.objects.filter(machine_type=MachineType.STEAM_IRON).count(), 4) # 3 iron + 1 boiler
        
        # Check total machines
        self.assertEqual(MachineAsset.objects.count(), 17)

        # Check Bank Accounts
        self.assertEqual(Account.objects.count(), 2)
        
        # Verify idempotency by running again
        call_command('seed_workshop')
        
        # 6 tailors + 1 ironer + 1 contractor + 1 owner + 1 accountant = 10 users total
        self.assertEqual(User.objects.count(), 10)
        self.assertEqual(MachineAsset.objects.count(), 17)
        self.assertEqual(Account.objects.count(), 2)
