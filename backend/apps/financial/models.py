from django.db import models
from django.conf import settings

BANK_CARD_BIN = {
    '603799': 'بانک ملی ایران',
    '589210': 'بانک سپه',
    '627648': 'بانک توسعه صادرات',
    '627961': 'بانک صنعت و معدن',
    '603770': 'بانک کشاورزی',
    '628023': 'بانک مسکن',
    '627760': 'پست بانک ایران',
    '502908': 'بانک توسعه تعاون',
    '627412': 'بانک اقتصاد نوین',
    '622106': 'بانک پارسیان',
    '502229': 'بانک پاسارگاد',
    '627488': 'بانک کارآفرین',
    '621986': 'بانک سامان',
    '639346': 'بانک سینا',
    '639607': 'بانک سرمایه',
    '502806': 'بانک شهر',
    '502938': 'بانک دی',
    '603769': 'بانک صادرات',
    '610433': 'بانک ملت',
    '627353': 'بانک تجارت',
    '585983': 'بانک تجارت (جدید)',
    '589463': 'بانک رفاه کارگران',
    '627381': 'بانک انصار',
    '639370': 'بانک مهر اقتصاد',
}

class Account(models.Model):
    f_name = models.CharField(max_length=100, verbose_name="نام دارنده حساب")
    l_name = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    card_number = models.CharField(max_length=16, unique=True, verbose_name="شماره کارت (۱۶ رقمی)")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="bank_accounts", verbose_name="کاربر مرتبط")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    def __str__(self):
        return f"{self.f_name} {self.l_name} ({self.card_number[-4:]}) - {self.bank_name}"

    @property
    def bank_name(self) -> str:
        bin_code = self.card_number[:6] if len(self.card_number) >= 6 else ''
        return BANK_CARD_BIN.get(bin_code, 'بانک نامشخص')

    @property
    def formatted_card_number(self) -> str:
        num = self.card_number
        if len(num) == 16:
            return f"{num[:4]}-{num[4:8]}-{num[8:12]}-{num[12:]}"
        return num

class ReceiptType(models.TextChoices):
    CUTTING_PAYROLL = 'CUTTING_PAYROLL', 'تسویه اجرت برشکاری'
    SEWING_PAYROLL = 'SEWING_PAYROLL', 'تسویه اجرت خیاطی'
    FABRIC_PURCHASE = 'FABRIC_PURCHASE', 'خرید پارچه / مواد اولیه'
    PRODUCER_PAYMENT = 'PRODUCER_PAYMENT', 'دریافتی از سفارش‌دهنده'
    OTHER = 'OTHER', 'سایر تراکنش‌ها'

class ReceiptStatus(models.TextChoices):
    PENDING = 'PENDING', 'در انتظار تایید'
    VERIFIED = 'VERIFIED', 'تایید شده'
    REJECTED = 'REJECTED', 'رد شده'

class Receipt(models.Model):
    tracking_code = models.CharField(max_length=50, verbose_name="شماره پیگیری")
    date_jalali = models.CharField(max_length=10, verbose_name="تاریخ شمسی (مثلا ۱۴۰۵/۰۵/۰۲)")
    time_str = models.CharField(max_length=5, blank=True, null=True, verbose_name="زمان (HH:MM)")
    atm_id = models.CharField(max_length=20, blank=True, null=True, verbose_name="شماره ترمینال")
    recovery_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="شماره بازیابی")
    
    from_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="outgoing_receipts", verbose_name="از حساب")
    to_account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name="incoming_receipts", verbose_name="به حساب")
    
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="مبلغ (تومان)")
    receipt_type = models.CharField(max_length=30, choices=ReceiptType.choices, default=ReceiptType.OTHER, verbose_name="نوع تراکنش")
    status = models.CharField(max_length=20, choices=ReceiptStatus.choices, default=ReceiptStatus.PENDING, verbose_name="وضعیت فیش")
    
    notes = models.TextField(blank=True, null=True, verbose_name="توضیحات و بابت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت در سیستم")

    def __str__(self):
        return f"فیش {self.tracking_code} - {self.amount:,} تومان ({self.date_jalali})"
