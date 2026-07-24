from django.contrib import admin
from apps.inventory.models import FabricType, ClothRoll

@admin.register(FabricType)
class FabricTypeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(ClothRoll)
class ClothRollAdmin(admin.ModelAdmin):
    list_display = ('roll_code', 'fabric_type', 'color', 'shade', 'length_meters', 'status', 'supplier_name', 'created_at')
    list_filter = ('status', 'fabric_type', 'color')
    search_fields = ('roll_code', 'color', 'shade', 'supplier_name')
    ordering = ('-created_at',)
