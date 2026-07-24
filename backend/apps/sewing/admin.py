from django.contrib import admin
from apps.sewing.models import SewingJob

@admin.register(SewingJob)
class SewingJobAdmin(admin.ModelAdmin):
    list_display = ('job_code', 'cut', 'sewer', 'assigned_pieces', 'completed_pieces', 'rejected_pieces', 'unit_sewing_price', 'display_payable', 'status', 'assigned_at')
    list_filter = ('status', 'assigned_at')
    search_fields = ('job_code', 'cut__cut_code', 'cut__model_name', 'sewer__first_name', 'sewer__last_name', 'sewer__username')
    ordering = ('-assigned_at',)

    @admin.display(description='اجرت قابل پرداخت (تومان)')
    def display_payable(self, obj):
        return f"{obj.total_payable_amount:,.0f}"
