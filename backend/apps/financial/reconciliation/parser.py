"""Pure-Python zero-dependency XLSX parser for Iranian bank statements.

Reads bank statement worksheets using standard library zipfile and xml.etree,
normalizing Persian numerals, extracting card/tracking identifiers, validating
printed bank checksums, and protecting against spreadsheet formula injection.
"""
import io
import re
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from dataclasses import dataclass
from decimal import Decimal
from typing import Any, List, Optional


def normalize_digits(value: Any) -> str:
    """Normalize Persian and Arabic digits to ASCII Latin digits."""
    return ''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in str(value or ''))


def parse_irr_amount(value: Any) -> int:
    """Parse Iranian Rial (IRR) string to integer, cleaning separators."""
    clean = normalize_digits(value).replace(',', '').replace('٬', '').replace(' ', '')
    return int(clean or '0')


def sanitize_excel_cell(value: Any) -> str:
    """Prevent spreadsheet formula injection by escaping formula prefixes."""
    text = str(value or '').strip()
    if text.startswith(('=', '+', '-', '@')):
        return "'" + text
    return text


@dataclass
class ParsedBankRow:
    statement_row_num: int
    excel_row_num: int
    date_jalali: str
    description: str
    document_number: str
    cheque_number: str
    reference_number: str
    branch: str
    credit_irr: int
    debit_irr: int
    balance_irr: int
    user_note: str
    destination_card: Optional[str]
    sender_card: Optional[str]
    tracking_number: Optional[str]


@dataclass
class StatementParseResult:
    deposit_number: str
    iban: Optional[str]
    from_date_jalali: str
    to_date_jalali: str
    declared_credit_irr: int
    declared_debit_irr: int
    calculated_credit_irr: int
    calculated_debit_irr: int
    total_rows: int
    rows: List[ParsedBankRow]


