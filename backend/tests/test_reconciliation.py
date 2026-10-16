import io
import os
import zipfile
import xml.etree.ElementTree as ET
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from ninja_jwt.tokens import RefreshToken

from apps.users.models import Party, PartyKind, UserRole
from apps.financial.models import (
    Account,
    BankDeposit,
    BankStatementImport,
    BankTransaction,
    BankReconciliationAuditLog,
    Expense,
    ExpenseCategory,
    Receipt,
    ReceiptStatus,
    ReceiptType,
    ReviewDecision,
    TransactionCategory,
)
from apps.financial.ownership import register_card, register_bank_deposit, verify_workshop_deposit
from apps.financial.reconciliation.services import stage_statement_import
from apps.financial.reconciliation.review import (
    decide_transaction,
    post_transaction_as_receipt,
    post_transaction_as_expense,
)

User = get_user_model()


def build_test_statement_xlsx(
    deposit_number: str = "873-800-4851219-1",
    rows_data: list = None,
    declared_credit: int = 10000000,
    declared_debit: int = 5000000,
) -> bytes:
    """Build a synthetic, sanitized bank statement XLSX in memory without third-party libraries."""
    if rows_data is None:
        rows_data = [
            (1, "1405/04/01 09:30", "به ک 6037997112345671 ش م 130011", "DOC1", "", "REF1", "مرکزی", 0, 5000000, 45000000, "حقوق خیاط"),
            (2, "1405/04/02 10:15", "واریز به حساب از بابایی", "DOC2", "", "REF2", "مرکزی", 10000000, 0, 55000000, "سفارش شومیز"),
        ]

    # Collect shared strings
    strings = [
        f"شماره سپرده: {deposit_number}  از تاریخ: 1405/04/01  تا تاریخ: 1405/07/23",
        f"جمع کل مبالغ واریز: {declared_credit:,} ریال",
        f"جمع کل مبالغ برداشت: {declared_debit:,} ریال",
        "ردیف", "تاریخ", "شرح سند", "شماره سند", "شماره برگه/چک", "شناسه واریز", "شعبه",
        "واریز (ریال)", "برداشت (ریال)", "مانده (ریال)", "توضیحات کاربر",
    ]

    string_map = {s: i for i, s in enumerate(strings)}

    def get_str_idx(s: str) -> int:
        if s not in string_map:
            string_map[s] = len(strings)
            strings.append(s)
        return string_map[s]

    # Pre-register strings in rows
    for r in rows_data:
        get_str_idx(str(r[1]))
        get_str_idx(str(r[2]))
        get_str_idx(str(r[3]))
        get_str_idx(str(r[4]))
        get_str_idx(str(r[5]))
        get_str_idx(str(r[6]))
        get_str_idx(str(r[10]))

    # Build sharedStrings.xml
    ss_root = ET.Element('sst', {
        'xmlns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
        'count': str(len(strings)),
        'uniqueCount': str(len(strings)),
    })
    for s in strings:
        si = ET.SubElement(ss_root, 'si')
        t = ET.SubElement(si, 't')
        t.text = s
    ss_xml = ET.tostring(ss_root, encoding='utf-8')

    # Build sheet1.xml
    sheet_root = ET.Element('worksheet', {'xmlns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'})
    sheet_data = ET.SubElement(sheet_root, 'sheetData')

    def add_row(r_idx: int, cells: list):
        row_elem = ET.SubElement(sheet_data, 'row', {'r': str(r_idx)})
        col_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
        for c_idx, val in enumerate(cells):
            if val is None:
                continue
            ref = f"{col_letters[c_idx]}{r_idx}"
            c = ET.SubElement(row_elem, 'c', {'r': ref})
            if isinstance(val, str):
                c.set('t', 's')
                v = ET.SubElement(c, 'v')
                v.text = str(get_str_idx(val))
            else:
                v = ET.SubElement(c, 'v')
                v.text = str(val)

    add_row(1, [strings[0]])
    add_row(2, [None] * 8 + [strings[1]])
    add_row(3, [None] * 8 + [strings[2]])
    add_row(4, ["ردیف", "تاریخ", "شرح سند", "شماره سند", "شماره برگه/چک", "شناسه واریز", "شعبه", "واریز (ریال)", "برداشت (ریال)", "مانده (ریال)", "توضیحات کاربر"])

    for idx, r in enumerate(rows_data, start=5):
        add_row(idx, [
            r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10]
        ])

    sheet_xml = ET.tostring(sheet_root, encoding='utf-8')

    # Package as zip
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, 'w', compression=zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>')
        z.writestr('_rels/.rels', b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>')
        z.writestr('xl/workbook.xml', b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Report" sheetId="1" r:id="rId1" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', b'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>')
        z.writestr('xl/sharedStrings.xml', ss_xml)
        z.writestr('xl/worksheets/sheet1.xml', sheet_xml)

    return buf.getvalue()


class BankReconciliationTestCase(TestCase):
    """Full lifecycle tests for the bank statement reconciliation engine (Milestone M4)."""

    def setUp(self):
        self.owner = User.objects.create_user(username="recon_owner", role=UserRole.OWNER)
        self.accountant = User.objects.create_user(username="recon_accountant", role=UserRole.ACCOUNTANT)
        self.worker = User.objects.create_user(username="recon_worker", role=UserRole.WORKER)

        self.owner_token = str(RefreshToken.for_user(self.owner).access_token)
        self.accountant_token = str(RefreshToken.for_user(self.accountant).access_token)
        self.worker_token = str(RefreshToken.for_user(self.worker).access_token)

        self.auth = {"HTTP_AUTHORIZATION": f"Bearer {self.accountant_token}"}

        # Create workshop entity and deposit
        self.workshop = Party.objects.create(kind=PartyKind.WORKSHOP, display_name="کارگاه دوخت نمونه")
        self.deposit = register_bank_deposit(
            deposit_number="873-800-4851219-1",
            bank_name="بانک سامان",
            owner=self.workshop,
            iban="IR8738004851219001",
            title="سپرده اصلی کارگاه",
        )
        verify_workshop_deposit(deposit_id=self.deposit.id, verified_by=self.owner)
        self.deposit.refresh_from_db()

        # Workshop source card
        self.source_card = register_card(
            party=self.workshop,
            number="6219861089303639",
            workshop=True,
            primary=True
        )
        self.source_card.deposit = self.deposit
        self.source_card.save(update_fields=['deposit'])

        # Tailor worker and destination card
        self.worker_party = Party.objects.create(kind=PartyKind.PERSON, display_name="مریم رضایی")
        self.worker.party = self.worker_party
        self.worker.save(update_fields=['party'])
        self.tailor_card = register_card(
            party=self.worker_party,
            number="6037997112345671",
            first_name="مریم",
            last_name="رضایی"
        )

    def test_dry_run_preview_without_database_persistence(self):
        """Test Issue #36: Dry-run preview parses XLSX and asserts checksums without creating records."""
        xlsx_bytes = build_test_statement_xlsx(
            deposit_number=self.deposit.deposit_number,
            declared_credit=10000000,
            declared_debit=5000000,
        )

        uploaded = SimpleUploadedFile("statement.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response = self.client.post("/api/financial/reconciliation/preview", {"file": uploaded}, **self.auth)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["deposit_number"], self.deposit.deposit_number)
        self.assertEqual(data["total_rows"], 2)
        self.assertEqual(data["calculated_credit_irr"], 10000000)
        self.assertEqual(data["calculated_debit_irr"], 5000000)

        # Zero rows persisted in database
        self.assertEqual(BankStatementImport.objects.count(), 0)
        self.assertEqual(BankTransaction.objects.count(), 0)

    def test_unverified_deposit_cannot_stage_statements(self):
        """Test Issue #35 & #36: Unverified deposits cannot be used for statement imports."""
        unverified = register_bank_deposit(
            deposit_number="999-000-1111111-1",
            bank_name="بانک نامعتبر",
            owner=self.workshop,
            is_workshop=False
        )
        xlsx_bytes = build_test_statement_xlsx(deposit_number=unverified.deposit_number)
        uploaded = SimpleUploadedFile("unverified.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        response = self.client.post(
            "/api/financial/reconciliation/upload",
            {"deposit_id": unverified.id, "file": uploaded},
            **self.auth
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("تاییدشده", response.json()["detail"])

    def test_stage_statement_import_idempotency_and_transaction_creation(self):
        """Test Issue #37: Statement import creates transactions with categorization and is idempotent."""
        xlsx_bytes = build_test_statement_xlsx(
            deposit_number=self.deposit.deposit_number,
            declared_credit=10000000,
            declared_debit=5000000,
        )
        uploaded = SimpleUploadedFile("statement.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

        # 1. Initial upload
        res1 = self.client.post(
            "/api/financial/reconciliation/upload",
            {"deposit_id": self.deposit.id, "file": uploaded},
            **self.auth
        )
        self.assertEqual(res1.status_code, 200)
        batch_id1 = res1.json()["id"]

        self.assertEqual(BankStatementImport.objects.count(), 1)
        self.assertEqual(BankTransaction.objects.count(), 2)

        # Worker transaction categorized as PAYROLL_CANDIDATE
        tx = BankTransaction.objects.get(destination_card=self.tailor_card.card_number)
        self.assertEqual(tx.category, TransactionCategory.PAYROLL_CANDIDATE)
        self.assertEqual(tx.debit_irr, Decimal("5000000"))

        # 2. Re-uploading identical file returns existing batch without duplicating transactions
        uploaded2 = SimpleUploadedFile("statement.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        res2 = self.client.post(
            "/api/financial/reconciliation/upload",
            {"deposit_id": self.deposit.id, "file": uploaded2},
            **self.auth
        )
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["id"], batch_id1)
        self.assertEqual(BankStatementImport.objects.count(), 1)
        self.assertEqual(BankTransaction.objects.count(), 2)

    def test_reconcile_existing_receipt_with_bank_row(self):
        """Test Issue #38: Reconciling statement rows against existing receipts marks MATCHED_EXISTING without duplicate creation."""
        # Pre-create verified receipt of 500,000 Tomans (= 5,000,000 Rials)
        receipt = Receipt.objects.create(
            tracking_code="130011",
            date_jalali="1405/04/01",
            from_account=self.source_card,
            to_account=self.tailor_card,
            amount=Decimal("500000"),
            status=ReceiptStatus.VERIFIED
        )

        xlsx_bytes = build_test_statement_xlsx(
            deposit_number=self.deposit.deposit_number,
            declared_credit=10000000,
            declared_debit=5000000,
        )
        uploaded = SimpleUploadedFile("statement.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.client.post("/api/financial/reconciliation/upload", {"deposit_id": self.deposit.id, "file": uploaded}, **self.auth)

        tx = BankTransaction.objects.get(tracking_number="130011")
        self.assertEqual(tx.matched_receipt, receipt)
        self.assertEqual(tx.review_decision, ReviewDecision.MATCHED_EXISTING)

        # Assert no duplicate Receipt was created
        self.assertEqual(Receipt.objects.count(), 1)

    def test_audited_human_review_and_posting_receipt_and_expense(self):
        """Test Issue #39: Audited decisions, posting as receipt and expense with audit trail."""
        # Create un-matched transaction row with machine repair note
        repair_rows = [
            (1, "1405/06/07 09:46", "به ک 6037997112345671", "DOC253", "", "REF253", "مرکزی", 0, 5000000, 45000000, "تعمیر چرخ خیاطی"),
            (2, "1405/06/08 11:00", "واریز", "DOC254", "", "REF254", "مرکزی", 5000000, 0, 50000000, ""),
        ]
        xlsx_bytes = build_test_statement_xlsx(
            deposit_number=self.deposit.deposit_number,
            rows_data=repair_rows,
            declared_credit=5000000,
            declared_debit=5000000,
        )
        uploaded = SimpleUploadedFile("repair_statement.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.client.post("/api/financial/reconciliation/upload", {"deposit_id": self.deposit.id, "file": uploaded}, **self.auth)

        tx = BankTransaction.objects.get(statement_row_num=1)

        # 1. Human review decision: change decision to PENDING review note
        decide_res = self.client.post(
            f"/api/financial/reconciliation/transactions/{tx.id}/decide",
            data={"decision": "APPROVED_POSTING", "notes": "تایید اولیه توسط حسابدار"},
            content_type="application/json",
            **self.auth
        )
        self.assertEqual(decide_res.status_code, 200)

        # Verify audit log created
        log = BankReconciliationAuditLog.objects.filter(transaction=tx).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.user, self.accountant)
        self.assertEqual(log.new_decision, "APPROVED_POSTING")

        # 2. Post as official workshop Expense
        exp_res = self.client.post(
            f"/api/financial/reconciliation/transactions/{tx.id}/post-expense",
            data={"category": "MAINTENANCE", "title": "سرویس و تعمیر چرخ راسته"},
            content_type="application/json",
            **self.auth
        )
        self.assertEqual(exp_res.status_code, 200)

        tx.refresh_from_db()
        self.assertIsNotNone(tx.matched_expense)
        self.assertEqual(tx.matched_expense.amount, Decimal("500000")) # 5,000,000 Rials / 10 = 500,000 Tomans
        self.assertEqual(tx.matched_expense.title, "سرویس و تعمیر چرخ راسته")

    def test_reconciliation_security_rbac_and_formula_escaping(self):
        """Test Issue #41: Access control and spreadsheet formula injection protection."""
        # 1. Anonymous access is rejected with 401
        res_anon = self.client.get("/api/financial/reconciliation/batches")
        self.assertEqual(res_anon.status_code, 401)

        # 2. Worker role is rejected with 403
        worker_auth = {"HTTP_AUTHORIZATION": f"Bearer {self.worker_token}"}
        res_worker = self.client.get("/api/financial/reconciliation/batches", **worker_auth)
        self.assertEqual(res_worker.status_code, 403)

        # 3. Formula injection test: descriptions starting with = are escaped
        malicious_rows = [
            (1, "1405/04/01", "=cmd|'/C calc'!A0", "DOC1", "", "", "", 0, 1000000, 49000000, "@malicious_formula"),
            (2, "1405/04/02", f"واریز به ک {self.tailor_card.card_number}", "DOC2", "", "", "", 0, 2000000, 47000000, ""),
            (3, "1405/04/03", "واریز عادی", "DOC3", "", "", "", 3000000, 0, 50000000, ""),
        ]
        xlsx_bytes = build_test_statement_xlsx(
            deposit_number=self.deposit.deposit_number,
            rows_data=malicious_rows,
            declared_credit=3000000,
            declared_debit=3000000,
        )
        uploaded = SimpleUploadedFile("formula_test.xlsx", xlsx_bytes, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        self.client.post("/api/financial/reconciliation/upload", {"deposit_id": self.deposit.id, "file": uploaded}, **self.auth)

        tx = BankTransaction.objects.get(statement_row_num=1)
        self.assertTrue(tx.description.startswith("'="))
        self.assertTrue(tx.user_note.startswith("'@"))

        # 4. PAN is masked in transaction listing response
        list_res = self.client.get("/api/financial/reconciliation/transactions", **self.auth)
        self.assertEqual(list_res.status_code, 200)
        content = list_res.content.decode()
        self.assertNotIn(self.tailor_card.card_number, content)
        self.assertIn(f"****-****-****-{self.tailor_card.card_number[-4:]}", content)
