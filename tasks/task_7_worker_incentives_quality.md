# Task 7: Dynamic Tailor Incentive Payroll & Zero-Defect Bonus Module

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). To motivate tailors and ironers to exceed daily quotas while keeping quality high, a dynamic bonus calculation module rewards workers when they exceed daily output standards with zero or low defect rates.

## Objective
Implement incentive bonus calculation logic, API endpoints, and tests in `apps/sewing` to compute piece-rate wages + performance bonuses.

## Allowed Scope
- `backend/apps/sewing/incentive_services.py`
- `backend/apps/sewing/incentive_api.py`
- `backend/tests/test_incentives.py`

## Implementation Rules
1. **Incentive Calculation Rules (`incentive_services.py`)**:
   - `base_payroll = completed_pieces * unit_price`
   - `quota_bonus`: If completed pieces > daily target (e.g. +20%), add 10% bonus per extra piece.
   - `zero_defect_bonus`: If `rejected_pieces == 0`, add a 5% quality bonus to total batch payroll.

2. **API Endpoints (`incentive_api.py`)**:
   - `GET /api/sewing/tailors/payroll-summary`: Detailed payroll report for 6 tailors and 1 ironer including base wage, quota bonus, quality bonus, and total payable amount.

3. **Testing (`backend/tests/test_incentives.py`)**:
   - Test bonus thresholds, zero-defect bonus trigger, and total payroll accuracy.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_incentives
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_7_worker_incentives_quality.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
