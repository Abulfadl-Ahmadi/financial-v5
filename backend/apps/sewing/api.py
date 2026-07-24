from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.sewing.models import SewingJob, SewingStatus
from apps.sewing.schemas import SewingJobOut, SewingJobCreateIn, SewingProgressUpdateIn
from apps.cutting.models import Cut
from apps.users.models import User
from django.utils import timezone

router = Router(tags=["Sewing Workshop (کارگاه خیاطی)"])

@router.get("/jobs", response=List[SewingJobOut])
def list_sewing_jobs(request):
    return SewingJob.objects.select_related("cut", "cut__owner", "sewer").all().order_by("-assigned_at")

@router.post("/jobs", response=SewingJobOut)
def create_sewing_job(request, payload: SewingJobCreateIn):
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
    try:
        job = SewingJob.objects.get(id=job_id)
    except SewingJob.DoesNotExist:
        raise HttpError(404, "کار خیاطی یافت نشد")
        
    job.completed_pieces = payload.completed_pieces
    job.rejected_pieces = payload.rejected_pieces
    
    if payload.status:
        job.status = payload.status
        if payload.status == SewingStatus.COMPLETED:
            job.completed_at = timezone.now()
            
    job.save()
    return job
