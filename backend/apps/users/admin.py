from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'first_name', 'last_name', 'role', 'phone_number', 'brand_name', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'phone_number', 'brand_name', 'card_number')
    ordering = ('-id',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('اطلاعات کارگاه پوشاک (ERP Info)', {
            'fields': ('role', 'phone_number', 'card_number', 'brand_name')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('اطلاعات کارگاه پوشاک (ERP Info)', {
            'fields': ('role', 'phone_number', 'card_number', 'brand_name')
        }),
    )
