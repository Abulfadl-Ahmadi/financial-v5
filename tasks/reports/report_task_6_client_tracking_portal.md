# Task 6: Contractor & Worker Portal Login System

## Summary of Changes
- Built JWT authentication endpoints for both Contractor (Client) and Worker portals in `portal_auth.py`.
- Developed API endpoints to retrieve orders for contractors and jobs for workers in `portal_api.py`.
- Implemented `ClientPortalDashboard.tsx` displaying the contractor login screen, their active/historical contract orders, and a stepper for production progress.
- Implemented `WorkerPortalDashboard.tsx` for sewing workers (tailors/ironers) to log in and view their assigned jobs and payable amounts.
- Wrote and passed comprehensive tests in `test_client_portal.py` to ensure correct authentication, data isolation, and API responses.
- Registered new portal endpoints in `backend/core/api.py`.
- Resolved TypeScript typing errors in the created files.

## Files Created/Modified
- **[NEW]** `backend/apps/users/portal_auth.py`
- **[NEW]** `backend/apps/sewing/portal_api.py`
- **[NEW]** `backend/tests/test_client_portal.py`
- **[NEW]** `frontend/src/features/portal/ClientPortalDashboard.tsx`
- **[NEW]** `frontend/src/features/portal/WorkerPortalDashboard.tsx`
- **[NEW]** `frontend/src/features/portal/types.ts`
- **[MODIFIED]** `backend/core/api.py` (Registered portal routers)

## Verification Results
- `manage.py test tests.test_client_portal`: **Passed** (2/2 tests OK).
- `tsc -b`: Confirmed no TypeScript errors originate from the newly created `src/features/portal` directory.

## Trade-offs / Known Issues
- Currently, contractor verification assumes that `User.brand_name` exactly matches `ContractOrder.client_name`. In a more robust system, a dedicated `Contractor` model or a `UserRole.CONTRACTOR` enum paired with a foreign key to `ContractOrder` would reduce data mismatch risks.
- The `manage.py test` runner is used for testing instead of `pytest`, avoiding issues with the `pytest` executable not being configured in the virtual environment.
- Unrelated pre-existing TypeScript errors exist in other frontend modules (`src/features/users/` and `src/stores/auth-store.test.ts`), which were left unmodified to respect the task's allowed scope.
