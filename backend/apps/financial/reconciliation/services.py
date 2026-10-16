"""Bank Statement Staging and Reconciliation Service.

Provides idempotent ingestion of bank statement batches, cross-account
pair linking, known-payee categorization, and receipt reconciliation.
"""
import hashlib
from collections import defaultdict
from decimal import Decimal
from typing import List, Tuple
from django.db import transaction
from django.utils import timezone
from ninja.errors import HttpError

from apps.financial.models import (
    Account,
    BankDeposit,
    BankStatementImport,
    BankTransaction,
    Expense,
    Receipt,
    ReceiptStatus,
    ReceiptType,
    ReviewDecision,
    StatementImportStatus,
    TransactionCategory,
)
from apps.financial.reconciliation.parser import (
    ParsedBankRow,
    StatementParseResult,
    parse_bank_statement_xlsx,
)
from apps.users.models import UserRole


@transaction.atomic
def stage_statement_import(
    *,
    deposit: BankDeposit,
    file_bytes: bytes,
    filename: str,
    user,
) -> Tuple[BankStatementImport, bool]:
    """Idempotently stage a validated bank statement into the database.

    Returns:
        (import_batch, created)
    """
    if not deposit.is_verified_workshop_account:
        raise HttpError(400, "تنها حساب‌های سپرده تاییدشده کارگاه امکان بارگذاری و مغایرت‌گیری دارند.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # Check for existing identical file upload (Idempotency)
    existing_import = BankStatementImport.objects.filter(file_hash=file_hash).first()
    if existing_import:
        return existing_import, False

    # Parse and validate XLSX statement
    try:
        parsed: StatementParseResult = parse_bank_statement_xlsx(file_bytes)
    except Exception as exc:
        raise HttpError(400, f"خطا در پردازش فایل اکسل صورت‌حساب: {str(exc)}") from exc

    # Ensure statement deposit matches target deposit
    clean_target = deposit.deposit_number.replace('-', '').strip()
    clean_statement = parsed.deposit_number.replace('-', '').strip()
    if clean_target not in clean_statement and clean_statement not in clean_target:
        raise HttpError(
            400,
            f"شماره حساب صورت‌حساب ({parsed.deposit_number}) با حساب انتخاب‌شده ({deposit.deposit_number}) تطابق ندارد."
        )

    # Create import batch
    batch = BankStatementImport.objects.create(
        deposit=deposit,
        filename=filename,
        file_hash=file_hash,
        from_date_jalali=parsed.from_date_jalali,
        to_date_jalali=parsed.to_date_jalali,
        total_rows=parsed.total_rows,
        total_credit_irr=Decimal(str(parsed.calculated_credit_irr)),
        total_debit_irr=Decimal(str(parsed.calculated_debit_irr)),
        status=StatementImportStatus.STAGED,
        uploaded_by=user,
    )

    # Pre-fetch active accounts mapping card -> Account
    registered_cards = {
        acc.card_number: acc
        for acc in Account.objects.filter(is_active=True).select_related('owner', 'user')
    }

    # Pre-fetch existing verified receipts for matching
    existing_receipts = list(
        Receipt.objects.select_related('from_account', 'to_account').all()
    )

    staged_transactions: List[BankTransaction] = []

    for row in parsed.rows:
        fp_str = (
            f"{deposit.deposit_number}:{row.date_jalali}:{row.debit_irr}:"
            f"{row.credit_irr}:{row.balance_irr}:{row.document_number}:{row.reference_number}"
        )
        fingerprint = hashlib.sha256(fp_str.encode('utf-8')).hexdigest()

        # Categorization logic
        category = TransactionCategory.UNKNOWN
        decision = ReviewDecision.PENDING
        matched_rec = None

        desc = row.description or ''
        note = row.user_note or ''

        if 'کارمزد' in desc:
            category = TransactionCategory.FEE
        elif 'انتقال وجه موبایلت' in desc and ('4851219' in desc or 'موبایلت' in desc):
            category = TransactionCategory.INTERNAL_TRANSFER
            decision = ReviewDecision.IGNORED_INTERNAL
        elif 'تعمیر' in note or 'تعمیر چرخ' in note:
            category = TransactionCategory.EXPENSE_CANDIDATE
        elif row.destination_card and row.destination_card in registered_cards:
            target_acc = registered_cards[row.destination_card]
            if target_acc.user_role == UserRole.WORKER or target_acc.user_role == UserRole.IRONER:
                category = TransactionCategory.PAYROLL_CANDIDATE
            else:
                category = TransactionCategory.SUPPLIER_CANDIDATE
        elif 'خرید' in desc or 'پایانه' in desc or 'شاپرک' in desc:
            category = TransactionCategory.POS_PURCHASE

        # Attempt to match with existing Receipt
        # Statement is in IRR, Receipt is in Toman (divide IRR by 10)
        toman_amount = row.debit_irr // 10
        if row.debit_irr > 0 and (row.tracking_number or row.destination_card):
            candidate = next(
                (
                    r for r in existing_receipts
                    if (
                        (r.tracking_code and row.tracking_number and r.tracking_code == row.tracking_number)
                        or (
                            r.amount == toman_amount
                            and r.date_jalali == row.date_jalali[:10]
                            and r.to_account
                            and r.to_account.card_number == row.destination_card
                        )
                    )
                ),
                None
            )
            if candidate:
                matched_rec = candidate
                decision = ReviewDecision.MATCHED_EXISTING

        tx = BankTransaction(
            statement_import=batch,
            statement_row_num=row.statement_row_num,
            excel_row_num=row.excel_row_num,
            date_jalali=row.date_jalali,
            description=row.description,
            document_number=row.document_number,
            cheque_number=row.cheque_number,
            reference_number=row.reference_number,
            tracking_number=row.tracking_number,
            destination_card=row.destination_card,
            sender_card=row.sender_card,
            credit_irr=Decimal(str(row.credit_irr)),
            debit_irr=Decimal(str(row.debit_irr)),
            balance_irr=Decimal(str(row.balance_irr)),
            user_note=row.user_note,
            category=category,
            matched_receipt=matched_rec,
            review_decision=decision,
            fingerprint=fingerprint,
        )
        staged_transactions.append(tx)

    BankTransaction.objects.bulk_create(staged_transactions)

    # Post-process: Link internal transfer pairs
    internal_transfers = BankTransaction.objects.filter(
        category=TransactionCategory.INTERNAL_TRANSFER,
        reference_number__isnull=False
    ).exclude(reference_number='')

    ref_map = defaultdict(list)
    for itx in internal_transfers:
        ref_map[itx.reference_number].append(itx)

    for ref, pair in ref_map.items():
        if len(pair) == 2 and pair[0].statement_import_id != pair[1].statement_import_id:
            pair[0].paired_transaction = pair[1]
            pair[1].paired_transaction = pair[0]
            pair[0].save(update_fields=['paired_transaction'])
            pair[1].save(update_fields=['paired_transaction'])

    return batch, True
