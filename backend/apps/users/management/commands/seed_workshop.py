from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.inventory.maintenance_models import MachineAsset, MachineType
from apps.financial.models import Account
from apps.financial.ownership import get_user_party

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with workforce, contractors, machinery, and accounts'

    def handle(self, *args, **kwargs):
        self.stdout.write("Starting workshop seeding...")
        
        # 1. Users Seeding
        # Tailors
        for i in range(1, 7):
            username = f'sewer{i}'
            name = f'خیاط {i}'
            user, created = User.objects.get_or_create(username=username, defaults={
                'first_name': name,
                'role': 'WORKER'
            })
            if created:
                user.set_password('123456')
                user.save()
                self.stdout.write(f"Created tailor: {username}")
                
        # Ironer
        ironer, created = User.objects.get_or_create(username='ironer1', defaults={
            'first_name': 'اتوکار ۱',
            'role': 'WORKER'
        })
        if created:
            ironer.set_password('123456')
            ironer.save()
            self.stdout.write("Created ironer: ironer1")
            
        # Contractor
        contractor, created = User.objects.get_or_create(username='contractor1', defaults={
            'first_name': 'پیمانکار نمونه',
            'last_name': 'ایده‌آل',
            'role': 'CLIENT',
            'brand_name': 'تولیدی پوشاک ایده‌آل'
        })
        if created:
            contractor.set_password('123456')
            contractor.save()
            self.stdout.write("Created contractor: contractor1")
            
        # Owner
        owner, created = User.objects.get_or_create(username='owner', defaults={
            'first_name': 'مدیر کارگاه',
            'role': 'OWNER'
        })
        if created:
            owner.set_password('123456')
            owner.save()
            self.stdout.write("Created owner: owner")
            
        # Accountant
        accountant, created = User.objects.get_or_create(username='accountant', defaults={
            'first_name': 'حسابدار',
            'role': 'ACCOUNTANT'
        })
        if created:
            accountant.set_password('123456')
            accountant.save()
            self.stdout.write("Created accountant: accountant")
            
        # 2. Machinery Seeding
        # 10 Sewing Machines
        for i in range(1, 11):
            machine, created = MachineAsset.objects.get_or_create(
                serial_number=f'SEW-{i:03d}',
                defaults={
                    'machine_name': f'چرخ خیاطی راسته‌دوز شماره {i}',
                    'machine_type': MachineType.SEWING,
                    'status': 'ACTIVE'
                }
            )
            if created:
                self.stdout.write(f"Created machinery: {machine.serial_number}")
                
        # 2 Sergers
        for i in range(1, 3):
            machine, created = MachineAsset.objects.get_or_create(
                serial_number=f'SRG-{i:03d}',
                defaults={
                    'machine_name': f'چرخ زیگزال/سردوز شماره {i}',
                    'machine_type': MachineType.SERGER,
                    'status': 'ACTIVE'
                }
            )
            if created:
                self.stdout.write(f"Created machinery: {machine.serial_number}")
                
        # 1 Janome Buttonhole Machine
        janome, created = MachineAsset.objects.get_or_create(
            serial_number='JAN-001',
            defaults={
                'machine_name': 'چرخ جانومه دکمه‌دوز و مادگی',
                'machine_type': MachineType.SEWING,
                'status': 'ACTIVE'
            }
        )
        if created:
            self.stdout.write(f"Created machinery: {janome.serial_number}")
            
        # 3 Industrial Steam Irons
        for i in range(1, 4):
            machine, created = MachineAsset.objects.get_or_create(
                serial_number=f'IRN-{i:03d}',
                defaults={
                    'machine_name': f'اتوبخار صنعتی شماره {i}',
                    'machine_type': MachineType.STEAM_IRON,
                    'status': 'ACTIVE'
                }
            )
            if created:
                self.stdout.write(f"Created machinery: {machine.serial_number}")
                
        # 1 Boiler
        boiler, created = MachineAsset.objects.get_or_create(
            serial_number='BLR-001',
            defaults={
                'machine_name': 'دیگ بخار مرکزی',
                'machine_type': MachineType.STEAM_IRON,
                'status': 'ACTIVE'
            }
        )
        if created:
            self.stdout.write(f"Created machinery: {boiler.serial_number}")
            
        # 3. Bank Accounts Seeding
        accounts_data = [
            {'f_name': 'مدیر', 'l_name': 'کارگاه', 'card_number': '6037991122334455', 'user': owner},
            {'f_name': 'پیمانکار', 'l_name': 'نمونه', 'card_number': '6104331122334455', 'user': contractor}
        ]
        
        for acc_data in accounts_data:
            linked_user = acc_data['user']
            account, created = Account.objects.get_or_create(
                card_number=acc_data['card_number'],
                defaults={
                    'f_name': acc_data['f_name'],
                    'l_name': acc_data['l_name'],
                    'user': linked_user,
                    'owner': get_user_party(linked_user),
                },
            )
            if created:
                self.stdout.write(f"Created account: {account.card_number}")
                
        self.stdout.write(self.style.SUCCESS('Successfully seeded workshop data!'))
