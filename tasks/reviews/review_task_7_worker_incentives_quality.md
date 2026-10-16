# Review Task 7: Audit & QA for Worker Incentives & Zero-Defect Bonus Module

## Audit Scope
- Modified Files: `backend/apps/sewing/incentive_services.py`, `backend/apps/sewing/incentive_api.py`
- Test File: `backend/tests/test_incentives.py`
- Worker Report: `./tasks/reports/report_task_7_worker_incentives_quality.md`

## Review Objective
1. Verify piece-rate base wage + quota bonus + zero-defect quality bonus logic.
2. Confirm payroll report accuracy for 6 tailors and 1 ironer.
3. Run verification tests and fix any discovered issues or bugs.

## Execution Instruction
Run `cd backend && uv run python manage.py test tests.test_incentives`. Inspect code and fix bugs directly if found.

## Report Requirements
Output audit findings and fixes to `./tasks/reviews/reports/report_review_task_7.md`.
