"""Financial tools executed through the governed agent gateway."""
import hashlib
from decimal import Decimal
from typing import Any, Dict, List, Optional
from django.db.models import Q
from ninja.errors import HttpError

from apps.ai_assistant.models import ActionDraft, ActionDraftType, ActionDraftStatus, ConversationSession
from apps.ai_assistant.tools.gateway import governed_tool
from apps.financial.models import Account, BankDeposit, Expense, ExpenseCategory, Receipt, ReceiptStatus, ReceiptType
from apps.financial.ownership import normalize_card
from apps.users.models import Party, PartyKind


@governed_tool(name="draft_receipt", action_type="DRAFT_RECEIPT", requires_finance_role=True)
def draft_receipt(
    *,
    user,
    session: ConversationSession,
    amount_toman: int,
    tracking_code: str,
    date_jalali: str,
    to_card_number: Optional[str] = None,
    to_account_id: Optional[int] = None,
    from_account_id: Optional[int] = None,
    receipt_type: str = ReceiptType.SEWING_PAYROLL,
    notes: str = "",
    time_str: Optional[str] = None,
    **kwargs
) -> ActionDraft:
    """Validate parameters and emit an ActionDraft for a new payment receipt."""
    if amount_toman <= 0:
        raise HttpError(400, "مبلغ فیش واریزی باید بزرگتر از صفر باشد.")
    if not tracking_code:
        raise HttpError(400, "شماره پیگیری واریز الزامی است.")
    if not date_jalali:
        raise HttpError(400, "تاریخ شمسی واریز الزامی است.")
    if receipt_type not in ReceiptType.values:
        raise HttpError(400, f"نوع فیش نامعتبر است: {receipt_type}")

    # Resolve from_account (must be workshop paying account)
    from_acc = None
    if from_account_id:
        from_acc = Account.objects.filter(id=from_account_id, is_workshop_account=True, is_active=True).first()
    if not from_acc:
        from_acc = Account.objects.filter(is_workshop_account=True, is_active=True).first()
    if not from_acc:
        raise HttpError(400, "حساب پرداخت کارگاه در سیستم یافت نشد.")

    # Resolve destination
    to_acc = None
    clean_to_card = None
    if to_account_id:
        to_acc = Account.objects.filter(id=to_account_id, is_active=True).first()
    elif to_card_number:
        clean_num = str(to_card_number or '').translate(str.maketrans('۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '01234567890123456789'))
        clean_num = ''.join(c for c in clean_num if c.isdigit())
        if len(clean_num) == 16:
            clean_to_card = clean_num
            to_acc = Account.objects.filter(card_number=clean_to_card, is_active=True).first()
        elif len(clean_num) == 4:
            to_acc = Account.objects.filter(card_number__endswith=clean_num, is_active=True).first()
            if to_acc:
                clean_to_card = to_acc.card_number
            else:
                clean_to_card = clean_num
        elif clean_num:
            clean_to_card = clean_num

    payload: Dict[str, Any] = {
        'amount': amount_toman,
        'tracking_code': tracking_code,
        'date_jalali': date_jalali,
        'time_str': time_str,
        'from_account_id': from_acc.id,
        'from_account_name': from_acc.f_name or 'حساب کارگاه',
        'from_account_card': f"****-****-****-{from_acc.card_number[-4:]}",
        'to_account_id': to_acc.id if to_acc else None,
        'to_card_number': clean_to_card or (to_acc.card_number if to_acc else None),
        'to_holder_name': to_acc.f_name if to_acc else 'دارنده حساب',
        'receipt_type': receipt_type,
        'notes': notes,
    }

    idemp_str = f"RECEIPT:{tracking_code}:{amount_toman}:{from_acc.id}:{payload['to_card_number']}"
    idempotency_key = hashlib.sha256(idemp_str.encode('utf-8')).hexdigest()

    existing = ActionDraft.objects.filter(idempotency_key=idempotency_key).first()
    if existing:
        return existing

    draft = ActionDraft.objects.create(
        session=session,
        action_type=ActionDraftType.CREATE_RECEIPT,
        payload=payload,
        status=ActionDraftStatus.PENDING_APPROVAL,
        idempotency_key=idempotency_key,
    )
    return draft


@governed_tool(name="draft_expense", action_type="DRAFT_EXPENSE", requires_finance_role=True)
def draft_expense(
    *,
    user,
    session: ConversationSession,
    title: str,
    category: str,
    amount_toman: int,
    date_jalali: str,
    notes: str = "",
    account_id: Optional[int] = None,
    **kwargs
) -> ActionDraft:
    """Validate parameters and emit an ActionDraft for a workshop operational expense."""
    if amount_toman <= 0:
        raise HttpError(400, "مبلغ هزینه باید بزرگتر از صفر باشد.")
    if not title:
        raise HttpError(400, "عنوان هزینه الزامی است.")
    if category not in ExpenseCategory.values:
        raise HttpError(400, f"دسته‌بندی هزینه نامعتبر است: {category}")
    if not date_jalali:
        raise HttpError(400, "تاریخ شمسی ثبت هزینه الزامی است.")

    acc = None
    if account_id:
        acc = Account.objects.filter(id=account_id, is_workshop_account=True, is_active=True).first()

    payload = {
        'title': title,
        'category': category,
        'amount': amount_toman,
        'date_jalali': date_jalali,
        'notes': notes,
        'account_id': acc.id if acc else None,
        'account_card': f"****-****-****-{acc.card_number[-4:]}" if acc else None,
    }

    idemp_str = f"EXPENSE:{title}:{category}:{amount_toman}:{date_jalali}"
    idempotency_key = hashlib.sha256(idemp_str.encode('utf-8')).hexdigest()

    existing = ActionDraft.objects.filter(idempotency_key=idempotency_key).first()
    if existing:
        return existing

    draft = ActionDraft.objects.create(
        session=session,
        action_type=ActionDraftType.CREATE_EXPENSE,
        payload=payload,
        status=ActionDraftStatus.PENDING_APPROVAL,
        idempotency_key=idempotency_key,
    )
    return draft


@governed_tool(name="search_parties_and_cards", action_type="QUERY", requires_finance_role=True)
def search_parties_and_cards(*, query: str, **kwargs) -> List[Dict[str, Any]]:
    """Search counterparties (tailors, ironers, suppliers, clients) and their cards."""
    q = query.strip()
    accounts = Account.objects.filter(is_active=True).select_related('owner', 'user')

    if q:
        accounts = accounts.filter(
            Q(f_name__icontains=q) |
            Q(l_name__icontains=q) |
            Q(card_number__endswith=q) |
            Q(owner__display_name__icontains=q)
        )

    results = []
    for a in accounts[:20]:
        results.append({
            'account_id': a.id,
            'holder_name': f"{a.f_name} {a.l_name}".strip() or a.owner.display_name,
            'bank_name': a.bank_name,
            'masked_card': f"****-****-****-{a.card_number[-4:]}",
            'last4': a.card_number[-4:],
            'is_workshop_account': a.is_workshop_account,
            'role': a.user_role or a.owner.kind,
            'party_id': a.owner_id,
        })
    return results


@governed_tool(name="get_financial_kpi_summary", action_type="QUERY", requires_finance_role=True)
def get_financial_kpi_summary(**kwargs) -> Dict[str, Any]:
    """Retrieve verified workshop financial totals for conversational answering."""
    from apps.sewing.models import ContractOrder, SewingJob

    contract_orders = ContractOrder.objects.all()
    contract_revenue = sum(order.total_revenue for order in contract_orders) or 0.0

    sewing_jobs = SewingJob.objects.all()
    total_payroll = sum(job.total_payable_amount for job in sewing_jobs) or 0.0

    from django.db.models import Sum
    total_overhead = float(Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.0)
    net_profit = contract_revenue - (total_payroll + total_overhead)

    return {
        'total_revenue_toman': int(contract_revenue),
        'total_tailor_payroll_toman': int(total_payroll),
        'total_overhead_expenses_toman': int(total_overhead),
        'net_profit_toman': int(net_profit),
    }
