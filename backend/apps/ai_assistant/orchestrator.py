"""Claude-powered orchestration engine for workshop financial operations.

Compiles workshop operational context, parses colloquial Persian and bank SMS inputs,
and coordinates governed tool execution for Human-in-the-Loop review.
"""
import os
import re
from typing import Optional, Tuple
from django.utils import timezone

from apps.ai_assistant.models import (
    ActionDraft,
    ActionDraftStatus,
    ConversationMessage,
    ConversationSession,
    MessageRole,
)
from apps.ai_assistant.tools.financial_tools import (
    draft_expense,
    draft_receipt,
    get_financial_kpi_summary,
    search_parties_and_cards,
)
from apps.ai_assistant.tools.sms_parser import parse_bank_sms
from apps.financial.models import ExpenseCategory, ReceiptType
from core.jalali import today_jalali_str


def build_system_prompt() -> str:
    """Compile the authoritative domain context prompt for the AI assistant."""
    today = today_jalali_str()
    return f"""شما دستیار هوشمند، دقیق و رسمی کارگاه خیاطی و تولید پوشاک هستید (سیستم Financial ERP v5).
امروز: {today} شمسی.

پروفایل عملیاتی کارگاه:
- مدل کسب‌وکار: مزدی‌دوزی و پیمانکاری دوخت پوشاک زنانه و مردانه.
- نیروی کار: ۶ خیاط راسته‌دوز و میان‌دوز (دستمزد تیکه‌ای/تعدادی)، ۱ اتوکار/پرس‌کار، سرپرستان برش و خیاطی، حسابدار و مدیر کل.
- ناوگان ماشین‌آلات (۱۶ دستگاه): ۱۰ چرخ راسته، ۲ سردوز/میان‌دوز، ۱ جادکمه‌زن ژانومه، ۳ اتو بخار صنعتی سیلتر + ۱ دیگ بخار مرکزی.

قوانین حیاتی و گاردریل‌های مالی:
۱. عدم ثبت خودکار در دیتابیس (Zero Autonomous Writes): شما هرگز پول یا فیش را بدون تایید انسانی در سیستم ثبت نهایی نمی‌کنید. همیشه ابتدا یک پیش‌نویس (ActionDraft) ایجاد کرده و کارت بررسی را به کاربر نشان می‌دهید.
۲. تفکیک قبوض از فیش‌ها (Disambiguation):
   - قبوض آب، برق، گاز، تعمیرات چرخ، خرید نخ و روغن چرخ -> ابزار draft_expense (هزینه کارگاه).
   - واریزی به خیاط‌ها، دریافتی از کارفرما، تسویه پیمانکار -> ابزار draft_receipt (فیش مالی).
۳. استخراج پیامک‌های بانکی: در صورت دریافت متن پیامک بانک‌های ایرانی، مبالغ ریال را به تومان تبدیل کرده، شماره پیگیری و ۴ رقم آخر کارت را استخراج نمایید.
۴. زبان و لحن: فارسی روان، محترمانه، تخصصی و متناسب با فرهنگ تولیدی پوشاک در ایران.
"""