def parse_bank_statement_xlsx(file_data: bytes | io.BytesIO) -> StatementParseResult:
    """Parse an Iranian bank statement XLSX worksheet into structured rows."""
    if isinstance(file_data, bytes):
        stream = io.BytesIO(file_data)
    else:
        stream = file_data

    if not zipfile.is_zipfile(stream):
        raise ValueError("فایل ارائه شده یک فایل اکسل معتبر (XLSX) نیست.")

    stream.seek(0)
    with zipfile.ZipFile(stream, 'r') as z:
        namelist = z.namelist()
        ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

        # 1. Read shared strings table
        shared_strings: List[str] = []
        if 'xl/sharedStrings.xml' in namelist:
            ss_tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in ss_tree.findall('x:si', ns):
                texts = [t.text for t in si.findall('.//x:t', ns) if t.text]
                shared_strings.append(''.join(texts))

        # 2. Locate worksheet
        sheet_path = 'xl/worksheets/sheet1.xml'
        if sheet_path not in namelist:
            candidates = [name for name in namelist if name.startswith('xl/worksheets/sheet')]
            if not candidates:
                raise ValueError("شیت صورت‌حساب در فایل اکسل یافت نشد.")
            sheet_path = candidates[0]

        sheet_tree = ET.fromstring(z.read(sheet_path))
        sheet_data = sheet_tree.find('x:sheetData', ns)
        if sheet_data is None:
            raise ValueError("محتوای شیت صورت‌حساب خالی است.")

        parsed_rows: List[dict[str, str]] = []
        for r in sheet_data.findall('x:row', ns):
            row_dict: dict[str, str] = {}
            for c in r.findall('x:c', ns):
                cell_ref = c.get('r')
                if not cell_ref:
                    continue
                match = re.match(r'([A-Z]+)', cell_ref)
                if not match:
                    continue
                col_letter = match.group(1)
                cell_type = c.get('t')
                v = c.find('x:v', ns)
                val = v.text if v is not None else None
                if cell_type == 's' and val is not None:
                    idx = int(val)
                    val = shared_strings[idx] if idx < len(shared_strings) else val
                row_dict[col_letter] = val or ''
            parsed_rows.append(row_dict)

    if len(parsed_rows) < 5:
        raise ValueError("فایل اکسل تعداد سطرهای کافی برای یک صورت‌حساب بانکی معتبر را ندارد.")

    # Parse metadata from top rows
    meta_row0 = parsed_rows[0]
    meta_row1 = parsed_rows[1]
    meta_row2 = parsed_rows[2]

    col_a_text = normalize_digits(meta_row0.get('A', ''))
    dep_match = re.search(r'([0-9]{3,4}[-][0-9]{3,4}[-][0-9]{5,10}[-][0-9])', col_a_text)
    deposit_number = dep_match.group(1) if dep_match else ''
    if not deposit_number:
        # Fallback to plain contiguous deposit numbers
        clean_nums = re.findall(r'[0-9]{7,20}', col_a_text)
        deposit_number = clean_nums[0] if clean_nums else 'UNKNOWN-DEPOSIT'

    iban_match = re.search(r'(IR[0-9]{24})', col_a_text.upper().replace(' ', ''))
    iban = iban_match.group(1) if iban_match else None

    # Date range extraction
    date_matches = re.findall(r'(140[0-9]/[0-1][0-9]/[0-3][0-9])', col_a_text + ' ' + normalize_digits(meta_row1.get('A', '')))
    from_date = date_matches[0] if date_matches else ''
    to_date = date_matches[1] if len(date_matches) > 1 else from_date

    # Declared totals in metadata (IRR)
    declared_credit = 0
    declared_debit = 0
    for row in (meta_row1, meta_row2):
        row_str = ' '.join(row.values())
        if 'واریز' in row_str or 'بستانکار' in row_str:
            nums = re.findall(r'[\d,]+', normalize_digits(row_str))
            if nums:
                declared_credit = parse_irr_amount(nums[-1])
        if 'برداشت' in row_str or 'بدهکار' in row_str:
            nums = re.findall(r'[\d,]+', normalize_digits(row_str))
            if nums:
                declared_debit = parse_irr_amount(nums[-1])

    # Parse transaction rows (index 4 = physical row 5)
    parsed_transactions: List[ParsedBankRow] = []
    col_mapping = {'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7, 'I': 8, 'J': 9, 'K': 10}

    for idx, r in enumerate(parsed_rows[4:], start=1):
        if not r.get('A'):
            continue

        raw_num = r.get('A', '')
        date_str = normalize_digits(r.get('B', ''))
        raw_desc = r.get('C', '')
        desc = normalize_digits(raw_desc)
        doc_num = normalize_digits(r.get('D', ''))
        cheque_num = normalize_digits(r.get('E', ''))
        ref_num = normalize_digits(r.get('F', ''))
        branch = r.get('G', '')
        credit = parse_irr_amount(r.get('H', '0'))
        debit = parse_irr_amount(r.get('I', '0'))
        balance = parse_irr_amount(r.get('J', '0'))
        user_note = r.get('K', '')

        dest_match = re.search(r'به ک\s*([0-9]{16})(?!\d)', desc)
        sender_match = re.search(r'از ک\s*([0-9]{16})(?!\d)', desc)
        track_match = re.search(r'ش م\s*(\d+)', desc)

        item = ParsedBankRow(
            statement_row_num=int(float(normalize_digits(raw_num))),
            excel_row_num=idx + 4,
            date_jalali=date_str,
            description=sanitize_excel_cell(raw_desc),
            document_number=doc_num or None,
            cheque_number=cheque_num or None,
            reference_number=ref_num or None,
            branch=branch or '',
            credit_irr=credit,
            debit_irr=debit,
            balance_irr=balance,
            user_note=sanitize_excel_cell(user_note),
            destination_card=dest_match.group(1) if dest_match else None,
            sender_card=sender_match.group(1) if sender_match else None,
            tracking_number=track_match.group(1) if track_match else None,
        )
        parsed_transactions.append(item)

    calc_credit = sum(t.credit_irr for t in parsed_transactions)
    calc_debit = sum(t.debit_irr for t in parsed_transactions)

    # Checksum assertion if declared totals are present
    if declared_credit > 0 and calc_credit != declared_credit:
        raise ValueError(
            f"عدم تطابق سرجمع واریزها: جمع سطرها ({calc_credit:,} ریال) با سرجمع اعلامی بانک ({declared_credit:,} ریال) مغایرت دارد."
        )
    if declared_debit > 0 and calc_debit != declared_debit:
        raise ValueError(
            f"عدم تطابق سرجمع برداشت‌ها: جمع سطرها ({calc_debit:,} ریال) با سرجمع اعلامی بانک ({declared_debit:,} ریال) مغایرت دارد."
        )

    return StatementParseResult(
        deposit_number=deposit_number,
        iban=iban,
        from_date_jalali=from_date,
        to_date_jalali=to_date,
        declared_credit_irr=declared_credit,
        declared_debit_irr=declared_debit,
        calculated_credit_irr=calc_credit,
        calculated_debit_irr=calc_debit,
        total_rows=len(parsed_transactions),
        rows=parsed_transactions,
    )
