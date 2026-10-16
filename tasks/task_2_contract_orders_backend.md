# Task 2: Backend Contract Orders & CMT Sewing Jobs Module (`apps/sewing`)

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). Cut fabric is received from clients/contractors and assigned to 6 tailors and 1 ironer. When finished, goods are delivered back to the client and invoiced.

## Objective
Implement `ContractOrder` (پیمانکاری دوخت) model, schemas, API endpoints, and tests in `apps/sewing` for managing contractor batches, piece rates, defect tracking, and client invoicing.

## Allowed Scope
- `backend/apps/sewing/models.py`
- `backend/apps/sewing/schemas.py`
- `backend/apps/sewing/api.py`
- `backend/tests/test_contract_orders.py`

## Implementation Rules
1. **Models (`models.py`)**:
   - `ContractOrderStatus`: `RECEIVED` (دریافت شده از کارفرما), `IN_PRODUCTION` (در حال دوخت), `DELIVERED` (تحویل داده شده به کارفرما), `SETTLED` (تسویه مالی شده).
   - `ContractOrder` model fields:
     - `order_code`: CharField(max_length=50, unique=True, verbose_name="کد سفارش پیمانکار")
     - `client_name`: CharField(max_length=150, verbose_name="نام کارفرما / پیمانکار")
     - `apparel_type`: CharField(max_length=100, verbose_name="نوع پوشاک (مانتو، شلوار، پیراهن...)")
     - `total_received_pieces`: PositiveIntegerField(verbose_name="تعداد قطعات تحویلی از کارفرما")
     - `unit_contractor_price`: DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ توافقی دوزندگی هر واحد به تومان")
     - `status`: CharField(choices=ContractOrderStatus.choices, default=RECEIVED)
     - `received_date_jalali`: CharField(max_length=10, verbose_name="تاریخ دریافت شمسی")
     - `delivery_date_jalali`: CharField(max_length=10, blank=True, null=True)
     - `notes`: TextField(blank=True, null=True)
     - `created_at`: DateTimeField(auto_now_add=True)

2. **Schemas (`schemas.py`)**:
   - `ContractOrderIn`, `ContractOrderOut`, `ContractOrderUpdateIn`, `ContractOrderSummaryOut`.

3. **API Endpoints (`api.py`)**:
   - `GET /api/sewing/contract-orders`: List all contract orders.
   - `POST /api/sewing/contract-orders`: Create new contract order.
   - `GET /api/sewing/contract-orders/{order_id}`: Detail view including total revenue (`total_received_pieces * unit_contractor_price`).
   - `PUT /api/sewing/contract-orders/{order_id}`: Update order status or details.

4. **Testing (`backend/tests/test_contract_orders.py`)**:
   - Write tests verifying creation, status transitions, total revenue calculation, and list queries.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_contract_orders
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_2_contract_orders_backend.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
