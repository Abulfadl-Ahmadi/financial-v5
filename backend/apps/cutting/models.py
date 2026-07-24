from django.db import models
from django.conf import settings
from apps.inventory.models import ClothRoll

class Sizes(models.TextChoices):
    FREE = 'FREE', 'Free Size'
    TWO = 'TWO', 'سایز ۲'
    THREE = 'THREE', 'سایز ۳'
    FOUR = 'FOUR', 'سایز ۴'

class CutStatus(models.TextChoices):
    PLANNED = 'PLANNED', 'برنامه‌ریزی اولیه'
    IN_PROGRESS = 'IN_PROGRESS', 'در حال برش'
    COMPLETED = 'COMPLETED', 'برش تکمیل شده'
    DELIVERED_TO_SEWING = 'DELIVERED_TO_SEWING', 'تحویل به کارگاه خیاطی'

class Cut(models.Model):
    cut_code = models.CharField(max_length=100, unique=True, primary_key=True, verbose_name="کد دستور برش")
    model_name = models.CharField(max_length=100, verbose_name="نام مدل")
    model_code = models.CharField(max_length=100, verbose_name="کد مدل")
    size = models.CharField(max_length=10, choices=Sizes.choices, default=Sizes.FREE, verbose_name="سایز بندی")
    
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="owned_cuts", verbose_name="تولیدکننده / سفارش‌دهنده")
    cutter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="cut_jobs", verbose_name="برشکار")
    
    lai_per_unit = models.PositiveSmallIntegerField(default=1, verbose_name="تعداد لا")
    product_per_layer = models.PositiveSmallIntegerField(default=1, verbose_name="تعداد قطعه در هر لا")
    length_of_layers = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name="متراژ لا (متر)")
    
    cutting_price = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="اجرت برش (تومان)")
    sewing_price = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="اجرت خیاطی (تومان)")
    cutting_price_raw = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="قیمت تمام‌شده برش (تومان)")
    sewing_price_raw = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="قیمت تمام‌شده خیاطی (تومان)")
    
    status = models.CharField(max_length=30, choices=CutStatus.choices, default=CutStatus.PLANNED, verbose_name="وضعیت برش")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")

    def __str__(self):
        return f"{self.cut_code} - {self.model_name}"

    @property
    def total_products(self) -> int:
        return sum(usage.produced_pieces for usage in self.roll_usages.all()) if self.roll_usages.exists() else (self.lai_per_unit * self.product_per_layer)

    @property
    def cut_margin(self) -> float:
        return float((self.cutting_price_raw - self.cutting_price) * self.total_products)

    @property
    def sew_margin(self) -> float:
        return float((self.sewing_price_raw - self.sewing_price) * self.total_products)

    @property
    def total_margin(self) -> float:
        return self.cut_margin + self.sew_margin

class CutRollUsage(models.Model):
    cut = models.ForeignKey(Cut, on_delete=models.CASCADE, related_name="roll_usages", verbose_name="دستور برش")
    roll = models.ForeignKey(ClothRoll, on_delete=models.PROTECT, related_name="cut_usages", verbose_name="طاقه پارچه")
    used_meters = models.DecimalField(max_digits=8, decimal_places=2, verbose_name="متراژ مصرف شده")
    used_layers = models.PositiveSmallIntegerField(default=1, verbose_name="تعداد لا مصرفی")
    produced_pieces = models.PositiveIntegerField(default=0, verbose_name="تعداد قطعات خروجی")

    def __str__(self):
        return f"{self.cut.cut_code} - {self.roll.roll_code} ({self.produced_pieces} pcs)"
