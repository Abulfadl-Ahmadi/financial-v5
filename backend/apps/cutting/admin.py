from django.contrib import admin
from apps.cutting.models import Cut, CutRollUsage

class CutRollUsageInline(admin.TabularInline):
    model = CutRollUsage
    extra = 1
    autocomplete_fields = ['roll']

@admin.register(Cut)
class CutAdmin(admin.ModelAdmin):
    list_display = ('cut_code', 'model_name', 'model_code', 'size', 'owner', 'cutter', 'total_products', 'display_total_margin', 'status', 'created_at')
    list_filter = ('status', 'size', 'created_at')
    search_fields = ('cut_code', 'model_name', 'model_code', 'owner__username', 'owner__brand_name')
    inlines = [CutRollUsageInline]
    ordering = ('-created_at',)

    @admin.display(description='سود کل (تومان)')
    def display_total_margin(self, obj):
        return f"{obj.total_margin:,.0f}"

@admin.register(CutRollUsage)
class CutRollUsageAdmin(admin.ModelAdmin):
    list_display = ('cut', 'roll', 'used_meters', 'used_layers', 'produced_pieces')
    list_filter = ('cut__status',)
    search_fields = ('cut__cut_code', 'roll__roll_code')
