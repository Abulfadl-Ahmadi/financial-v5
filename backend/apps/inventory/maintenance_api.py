from ninja import Router
from typing import List
from django.shortcuts import get_object_or_404
from .maintenance_models import MachineAsset, MaintenanceLog, MachineStatus
from .maintenance_schemas import MachineAssetSchema, MaintenanceLogSchema, MaintenanceLogCreate
import datetime
from datetime import timedelta
from apps.users.permissions import require_inventory_manager

maintenance_router = Router(tags=["Maintenance"])

@maintenance_router.get("/machinery", response=List[MachineAssetSchema])
def list_machinery(request):
    """List all machines with active status and assigned worker."""
    require_inventory_manager(request)
    machines = MachineAsset.objects.filter(status=MachineStatus.ACTIVE, assigned_operator__isnull=False)
    return machines

@maintenance_router.post("/machinery/{machine_id}/maintenance", response=MaintenanceLogSchema)
def create_maintenance_log(request, machine_id: int, payload: MaintenanceLogCreate):
    """Log new maintenance event."""
    require_inventory_manager(request)
    machine = get_object_or_404(MachineAsset, id=machine_id)
    log = MaintenanceLog.objects.create(
        machine=machine,
        **payload.dict()
    )
    return log

@maintenance_router.get("/machinery/maintenance-due", response=List[MachineAssetSchema])
def get_maintenance_due(request):
    """List machines due for service within the next 7 days."""
    require_inventory_manager(request)
    today = datetime.date.today()
    target_date = today + timedelta(days=7)
    today_str = today.strftime("%Y/%m/%d")
    target_str = target_date.strftime("%Y/%m/%d")
    
    logs = MaintenanceLog.objects.filter(
        next_service_due_jalali__gte=today_str,
        next_service_due_jalali__lte=target_str
    ).select_related('machine')
    
    machines_dict = {}
    for log in logs:
        machines_dict[log.machine.id] = log.machine
        
    return list(machines_dict.values())
