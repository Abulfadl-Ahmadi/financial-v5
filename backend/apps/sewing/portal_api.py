from typing import List
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from apps.sewing.models import ContractOrder, SewingJob
from apps.sewing.schemas import ContractOrderSummaryOut, SewingJobOut

router = Router(tags=["Portal Sewing"])

@router.get("/client/orders", response=List[ContractOrderSummaryOut], auth=JWTAuth())
def get_client_orders(request):
    user = request.user
    if not user.brand_name:
        raise HttpError(403, "Not a contractor account")
    
    orders = ContractOrder.objects.filter(client_name=user.brand_name).order_by("-created_at")
    return orders

@router.get("/worker/jobs", response=List[SewingJobOut], auth=JWTAuth())
def get_worker_jobs(request):
    user = request.user
    if user.role != "WORKER":
        raise HttpError(403, "Not a worker account")
    
    jobs = SewingJob.objects.filter(sewer=user).select_related("cut", "cut__owner", "sewer").order_by("-assigned_at")
    return jobs
