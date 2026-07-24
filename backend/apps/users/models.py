from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    OWNER = 'OWNER', 'مدیر کل'
    ACCOUNTANT = 'ACCOUNTANT', 'حسابدار'
    CUTTING_SUPERVISOR = 'CUTTING_SUPERVISOR', 'سرپرست کارگاه برش'
    SEWING_SUPERVISOR = 'SEWING_SUPERVISOR', 'سرپرست کارگاه خیاطی'
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'انباردار پارچه'
    WORKER = 'WORKER', 'کارگر ساده / اپراتور'

class User(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.WORKER,
        verbose_name="نقش کاربری"
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="شماره تماس")
    card_number = models.CharField(max_length=16, blank=True, null=True, verbose_name="شماره کارت بانکی")
    brand_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="نام برند (تولیدکننده)")

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_role_display()})" if self.first_name else f"{self.username} ({self.get_role_display()})"
