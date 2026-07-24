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
