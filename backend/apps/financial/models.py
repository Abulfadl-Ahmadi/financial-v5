from django.db import models
from django.conf import settings

PERSIAN_TO_LATIN_DIGITS = str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789')

def to_latin_digits(val: str | None) -> str | None:
    if not val:
        return val
    return str(val).translate(PERSIAN_TO_LATIN_DIGITS)

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

class BankDeposit(models.Model):
    """Authoritative legal bank deposit / account / IBAN independent of 16-digit cards."""
    deposit_number = models.CharField(max_length=50, unique=True, verbose_name="شماره حساب / سپرده")
    iban = models.CharField(max_length=34, blank=True, null=True, verbose_name="شماره شبا (IBAN)")
    bank_name = models.CharField(max_length=100, verbose_name="نام بانک")
    title = models.CharField(max_length=200, blank=True, null=True, verbose_name="عنوان سپرده")
    owner = models.ForeignKey('users.Party', on_delete=models.PROTECT, related_name='bank_deposits', verbose_name="طرف حساب مالک قانونی")
    is_verified_workshop_account = models.BooleanField(default=False, verbose_name="تایید شده به‌عنوان حساب کارگاه")
    verified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_deposits')
    verified_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name="حساب فعال")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bank_name} - {self.deposit_number} ({self.owner.display_name})"

class Account(models.Model):
    f_name = models.CharField(max_length=100, verbose_name="نام دارنده حساب")
    l_name = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    card_number = models.CharField(max_length=16, unique=True, verbose_name="شماره کارت (۱۶ رقمی)")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="bank_accounts", verbose_name="کاربر مرتبط")
    owner = models.ForeignKey('users.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='payment_cards')
    deposit = models.ForeignKey(BankDeposit, on_delete=models.SET_NULL, null=True, blank=True, related_name='cards', verbose_name="سپرده بانکی مرتبط")
    is_primary = models.BooleanField(default=False, verbose_name='کارت اصلی طرف حساب')
    is_active = models.BooleanField(default=True, verbose_name='کارت فعال')
    is_workshop_account = models.BooleanField(default=False, verbose_name="حساب اصلی کارگاه / کارفرما")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['owner'], condition=models.Q(is_primary=True), name='one_primary_card_per_party'),
        ]

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

    @property
    def user_role(self) -> str | None:
        return self.user.role if self.user else None

    @property
    def is_workshop(self) -> bool:
        return self.is_workshop_account and self.owner_id is not None and self.owner.kind == 'WORKSHOP'

    @property
    def user_full_name(self) -> str:
        if self.user:
            return self.user.get_full_name() or self.user.username
        return f"{self.f_name} {self.l_name}".strip()

class CardOwnershipLog(models.Model):
    """Audit log of card ownership assignments and transfers."""
    card = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='ownership_history')
    from_party = models.ForeignKey('users.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='+')
    to_party = models.ForeignKey('users.Party', on_delete=models.PROTECT, related_name='+')
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    reason = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Transfer {self.card.card_number[-4:]} from {self.from_party} to {self.to_party}"

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
    from_party = models.ForeignKey('users.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='sent_receipts')
    to_party = models.ForeignKey('users.Party', on_delete=models.PROTECT, null=True, blank=True, related_name='received_receipts')
    
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="مبلغ (تومان)")
    receipt_type = models.CharField(max_length=30, choices=ReceiptType.choices, default=ReceiptType.OTHER, verbose_name="نوع تراکنش")
    status = models.CharField(max_length=20, choices=ReceiptStatus.choices, default=ReceiptStatus.PENDING, verbose_name="وضعیت فیش")
    image = models.ImageField(upload_to="receipts/", blank=True, null=True, verbose_name="تصویر فیش واریزی")
    
    notes = models.TextField(blank=True, null=True, verbose_name="توضیحات و بابت")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت در سیستم")

    def save(self, *args, **kwargs):
        if self.date_jalali:
            self.date_jalali = to_latin_digits(self.date_jalali)
        if self.tracking_code:
            self.tracking_code = to_latin_digits(self.tracking_code)
        if self.time_str:
            self.time_str = to_latin_digits(self.time_str)
        if self._state.adding:
            if self.from_account_id and not self.from_party_id:
                self.from_party_id = self.from_account.owner_id
            if self.to_account_id and not self.to_party_id:
                self.to_party_id = self.to_account.owner_id
        super().save(*args, **kwargs)

    def __str__(self):
        return f"فیش {self.tracking_code} - {self.amount:,} تومان ({self.date_jalali})"

    @property
    def receipt_image(self) -> str | None:
        if self.image:
            return self.image.url
        return None

class ExpenseCategory(models.TextChoices):
    RENT = 'RENT', 'اجاره مکان کارگاه'
    ELECTRICITY = 'ELECTRICITY', 'قبض برق'
    WATER = 'WATER', 'قبض آب'
    GAS = 'GAS', 'قبض گاز - دیگ بخار و آشپزخانه'
    SUPPLIES = 'SUPPLIES', 'ملزومات دوخت - نخ، سوزن، روغن چرخ'
    MAINTENANCE = 'MAINTENANCE', 'تعمیر چرخ‌ها، دیگ بخار، برق‌کشی و روشنایی'
    WELFARE = 'WELFARE', 'چای، قند و پذیرایی کارگران'
    CLEANING = 'CLEANING', 'نظافت و بهداشت کارگاه'
    OTHER = 'OTHER', 'سایر هزینه‌ها'

class Expense(models.Model):
    title = models.CharField(max_length=200, verbose_name="عنوان هزینه")
    category = models.CharField(max_length=50, choices=ExpenseCategory.choices, default=ExpenseCategory.OTHER)
    amount = models.DecimalField(max_digits=15, decimal_places=0, verbose_name="مبلغ به تومان")
    date_jalali = models.CharField(max_length=10, verbose_name="تاریخ شمسی")
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.date_jalali:
            self.date_jalali = to_latin_digits(self.date_jalali)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.amount:,} تومان ({self.date_jalali})"


