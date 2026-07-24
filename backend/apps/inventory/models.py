from django.db import models

class FabricType(models.Model):
    name = models.CharField(max_length=100, unique=True, verbose_name="جنس پارچه")

    def __str__(self):
        return self.name

class RollStatus(models.TextChoices):
    IN_STOCK = 'IN_STOCK', 'موجود در انبار'
    IN_CUTTING = 'IN_CUTTING', 'در حال استفاده در برشگاه'
    EXHAUSTED = 'EXHAUSTED', 'تمام شده'

class ClothRoll(models.Model):
    roll_code = models.CharField(max_length=50, unique=True, verbose_name="کد طاقه")
    fabric_type = models.ForeignKey(FabricType, on_delete=models.PROTECT, related_name="rolls", verbose_name="جنس پارچه")
    color = models.CharField(max_length=50, verbose_name="رنگ")
    shade = models.CharField(max_length=50, blank=True, null=True, verbose_name="کد شید / رنگ‌رزی")
    length_meters = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="متراژ طاقه (متر)")
    status = models.CharField(max_length=20, choices=RollStatus.choices, default=RollStatus.IN_STOCK, verbose_name="وضعیت طاقه")
    supplier_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="تامین‌کننده / خریدار")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ورود به انبار")

    def __str__(self):
        return f"{self.roll_code} - {self.fabric_type.name} ({self.color}) - {self.length_meters}m"
