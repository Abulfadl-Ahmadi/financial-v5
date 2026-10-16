# Task 6: Contractor & Worker Portal Login System (Client & Tailor Dedicated Dashboards)

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). Dedicated logins for tailors/ironers and contractors allow workers to view assigned jobs & piece earnings, while contractors can log in to view active order progress, invoices, and delivery dates.

## Objective
Build JWT authentication endpoints and frontend portal views for Contractor Login (`/portal/client`) and Tailor/Worker Login (`/portal/worker`).

## Allowed Scope
- `backend/apps/users/portal_auth.py`
- `backend/apps/sewing/portal_api.py`
- `frontend/src/features/portal/ClientPortalDashboard.tsx`
- `frontend/src/features/portal/WorkerPortalDashboard.tsx`
- `frontend/src/features/portal/types.ts`
- `backend/tests/test_client_portal.py`

## Implementation Rules
1. **Contractor Portal (`ClientPortalDashboard.tsx`)**:
   - Authenticated contractor login with JWT token.
   - List all active and historical contract orders for that contractor.
   - Stepper progress bar: `تحویل پارچه` ➔ `دوخت خیاطی` ➔ `دکمه و مادگی (جانومه)` ➔ `خط اتو` ➔ `آماده تحویل`.
   - Download/view invoice & payment settlement status.

2. **Tailor & Ironer Portal (`WorkerPortalDashboard.tsx`)**:
   - Authenticated tailor/ironer login.
   - View assigned sewing jobs and completed piece counts.
   - Real-time piece-rate earnings summary (اجرت تکه‌ای + پاداش کیفیت).

3. **Backend API Endpoints (`portal_api.py`)**:
   - `GET /api/sewing/portal/client/orders`: Authenticated client orders list.
   - `GET /api/sewing/portal/worker/jobs`: Authenticated worker assigned jobs list.

4. **Testing (`backend/tests/test_client_portal.py`)**:
   - Test contractor and worker authentication, data isolation, and status updates.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_client_portal
cd ../frontend
npm run build
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_6_client_tracking_portal.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
