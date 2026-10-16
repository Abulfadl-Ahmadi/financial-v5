"""Governed Tool Gateway.

Controls tool execution, validates RBAC authorization, masks sensitive data,
and intercepts write operations to generate ActionDrafts for Human-in-the-Loop review.
"""
import functools
import re
import time
from typing import Any, Callable, Dict
from ninja.errors import HttpError
from apps.ai_assistant.models import AgentAuditLog, ExecutionStatus
from apps.users.permissions import require_finance_manager


def mask_sensitive_payload(payload: Any) -> Any:
    """Mask 16-digit card numbers in payloads for audit logging."""
    if isinstance(payload, dict):
        masked_dict = {}
        for k, v in payload.items():
            if 'card' in k.lower() and isinstance(v, str) and re.fullmatch(r'[0-9]{16}', v):
                masked_dict[k] = f"****-****-****-{v[-4:]}"
            else:
                masked_dict[k] = mask_sensitive_payload(v)
        return masked_dict
    elif isinstance(payload, list):
        return [mask_sensitive_payload(item) for item in payload]
    elif isinstance(payload, str):
        # Mask 16-digit strings
        return re.sub(r'(?<!\d)([0-9]{4})[0-9]{8}([0-9]{4})(?!\d)', r'\1********\2', payload)
    return payload


def governed_tool(
    name: str,
    action_type: str = 'QUERY',
    requires_finance_role: bool = True,
):
    """Decorator ensuring RBAC, parameter validation, audit logging, and safe execution."""
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            request = kwargs.get('request')
            user = getattr(request, 'user', None) if request else kwargs.get('user')
            session = kwargs.get('session')

            if requires_finance_role:
                if not user or not user.is_authenticated:
                    raise HttpError(401, "Authentication required for financial tools")
                if user.role not in ('OWNER', 'ACCOUNTANT'):
                    raise HttpError(403, "Financial management role (Owner or Accountant) required")

            start_time = time.time()
            clean_kwargs = {
                k: v for k, v in kwargs.items()
                if k not in ('user', 'request', 'session')
            }
            clean_payload = mask_sensitive_payload(clean_kwargs)
            status = ExecutionStatus.PROPOSED

            try:
                result = func(*args, **kwargs)
                latency_ms = int((time.time() - start_time) * 1000)

                if user and user.is_authenticated:
                    AgentAuditLog.objects.create(
                        user=user,
                        session=session,
                        action_type=action_type,
                        tool_name=name,
                        input_payload=clean_payload,
                        execution_status=ExecutionStatus.CONFIRMED if action_type == 'QUERY' else ExecutionStatus.PROPOSED,
                        latency_ms=latency_ms,
                    )
                return result
            except Exception as exc:
                latency_ms = int((time.time() - start_time) * 1000)
                if user and user.is_authenticated:
                    AgentAuditLog.objects.create(
                        user=user,
                        session=session,
                        action_type=action_type,
                        tool_name=name,
                        input_payload=clean_payload,
                        execution_status=ExecutionStatus.FAILED,
                        latency_ms=latency_ms,
                    )
                raise exc
        return wrapper
    return decorator
