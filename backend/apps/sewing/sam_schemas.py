from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime

class GarmentOperationIn(BaseModel):
    name: str
    apparel_type: str
    standard_minutes: Decimal

class GarmentOperationOut(BaseModel):
    id: int
    name: str
    apparel_type: str
    standard_minutes: Decimal
    created_at: datetime

    class Config:
        from_attributes = True

class EfficiencyRecordOut(BaseModel):
    sewer_name: str
    job_code: str
    actual_units: int
    earned_sam_minutes: float
    available_work_minutes: int
    efficiency_percentage: float

class LineEfficiencyReportOut(BaseModel):
    date_jalali: str
    total_earned_sam: float
    total_available_minutes: int
    workshop_efficiency_percentage: float
    records: List[EfficiencyRecordOut]
