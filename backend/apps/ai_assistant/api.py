import uuid
from typing import List, Optional
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from ninja import Router
from ninja.errors import HttpError
from ninja_jwt.authentication import JWTAuth

from apps.ai_assistant.models import (
    ActionDraft,
    ActionDraftStatus,
    ActionDraftType,
    ConversationSession,
)
from apps.ai_assistant.orchestrator import process_user_turn
from apps.ai_assistant.schemas import (
    ActionDraftOut,
    ChatMessageIn,
    ChatMessageOut,
    CommitDraftOut,
    ParseSmsIn,
    ParseSmsOut,
)
from apps.ai_assistant.tools.sms_parser import parse_bank_sms
from apps.financial.models import Account, Expense, Receipt, ReceiptStatus, ReceiptType
from apps.financial.ownership import create_external_card, normalize_card
from apps.users.permissions import require_finance_manager

ai_router = Router(tags=["AI Assistant (دستیار هوشمند مالی)"])


@ai_router.post("/chat", response=ChatMessageOut, auth=JWTAuth())
def chat_with_assistant(request, payload: ChatMessageIn):
    """Conversational interaction with the workshop financial assistant."""
    require_finance_manager(request)

    # Resolve or create conversation session
    if payload.session_id:
        try:
            session = ConversationSession.objects.get(id=uuid.UUID(payload.session_id), user=request.user)
        except (ConversationSession.DoesNotExist, ValueError):
            session = ConversationSession.objects.create(user=request.user)
    else:
        session = ConversationSession.objects.create(user=request.user)

    reply_text, active_draft = process_user_turn(
        user=request.user,
        session=session,
        user_text=payload.message,
    )

    draft_out = None
    if active_draft:
        draft_out = ActionDraftOut.from_orm(active_draft)

    return {
        "session_id": str(session.id),
        "reply": reply_text,
        "active_draft": draft_out,
    }


@ai_router.post("/drafts/{draft_id}/commit", response=CommitDraftOut, auth=JWTAuth())
@transaction.atomic
def commit_action_draft(request, draft_id: uuid.UUID):
    """Execute and commit an approved ActionDraft into the database (HITL)."""
    require_finance_manager(request)

    try:
        draft = ActionDraft.objects.select_for_update().get(id=draft_id)
    except ActionDraft.DoesNotExist:
        raise HttpError(404, "پیش‌نویس عملیات یافت نشد.")

    if draft.is_expired and draft.status == ActionDraftStatus.PENDING_APPROVAL:
        draft.status = ActionDraftStatus.EXPIRED
        draft.save(update_fields=['status'])
        raise HttpError(400, "مهلت تایید این پیش‌نویس به پایان رسیده است.")

    # Idempotency check: If already committed, return existing record
    if draft.status == ActionDraftStatus.COMMITTED and draft.committed_record_id:
        return {
            "success": True,
            "draft_id": draft.id,
            "action_type": draft.action_type,
            "status": draft.status,
            "record_id": draft.committed_record_id,
            "message": "این عملیات قبلاً با موفقیت ثبت شده است (پاسخ تکرارپذیر).",
        }

    if draft.status != ActionDraftStatus.PENDING_APPROVAL:
        raise HttpError(400, f"وضعیت پیش‌نویس برای ثبت نهایی مجاز نیست: {draft.status}")

    p = draft.payload
    record_id = 0

    if draft.action_type == ActionDraftType.CREATE_RECEIPT:
        from_acc = Account.objects.get(id=p['from_account_id'])
        to_acc = None
        if p.get('to_account_id'):
            to_acc = Account.objects.get(id=p['to_account_id'])
        elif p.get('to_card_number'):
            to_acc = create_external_card(
                number=p['to_card_number'],
                first_name=p.get('to_holder_name', 'دارنده حساب'),
            )
        else:
            to_acc = Account.objects.filter(is_active=True).exclude(id=from_acc.id).first()

        receipt = Receipt.objects.create(
            tracking_code=p['tracking_code'],
            date_jalali=p['date_jalali'],
            time_str=p.get('time_str'),
            from_account=from_acc,
            to_account=to_acc,
            amount=Decimal(str(p['amount'])),
            receipt_type=p.get('receipt_type', ReceiptType.OTHER),
            status=ReceiptStatus.VERIFIED,
            notes=p.get('notes', ''),
            from_party_id=from_acc.owner_id,
            to_party_id=to_acc.owner_id if to_acc else None,
        )
        record_id = receipt.id

    elif draft.action_type == ActionDraftType.CREATE_EXPENSE:
        acc = None
        if p.get('account_id'):
            acc = Account.objects.get(id=p['account_id'])

        expense = Expense.objects.create(
            title=p['title'],
            category=p['category'],
            amount=Decimal(str(p['amount'])),
            date_jalali=p['date_jalali'],
            account=acc,
            notes=p.get('notes', ''),
        )
        record_id = expense.id

    draft.status = ActionDraftStatus.COMMITTED
    draft.committed_record_id = record_id
    draft.committed_at = timezone.now()
    draft.save(update_fields=['status', 'committed_record_id', 'committed_at'])

    return {
        "success": True,
        "draft_id": draft.id,
        "action_type": draft.action_type,
        "status": draft.status,
        "record_id": record_id,
        "message": "عملیات با موفقیت در سیستم مالی ثبت نهایی شد.",
    }


@ai_router.post("/drafts/{draft_id}/reject", auth=JWTAuth())
def reject_action_draft(request, draft_id: uuid.UUID):
    """Discard an ActionDraft upon user rejection."""
    require_finance_manager(request)
    try:
        draft = ActionDraft.objects.get(id=draft_id)
    except ActionDraft.DoesNotExist:
        raise HttpError(404, "پیش‌نویس عملیات یافت نشد.")

    draft.status = ActionDraftStatus.DISCARDED
    draft.save(update_fields=['status'])
    return {"success": True, "draft_id": str(draft.id), "status": draft.status}


@ai_router.post("/parse-sms", response=ParseSmsOut, auth=JWTAuth())
def parse_sms_endpoint(request, payload: ParseSmsIn):
    """Parse raw Iranian banking SMS text into structured parameters."""
    require_finance_manager(request)
    parsed = parse_bank_sms(payload.text)
    return {
        "bank_name": parsed.bank_name,
        "amount_toman": parsed.amount_toman,
        "tracking_code": parsed.tracking_code,
        "card_last4": parsed.card_last4,
        "date_jalali": parsed.date_jalali,
        "time_str": parsed.time_str,
        "transaction_type": parsed.transaction_type,
    }


@ai_router.get("/drafts", response=List[ActionDraftOut], auth=JWTAuth())
def list_pending_drafts(request, session_id: Optional[str] = None):
    """List pending ActionDraft cards awaiting human confirmation."""
    require_finance_manager(request)
    qs = ActionDraft.objects.filter(status=ActionDraftStatus.PENDING_APPROVAL).order_by('-created_at')
    if session_id:
        try:
            qs = qs.filter(session_id=uuid.UUID(session_id))
        except ValueError:
            pass
    return qs
