# Review Task 2: Audit & QA for Contract Orders Backend Module

## Audit Scope
- Modified Files: `backend/apps/sewing/models.py`, `backend/apps/sewing/schemas.py`, `backend/apps/sewing/api.py`
- Test File: `backend/tests/test_contract_orders.py`
- Worker Report: `./tasks/reports/report_task_2_contract_orders_backend.md`

## Review Objective
1. Audit `ContractOrder` model, schemas, status choices (`RECEIVED`, `IN_PRODUCTION`, `DELIVERED`, `SETTLED`), and API endpoints.
2. Check calculation of `total_revenue` (`total_received_pieces * unit_contractor_price`).
3. Ensure duplicate order codes are handled cleanly.
4. Run verification tests and fix any discovered issues or bugs.

## Execution Instruction
Run `cd backend && uv run python manage.py test tests.test_contract_orders`. Inspect code and fix bugs directly if found.

## Report Requirements
Output audit findings and fixes to `./tasks/reviews/reports/report_review_task_2.md`.
