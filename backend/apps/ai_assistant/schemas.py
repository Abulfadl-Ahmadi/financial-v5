import uuid
from typing import Any, Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class ActionDraftOut(BaseModel):
    id: uuid.UUID
    action_type: str
    status: str
    payload: Dict[str, Any]
    idempotency_key: str
    committed_record_id: Optional[int] = None
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageOut(BaseModel):
    session_id: str
    reply: str
    active_draft: Optional[ActionDraftOut] = None


class ParseSmsIn(BaseModel):
    text: str


class ParseSmsOut(BaseModel):
    bank_name: str
    amount_toman: int
    tracking_code: Optional[str] = None
    card_last4: Optional[str] = None
    date_jalali: Optional[str] = None
    time_str: Optional[str] = None
    transaction_type: str


class CommitDraftOut(BaseModel):
    success: bool
    draft_id: uuid.UUID
    action_type: str
    status: str
    record_id: int
    message: str
