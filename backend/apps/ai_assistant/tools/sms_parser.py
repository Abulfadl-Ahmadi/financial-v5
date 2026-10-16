"""Deterministic parser for Iranian bank SMS formats across major banks.

Supports Bank Melli, Mellat, Saderat, Sepah, Saman, Pasargad, and Tejarat.
Normalizes Persian/Arabic numerals and converts Rial amounts to Toman.
"""
import re
import unicodedata
from dataclasses import dataclass
from typing import Optional


def normalize_digits(value: str) -> str:
    """Normalize Persian and Arabic digits to ASCII Latin digits."""
    return ''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in str(value or ''))


def parse_amount_to_toman(text: str) -> int:
    """Extract numeric amount and convert Rials to Toman if explicitly in Rials."""
    clean_text = normalize_digits(text)

    # Check for amount with currency indicator
    match = re.search(r'([\d,٬]+)\s*(ریال|تومان|ت|R)?', clean_text)
    if not match:
        # Fallback to plain numbers
        nums = re.findall(r'[\d,٬]+', clean_text)
        if not nums:
            return 0
        raw_num = nums[0].replace(',', '').replace('٬', '').strip()
        val = int(raw_num) if raw_num.isdigit() else 0
        return val // 10 if val >= 1000000 else val

    raw_val = match.group(1).replace(',', '').replace('٬', '').strip()
    val = int(raw_val) if raw_val.isdigit() else 0
    currency = match.group(2) or ''

    if 'ریال' in currency or currency == 'R':
        return val // 10
    elif 'تومان' in currency or currency == 'ت':
        return val
    else:
        # Heuristic: Iranian banking amounts over 500,000 without unit are typically Rials
        return val // 10 if val >= 1000000 else val


@dataclass
class ParsedBankSms:
    bank_name: str
    amount_toman: int
    tracking_code: Optional[str]
    card_last4: Optional[str]
    date_jalali: Optional[str]
    time_str: Optional[str]
    transaction_type: str  # 'DEPOSIT' or 'WITHDRAWAL'
    raw_text: str


def parse_bank_sms(text: str) -> ParsedBankSms:
    """Parse SMS text from 7 major Iranian banks."""
    clean = normalize_digits(text).strip()

    # Identify Bank
    bank_name = 'بانک نامشخص'
    if 'ملی' in text or 'بام' in text or '603799' in clean:
        bank_name = 'بانک ملی ایران'
    elif 'ملت' in text or '610433' in clean:
        bank_name = 'بانک ملت'
    elif 'صادرات' in text or 'سپهر' in text or '603769' in clean:
        bank_name = 'بانک صادرات'
    elif 'سامان' in text or 'موبایلت' in text or '621986' in clean:
        bank_name = 'بانک سامان'
    elif 'پاسارگاد' in text or '502229' in clean:
        bank_name = 'بانک پاسارگاد'
    elif 'تجارت' in text or '585983' in clean or '627353' in clean:
        bank_name = 'بانک تجارت'
    elif 'سپه' in text or '589210' in clean:
        bank_name = 'بانک سپه'

    # Transaction Type: Deposit vs Withdrawal
    tx_type = 'DEPOSIT'
    if any(w in text for w in ['برداشت', 'خرید', 'انتقال از', 'کسر', 'پایا خروجی']):
        tx_type = 'WITHDRAWAL'

    # Amount extraction
    amount_match = re.search(r'(?:مبلغ|واریز|برداشت|وجه|مبلغ:)\s*[:=]?\s*([\d,٬]+)\s*(ریال|تومان|ت)?', clean)
    if amount_match:
        amount_toman = parse_amount_to_toman(amount_match.group(0))
    else:
        amount_toman = parse_amount_to_toman(clean)

    # Tracking code extraction (پیگیری، ارجاع، مرجع، ش م، رهگیری)
    tracking_code = None
    track_match = re.search(
        r'(?:پیگیری|ارجاع|مرجع|رهگیری|کد پیگیری|ش\.پیگیری|ش م|شماره ارجاع|کد:)\s*[:=]?\s*([A-Za-z0-9_-]+)',
        clean
    )
    if track_match:
        tracking_code = track_match.group(1).strip()
    else:
        # Fallback standalone numeric tracking codes (6-16 digits)
        candidates = re.findall(r'(?<!\d)(?:1300\d{6,10}|\d{6,12})(?!\d)', clean)
        # Exclude amount or card numbers
        for c in candidates:
            if c != str(amount_toman) and c != str(amount_toman * 10) and len(c) != 16:
                tracking_code = c
                break

    # Card / Account Last 4 digits
    card_last4 = None
    card_match = re.search(r'(?:کارت|حساب|ک|به ک|از ک)\s*[:=]?\s*[\d*X\-]{0,12}(\d{4})(?!\d)', clean)
    if card_match:
        card_last4 = card_match.group(1)
    else:
        full_card = re.search(r'(?<!\d)([0-9]{16})(?!\d)', clean)
        if full_card:
            card_last4 = full_card.group(1)[-4:]

    # Date Jalali extraction (140x/xx/xx)
    date_jalali = None
    date_match = re.search(r'(140[0-9][/\-.][0-1]?[0-9][/\-.][0-3]?[0-9])', clean)
    if date_match:
        date_jalali = date_match.group(1).replace('-', '/').replace('.', '/')

    # Time extraction (HH:MM)
    time_str = None
    time_match = re.search(r'(?<!\d)([0-2]?[0-9]:[0-5][0-9])(?!\d)', clean)
    if time_match:
        time_str = time_match.group(1)
        if len(time_str) == 4 and time_str[1] == ':':
            time_str = '0' + time_str

    return ParsedBankSms(
        bank_name=bank_name,
        amount_toman=amount_toman,
        tracking_code=tracking_code,
        card_last4=card_last4,
        date_jalali=date_jalali,
        time_str=time_str,
        transaction_type=tx_type,
        raw_text=text,
    )
