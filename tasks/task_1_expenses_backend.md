# Task 1: Backend Expense & Overhead Management Module (`apps/financial`)

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). The workshop incurs specific operational overheads:
- **Rent**: Monthly workshop rent (اجاره مکان).
- **Utilities**: Electricity bill (قبض برق), Water bill (قبض آب), Gas bill (قبض گاز برای دیگ بخار اتو و آشپزخانه).
- **Supplies**: Polyester thread spools (دوک نخ پلی‌استر/زیگزال), machine needles (سوزن چرخ), machine oil (روغن چرخ).
- **Maintenance**: Sewing machine servicing, central steam boiler servicing (سرویس دیگ بخار اتو), electrical wiring & lighting repairs (تعویض لامپ و سیم‌کشی سوخته).
- **Welfare**: Tea & sugar for workers (چای و قند آشپزخانه).
- **Cleaning**: Workshop hygiene & cleaning products (نظافت و بهداشت).

## Objective
Implement backend models, Pydantic schemas, API endpoints, and tests for tracking all operational expense categories.

## Allowed Scope
- `backend/apps/financial/models.py`
- `backend/apps/financial/schemas.py`
- `backend/apps/financial/api.py`
- `backend/tests/test_expenses.py`

## Implementation Rules
1. **Models (`models.py`)**:
   - `ExpenseCategory` text choices:
     - `RENT` (اجاره مکان کارگاه)
     - `ELECTRICITY` (قبض برق)
     - `WATER` (قبض آب)
     - `GAS` (قبض گاز - دیگ بخار و آشپزخانه)
     - `SUPPLIES` (ملزومات دوخت - نخ، سوزن، روغن چرخ)
     - `MAINTENANCE` (تعمیر چرخ‌ها، دیگ بخار، برق‌کشی و روشنایی)
     - `WELFARE` (چای، قند و پذیرایی کارگران)
     - `CLEANING` (نظافت و بهداشت کارگاه)
     - `OTHER` (سایر هزینه‌ها)
   - `Expense` model fields:
     - `title`: CharField(max_length=200, verbose_name="عنوان هزینه")
     - `category`: CharField(choices=ExpenseCategory.choices, default=OTHER)
     - `amount`: DecimalField(max_digits=15, decimal_places=0, verbose_name="مبلغ به تومان")
     - `date_jalali`: CharField(max_length=10, verbose_name="تاریخ شمسی")
     - `account`: ForeignKey(Account, on_delete=SET_NULL, null=True, blank=True)
     - `notes`: TextField(blank=True, null=True)
     - `created_at`: DateTimeField(auto_now_add=True)

2. **Schemas (`schemas.py`)**:
   - `ExpenseIn`, `ExpenseOut`, `ExpenseUpdateIn`.

3. **API Endpoints (`api.py`)**:
   - `GET /api/financial/expenses`: List all expenses with filtering by category or date range.
   - `POST /api/financial/expenses`: Create new expense.
   - `PUT /api/financial/expenses/{expense_id}`: Update expense.
   - `DELETE /api/financial/expenses/{expense_id}`: Delete expense.
   - `GET /api/financial/expenses/summary`: Total expense amount grouped by category.

4. **Testing (`backend/tests/test_expenses.py`)**:
   - Write tests for expense creation, listing, updating, deletion, and summary calculations across all categories.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_expenses
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_1_expenses_backend.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
