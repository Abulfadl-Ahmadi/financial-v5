from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime
from apps.users.schemas import UserOut
from apps.cutting.schemas import CutOut

class SewingJobOut(BaseModel):
    id: int
    job_code: str
    cut: CutOut
    sewer: UserOut
    assigned_pieces: int
    completed_pieces: int
    rejected_pieces: int
    unit_sewing_price: Decimal
    status: str
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    total_payable_amount: float

    class Config:
        from_attributes = True

class SewingJobCreateIn(BaseModel):
    job_code: str
    cut_code: str
    sewer_id: int
    assigned_pieces: int
    unit_sewing_price: Decimal

class SewingProgressUpdateIn(BaseModel):
    completed_pieces: int
    rejected_pieces: int = 0
    status: Optional[str] = None

class ContractOrderIn(BaseModel):
    order_code: str
    client_name: str
    apparel_type: str
    total_received_pieces: int
    unit_contractor_price: Decimal
    received_date_jalali: str
    notes: Optional[str] = None

class ContractOrderOut(BaseModel):
    id: int
    order_code: str
    client_name: str
    apparel_type: str
    total_received_pieces: int
    unit_contractor_price: Decimal
    status: str
    received_date_jalali: str
    delivery_date_jalali: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    total_revenue: float

    class Config:
        from_attributes = True

class ContractOrderUpdateIn(BaseModel):
    client_name: Optional[str] = None
    apparel_type: Optional[str] = None
    total_received_pieces: Optional[int] = None
    unit_contractor_price: Optional[Decimal] = None
    status: Optional[str] = None
    delivery_date_jalali: Optional[str] = None
    notes: Optional[str] = None

class ContractOrderSummaryOut(BaseModel):
    id: int
    order_code: str
    client_name: str
    status: str
    total_revenue: float

    class Config:
        from_attributes = True
