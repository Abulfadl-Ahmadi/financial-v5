# Task 8: Machinery Asset Registry & Preventive Maintenance Module (TPM)

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). The workshop has 10 sewing machines, 2 sergers, and 3 industrial steam irons. Unscheduled machine downtime disrupts production lines. A Preventive Maintenance (TPM) module tracks machinery health, service history, and alerts upcoming oil changes, needle replacements, and iron descaling.

## Objective
Implement `MachineAsset` and `MaintenanceLog` models, Pydantic schemas, maintenance alert APIs, and tests.

## Allowed Scope
- `backend/apps/inventory/maintenance_models.py`
- `backend/apps/inventory/maintenance_schemas.py`
- `backend/apps/inventory/maintenance_api.py`
- `backend/tests/test_maintenance.py`

## Implementation Rules
1. **Models (`maintenance_models.py`)**:
   - `MachineType`: `SEWING` (راسته‌دوز), `SERGER` (زیگزال/سردوز), `STEAM_IRON` (اتوبخار صنعتی).
   - `MachineAsset`: `serial_number`, `machine_name`, `machine_type`, `status` (`ACTIVE`, `MAINTENANCE`, `DECOMMISSIONED`), `assigned_operator` (User FK, optional).
   - `MaintenanceLog`: `machine` (FK), `service_type` (`OIL_CHANGE`, `NEEDLE_REPLACEMENT`, `STEAM_DESCALING`, `GENERAL_OVERHAUL`), `service_cost`, `serviced_at_jalali`, `next_service_due_jalali`, `notes`.

2. **API Endpoints (`maintenance_api.py`)**:
   - `GET /api/inventory/machinery`: List all 15 machines with active status and assigned worker.
   - `POST /api/inventory/machinery/{machine_id}/maintenance`: Log new maintenance event.
   - `GET /api/inventory/machinery/maintenance-due`: List machines due for service within the next 7 days.

3. **Testing (`backend/tests/test_maintenance.py`)**:
   - Verify machine creation, service log recording, and upcoming service alert queries.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_maintenance
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_8_machinery_maintenance_tpm.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
