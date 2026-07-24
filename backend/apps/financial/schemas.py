from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime

class AccountOut(BaseModel):
    id: int
    f_name: str
    l_name: str
    card_number: str
    bank_name: str
    formatted_card_number: str

    class Config:
        from_attributes = True

class AccountIn(BaseModel):
    f_name: str
    l_name: str
    card_number: str
    user_id: Optional[int] = None

class AccountUpdateIn(BaseModel):
    f_name: Optional[str] = None
    l_name: Optional[str] = None
    card_number: Optional[str] = None
    user_id: Optional[int] = None

class ReceiptOut(BaseModel):
    id: int
    tracking_code: str
    date_jalali: str
    time_str: Optional[str] = None
    atm_id: Optional[str] = None
    recovery_code: Optional[str] = None
    from_account: AccountOut
    to_account: AccountOut
    amount: Decimal
    receipt_type: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReceiptCreateIn(BaseModel):
    tracking_code: str
    date_jalali: str
    time_str: Optional[str] = None
    atm_id: Optional[str] = None
    recovery_code: Optional[str] = None
    from_account_id: int
    to_account_id: int
    amount: Decimal
    receipt_type: str = "OTHER"
    notes: Optional[str] = None

class ReceiptUpdateIn(BaseModel):
    tracking_code: Optional[str] = None
    date_jalali: Optional[str] = None
    time_str: Optional[str] = None
    atm_id: Optional[str] = None
    recovery_code: Optional[str] = None
    from_account_id: Optional[int] = None
    to_account_id: Optional[int] = None
    amount: Optional[Decimal] = None
    receipt_type: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
