from pydantic import BaseModel, Field
from typing import Optional

class UserOut(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = ""
    role: str
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None

    class Config:
        from_attributes = True

class UserCreateIn(BaseModel):
    username: str
    password: str
    first_name: str
    last_name: str
    role: str
    email: Optional[str] = ""
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None

class UserUpdateIn(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    phone_number: Optional[str] = None
    card_number: Optional[str] = None
    brand_name: Optional[str] = None

class LoginIn(BaseModel):
    username: str
    password: str
