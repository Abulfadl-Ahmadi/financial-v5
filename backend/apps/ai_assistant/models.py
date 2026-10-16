import uuid
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.utils import timezone


def default_draft_expiration():
    return timezone.now() + timedelta(minutes=15)


class MessageRole(models.TextChoices):
    USER = 'USER', 'کاربر'
    ASSISTANT = 'ASSISTANT', 'دستیار هوشمند'
    TOOL = 'TOOL', 'ابزار سیستمی'
    SYSTEM = 'SYSTEM', 'سیستم'


class ActionDraftType(models.TextChoices):
    CREATE_RECEIPT = 'CREATE_RECEIPT', 'ثبت فیش واریزی'
    CREATE_EXPENSE = 'CREATE_EXPENSE', 'ثبت هزینه کارگاه'
    REGISTER_CARD = 'REGISTER_CARD', 'ثبت کارت بانکی'


class ActionDraftStatus(models.TextChoices):
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'در انتظار تایید کاربر'
    COMMITTED = 'COMMITTED', 'تایید و ثبت نهایی شده'
    DISCARDED = 'DISCARDED', 'انصراف کاربر / رد شده'
    EXPIRED = 'EXPIRED', 'منقضی شده'


class ExecutionStatus(models.TextChoices):
    PROPOSED = 'PROPOSED', 'پیشنهاد اولیه'
    CONFIRMED = 'CONFIRMED', 'تایید شده'
    REJECTED = 'REJECTED', 'رد شده'
    FAILED = 'FAILED', 'ناموفق'


class ConversationSession(models.Model):
    """A conversational interaction session with the AI assistant."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_sessions')
    title = models.CharField(max_length=255, default='گفتگوی جدید')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.title} ({self.created_at:%Y/%m/%d})"


class ConversationMessage(models.Model):
    """An individual message turn within a conversation session."""
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=MessageRole.choices)
    content = models.TextField()
    tool_calls = models.JSONField(null=True, blank=True)
    tool_results = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"


class ActionDraft(models.Model):
    """Pre-commit checkpoint for financial actions awaiting human approval (HITL)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ConversationSession, on_delete=models.CASCADE, related_name='action_drafts')
    action_type = models.CharField(max_length=50, choices=ActionDraftType.choices)
    payload = models.JSONField()
    status = models.CharField(max_length=30, choices=ActionDraftStatus.choices, default=ActionDraftStatus.PENDING_APPROVAL)
    idempotency_key = models.CharField(max_length=64, unique=True, db_index=True)
    committed_record_id = models.IntegerField(null=True, blank=True)
    expires_at = models.DateTimeField(default=default_draft_expiration)
    committed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"{self.action_type} - {self.status} ({self.id})"


class AgentAuditLog(models.Model):
    """Immutable audit trail for all agent operations, tools, and human review decisions."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    session = models.ForeignKey(ConversationSession, null=True, blank=True, on_delete=models.SET_NULL)
    action_type = models.CharField(max_length=50)
    tool_name = models.CharField(max_length=100)
    input_payload = models.JSONField(default=dict)
    execution_status = models.CharField(max_length=30, choices=ExecutionStatus.choices)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    latency_ms = models.IntegerField(default=0)
    tokens_used = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.execution_status}] {self.user.username} {self.tool_name} ({self.created_at})"
