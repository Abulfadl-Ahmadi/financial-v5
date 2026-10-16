from typing import List, Optional
from ninja import Router, File, Form, UploadedFile
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth
from django.db.models import Q

from apps.financial.models import (
    BankDeposit,
    BankStatementImport,
    BankTransaction,
)
from apps.financial.schemas import ReceiptOut, ExpenseOut
from apps.financial.reconciliation.schemas import (
    BankTransactionOut,
    StatementBatchOut,
    DryRunPreviewOut,
    ReviewDecisionIn,
    PostReceiptIn,
    PostExpenseIn,
)
from apps.financial.reconciliation.parser import parse_bank_statement_xlsx
from apps.financial.reconciliation.services import stage_statement_import
from apps.financial.reconciliation.review import (
    decide_transaction,
    post_transaction_as_receipt,
    post_transaction_as_expense,
)
from apps.users.permissions import require_finance_manager

reconciliation_router = Router(tags=["Bank Reconciliation (مغایرت‌گیری بانکی)"])


@reconciliation_router.post("/preview", response=DryRunPreviewOut, auth=JWTAuth())
def dry_run_preview(request, file: UploadedFile = File(...)):
    """Dry-run parse and validate bank XLSX statement without database persistence."""
    require_finance_manager(request)
    file_bytes = file.read()
    try:
        parsed = parse_bank_statement_xlsx(file_bytes)
    except Exception as exc:
        raise HttpError(400, f"خطا در پردازش فایل: {str(exc)}") from exc

    samples = [
        {
            'statement_row_num': r.statement_row_num,
            'date_jalali': r.date_jalali,
            'description': r.description,
            'credit_irr': r.credit_irr,
            'debit_irr': r.debit_irr,
            'balance_irr': r.balance_irr,
            'destination_card': r.destination_card,
            'tracking_number': r.tracking_number,
        }
        for r in parsed.rows[:10]
    ]

    return {
        'deposit_number': parsed.deposit_number,
        'iban': parsed.iban,
        'from_date_jalali': parsed.from_date_jalali,
        'to_date_jalali': parsed.to_date_jalali,
        'total_rows': parsed.total_rows,
        'calculated_credit_irr': parsed.calculated_credit_irr,
        'calculated_debit_irr': parsed.calculated_debit_irr,
        'sample_rows': samples,
    }


@reconciliation_router.post("/upload", response=StatementBatchOut, auth=JWTAuth())
def upload_statement(
    request,
    deposit_id: int = Form(...),
    file: UploadedFile = File(...)
):
    """Upload, stage, and reconcile a bank XLSX statement with verified deposit."""
    require_finance_manager(request)
    try:
        deposit = BankDeposit.objects.get(id=deposit_id)
    except BankDeposit.DoesNotExist:
        raise HttpError(404, "حساب سپرده یافت نشد.")

    file_bytes = file.read()
    batch, _ = stage_statement_import(
        deposit=deposit,
        file_bytes=file_bytes,
        filename=file.name,
        user=request.user,
    )
    return batch


@reconciliation_router.get("/batches", response=List[StatementBatchOut], auth=JWTAuth())
def list_batches(request):
    """List statement import batches."""
    require_finance_manager(request)
    return BankStatementImport.objects.select_related('deposit').all().order_by('-id')


@reconciliation_router.get("/transactions", response=List[BankTransactionOut], auth=JWTAuth())
def list_transactions(
    request,
    batch_id: Optional[int] = None,
    category: Optional[str] = None,
    decision: Optional[str] = None,
    search: Optional[str] = None
):
    """List staged bank transactions with filter options."""
    require_finance_manager(request)
    qs = BankTransaction.objects.select_related('statement_import__deposit').all().order_by('excel_row_num')

    if batch_id:
        qs = qs.filter(statement_import_id=batch_id)
    if category:
        qs = qs.filter(category=category)
    if decision:
        qs = qs.filter(review_decision=decision)
    if search:
        qs = qs.filter(
            Q(description__icontains=search) |
            Q(tracking_number__icontains=search) |
            Q(destination_card__icontains=search) |
            Q(document_number__icontains=search)
        )
    return qs[:250]


@reconciliation_router.post("/transactions/{transaction_id}/decide", response=BankTransactionOut, auth=JWTAuth())
def set_transaction_decision(request, transaction_id: int, payload: ReviewDecisionIn):
    """Record an audited human review decision on a transaction."""
    require_finance_manager(request)
    return decide_transaction(
        transaction_id=transaction_id,
        decision=payload.decision,
        user=request.user,
        notes=payload.notes or ''
    )


@reconciliation_router.post("/transactions/{transaction_id}/post-receipt", response=ReceiptOut, auth=JWTAuth())
def post_receipt(request, transaction_id: int, payload: PostReceiptIn):
    """Post an approved transaction as an official workshop receipt."""
    require_finance_manager(request)
    return post_transaction_as_receipt(
        transaction_id=transaction_id,
        user=request.user,
        receipt_type=payload.receipt_type,
        notes=payload.notes or ''
    )


@reconciliation_router.post("/transactions/{transaction_id}/post-expense", response=ExpenseOut, auth=JWTAuth())
def post_expense(request, transaction_id: int, payload: PostExpenseIn):
    """Post an approved transaction as an official workshop expense."""
    require_finance_manager(request)
    return post_transaction_as_expense(
        transaction_id=transaction_id,
        user=request.user,
        category=payload.category,
        title=payload.title or '',
        notes=payload.notes or ''
    )
