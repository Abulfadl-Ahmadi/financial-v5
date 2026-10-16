# Review Task 6: Audit & QA for Contractor & Worker Portals

## Audit Scope
- Modified Files: `backend/apps/sewing/portal_api.py`, `frontend/src/features/portal/ClientPortalDashboard.tsx`, `frontend/src/features/portal/WorkerPortalDashboard.tsx`
- Test File: `backend/tests/test_client_portal.py`
- Worker Report: `./tasks/reports/report_task_6_client_tracking_portal.md`

## Review Objective
1. Verify authentication, data isolation, and public/secured field filtering for Contractor and Worker portals.
2. Confirm order status stepper display (تحویل پارچه ➔ دوخت ➔ دکمه و مادگی جانومه ➔ اتو ➔ آماده تحویل).
3. Run verification tests and fix any discovered issues or bugs.

## Execution Instruction
Run `cd backend && uv run python manage.py test tests.test_client_portal`. Inspect code and fix bugs directly if found.

## Report Requirements
Output audit findings and fixes to `./tasks/reviews/reports/report_review_task_6.md`.
