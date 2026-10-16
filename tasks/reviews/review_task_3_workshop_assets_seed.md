# Review Task 3: Audit & QA for Workshop Seeding Command

## Audit Scope
- Modified Files: `backend/apps/users/management/commands/seed_workshop.py`, `backend/apps/inventory/models.py`
- Test File: `backend/tests/test_seed_workshop.py`
- Worker Report: `./tasks/reports/report_task_3_workshop_assets_seed.md`

## Review Objective
1. Verify idempotency of `seed_workshop` command.
2. Confirm exact workforce (6 tailors, 1 ironer, 1 contractor, 1 owner, 1 accountant) and 16 machinery assets (10 sewing, 2 sergers, 1 Janome buttonhole, 3 irons + 1 boiler) are created correctly.
3. Check Windows console encoding handling.
4. Run verification tests and fix any discovered issues or bugs.

## Execution Instruction
Run `cd backend && uv run python manage.py test tests.test_seed_workshop`. Inspect code and fix bugs directly if found.

## Report Requirements
Output audit findings and fixes to `./tasks/reviews/reports/report_review_task_3.md`.
