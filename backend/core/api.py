from ninja import NinjaAPI
from ninja_jwt.authentication import JWTAuth
from apps.users.api import router as users_router
from apps.inventory.api import router as inventory_router
from apps.cutting.api import router as cutting_router
from apps.sewing.api import router as sewing_router
from apps.sewing.incentive_api import router as incentive_router
from apps.financial.api import router as financial_router

from apps.users.portal_auth import router as portal_auth_router
from apps.sewing.portal_api import router as portal_sewing_router
from apps.ai_assistant.api import ai_router

api = NinjaAPI(
    title="Garment ERP & Financial API (سیستم جامع مدیریت کارگاه پوشاک)",
    version="5.0.0",
    description="API مدرن با نینجا برای کارگاه برش، خیاطی، انبار پارچه و حسابداری",
    auth=JWTAuth(),
)

api.add_router("/users/portal/", portal_auth_router)
api.add_router("/sewing/portal/", portal_sewing_router)
api.add_router("/users/", users_router)
api.add_router("/inventory/", inventory_router)
api.add_router("/cutting/", cutting_router)
api.add_router("/sewing/", sewing_router)
api.add_router("/sewing/tailors/", incentive_router)
api.add_router("/financial/", financial_router)
api.add_router("/ai/", ai_router)
