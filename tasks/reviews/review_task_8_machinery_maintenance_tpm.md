# Review Task 8: Audit & QA for Machinery Asset Registry & TPM Module

## Audit Scope
- Modified Files: `backend/apps/inventory/maintenance_models.py`, `backend/apps/inventory/maintenance_api.py`
- Test File: `backend/tests/test_maintenance.py`
- Worker Report: `./tasks/reports/report_task_8_machinery_maintenance_tpm.md`

## Review Objective
1. Verify 16 machinery assets (10 sewing, 2 sergers, 1 Janome buttonhole, 3 irons + 1 boiler) status & assignment.
2. Confirm maintenance log recording (oil change, needle replacement, boiler descaling) and service due alert API.
3. Run verification tests and fix any discovered issues or bugs.

## Execution Instruction
Run `cd backend && uv run python manage.py test tests.test_maintenance`. Inspect code and fix bugs directly if found.

## Report Requirements
Output audit findings and fixes to `./tasks/reviews/reports/report_review_task_8.md`.
