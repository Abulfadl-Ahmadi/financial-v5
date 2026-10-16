from ninja import Router
from typing import List
from apps.sewing.sam_models import GarmentOperation, SewingLineEfficiency
from apps.sewing.sam_schemas import GarmentOperationIn, GarmentOperationOut, LineEfficiencyReportOut, EfficiencyRecordOut
from django.db.models import Sum
from apps.users.permissions import require_sewing_supervisor

sam_router = Router(tags=["SAM Efficiency"])

@sam_router.get("/operations", response=List[GarmentOperationOut])
def list_operations(request):
    require_sewing_supervisor(request)
    return GarmentOperation.objects.all()

@sam_router.post("/operations", response=GarmentOperationOut)
def create_operation(request, payload: GarmentOperationIn):
    require_sewing_supervisor(request)
    op = GarmentOperation.objects.create(**payload.dict())
    return op

@sam_router.get("/efficiency", response=LineEfficiencyReportOut)
def get_efficiency_report(request, date_jalali: str):
    require_sewing_supervisor(request)
    records = SewingLineEfficiency.objects.filter(date_jalali=date_jalali).select_related('sewer', 'job')
    
    total_earned_sam = 0.0
    total_available_minutes = 0
    
    out_records = []
    for rec in records:
        total_earned_sam += float(rec.earned_sam_minutes)
        total_available_minutes += rec.available_work_minutes
        
        out_records.append(EfficiencyRecordOut(
            sewer_name=rec.sewer.get_full_name(),
            job_code=rec.job.job_code,
            actual_units=rec.actual_units,
            earned_sam_minutes=float(rec.earned_sam_minutes),
            available_work_minutes=rec.available_work_minutes,
            efficiency_percentage=rec.efficiency_percentage
        ))
        
    workshop_efficiency_percentage = 0.0
    if total_available_minutes > 0:
        workshop_efficiency_percentage = (total_earned_sam / total_available_minutes) * 100
        
    return LineEfficiencyReportOut(
        date_jalali=date_jalali,
        total_earned_sam=total_earned_sam,
        total_available_minutes=total_available_minutes,
        workshop_efficiency_percentage=workshop_efficiency_percentage,
        records=out_records
    )
