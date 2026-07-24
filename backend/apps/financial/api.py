from ninja import Router
from ninja.errors import HttpError
from typing import List
from apps.financial.models import Account, Receipt
from apps.financial.schemas import AccountOut, AccountIn, AccountUpdateIn, ReceiptOut, ReceiptCreateIn, ReceiptUpdateIn
from apps.users.models import User

router = Router(tags=["Financial & Accounts (حسابداری و فیش‌ها)"])

@router.get("/accounts", response=List[AccountOut])
def list_accounts(request):
    return Account.objects.all().order_by("-id")

@router.post("/accounts", response=AccountOut)
def create_account(request, payload: AccountIn):
    if len(payload.card_number) != 16 or not payload.card_number.isdigit():
        raise HttpError(400, "Card number must be exactly 16 digits")
        
    user = User.objects.filter(id=payload.user_id).first() if payload.user_id else None
    
    account = Account.objects.create(
        f_name=payload.f_name,
        l_name=payload.l_name,
        card_number=payload.card_number,
        user=user
    )
    return account

@router.put("/accounts/{account_id}", response=AccountOut)
def update_account(request, account_id: int, payload: AccountUpdateIn):
    try:
        account = Account.objects.get(id=account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")
        
    if payload.card_number is not None:
        if len(payload.card_number) != 16 or not payload.card_number.isdigit():
            raise HttpError(400, "Card number must be exactly 16 digits")
        account.card_number = payload.card_number
        
    if payload.f_name is not None:
        account.f_name = payload.f_name
    if payload.l_name is not None:
        account.l_name = payload.l_name
    if payload.user_id is not None:
        user = User.objects.filter(id=payload.user_id).first() if payload.user_id else None
        account.user = user
        
    account.save()
    return account

@router.delete("/accounts/{account_id}")
def delete_account(request, account_id: int):
    try:
        account = Account.objects.get(id=account_id)
        account.delete()
        return {"success": True}
    except Account.DoesNotExist:
        raise HttpError(404, "Account not found")

@router.get("/receipts", response=List[ReceiptOut])
def list_receipts(request):
    return Receipt.objects.select_related("from_account", "to_account").all().order_by("-created_at")

@router.post("/receipts", response=ReceiptOut)
def create_receipt(request, payload: ReceiptCreateIn):
    try:
        from_acc = Account.objects.get(id=payload.from_account_id)
        to_acc = Account.objects.get(id=payload.to_account_id)
    except Account.DoesNotExist:
        raise HttpError(404, "From or To account not found")
        
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
        notes=payload.notes
    )
    return receipt

@router.put("/receipts/{receipt_id}", response=ReceiptOut)
def update_receipt(request, receipt_id: int, payload: ReceiptUpdateIn):
    try:
        receipt = Receipt.objects.get(id=receipt_id)
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")
        
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

    receipt.save()
    return receipt

@router.delete("/receipts/{receipt_id}")
def delete_receipt(request, receipt_id: int):
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        receipt.delete()
        return {"success": True}
    except Receipt.DoesNotExist:
        raise HttpError(404, "Receipt not found")