class StatementImportStatus(models.TextChoices):
    STAGED = 'STAGED', 'بارگذاری و استیج شده'
    RECONCILED = 'RECONCILED', 'مغایرت‌گیری شده'
    FAILED = 'FAILED', 'ناموفق'


class BankStatementImport(models.Model):
    """Import batch metadata for bank statements."""
    deposit = models.ForeignKey(BankDeposit, on_delete=models.PROTECT, related_name='statement_imports')
    filename = models.CharField(max_length=255)
    file_hash = models.CharField(max_length=64, db_index=True)
    from_date_jalali = models.CharField(max_length=20, blank=True, null=True)
    to_date_jalali = models.CharField(max_length=20, blank=True, null=True)
    total_rows = models.IntegerField(default=0)
    total_credit_irr = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    total_debit_irr = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    status = models.CharField(max_length=20, choices=StatementImportStatus.choices, default=StatementImportStatus.STAGED)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.filename} ({self.deposit.deposit_number}) - {self.total_rows} rows"


class TransactionCategory(models.TextChoices):
    INTERNAL_TRANSFER = 'INTERNAL_TRANSFER', 'انتقال داخلی بین حساب‌ها'
    PAYROLL_CANDIDATE = 'PAYROLL_CANDIDATE', 'کاندید دستمزد خیاطی'
    SUPPLIER_CANDIDATE = 'SUPPLIER_CANDIDATE', 'کاندید خرید پارچه و ملزومات'
    EXPENSE_CANDIDATE = 'EXPENSE_CANDIDATE', 'کاندید هزینه کارگاه'
    POS_PURCHASE = 'POS_PURCHASE', 'خرید کارتخوان'
    FEE = 'FEE', 'کارمزد بانکی'
    UNKNOWN = 'UNKNOWN', 'تراکنش نامشخص'


class ReviewDecision(models.TextChoices):
    PENDING = 'PENDING', 'در انتظار بررسی'
    MATCHED_EXISTING = 'MATCHED_EXISTING', 'تطبیق با فیش موجود'
    APPROVED_POSTING = 'APPROVED_POSTING', 'تایید جهت ثبت رسمی'
    IGNORED_INTERNAL = 'IGNORED_INTERNAL', 'نادیده گرفتن (انتقال داخلی)'
    IGNORED_PERSONAL = 'IGNORED_PERSONAL', 'نادیده گرفتن (تراکنش شخصی)'


class BankTransaction(models.Model):
    """Normalized physical row from a bank statement staged for review."""
    statement_import = models.ForeignKey(BankStatementImport, on_delete=models.CASCADE, related_name='transactions')
    statement_row_num = models.IntegerField()
    excel_row_num = models.IntegerField()
    date_jalali = models.CharField(max_length=25)
    description = models.TextField()
    document_number = models.CharField(max_length=50, blank=True, null=True)
    cheque_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="شماره برگه / چک")
    reference_number = models.CharField(max_length=50, blank=True, null=True)
    tracking_number = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    destination_card = models.CharField(max_length=16, blank=True, null=True, db_index=True)
    sender_card = models.CharField(max_length=16, blank=True, null=True)
    credit_irr = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    debit_irr = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    balance_irr = models.DecimalField(max_digits=18, decimal_places=0, default=0)
    user_note = models.TextField(blank=True, null=True)
    category = models.CharField(max_length=50, choices=TransactionCategory.choices, default=TransactionCategory.UNKNOWN)
    matched_receipt = models.ForeignKey(Receipt, on_delete=models.SET_NULL, null=True, blank=True, related_name='bank_matches')
    matched_expense = models.ForeignKey(Expense, on_delete=models.SET_NULL, null=True, blank=True, related_name='bank_matches')
    paired_transaction = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='paired_reverse')
    review_decision = models.CharField(max_length=30, choices=ReviewDecision.choices, default=ReviewDecision.PENDING)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_bank_txs')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, null=True)
    fingerprint = models.CharField(max_length=64, db_index=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['statement_import', 'statement_row_num'], name='unique_row_per_import'),
        ]

    def __str__(self):
        return f"{self.statement_import.deposit.deposit_number} #{self.statement_row_num} - {self.date_jalali}"


class BankReconciliationAuditLog(models.Model):
    """Audit log of decisions and financial postings made from bank transactions."""
    transaction = models.ForeignKey(BankTransaction, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=50)
    previous_decision = models.CharField(max_length=30)
    new_decision = models.CharField(max_length=30)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
