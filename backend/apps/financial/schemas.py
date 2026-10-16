from pydantic import BaseModel, field_validator, model_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime
from apps.financial.models import ReceiptType, ReceiptStatus


def valid_receipt_type(value: str) -> str:
    if value not in ReceiptType.values:
        raise ValueError('Invalid receipt category')
    return value


def valid_receipt_status(value: str) -> str:
    if value not in ReceiptStatus.values:
        raise ValueError('Invalid receipt status')
    return value

class AccountOut(BaseModel):
    id: int
    owner_id: Optional[int] = None
    is_primary: bool = False
    is_active: bool = True
    f_name: str
    l_name: str
    card_number: str
    last4: str
    bank_name: str
    formatted_card_number: str
    user_id: Optional[int] = None
    user_role: Optional[str] = None
    user_full_name: Optional[str] = None
    is_workshop: bool = False

    @model_validator(mode='before')
    @classmethod
    def mask_card_fields(cls, value):
        # Django Ninja passes ORM instances to Pydantic; never serialize raw PAN.
        if hasattr(value, 'card_number') and not isinstance(value, dict):
            number = value.card_number
            masked = f'****-****-****-{number[-4:]}'
            return {
                'id': value.id,
                'owner_id': value.owner_id,
                'is_primary': value.is_primary,
                'is_active': value.is_active,
                'f_name': value.f_name,
                'l_name': value.l_name,
                'card_number': masked,
                'last4': number[-4:],
                'formatted_card_number': masked,
                'bank_name': value.bank_name,
                'user_id': value.user_id,
                'user_role': value.user_role,
                'user_full_name': value.user_full_name,
                'is_workshop': value.is_workshop,
            }
        if isinstance(value, dict) and 'card_number' in value:
            number = value['card_number']
            value = {**value, 'last4': number[-4:], 'card_number': f'****-****-****-{number[-4:]}',
                     'formatted_card_number': f'****-****-****-{number[-4:]}'}
        return value

    class Config:
        from_attributes = True

class AccountRevealOut(BaseModel):
    id: int
    card_number: str

class AccountIn(BaseModel):
    f_name: Optional[str] = None
    l_name: Optional[str] = None
    card_number: str
    user_id: Optional[int] = None
    party_id: Optional[int] = None
    is_primary: bool = False
    is_workshop_account: Optional[bool] = False

class AccountUpdateIn(BaseModel):
    f_name: Optional[str] = None
    l_name: Optional[str] = None
    card_number: Optional[str] = None
    user_id: Optional[int] = None
    party_id: Optional[int] = None
    is_primary: Optional[bool] = None
    is_active: Optional[bool] = None
    is_workshop_account: Optional[bool] = None

class ReceiptOut(BaseModel):
    id: int
    tracking_code: str
    date_jalali: str
    time_str: Optional[str] = None
    atm_id: Optional[str] = None
    recovery_code: Optional[str] = None
    from_account: AccountOut
    to_account: AccountOut
    from_party_id: Optional[int] = None
    to_party_id: Optional[int] = None
    amount: Decimal
    receipt_type: str
    status: str
    receipt_image: Optional[str] = None
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
    to_account_id: Optional[int] = None
    new_to_card_number: Optional[str] = None
    new_to_f_name: Optional[str] = None
    new_to_l_name: Optional[str] = None
    user_id: Optional[int] = None
    party_id: Optional[int] = None
    amount: Decimal
    receipt_type: str = "OTHER"
    status: Optional[str] = "VERIFIED"
    notes: Optional[str] = None

    @field_validator('receipt_type')
    @classmethod
    def check_type(cls, value):
        return valid_receipt_type(value)

    @field_validator('status')
    @classmethod
    def check_status(cls, value):
        return valid_receipt_status(value) if value is not None else value

class ReceiptUpdateIn(BaseModel):
    remove_image: Optional[bool] = None
    new_to_card_number: Optional[str] = None
    new_to_f_name: Optional[str] = None
    new_to_l_name: Optional[str] = None
    user_id: Optional[int] = None
    party_id: Optional[int] = None
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

    @field_validator('receipt_type')
    @classmethod
    def check_type(cls, value):
        return valid_receipt_type(value) if value is not None else value

    @field_validator('status')
    @classmethod
    def check_status(cls, value):
        return valid_receipt_status(value) if value is not None else value

class ExpenseOut(BaseModel):
    id: int
    title: str
    category: str
    amount: Decimal
    date_jalali: str
    account: Optional[AccountOut] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ExpenseIn(BaseModel):
    title: str
    category: str = "OTHER"
    amount: Decimal
    date_jalali: str
    account_id: Optional[int] = None
    notes: Optional[str] = None

class ExpenseUpdateIn(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    date_jalali: Optional[str] = None
    account_id: Optional[int] = None
    notes: Optional[str] = None
