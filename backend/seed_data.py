import os
import sys
import django

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.users.models import User, UserRole
from apps.inventory.models import FabricType, ClothRoll, RollStatus
from apps.cutting.models import Cut, CutRollUsage, Sizes, CutStatus
from apps.sewing.models import SewingJob, SewingStatus
from apps.financial.models import Account, Receipt, ReceiptType, ReceiptStatus
from decimal import Decimal

def seed():
    print("🌱 Starting database seeding...")
    
    # 1. Create Users
    admin, _ = User.objects.get_or_create(
        username="admin",
        defaults={
            "first_name": "مدیر",
            "last_name": "اصلی",
            "role": UserRole.OWNER,
            "is_staff": True,
            "is_superuser": True
        }
    )
    admin.set_password("admin123")
    admin.save()
    
    cutter_user, _ = User.objects.get_or_create(
        username="cutter1",
        defaults={
            "first_name": "رضا",
            "last_name": "مرادی",
            "role": UserRole.CUTTING_SUPERVISOR,
            "phone_number": "09121111111"
        }
    )
    cutter_user.set_password("123456")
    cutter_user.save()

    sewer_user, _ = User.objects.get_or_create(
        username="sewer1",
        defaults={
            "first_name": "مریم",
            "last_name": "احمدی",
            "role": UserRole.SEWING_SUPERVISOR,
            "phone_number": "09122222222",
            "card_number": "6037997112345678"
        }
    )
    sewer_user.set_password("123456")
    sewer_user.save()

    producer_user, _ = User.objects.get_or_create(
        username="producer_zara",
        defaults={
            "first_name": "علی",
            "last_name": "کاظمی",
            "role": UserRole.WORKER,
            "brand_name": "برند زارا پوشاک",
            "phone_number": "09123333333"
        }
    )
    producer_user.set_password("123456")
    producer_user.save()

    print("✅ Users created (admin, cutter1, sewer1, producer_zara)")

    # 2. Fabric Types & Rolls
    cotton, _ = FabricType.objects.get_or_create(name="نخ پنبه ۱۰۰٪")
    crepe, _ = FabricType.objects.get_or_create(name="کرپ مازراتی")

    roll1, _ = ClothRoll.objects.get_or_create(
        roll_code="ROLL-101",
        defaults={
            "fabric_type": cotton,
            "color": "مشکی",
            "shade": "SH-01",
            "length_meters": Decimal("150.50"),
            "status": RollStatus.IN_STOCK,
            "supplier_name": "نساجی اصفهان"
        }
    )

    roll2, _ = ClothRoll.objects.get_or_create(
        roll_code="ROLL-102",
        defaults={
            "fabric_type": crepe,
            "color": "سرمه‌ای",
            "shade": "SH-05",
            "length_meters": Decimal("200.00"),
            "status": RollStatus.IN_STOCK,
            "supplier_name": "نساجی یزد"
        }
    )

    print("✅ Inventory seeded (ClothRolls: ROLL-101, ROLL-102)")

    # 3. Cutting Order
    cut1, _ = Cut.objects.get_or_create(
        cut_code="CUT-2026-001",
        defaults={
            "model_name": "مانتو پاییزه کلاسیک",
            "model_code": "MANT-90",
            "size": Sizes.TWO,
            "owner": producer_user,
            "cutter": cutter_user,
            "lai_per_unit": 40,
            "product_per_layer": 6,
            "length_of_layers": Decimal("3.20"),
            "cutting_price": Decimal("25000"),
            "sewing_price": Decimal("65000"),
            "cutting_price_raw": Decimal("40000"),
            "sewing_price_raw": Decimal("95000"),
            "status": CutStatus.IN_PROGRESS
        }
    )

    CutRollUsage.objects.get_or_create(
        cut=cut1,
        roll=roll1,
        defaults={
            "used_meters": Decimal("128.00"),
            "used_layers": 40,
            "produced_pieces": 240
        }
    )

    print("✅ Cutting order created (CUT-2026-001 with 240 pieces)")

    # 4. Sewing Job
    job1, _ = SewingJob.objects.get_or_create(
        job_code="SEW-JOB-001",
        defaults={
            "cut": cut1,
            "sewer": sewer_user,
            "assigned_pieces": 240,
            "completed_pieces": 180,
            "rejected_pieces": 2,
            "unit_sewing_price": Decimal("65000"),
            "status": SewingStatus.IN_PROGRESS
        }
    )

    print("✅ Sewing job created (SEW-JOB-001)")

    # 5. Accounts & Receipts
    acc1, _ = Account.objects.get_or_create(
        card_number="6037997112345678",
        defaults={
            "f_name": "مریم",
            "l_name": "احمدی",
            "user": sewer_user
        }
    )

    acc_company, _ = Account.objects.get_or_create(
        card_number="6104337788990011",
        defaults={
            "f_name": "صندوق اصلی",
            "l_name": "کارگاه پوشاک",
            "user": admin
        }
    )

    Receipt.objects.get_or_create(
        tracking_code="TRX-998877",
        defaults={
            "date_jalali": "1405/05/02",
            "time_str": "14:30",
            "from_account": acc_company,
            "to_account": acc1,
            "amount": Decimal("11700000"),
            "receipt_type": ReceiptType.SEWING_PAYROLL,
            "status": ReceiptStatus.VERIFIED,
            "notes": "بابت پیش‌پرداخت تسویه کارگاه خیاطی"
        }
    )

    print("✅ Bank Accounts & Receipt created successfully!")
    print("🎉 Database Seeding Completed!")

if __name__ == "__main__":
    seed()
