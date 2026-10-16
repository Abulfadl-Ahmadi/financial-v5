from django.db import models
from django.conf import settings
from apps.cutting.models import Cut

class SewingStatus(models.TextChoices):
    ASSIGNED = 'ASSIGNED', 'تخصیص یافته به خیاط'
    IN_PROGRESS = 'IN_PROGRESS', 'در حال دوخت'
    COMPLETED = 'COMPLETED', 'تکمیل شده'
    SETTLED = 'SETTLED', 'تسویه شده'

class SewingJob(models.Model):
    job_code = models.CharField(max_length=100, unique=True, verbose_name="کد کار خیاطی")
    cut = models.ForeignKey(Cut, on_delete=models.PROTECT, related_name="sewing_jobs", verbose_name="دستور برش")
    sewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="sewing_assignments", verbose_name="خیاط / کارگاه خیاطی")
    
    assigned_pieces = models.PositiveIntegerField(verbose_name="تعداد قطعات تحویلی")
    completed_pieces = models.PositiveIntegerField(default=0, verbose_name="تعداد قطعات دوخته‌شده")
    rejected_pieces = models.PositiveIntegerField(default=0, verbose_name="تعداد ضایعات / مرجوعی")
    
    unit_sewing_price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="اجرت دوخت هر واحد (تومان)")
    status = models.CharField(max_length=30, choices=SewingStatus.choices, default=SewingStatus.ASSIGNED, verbose_name="وضعیت دوخت")
    
    assigned_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ تحویل به خیاط")
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name="تاریخ اتمام دوخت")

    def __str__(self):
        return f"{self.job_code} - {self.sewer.get_full_name()} ({self.completed_pieces}/{self.assigned_pieces})"

    @property
    def total_payable_amount(self) -> float:
        return float(self.completed_pieces * self.unit_sewing_price)

class ContractOrderStatus(models.TextChoices):
    RECEIVED = 'RECEIVED', 'دریافت شده از کارفرما'
    IN_PRODUCTION = 'IN_PRODUCTION', 'در حال دوخت'
    DELIVERED = 'DELIVERED', 'تحویل داده شده به کارفرما'
    SETTLED = 'SETTLED', 'تسویه مالی شده'

class ContractOrder(models.Model):
    order_code = models.CharField(max_length=50, unique=True, verbose_name="کد سفارش پیمانکار")
    client_name = models.CharField(max_length=150, verbose_name="نام کارفرما / پیمانکار")
    apparel_type = models.CharField(max_length=100, verbose_name="نوع پوشاک (مانتو، شلوار، پیراهن...)")
    total_received_pieces = models.PositiveIntegerField(verbose_name="تعداد قطعات تحویلی از کارفرما")
    unit_contractor_price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ توافقی دوزندگی هر واحد به تومان")
    status = models.CharField(max_length=30, choices=ContractOrderStatus.choices, default=ContractOrderStatus.RECEIVED)
    received_date_jalali = models.CharField(max_length=10, verbose_name="تاریخ دریافت شمسی")
    delivery_date_jalali = models.CharField(max_length=10, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.order_code} - {self.client_name}"

    @property
    def total_revenue(self) -> float:
        return float(self.total_received_pieces * self.unit_contractor_price)

from .sam_models import *
