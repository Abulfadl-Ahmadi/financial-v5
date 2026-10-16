# Task 2: Backend Contract Orders & CMT Sewing Jobs Module (`apps/sewing`) - Execution Report

## Summary of Changes
Successfully implemented the `ContractOrder` (پیمانکاری دوخت) feature for the sewing workshop module. This allows tracking batches of cut fabrics sent by clients, the number of pieces received, the agreed-upon price per piece, and calculating the total revenue from contractors. The status of these contract orders can also be tracked from `RECEIVED` to `SETTLED`.

## Files Created/Modified
1. **`backend/apps/sewing/models.py`** (Modified)
   - Added `ContractOrderStatus` text choices (`RECEIVED`, `IN_PRODUCTION`, `DELIVERED`, `SETTLED`).
   - Created the `ContractOrder` model with fields for `order_code`, `client_name`, `apparel_type`, `total_received_pieces`, `unit_contractor_price`, `status`, and `total_revenue` property.
   
2. **`backend/apps/sewing/schemas.py`** (Modified)
   - Created Pydantic schemas for API serialization and validation: `ContractOrderIn`, `ContractOrderOut`, `ContractOrderUpdateIn`, and `ContractOrderSummaryOut`.

3. **`backend/apps/sewing/api.py`** (Modified)
   - Added API endpoints for contract orders under the existing Ninja Router:
     - `GET /api/sewing/contract-orders`: List all orders
     - `POST /api/sewing/contract-orders`: Create a new order
     - `GET /api/sewing/contract-orders/{order_id}`: Retrieve a specific order
     - `PUT /api/sewing/contract-orders/{order_id}`: Update an order's details and status

4. **`backend/tests/test_contract_orders.py`** (Created)
   - Created comprehensive unit tests validating order creation, status transitions, API list and detail queries, validation of duplicate order codes, and the correct calculation of `total_revenue`.

5. **Migrations** (Created)
   - Generated and applied `sewing.0003_contractorder` migration.

## Verification Results
All 6 newly written tests for `test_contract_orders.py` passed successfully.
```bash
Found 6 test(s).
System check identified no issues (0 silenced).
Creating test database for alias 'default'...
......
----------------------------------------------------------------------
Ran 6 tests in 0.050s

OK
Destroying test database for alias 'default'...
```

## Trade-offs / Known Issues
- Currently, updates to a `ContractOrder` (via PUT) can modify any exposed field via `ContractOrderUpdateIn`. Future iterations may require restricting updates for certain fields (like `total_received_pieces`) if the order has moved past the `RECEIVED` state.
- `delivery_date_jalali` is currently stored as a CharField for Jalali dates. We might want to use a native DateTime object or a customized Jalali field later on for robust querying and filtering by date intervals.
