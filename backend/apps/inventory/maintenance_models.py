from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class MachineType(models.TextChoices):
    SEWING = 'SEWING', 'راسته‌دوز'
    SERGER = 'SERGER', 'زیگزال/سردوز'
    STEAM_IRON = 'STEAM_IRON', 'اتوبخار صنعتی'

class MachineStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'فعال'
    MAINTENANCE = 'MAINTENANCE', 'در حال تعمیر'
    DECOMMISSIONED = 'DECOMMISSIONED', 'از رده خارج'

class MachineAsset(models.Model):
    serial_number = models.CharField(max_length=100, unique=True, verbose_name='شماره سریال')
    machine_name = models.CharField(max_length=100, verbose_name='نام چرخ/دستگاه')
    machine_type = models.CharField(max_length=20, choices=MachineType.choices, verbose_name='نوع دستگاه')
    status = models.CharField(max_length=20, choices=MachineStatus.choices, default=MachineStatus.ACTIVE, verbose_name='وضعیت')
    assigned_operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_machines', verbose_name='اپراتور اختصاصی')

    class Meta:
        app_label = 'inventory'
        verbose_name = 'دارایی دستگاه'
        verbose_name_plural = 'دارایی‌های دستگاه'

    def __str__(self):
        return f"{self.machine_name} ({self.serial_number})"

class ServiceType(models.TextChoices):
    OIL_CHANGE = 'OIL_CHANGE', 'تعویض روغن'
    NEEDLE_REPLACEMENT = 'NEEDLE_REPLACEMENT', 'تعویض سوزن'
    STEAM_DESCALING = 'STEAM_DESCALING', 'رسوب‌گیری اتوبخار'
    GENERAL_OVERHAUL = 'GENERAL_OVERHAUL', 'سرویس کلی'

class MaintenanceLog(models.Model):
    machine = models.ForeignKey(MachineAsset, on_delete=models.CASCADE, related_name='maintenance_logs', verbose_name='دستگاه')
    service_type = models.CharField(max_length=30, choices=ServiceType.choices, verbose_name='نوع سرویس')
    service_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name='هزینه سرویس')
    serviced_at_jalali = models.CharField(max_length=10, verbose_name='تاریخ سرویس (جلالی)')
    next_service_due_jalali = models.CharField(max_length=10, verbose_name='تاریخ سررسید سرویس بعدی (جلالی)')
    notes = models.TextField(blank=True, null=True, verbose_name='توضیحات')

    class Meta:
        app_label = 'inventory'
        verbose_name = 'گزارش سرویس و نگهداری'
        verbose_name_plural = 'گزارش‌های سرویس و نگهداری'

    def __str__(self):
        return f"{self.machine.machine_name} - {self.get_service_type_display()} - {self.serviced_at_jalali}"
