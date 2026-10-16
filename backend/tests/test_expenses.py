from django.test import TestCase
from django.contrib.auth import get_user_model
from ninja_jwt.tokens import RefreshToken
from apps.users.models import UserRole
from apps.financial.models import Account, Expense, ExpenseCategory

class ExpenseTests(TestCase):
    def setUp(self):
        self.account = Account.objects.create(
            f_name="علی",
            l_name="رضایی",
            card_number="6037991234567890",
            is_workshop_account=True
        )
        manager = get_user_model().objects.create_user(username='expenses-manager', password='test-password', role=UserRole.ACCOUNTANT)
        self.client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {RefreshToken.for_user(manager).access_token}'

    def test_create_expense(self):
        payload = {
            "title": "اجاره تیر",
            "category": "RENT",
            "amount": 5000000,
            "date_jalali": "1402/04/01",
            "account_id": self.account.id,
            "notes": "بابت اجاره کارگاه"
        }
        response = self.client.post("/api/financial/expenses", data=payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["title"], "اجاره تیر")
        self.assertEqual(data["category"], "RENT")
        self.assertEqual(data["amount"], "5000000")
        self.assertEqual(data["account"]["id"], self.account.id)

    def test_list_expenses(self):
        Expense.objects.create(
            title="اجاره تیر",
            category="RENT",
            amount=5000000,
            date_jalali="1402/04/01"
        )
        Expense.objects.create(
            title="قبض برق",
            category="ELECTRICITY",
            amount=100000,
            date_jalali="1402/04/05"
        )
        response = self.client.get("/api/financial/expenses")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)

    def test_filter_expenses(self):
        Expense.objects.create(
            title="اجاره تیر",
            category="RENT",
            amount=5000000,
            date_jalali="1402/04/01"
        )
        Expense.objects.create(
            title="قبض برق",
            category="ELECTRICITY",
            amount=100000,
            date_jalali="1402/04/05"
        )
        response = self.client.get("/api/financial/expenses?category=RENT")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["category"], "RENT")

    def test_update_expense(self):
        expense = Expense.objects.create(
            title="اجاره تیر",
            category="RENT",
            amount=5000000,
            date_jalali="1402/04/01"
        )
        payload = {
            "amount": 6000000,
            "notes": "افزایش اجاره"
        }
        response = self.client.put(f"/api/financial/expenses/{expense.id}", data=payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["amount"], "6000000")
        self.assertEqual(data["notes"], "افزایش اجاره")

        expense.refresh_from_db()
        self.assertEqual(expense.amount, 6000000)

    def test_delete_expense(self):
        expense = Expense.objects.create(
            title="اجاره تیر",
            category="RENT",
            amount=5000000,
            date_jalali="1402/04/01"
        )
        response = self.client.delete(f"/api/financial/expenses/{expense.id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Expense.objects.count(), 0)

    def test_expenses_summary(self):
        Expense.objects.create(
            title="اجاره ۱",
            category="RENT",
            amount=5000000,
            date_jalali="1402/04/01"
        )
        Expense.objects.create(
            title="اجاره ۲",
            category="RENT",
            amount=5000000,
            date_jalali="1402/05/01"
        )
        Expense.objects.create(
            title="قبض برق",
            category="ELECTRICITY",
            amount=100000,
            date_jalali="1402/04/05"
        )
        response = self.client.get("/api/financial/expenses/summary")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["RENT"], "10000000")
        self.assertEqual(data["ELECTRICITY"], "100000")

    def test_expense_paying_account_must_be_workshop_account(self):
        """Test Issue #13: Paying account on expense must be a workshop account."""
        personal_acc = Account.objects.create(
            f_name="محمد",
            l_name="کارگر",
            card_number="5022291234567890",
            is_workshop_account=False
        )
        payload = {
            "title": "خرید وسایل متفرقه",
            "category": "SUPPLIES",
            "amount": 250000,
            "date_jalali": "1405/01/10",
            "account_id": personal_acc.id
        }
        res = self.client.post("/api/financial/expenses", data=payload, content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertIn("باید متعلق به کارگاه باشد", res.json().get("detail", ""))

    def test_update_expense_can_detach_account(self):
        """Test Issue #15: Updating an expense with explicit account_id=null clears the paying account."""
        expense = Expense.objects.create(
            title="خرید چرخ‌خیاطی لوازم",
            category="MAINTENANCE",
            amount=800000,
            date_jalali="1405/02/01",
            account=self.account
        )
        self.assertIsNotNone(expense.account)

        # Update with account_id: None
        update_payload = {
            "account_id": None
        }
        res = self.client.put(f"/api/financial/expenses/{expense.id}", data=update_payload, content_type="application/json")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.json()["account"])

        expense.refresh_from_db()
        self.assertIsNone(expense.account)
