from django.db import models
from django.conf import settings
from .models import SewingJob

class GarmentOperation(models.Model):
    name = models.CharField(max_length=150, verbose_name="نام عملیات")
    apparel_type = models.CharField(max_length=100, verbose_name="نوع پوشاک")
    standard_minutes = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="زمان استاندارد (دقیقه)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'sewing'

    def __str__(self):
        return f"{self.name} ({self.apparel_type}) - {self.standard_minutes} min"

class SewingLineEfficiency(models.Model):
    date_jalali = models.CharField(max_length=10, verbose_name="تاریخ شمسی")
    sewer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="efficiency_records",
        verbose_name="خیاط"
    )
    job = models.ForeignKey(
        SewingJob,
        on_delete=models.CASCADE,
        related_name="efficiency_records",
        verbose_name="کار خیاطی"
    )
    actual_units = models.PositiveIntegerField(verbose_name="تعداد قطعات دوخته شده")
    earned_sam_minutes = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name="دقیقه استاندارد کسب شده"
    )
    available_work_minutes = models.PositiveIntegerField(
        default=480, 
        verbose_name="دقایق کاری در دسترس"
    )
    
    @property
    def efficiency_percentage(self) -> float:
        if self.available_work_minutes <= 0:
            return 0.0
        return float((self.earned_sam_minutes / self.available_work_minutes) * 100)

    class Meta:
        app_label = 'sewing'

    def __str__(self):
        return f"{self.sewer.get_full_name()} - {self.date_jalali} - {self.efficiency_percentage:.2f}%"
