from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class FabricTypeOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class FabricTypeIn(BaseModel):
    name: str

class ClothRollOut(BaseModel):
    id: int
    roll_code: str
    fabric_type: FabricTypeOut
    color: str
    shade: Optional[str] = None
    length_meters: Decimal
    status: str
    supplier_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ClothRollIn(BaseModel):
    roll_code: str
    fabric_type_id: int
    color: str
    shade: Optional[str] = None
    length_meters: Decimal
    supplier_name: Optional[str] = None
