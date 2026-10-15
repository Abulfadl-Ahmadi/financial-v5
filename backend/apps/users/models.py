from django.contrib.auth.models import AbstractUser
from django.db import models


class PartyKind(models.TextChoices):
    PERSON = 'PERSON', 'شخص حقیقی'
    ORGANIZATION = 'ORGANIZATION', 'شخص حقوقی'
    WORKSHOP = 'WORKSHOP', 'کارگاه'
    EXTERNAL = 'EXTERNAL', 'طرف حساب بیرونی'


class Party(models.Model):
    """A financial counterparty; an interactive login is never required."""

    kind = models.CharField(max_length=20, choices=PartyKind.choices, default=PartyKind.PERSON)
    display_name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.display_name


class UserRole(models.TextChoices):
    OWNER = 'OWNER', 'مدیر کل'
    ACCOUNTANT = 'ACCOUNTANT', 'حسابدار'
    CUTTING_SUPERVISOR = 'CUTTING_SUPERVISOR', 'سرپرست کارگاه برش'
    SEWING_SUPERVISOR = 'SEWING_SUPERVISOR', 'سرپرست کارگاه خیاطی'
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER', 'انباردار پارچه'
    IRONER = 'IRONER', 'اتوکار / پرس‌کار'
    WORKER = 'WORKER', 'خیاط / کارگر'

class User(AbstractUser):
    role = models.CharField(
        max_length=30,
        choices=UserRole.choices,
        default=UserRole.WORKER,
        verbose_name="نقش کاربری"
    )
    phone_number = models.CharField(max_length=15, blank=True, null=True, verbose_name="شماره تماس")
    # Retained temporarily for legacy readers; Party/Account is authoritative.
    card_number = models.CharField(max_length=16, blank=True, null=True, verbose_name="شماره کارت بانکی")
    brand_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="نام برند (تولیدکننده)")
    party = models.OneToOneField(Party, on_delete=models.PROTECT, null=True, blank=True, related_name='login_user')

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_role_display()})" if self.first_name else f"{self.username} ({self.get_role_display()})"
