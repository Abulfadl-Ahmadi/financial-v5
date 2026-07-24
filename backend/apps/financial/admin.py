from django.contrib import admin
from apps.financial.models import Account, Receipt

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('f_name', 'l_name', 'card_number', 'display_bank', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('f_name', 'l_name', 'card_number', 'user__username')
    ordering = ('-created_at',)

    @admin.display(description='نام بانک (شناسایی BIN)')
    def display_bank(self, obj):
        return obj.bank_name

@admin.register(Receipt)
class ReceiptAdmin(admin.ModelAdmin):
    list_display = ('tracking_code', 'date_jalali', 'time_str', 'from_account', 'to_account', 'display_amount', 'receipt_type', 'status', 'created_at')
    list_filter = ('status', 'receipt_type', 'date_jalali')
    search_fields = ('tracking_code', 'notes', 'from_account__f_name', 'to_account__f_name')
    ordering = ('-created_at',)

    @admin.display(description='مبلغ (تومان)')
    def display_amount(self, obj):
        return f"{obj.amount:,.0f}"
