from ninja import NinjaAPI
from apps.users.api import router as users_router
from apps.inventory.api import router as inventory_router
from apps.cutting.api import router as cutting_router
from apps.sewing.api import router as sewing_router
from apps.financial.api import router as financial_router

api = NinjaAPI(
    title="Garment ERP & Financial API (سیستم جامع مدیریت کارگاه پوشاک)",
    version="5.0.0",
    description="API مدرن بازنویسی شده کارگاه برش، خیاطی، انبار پارچه و حسابداری"
)

api.add_router("/users/", users_router)
api.add_router("/inventory/", inventory_router)
api.add_router("/cutting/", cutting_router)
api.add_router("/sewing/", sewing_router)
api.add_router("/financial/", financial_router)
