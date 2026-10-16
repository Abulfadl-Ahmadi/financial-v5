from pydantic import BaseModel, field_validator
from typing import Optional, List
from apps.financial.schemas import AccountOut

class UserOut(BaseModel):
    id: int
    party_id: Optional[int] = None
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = ""
    role: str
    is_active: bool = True
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None
    bank_accounts: Optional[List[AccountOut]] = []

    @field_validator('bank_accounts', mode='before')
    @classmethod
    def convert_related_manager(cls, v):
        if hasattr(v, 'all'):
            return list(v.filter(is_active=True))
        if isinstance(v, list):
            return [account for account in v if account.is_active]
        return []

    class Config:
        from_attributes = True

class PartyIn(BaseModel):
    kind: str = 'PERSON'
    display_name: str


class PartyOut(PartyIn):
    id: int
    is_active: bool = True

    class Config:
        from_attributes = True


class UserCreateIn(BaseModel):
    username: str
    password: str
    party_id: Optional[int] = None
    first_name: str
    last_name: str
    role: str
    is_active: Optional[bool] = True
    email: Optional[str] = ""
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None
    additional_cards: Optional[List[str]] = []

class UserUpdateIn(BaseModel):
    party_id: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None
    additional_cards: Optional[List[str]] = []

class LoginIn(BaseModel):
    username: str
    password: str
