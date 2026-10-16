from typing import List, Optional
from decimal import Decimal
from pydantic import BaseModel, model_validator


class BankTransactionOut(BaseModel):
    id: int
    statement_import_id: int
    statement_row_num: int
    excel_row_num: int
    date_jalali: str
    description: str
    document_number: Optional[str] = None
    reference_number: Optional[str] = None
    tracking_number: Optional[str] = None
    destination_card: Optional[str] = None
    masked_destination_card: Optional[str] = None
    sender_card: Optional[str] = None
    credit_irr: Decimal
    debit_irr: Decimal
    balance_irr: Decimal
    user_note: Optional[str] = None
    category: str
    matched_receipt_id: Optional[int] = None
    matched_expense_id: Optional[int] = None
    paired_transaction_id: Optional[int] = None
    review_decision: str
    review_notes: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def mask_sensitive_cards(cls, data):
        if hasattr(data, 'destination_card'):
            import re
            card = data.destination_card
            masked = f"****-****-****-{card[-4:]}" if card and len(card) == 16 else card
            desc = data.description or ''
            desc_masked = re.sub(r'([0-9]{4})[0-9]{8}([0-9]{4})', r'\1********\2', desc)
            note = data.user_note or ''
            note_masked = re.sub(r'([0-9]{4})[0-9]{8}([0-9]{4})', r'\1********\2', note) if note else note
            return {
                'id': data.id,
                'statement_import_id': data.statement_import_id,
                'statement_row_num': data.statement_row_num,
                'excel_row_num': data.excel_row_num,
                'date_jalali': data.date_jalali,
                'description': desc_masked,
                'document_number': data.document_number,
                'reference_number': data.reference_number,
                'tracking_number': data.tracking_number,
                'destination_card': masked,
                'masked_destination_card': masked,
                'sender_card': data.sender_card,
                'credit_irr': data.credit_irr,
                'debit_irr': data.debit_irr,
                'balance_irr': data.balance_irr,
                'user_note': note_masked,
                'category': data.category,
                'matched_receipt_id': data.matched_receipt_id,
                'matched_expense_id': data.matched_expense_id,
                'paired_transaction_id': data.paired_transaction_id,
                'review_decision': data.review_decision,
                'review_notes': data.review_notes,
            }
        return data

    class Config:
        from_attributes = True


class StatementBatchOut(BaseModel):
    id: int
    deposit_id: int
    deposit_number: str
    filename: str
    file_hash: str
    from_date_jalali: Optional[str] = None
    to_date_jalali: Optional[str] = None
    total_rows: int
    total_credit_irr: Decimal
    total_debit_irr: Decimal
    status: str
    created_at: str

    @model_validator(mode='before')
    @classmethod
    def map_deposit_number(cls, data):
        if hasattr(data, 'deposit'):
            return {
                'id': data.id,
                'deposit_id': data.deposit_id,
                'deposit_number': data.deposit.deposit_number,
                'filename': data.filename,
                'file_hash': data.file_hash,
                'from_date_jalali': data.from_date_jalali,
                'to_date_jalali': data.to_date_jalali,
                'total_rows': data.total_rows,
                'total_credit_irr': data.total_credit_irr,
                'total_debit_irr': data.total_debit_irr,
                'status': data.status,
                'created_at': data.created_at.isoformat() if hasattr(data.created_at, 'isoformat') else str(data.created_at),
            }
        return data

    class Config:
        from_attributes = True


class DryRunPreviewOut(BaseModel):
    deposit_number: str
    iban: Optional[str] = None
    from_date_jalali: str
    to_date_jalali: str
    total_rows: int
    calculated_credit_irr: int
    calculated_debit_irr: int
    sample_rows: List[dict]


class ReviewDecisionIn(BaseModel):
    decision: str
    notes: Optional[str] = None


class PostReceiptIn(BaseModel):
    receipt_type: str = "SEWING_PAYROLL"
    notes: Optional[str] = None


class PostExpenseIn(BaseModel):
    category: str = "MAINTENANCE"
    title: Optional[str] = None
    notes: Optional[str] = None
