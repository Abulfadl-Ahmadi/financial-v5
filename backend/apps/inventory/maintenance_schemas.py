from pydantic import BaseModel
from typing import Optional

class MachineAssetSchema(BaseModel):
    id: int
    serial_number: str
    machine_name: str
    machine_type: str
    status: str
    assigned_operator_id: Optional[int] = None

    class Config:
        from_attributes = True

class MaintenanceLogSchema(BaseModel):
    id: int
    machine_id: int
    service_type: str
    service_cost: float
    serviced_at_jalali: str
    next_service_due_jalali: str
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class MaintenanceLogCreate(BaseModel):
    service_type: str
    service_cost: float
    serviced_at_jalali: str
    next_service_due_jalali: str
    notes: Optional[str] = None
