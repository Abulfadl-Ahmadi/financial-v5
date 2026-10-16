from ninja import Router, File, UploadedFile, Schema
from ninja.errors import HttpError
from typing import List
from apps.financial.models import Account, Receipt, Expense, ReceiptType, ReceiptStatus, BankDeposit, CardOwnershipLog
from apps.financial.schemas import (
    AccountOut, AccountIn, AccountUpdateIn, AccountRevealOut,
    ReceiptOut, ReceiptCreateIn, ReceiptUpdateIn,
    ExpenseOut, ExpenseIn, ExpenseUpdateIn,
    BankDepositIn, BankDepositOut, CardTransferIn
)
from apps.users.models import User, Party, PartyKind
from apps.financial.ownership import (
    CardConflict, normalize_card, get_user_party, register_card, create_external_card, snapshot_receipt_owners,
    register_bank_deposit, transfer_card_ownership, verify_workshop_deposit
)
from django.db import transaction
from ninja_jwt.authentication import JWTAuth
from django.db.models import Q, Sum

router = Router(tags=["Financial & Accounts (حسابداری و فیش‌ها)"])


def require_finance_manager(request):
    if request.user.role not in ('OWNER', 'ACCOUNTANT'):
        raise HttpError(403, 'Financial management permission required')


@router.get("/accounts", response=List[AccountOut], auth=JWTAuth())
def list_accounts(request):
    require_finance_manager(request)
    return Account.objects.select_related('owner', 'user').all().order_by('-is_active', '-id')

