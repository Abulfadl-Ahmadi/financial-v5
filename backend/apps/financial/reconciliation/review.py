"""Audited review decisions and financial postings for bank transactions.

Enforces human-in-the-loop approval before posting bank statement withdrawals
or deposits into official Receipts or Expenses, tracking an immutable audit trail.
"""
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from ninja.errors import HttpError

from apps.financial.models import (
    Account,
    BankReconciliationAuditLog,
    BankTransaction,
    Expense,
    ExpenseCategory,
    Receipt,
    ReceiptStatus,
    ReceiptType,
    ReviewDecision,
)
from apps.users.permissions import require_finance_manager


@transaction.atomic
def decide_transaction(
    *,
    transaction_id: int,
    decision: str,
    user,
    notes: str = ''
) -> BankTransaction:
    """Record an audited human review decision for a staged bank transaction."""
    if decision not in ReviewDecision.values:
        raise HttpError(400, "تصمیم بررسی نامعتبر است.")

    try:
        tx = BankTransaction.objects.select_for_update().select_related('statement_import__deposit').get(id=transaction_id)
    except BankTransaction.DoesNotExist:
        raise HttpError(404, "تراکنش بانکی یافت نشد.")

    prev_decision = tx.review_decision
    tx.review_decision = decision
    tx.reviewed_by = user
    tx.reviewed_at = timezone.now()
    tx.review_notes = notes or tx.review_notes
    tx.save(update_fields=['review_decision', 'reviewed_by', 'reviewed_at', 'review_notes'])

    BankReconciliationAuditLog.objects.create(
        transaction=tx,
        user=user,
        action='DECISION_CHANGED',
        previous_decision=prev_decision,
        new_decision=decision,
        notes=notes,
    )
    return tx


@transaction.atomic
def post_transaction_as_receipt(
    *,
    transaction_id: int,
    user,
    receipt_type: str = ReceiptType.SEWING_PAYROLL,
    notes: str = ''
) -> Receipt:
    """Post an approved bank transaction as an official workshop Receipt."""
    try:
        tx = BankTransaction.objects.select_for_update().select_related(
            'statement_import__deposit', 'statement_import__deposit__owner'
        ).get(id=transaction_id)
    except BankTransaction.DoesNotExist:
        raise HttpError(404, "تراکنش بانکی یافت نشد.")

    if tx.matched_receipt_id:
        raise HttpError(400, "این تراکنش قبلاً با یک فیش موجود تطبیق داده شده است.")

    if tx.debit_irr <= Decimal('0'):
        raise HttpError(400, "تنها تراکنش‌های برداشتی امکان ثبت به‌عنوان فیش پرداخت را دارند.")

    # Find source account for the deposit
    deposit = tx.statement_import.deposit
    from_acc = deposit.cards.filter(is_active=True).first()
    if not from_acc:
        from_acc = Account.objects.filter(owner=deposit.owner, is_workshop_account=True, is_active=True).first()
    if not from_acc:
        raise HttpError(400, "کارت یا حساب پرداخت متناظر با این سپرده در سیستم یافت نشد.")

    # Find destination account
    to_acc = None
    if tx.destination_card:
        to_acc = Account.objects.filter(card_number=tx.destination_card, is_active=True).first()
    if not to_acc:
        raise HttpError(400, "کارت مقصد تراکنش در لیست حساب‌های سیستم ثبت نشده است.")

    amount_toman = tx.debit_irr // Decimal('10')
    tracking_code = tx.tracking_number or tx.document_number or f"TX-{tx.statement_row_num}"

    # Create official receipt
    receipt = Receipt.objects.create(
        tracking_code=tracking_code,
        date_jalali=tx.date_jalali[:10],
        time_str=tx.date_jalali[11:16] if len(tx.date_jalali) >= 16 else None,
        from_account=from_acc,
        to_account=to_acc,
        amount=amount_toman,
        receipt_type=receipt_type,
        status=ReceiptStatus.VERIFIED,
        notes=notes or tx.description,
        from_party_id=from_acc.owner_id,
        to_party_id=to_acc.owner_id,
    )

    prev_dec = tx.review_decision
    tx.matched_receipt = receipt
    tx.review_decision = ReviewDecision.APPROVED_POSTING
    tx.reviewed_by = user
    tx.reviewed_at = timezone.now()
    tx.save(update_fields=['matched_receipt', 'review_decision', 'reviewed_by', 'reviewed_at'])

    BankReconciliationAuditLog.objects.create(
        transaction=tx,
        user=user,
        action='RECEIPT_POSTED',
        previous_decision=prev_dec,
        new_decision=ReviewDecision.APPROVED_POSTING,
        notes=f"Receipt #{receipt.id} posted from bank row #{tx.statement_row_num}",
    )
    return receipt


@transaction.atomic
def post_transaction_as_expense(
    *,
    transaction_id: int,
    user,
    category: str = ExpenseCategory.MAINTENANCE,
    title: str = '',
    notes: str = ''
) -> Expense:
    """Post an approved bank transaction as an official workshop Expense."""
    try:
        tx = BankTransaction.objects.select_for_update().select_related(
            'statement_import__deposit'
        ).get(id=transaction_id)
    except BankTransaction.DoesNotExist:
        raise HttpError(404, "تراکنش بانکی یافت نشد.")

    if tx.matched_expense_id:
        raise HttpError(400, "این تراکنش قبلاً به‌عنوان هزینه ثبت شده است.")

    if tx.debit_irr <= Decimal('0'):
        raise HttpError(400, "تنها تراکنش‌های برداشتی امکان ثبت به‌عنوان هزینه را دارند.")

    deposit = tx.statement_import.deposit
    from_acc = deposit.cards.filter(is_active=True).first()
    if not from_acc:
        from_acc = Account.objects.filter(owner=deposit.owner, is_workshop_account=True, is_active=True).first()

    amount_toman = tx.debit_irr // Decimal('10')
    exp_title = title or tx.user_note or tx.description[:100]

    expense = Expense.objects.create(
        title=exp_title,
        category=category,
        amount=amount_toman,
        date_jalali=tx.date_jalali[:10],
        account=from_acc,
        notes=notes or tx.description,
    )

    prev_dec = tx.review_decision
    tx.matched_expense = expense
    tx.review_decision = ReviewDecision.APPROVED_POSTING
    tx.reviewed_by = user
    tx.reviewed_at = timezone.now()
    tx.save(update_fields=['matched_expense', 'review_decision', 'reviewed_by', 'reviewed_at'])

    BankReconciliationAuditLog.objects.create(
        transaction=tx,
        user=user,
        action='EXPENSE_POSTED',
        previous_decision=prev_dec,
        new_decision=ReviewDecision.APPROVED_POSTING,
        notes=f"Expense #{expense.id} posted from bank row #{tx.statement_row_num}",
    )
    return expense