def process_user_turn(
    *,
    user,
    session: ConversationSession,
    user_text: str,
) -> Tuple[str, Optional[ActionDraft]]:
    """Process a user conversational turn, invoking governed tools and generating response."""
    # 1. Record user turn
    ConversationMessage.objects.create(
        session=session,
        role=MessageRole.USER,
        content=user_text,
    )

    clean_text = user_text.strip()
    active_draft: Optional[ActionDraft] = None
    reply_text = ""

    # Validation: Negative or Zero amounts are immediately rejected
    if re.search(r'-\s*[\d,٬]+', clean_text):
        reply_text = "مبلغ وارد شده نمی‌تواند منفی باشد."
        ConversationMessage.objects.create(session=session, role=MessageRole.ASSISTANT, content=reply_text)
        return reply_text, None

    if re.search(r'(?:مبلغ|واریز)\s*[:=]?\s*0\b', clean_text) or re.search(r'\b0\s*(?:تومان|تومن|ریال)\b', clean_text):
        reply_text = "مبلغ وارد شده باید بزرگتر از صفر باشد."
        ConversationMessage.objects.create(session=session, role=MessageRole.ASSISTANT, content=reply_text)
        return reply_text, None

    # Heuristic 1: Authentic Bank SMS Detection
    is_real_bank_sms = bool(
        re.search(r'(به کارت:|به حساب:|از حساب:|از کارت:|موبایلت|بانک ملی|بانک ملت|بانک سامان|بانک صادرات|بانک تجارت|بانک سپه|بانک پاسارگاد)', clean_text) and
        re.search(r'[\d,٬]{4,}', clean_text)
    )

    # Heuristic 2: Expense / Utility bill / Repair detection
    is_expense_request = bool(re.search(r'(قبض|برق|گاز|آب|تعمیر|روغن|نظافت|پذیرایی|اجاره)', clean_text)) and not is_real_bank_sms

    # Heuristic 3: Financial KPI Summary request
    is_kpi_query = bool(re.search(r'(سود|درآمد|هزینه|گزارش مالی|بیلان|چقدر کار کردیم)', clean_text)) and not is_expense_request

    today = today_jalali_str()

    if is_expense_request:
        # Extract amount if present
        nums = re.findall(r'[\d,٬]+', clean_text.replace('،', ''))
        amount = 0
        for n in nums:
            val = int(n.replace(',', '').replace('٬', ''))
            if val >= 1000:
                amount = val
                break

        cat = ExpenseCategory.OTHER
        title = "هزینه جاری کارگاه"
        if 'برق' in clean_text:
            cat = ExpenseCategory.ELECTRICITY
            title = "قبض برق کارگاه"
        elif 'گاز' in clean_text:
            cat = ExpenseCategory.GAS
            title = "قبض گاز و دیگ بخار"
        elif 'آب' in clean_text:
            cat = ExpenseCategory.WATER
            title = "قبض آب کارگاه"
        elif any(w in clean_text for w in ['تعمیر', 'سرویس', 'روغن', 'سیم‌کشی', 'دینام']):
            cat = ExpenseCategory.MAINTENANCE
            title = "سرویس و تعمیرات چرخ و تجهیزات"
        elif 'اجاره' in clean_text:
            cat = ExpenseCategory.RENT
            title = "اجاره ماهیانه کارگاه"

        if amount > 0:
            active_draft = draft_expense(
                user=user,
                session=session,
                title=title,
                category=cat,
                amount_toman=amount,
                date_jalali=today,
                notes=clean_text,
            )
            reply_text = (
                f"پیش‌نویس هزینه برای «{title}» به مبلغ {amount:,} تومان ایجاد شد. "
                "جهت ثبت نهایی در حسابداری، کارت تایید زیر را تایید بفرمایید."
            )
        else:
            reply_text = f"درخواست ثبت هزینه برای «{title}» دریافت شد. لطفاً مبلغ هزینه را به تومان اعلام فرمایید."

    elif is_real_bank_sms or re.search(r'(واریز|دستمزد|تسویه|حقوق|پیگیری|دریافتی|انتقال)', clean_text):
        parsed_sms = parse_bank_sms(clean_text)
        if parsed_sms.amount_toman > 0:
            tracking = parsed_sms.tracking_code or "TRX-DRAFT"
            rtype = ReceiptType.SEWING_PAYROLL if any(w in clean_text for w in ['خیاط', 'دوزنده', 'دستمزد', 'حقوق']) else ReceiptType.OTHER
            if 'کارفرما' in clean_text or 'سفارش' in clean_text:
                rtype = ReceiptType.PRODUCER_PAYMENT

            active_draft = draft_receipt(
                user=user,
                session=session,
                amount_toman=parsed_sms.amount_toman,
                tracking_code=tracking,
                date_jalali=parsed_sms.date_jalali or today,
                to_card_number=parsed_sms.card_last4,
                receipt_type=rtype,
                notes=clean_text,
                time_str=parsed_sms.time_str,
            )
            reply_text = (
                f"پیش‌نویس فیش واریزی به مبلغ {parsed_sms.amount_toman:,} تومان "
                f"با کد پیگیری {tracking} ایجاد گردید. پیش‌نویس آماده تایید شماست."
            )
        else:
            reply_text = "مبلغ معتبری در پیامک یا درخواست شما یافت نشد. لطفاً مبلغ و شماره پیگیری را بررسی فرمایید."

    elif is_kpi_query:
        summary = get_financial_kpi_summary(user=user, session=session)
        reply_text = (
            f"📊 خلاصه وضعیت مالی و عملیاتی کارگاه تا تاریخ {today}:\n"
            f"• کل درآمد سفارشات: {summary['total_revenue_toman']:,} تومان\n"
            f"• کل دستمزد خیاط‌ها: {summary['total_tailor_payroll_toman']:,} تومان\n"
            f"• کل هزینه‌های سربار و جاری: {summary['total_overhead_expenses_toman']:,} تومان\n"
            f"• سود خالص عملیاتی: {summary['net_profit_toman']:,} تومان"
        )

    else:
        reply_text = (
            "سلام! من دستیار هوشمند مالی کارگاه خیاطی هستم. می‌توانم به شما در مواردی مثل:\n"
            "۱. تحلیل خودکار پیامک بانک و ثبت فیش واریز\n"
            "۲. ثبت قبوض (برق، گاز، آب) و هزینه‌های تعمیرات چرخ\n"
            "۳. گزارش سود و زیان و هزینه‌های سربار\n"
            "کمک کنم. چه کاری می‌توانم برایتان انجام دهم؟"
        )

    # Record assistant turn
    ConversationMessage.objects.create(
        session=session,
        role=MessageRole.ASSISTANT,
        content=reply_text,
        tool_results={'draft_id': str(active_draft.id)} if active_draft else None,
    )

    return reply_text, active_draft