@router.get("/accounts/{account_id}/reveal", response=AccountRevealOut, auth=JWTAuth())
def reveal_account_card(request, account_id: int):
    require_finance_manager(request)
    try:
        account = Account.objects.get(id=account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")
    return {"id": account.id, "card_number": account.card_number}

@router.post("/accounts", response=AccountOut, auth=JWTAuth())
@transaction.atomic
def create_account(request, payload: AccountIn):
    require_finance_manager(request)
    user = User.objects.filter(id=payload.user_id).first() if payload.user_id else None
    if payload.user_id and not user:
        raise HttpError(404, 'User not found')
    if user and payload.party_id and user.party_id != payload.party_id:
        raise HttpError(400, 'Party and user do not match')
    if payload.party_id:
        party = Party.objects.filter(pk=payload.party_id).first()
        if not party:
            raise HttpError(404, 'Party not found')
        if not party.is_active:
            raise HttpError(409, 'Archived counterparties cannot receive new cards')
        if party.kind == PartyKind.WORKSHOP and user:
            raise HttpError(400, 'Workshop cards cannot be owned by an individual login')
    elif user:
        party = get_user_party(user)
    else:
        if payload.is_workshop_account:
            raise HttpError(400, 'Select an explicitly registered workshop party for paying accounts')
        party = Party.objects.create(
            display_name=f'{payload.f_name or ""} {payload.l_name or ""}'.strip() or 'طرف حساب بیرونی',
            kind=PartyKind.EXTERNAL,
        )
    try:
        if Account.objects.filter(card_number=normalize_card(payload.card_number)).exists():
            raise CardConflict('This card is already registered')
        return register_card(party=party, number=payload.card_number, first_name=payload.f_name or (user.first_name if user else ''),
                             last_name=payload.l_name or (user.last_name if user else ''),
                             primary=bool(payload.is_primary), workshop=bool(payload.is_workshop_account))
    except (ValueError, CardConflict) as exc:
        transaction.set_rollback(True)
        raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc

@router.put("/accounts/{account_id}", response=AccountOut, auth=JWTAuth())
@transaction.atomic
def update_account(request, account_id: int, payload: AccountUpdateIn):
    require_finance_manager(request)
    try:
        account = Account.objects.get(id=account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")

    if payload.card_number is not None:
        try:
            card = normalize_card(payload.card_number)
        except ValueError as exc:
            raise HttpError(400, str(exc)) from exc
        if card != account.card_number:
            raise HttpError(409, 'Card identity is immutable; archive this card and register a new one')
        # A normalized spelling of the same PAN is allowed; no mutation is needed.
    if payload.f_name is not None:
        account.f_name = payload.f_name
    if payload.l_name is not None:
        account.l_name = payload.l_name
    if 'party_id' in payload.model_fields_set and payload.party_id != account.owner_id:
        raise HttpError(409, 'Account ownership changes require a reviewed transfer')
    if 'user_id' in payload.model_fields_set and payload.user_id != account.user_id:
        if payload.user_id is None and account.owner_id and not hasattr(account.owner, 'login_user'):
            account.user = None
        else:
            raise HttpError(409, 'Account ownership changes require a reviewed transfer')
    if payload.is_workshop_account is not None:
        if payload.is_workshop_account and (not account.owner_id or account.owner.kind != PartyKind.WORKSHOP):
            raise HttpError(409, 'Only a workshop-owned card may be a workshop paying account')
        account.is_workshop_account = payload.is_workshop_account
    if payload.is_active is True and not account.is_active:
        raise HttpError(409, 'Archived cards require reviewed reactivation')
    if account.owner_id and not account.owner.is_active and (payload.is_active is True or payload.is_primary is True):
        raise HttpError(409, 'Archived parties cannot activate a payment card')
    if payload.is_active is not None:
        account.is_active = payload.is_active
    if payload.is_primary is True:
        if not account.is_active:
            raise HttpError(400, 'An archived card cannot be primary')
        if not account.owner_id:
            raise HttpError(409, 'Card owner must be resolved before selecting a primary card')
        Party.objects.select_for_update().get(pk=account.owner_id)
        Account.objects.filter(owner=account.owner, is_primary=True).exclude(pk=account.pk).update(is_primary=False)
        account.is_primary = True
    elif payload.is_primary is False:
        account.is_primary = False
    if not account.is_active:
        account.is_primary = False
    account.save()
    if account.owner_id and hasattr(account.owner, 'login_user'):
        login_user = account.owner.login_user
        primary = Account.objects.filter(owner=account.owner, is_primary=True).first()
        primary_number = primary.card_number if primary else None
        if login_user.card_number != primary_number:
            login_user.card_number = primary_number
            login_user.save(update_fields=['card_number'])
    return account

@router.delete("/accounts/{account_id}", auth=JWTAuth())
@transaction.atomic
def delete_account(request, account_id: int):
    require_finance_manager(request)
    try:
        account = Account.objects.get(id=account_id)
        account.is_active = False
        account.is_primary = False
        account.save(update_fields=['is_active', 'is_primary'])
        if account.owner_id and hasattr(account.owner, 'login_user'):
            login_user = account.owner.login_user
            if login_user.card_number == account.card_number:
                login_user.card_number = None
                login_user.save(update_fields=['card_number'])
        return {'success': True, 'archived': True}
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")

@router.post("/accounts/{account_id}/transfer-owner", response=AccountOut, auth=JWTAuth())
def transfer_card_owner(request, account_id: int, payload: CardTransferIn):
    require_finance_manager(request)
    try:
        account = Account.objects.get(id=account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")

    try:
        new_party = Party.objects.get(id=payload.new_owner_party_id)
    except Party.DoesNotExist:
        raise HttpError(404, "Target party not found")

    try:
        return transfer_card_ownership(
            card=account,
            new_party=new_party,
            changed_by=request.user,
            reason=payload.reason or 'Owner transfer via API'
        )
    except (ValueError, CardConflict) as exc:
        raise HttpError(400, str(exc)) from exc

@router.get("/deposits", response=List[BankDepositOut], auth=JWTAuth())
def list_deposits(request):
    require_finance_manager(request)
    return BankDeposit.objects.select_related('owner').filter(is_active=True).order_by('-id')

@router.post("/deposits", response=BankDepositOut, auth=JWTAuth())
def create_deposit(request, payload: BankDepositIn):
    require_finance_manager(request)
    try:
        owner = Party.objects.get(id=payload.owner_id)
    except Party.DoesNotExist:
        raise HttpError(404, "Owner party not found")

    try:
        return register_bank_deposit(
            deposit_number=payload.deposit_number,
            bank_name=payload.bank_name,
            owner=owner,
            iban=payload.iban,
            title=payload.title,
            is_workshop=payload.is_verified_workshop_account,
            verified_by=request.user if payload.is_verified_workshop_account else None
        )
    except (ValueError, CardConflict) as exc:
        raise HttpError(400, str(exc)) from exc

@router.post("/deposits/{deposit_id}/verify", response=BankDepositOut, auth=JWTAuth())
def verify_deposit(request, deposit_id: int):
    require_finance_manager(request)
    try:
        return verify_workshop_deposit(deposit_id=deposit_id, verified_by=request.user)
    except (BankDeposit.DoesNotExist, PermissionError, CardConflict) as exc:
        status_code = 404 if isinstance(exc, BankDeposit.DoesNotExist) else 400
        raise HttpError(status_code, str(exc)) from exc

@router.get("/receipts", response=List[ReceiptOut], auth=JWTAuth())
def list_receipts(request):
    require_finance_manager(request)
    return Receipt.objects.select_related("from_account", "to_account").all().order_by("-created_at")

@router.post("/receipts", response=ReceiptOut, auth=JWTAuth())
@transaction.atomic
def create_receipt(request, payload: ReceiptCreateIn):
    require_finance_manager(request)
    from_acc = None
    try:
        from_acc = Account.objects.get(id=payload.from_account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "From account not found")

    if not from_acc.is_workshop_account:
        raise HttpError(400, "Source account must be an authorized workshop account")

    to_acc = None
    if payload.to_account_id:
        try:
            to_acc = Account.objects.get(id=payload.to_account_id)
        except Account.DoesNotExist:
            raise HttpError(404, "To account not found")
    elif payload.new_to_card_number:
        user = User.objects.filter(id=payload.user_id).first() if payload.user_id else None
        if payload.user_id and not user:
            raise HttpError(404, 'User not found')
        party = Party.objects.filter(pk=payload.party_id).first() if payload.party_id else None
        if payload.party_id and not party:
            raise HttpError(404, 'Party not found')
        try:
            to_acc = create_external_card(
                number=payload.new_to_card_number, first_name=payload.new_to_f_name or (user.first_name if user else ''),
                last_name=payload.new_to_l_name or (user.last_name if user else ''), user=user, party=party,
            )
        except (ValueError, CardConflict) as exc:
            transaction.set_rollback(True)
            raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc
    else:
        raise HttpError(400, "Either to_account_id or new_to_card_number is required")

    if from_acc.pk == to_acc.pk:
        raise HttpError(400, 'Source and destination must differ')
    if not from_acc.is_active or not to_acc.is_active:
        raise HttpError(400, 'Archived cards cannot be used in a new receipt')
    if ((from_acc.owner_id and not from_acc.owner.is_active) or
            (to_acc.owner_id and not to_acc.owner.is_active)):
        raise HttpError(400, 'An archived party cannot participate in a new receipt')
    # Older integrations may still insert Account rows without the new owner field.
    for account in (from_acc, to_acc):
        if account.owner_id is None:
            if account.user_id:
                account.owner = get_user_party(account.user)
            else:
                account.owner = Party.objects.create(
                    kind=PartyKind.EXTERNAL,
                    display_name=f'{account.f_name} {account.l_name}'.strip() or 'طرف حساب بیرونی',
                )
            account.save(update_fields=['owner'])
    existing = Receipt.objects.filter(tracking_code=payload.tracking_code).first()
    if existing:
        if (existing.from_account_id == from_acc.id and
                existing.to_account_id == to_acc.id and
                existing.amount == payload.amount):
            return existing
        raise HttpError(409, f"تراکنش با شماره پیگیری {payload.tracking_code} قبلاً ثبت شده است")

    status = payload.status or "VERIFIED"
    receipt = Receipt.objects.create(
        tracking_code=payload.tracking_code,
        date_jalali=payload.date_jalali,
        time_str=payload.time_str,
        atm_id=payload.atm_id,
        recovery_code=payload.recovery_code,
        from_account=from_acc,
        to_account=to_acc,
        amount=payload.amount,
        receipt_type=payload.receipt_type,
        status=status,
        notes=payload.notes,
        from_party_id=from_acc.owner_id,
        to_party_id=to_acc.owner_id,
    )
    return receipt

class BulkActionIn(Schema):
    ids: List[int]

@router.post("/receipts/bulk-verify", auth=JWTAuth())
def bulk_verify_receipts(request, payload: BulkActionIn):
    require_finance_manager(request)
    updated = Receipt.objects.filter(id__in=payload.ids).update(status=ReceiptStatus.VERIFIED)
    return {"success": True, "count": updated}

@router.post("/receipts/bulk-delete", auth=JWTAuth())
def bulk_delete_receipts(request, payload: BulkActionIn):
    require_finance_manager(request)
    deleted, _ = Receipt.objects.filter(id__in=payload.ids).delete()
    return {"success": True, "count": deleted}

@router.put("/receipts/{receipt_id}", response=ReceiptOut, auth=JWTAuth())
@transaction.atomic
def update_receipt(request, receipt_id: int, payload: ReceiptUpdateIn):
    require_finance_manager(request)
    try:
        receipt = Receipt.objects.get(id=receipt_id)
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")
    original_account_ids = (receipt.from_account_id, receipt.to_account_id)

    if payload.from_account_id:
        try:
            receipt.from_account = Account.objects.get(id=payload.from_account_id)
        except Account.DoesNotExist:
            raise HttpError(404, "From account not found")

    if payload.to_account_id:
        try:
            receipt.to_account = Account.objects.get(id=payload.to_account_id)
        except Account.DoesNotExist:
            raise HttpError(404, "To account not found")
    elif payload.new_to_card_number:
        user = User.objects.filter(id=payload.user_id).first() if payload.user_id else None
        if payload.user_id and not user:
            raise HttpError(404, 'User not found')
        party = Party.objects.filter(pk=payload.party_id).first() if payload.party_id else None
        if payload.party_id and not party:
            raise HttpError(404, 'Party not found')
        try:
            receipt.to_account = create_external_card(
                number=payload.new_to_card_number,
                first_name=payload.new_to_f_name or (user.first_name if user else ''),
                last_name=payload.new_to_l_name or (user.last_name if user else ''), user=user, party=party,
            )
        except (ValueError, CardConflict) as exc:
            transaction.set_rollback(True)
            raise HttpError(409 if isinstance(exc, CardConflict) else 400, str(exc)) from exc
    accounts_changed = (receipt.from_account_id, receipt.to_account_id) != original_account_ids
    if receipt.from_account_id == receipt.to_account_id:
        raise HttpError(400, 'Source and destination must differ')
    if accounts_changed and (not receipt.from_account.is_active or not receipt.to_account.is_active):
        raise HttpError(400, 'Archived cards cannot be selected for a receipt')
    if accounts_changed and ((receipt.from_account.owner_id and not receipt.from_account.owner.is_active) or
                             (receipt.to_account.owner_id and not receipt.to_account.owner.is_active)):
        raise HttpError(400, 'Archived parties cannot be selected for a receipt')
    if accounts_changed:
        for account in (receipt.from_account, receipt.to_account):
            if account.owner_id is None:
                account.owner = get_user_party(account.user) if account.user_id else Party.objects.create(
                    kind=PartyKind.EXTERNAL,
                    display_name=f'{account.f_name} {account.l_name}'.strip() or 'طرف حساب بیرونی',
                )
                account.save(update_fields=['owner'])
        snapshot_receipt_owners(receipt)

    if payload.tracking_code is not None:
        receipt.tracking_code = payload.tracking_code
    if payload.date_jalali is not None:
        receipt.date_jalali = payload.date_jalali
    if payload.time_str is not None:
        receipt.time_str = payload.time_str
    if payload.atm_id is not None:
        receipt.atm_id = payload.atm_id
    if payload.recovery_code is not None:
        receipt.recovery_code = payload.recovery_code
    if payload.amount is not None:
        receipt.amount = payload.amount
    if payload.receipt_type is not None:
        receipt.receipt_type = payload.receipt_type
    if payload.status is not None:
        receipt.status = payload.status
    if payload.notes is not None:
        receipt.notes = payload.notes
    if payload.remove_image:
        if receipt.image:
            receipt.image.delete(save=False)
            receipt.image = None

    receipt.save()
    return receipt

@router.delete("/receipts/{receipt_id}/image", response=ReceiptOut, auth=JWTAuth())
def delete_receipt_image(request, receipt_id: int):
    require_finance_manager(request)
    try:
        receipt = Receipt.objects.get(id=receipt_id)
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")

    if receipt.image:
        receipt.image.delete(save=False)
        receipt.image = None
        receipt.save(update_fields=['image'])
    return receipt

@router.post("/receipts/{receipt_id}/image", response=ReceiptOut, auth=JWTAuth())
def upload_receipt_image(request, receipt_id: int, file: UploadedFile = File(...)):
    require_finance_manager(request)
    try:
        receipt = Receipt.objects.get(id=receipt_id)
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")

    receipt.image.save(file.name, file)
    receipt.save()
    return receipt

@router.delete("/receipts/{receipt_id}", auth=JWTAuth())
def delete_receipt(request, receipt_id: int):
    require_finance_manager(request)
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        receipt.delete()
        return {"success": True}
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")

@router.get("/expenses", response=List[ExpenseOut], auth=JWTAuth())
def list_expenses(request, category: str = None, start_date: str = None, end_date: str = None):
    require_finance_manager(request)
    qs = Expense.objects.select_related("account").all().order_by("-created_at")
    if category:
        qs = qs.filter(category=category)
    if start_date:
        qs = qs.filter(date_jalali__gte=start_date)
    if end_date:
        qs = qs.filter(date_jalali__lte=end_date)
    return qs

@router.post("/expenses", response=ExpenseOut, auth=JWTAuth())
def create_expense(request, payload: ExpenseIn):
    require_finance_manager(request)
    account = None
    if payload.account_id:
        try:
            account = Account.objects.get(id=payload.account_id)
        except Account.DoesNotExist:
            raise HttpError(404, "Account not found")
        if not account.is_workshop_account and (not account.owner_id or account.owner.kind != PartyKind.WORKSHOP):
            raise HttpError(400, "حساب پرداخت‌کننده هزینه باید متعلق به کارگاه باشد")

    expense = Expense.objects.create(
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        date_jalali=payload.date_jalali,
        account=account,
        notes=payload.notes
    )
    return expense

@router.get("/expenses/summary", auth=JWTAuth())
def get_expenses_summary(request):
    require_finance_manager(request)
    summary = Expense.objects.values('category').annotate(total_amount=Sum('amount'))
    return {item['category']: item['total_amount'] for item in summary}

@router.put("/expenses/{expense_id}", response=ExpenseOut, auth=JWTAuth())
def update_expense(request, expense_id: int, payload: ExpenseUpdateIn):
    require_finance_manager(request)
    try:
        expense = Expense.objects.get(id=expense_id)
    except Expense.DoesNotExist:
        raise HttpError(404, "Expense not found")

    if 'account_id' in payload.model_fields_set:
        if payload.account_id is None:
            expense.account = None
        else:
            try:
                account = Account.objects.get(id=payload.account_id)
            except Account.DoesNotExist:
                raise HttpError(404, "Account not found")
            if not account.is_workshop_account and (not account.owner_id or account.owner.kind != PartyKind.WORKSHOP):
                raise HttpError(400, "حساب پرداخت‌کننده هزینه باید متعلق به کارگاه باشد")
            expense.account = account

    if payload.title is not None:
        expense.title = payload.title
    if payload.category is not None:
        expense.category = payload.category
    if payload.amount is not None:
        expense.amount = payload.amount
    if payload.date_jalali is not None:
        expense.date_jalali = payload.date_jalali
    if payload.notes is not None:
        expense.notes = payload.notes

    expense.save()
    return expense

@router.delete("/expenses/{expense_id}", auth=JWTAuth())
def delete_expense(request, expense_id: int):
    require_finance_manager(request)
    try:
        expense = Expense.objects.get(id=expense_id)
        expense.delete()
        return {"success": True}
    except Expense.DoesNotExist:
        raise HttpError(404, "Expense not found")

@router.get("/profitability-summary", auth=JWTAuth())
def get_profitability_summary(request):
    require_finance_manager(request)
    from apps.sewing.models import ContractOrder, SewingJob
    from apps.financial.models import ReceiptType, ReceiptStatus

    contract_orders = ContractOrder.objects.all()
    contract_revenue = sum(order.total_revenue for order in contract_orders) or 0.0

    # Receipts revenue: Only VERIFIED deposits from producers or incoming to workshop accounts
    verified_incoming_receipts = Receipt.objects.filter(
        status=ReceiptStatus.VERIFIED
    ).filter(
        Q(receipt_type=ReceiptType.PRODUCER_PAYMENT) |
        Q(to_account__is_workshop_account=True) |
        Q(to_party__kind=PartyKind.WORKSHOP)
    ).exclude(
        receipt_type__in=[ReceiptType.SEWING_PAYROLL, ReceiptType.CUTTING_PAYROLL, ReceiptType.FABRIC_PURCHASE]
    )

    receipts_revenue = float(verified_incoming_receipts.aggregate(total=Sum('amount'))['total'] or 0.0)

    # Use contract orders revenue if present, otherwise verified incoming receipts
    total_revenue = contract_revenue if contract_revenue > 0.0 else receipts_revenue

    sewing_jobs = SewingJob.objects.all()
    total_payroll = sum(job.total_payable_amount for job in sewing_jobs) or 0.0

    total_overhead = float(Expense.objects.aggregate(total=Sum('amount'))['total'] or 0.0)
    net_profit = total_revenue - (total_payroll + total_overhead)

    summary = Expense.objects.values('category').annotate(cat_total=Sum('amount'))
    breakdown = []
    for item in summary:
        cat_amount = float(item['cat_total'] or 0)
        pct = round((cat_amount / total_overhead * 100), 1) if total_overhead > 0 else 0.0
        breakdown.append({
            "category": item['category'],
            "amount": cat_amount,
            "percentage": pct
        })

    return {
        "totalRevenue": total_revenue,
        "totalPayroll": total_payroll,
        "totalOverhead": total_overhead,
        "netProfit": net_profit,
        "overheadBreakdown": breakdown
    }

from apps.financial.reconciliation.api import reconciliation_router
router.add_router('reconciliation/', reconciliation_router)
