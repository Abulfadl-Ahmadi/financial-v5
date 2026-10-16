from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.sewing.models import SewingJob, SewingStatus, ContractOrder
from apps.sewing.schemas import (
    SewingJobOut, SewingJobCreateIn, SewingProgressUpdateIn,
    ContractOrderIn, ContractOrderOut, ContractOrderUpdateIn, ContractOrderSummaryOut
)
from apps.cutting.models import Cut
from apps.users.models import User, UserRole
from apps.users.permissions import (
    require_authenticated,
    require_sewing_supervisor,
    require_finance_manager,
)
from django.utils import timezone

router = Router(tags=["Sewing Workshop (کارگاه خیاطی)"])

@router.get("/jobs", response=List[SewingJobOut])
def list_sewing_jobs(request):
    user = require_authenticated(request)
    if user.role == UserRole.WORKER:
        return SewingJob.objects.filter(sewer=user).select_related("cut", "cut__owner", "sewer").order_by("-assigned_at")
    require_sewing_supervisor(request)
    return SewingJob.objects.select_related("cut", "cut__owner", "sewer").all().order_by("-assigned_at")

@router.post("/jobs", response=SewingJobOut)
def create_sewing_job(request, payload: SewingJobCreateIn):
    require_sewing_supervisor(request)
    if SewingJob.objects.filter(job_code=payload.job_code).exists():
        raise HttpError(400, "کد کار خیاطی تکراری است")

    try:
        cut = Cut.objects.get(cut_code=payload.cut_code)
    except Cut.DoesNotExist:
        raise HttpError(404, "دستور برش یافت نشد")

    try:
        sewer = User.objects.get(id=payload.sewer_id)
    except User.DoesNotExist:
        raise HttpError(404, "خیاط یافت نشد")

    job = SewingJob.objects.create(
        job_code=payload.job_code,
        cut=cut,
        sewer=sewer,
        assigned_pieces=payload.assigned_pieces,
        unit_sewing_price=payload.unit_sewing_price
    )
    return job

@router.patch("/jobs/{job_id}/progress", response=SewingJobOut)
def update_sewing_progress(request, job_id: int, payload: SewingProgressUpdateIn):
    user = require_authenticated(request)
    try:
        job = SewingJob.objects.get(id=job_id)
    except SewingJob.DoesNotExist:
        raise HttpError(404, "کار خیاطی یافت نشد")

    if user.role not in (UserRole.OWNER, UserRole.SEWING_SUPERVISOR) and job.sewer_id != user.id:
        raise HttpError(403, "Permission denied for current user")

    job.completed_pieces = payload.completed_pieces
    job.rejected_pieces = payload.rejected_pieces
    
    if payload.status:
        job.status = payload.status
        if payload.status == SewingStatus.COMPLETED:
            job.completed_at = timezone.now()
            
    job.save()
    return job

@router.get("/contract-orders", response=List[ContractOrderSummaryOut])
def list_contract_orders(request):
    require_finance_manager(request)
    return ContractOrder.objects.all().order_by("-created_at")

@router.post("/contract-orders", response=ContractOrderOut)
def create_contract_order(request, payload: ContractOrderIn):
    require_finance_manager(request)
    if ContractOrder.objects.filter(order_code=payload.order_code).exists():
        raise HttpError(400, "کد سفارش پیمانکار تکراری است")

    order = ContractOrder.objects.create(**payload.dict())
    return order

@router.get("/contract-orders/{order_id}", response=ContractOrderOut)
def get_contract_order(request, order_id: int):
    require_finance_manager(request)
    try:
        return ContractOrder.objects.get(id=order_id)
    except ContractOrder.DoesNotExist:
        raise HttpError(404, "سفارش پیمانکار یافت نشد")

@router.put("/contract-orders/{order_id}", response=ContractOrderOut)
def update_contract_order(request, order_id: int, payload: ContractOrderUpdateIn):
    require_finance_manager(request)
    try:
        order = ContractOrder.objects.get(id=order_id)
    except ContractOrder.DoesNotExist:
        raise HttpError(404, "سفارش پیمانکار یافت نشد")
        
    for attr, value in payload.dict(exclude_unset=True).items():
        setattr(order, attr, value)
        
    order.save()
    return order

from .sam_api import sam_router
router.add_router('', sam_router)
