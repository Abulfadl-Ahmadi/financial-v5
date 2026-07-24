from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from apps.users.schemas import UserOut
from apps.inventory.schemas import ClothRollOut

class CutRollUsageOut(BaseModel):
    id: int
    roll: ClothRollOut
    used_meters: Decimal
    used_layers: int
    produced_pieces: int

    class Config:
        from_attributes = True

class CutRollUsageIn(BaseModel):
    roll_id: int
    used_meters: Decimal
    used_layers: int
    produced_pieces: int

class CutOut(BaseModel):
    cut_code: str
    model_name: str
    model_code: str
    size: str
    owner: UserOut
    cutter: Optional[UserOut] = None
    lai_per_unit: int
    product_per_layer: int
    length_of_layers: Decimal
    cutting_price: Decimal
    sewing_price: Decimal
    cutting_price_raw: Decimal
    sewing_price_raw: Decimal
    status: str
    created_at: datetime
    total_products: int
    cut_margin: float
    sew_margin: float
    total_margin: float
    roll_usages: List[CutRollUsageOut] = []

    @field_validator('roll_usages', mode='before')
    @classmethod
    def convert_related_manager(cls, v):
        if hasattr(v, 'all'):
            return list(v.all())
        return v

    class Config:
        from_attributes = True

class CutCreateIn(BaseModel):
    cut_code: str
    model_name: str
    model_code: str
    size: str = "FREE"
    owner_id: int
    cutter_id: Optional[int] = None
    lai_per_unit: int = 1
    product_per_layer: int = 1
    length_of_layers: Decimal = Decimal("0.00")
    cutting_price: Decimal
    sewing_price: Decimal
    cutting_price_raw: Decimal
    sewing_price_raw: Decimal
    roll_usages: List[CutRollUsageIn] = []
