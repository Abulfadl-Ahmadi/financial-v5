# Task 4: Frontend Financial Expenses & Net Profitability UI Module

## Global Context
Financial ERP v5 frontend is built with React 18, Vite, TypeScript, `shadcn/ui`, and Tailwind CSS with full RTL (Vazirmatn font) support. The workshop manager needs a dedicated UI view to log all workshop overhead expenses (rent, electricity, water, gas for boiler/kitchen, thread, needles, machine oil, boiler maintenance, wiring/lighting repairs, tea/sugar welfare, cleaning) and view net profitability.

## Objective
Build React UI views for managing workshop operational expenses and viewing the Net Profitability Dashboard.

## Allowed Scope
- `frontend/src/features/financial/ExpensesPage.tsx`
- `frontend/src/features/financial/ExpenseModal.tsx`
- `frontend/src/features/financial/NetProfitDashboard.tsx`
- `frontend/src/features/financial/types.ts`
- `frontend/src/features/financial/services.ts`

## Implementation Rules
1. **Types & Services (`types.ts`, `services.ts`)**:
   - Define TypeScript interfaces for `Expense`, `ExpenseCategory` (`RENT`, `ELECTRICITY`, `WATER`, `GAS`, `SUPPLIES`, `MAINTENANCE`, `WELFARE`, `CLEANING`, `OTHER`), and `ProfitabilitySummary`.
   - Add API fetch/axios calls targeting `/api/financial/expenses`.

2. **Expenses Page Component (`ExpensesPage.tsx`)**:
   - DataTable listing expenses with Jalali date, category badge, amount formatted in Tomans, and action buttons.
   - Filter dropdown by expense category (اجاره, برق, آب, گاز و دیگ بخار, ملزومات دوخت و روغن, تعمیرات و سیم‌کشی, چای و پذیرایی, نظافت).
   - "ثبت هزینه جدید" button opening `ExpenseModal`.

3. **Expense Modal (`ExpenseModal.tsx`)**:
   - Modal form for creating/editing expenses with category selector and quick preset buttons for common items (روغن چرخ, چای و قند, تعویض لامپ, سرویس دیگ بخار).

4. **Net Profitability Dashboard (`NetProfitDashboard.tsx`)**:
   - Summary cards:
     - 💵 **درآمد کل از پیمانکار** (Total Contractor Revenue)
     - 🧵 **کارمزد خیاط‌ها و اتوکار** (Total Worker Payroll)
     - 🏠 **هزینه‌های جاری و سربار** (Total Operational Expenses)
     - 📈 **سود خالص کارگاه** (Net Profit = Revenue - Payroll - Overhead)
   - Visual category breakdown bar with percentage shares.

5. **RTL & Design Compliance**:
   - Use `shadcn/ui` components (`Button`, `Card`, `Dialog`, `Select`, `Input`, `Badge`).
   - All text in Persian with Vazirmatn font and clean RTL layout.

## Verification Commands
```bash
cd frontend
npm run test
npm run build
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_4_financial_dashboard_frontend.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
