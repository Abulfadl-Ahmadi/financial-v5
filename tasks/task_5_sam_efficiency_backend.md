# Task 5: Backend Standard Allowed Minutes (SAM) & Sewing Line Efficiency Module

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). Standard Allowed Minutes (SAM) measures the exact standard time required for specific sewing operations (collar, sleeve, zipper, side seam) to calculate sewing line efficiency:
$$\text{Efficiency \%} = \left( \frac{\text{Total SAM Produced}}{\text{Total Available Operator Minutes}} \right) \times 100$$

## Objective
Implement `GarmentOperation`, `OperationSAM`, and `SewingLineEfficiency` models, Pydantic schemas, calculation utilities, and API endpoints in `apps/sewing`.

## Allowed Scope
- `backend/apps/sewing/sam_models.py`
- `backend/apps/sewing/sam_schemas.py`
- `backend/apps/sewing/sam_api.py`
- `backend/tests/test_sam_efficiency.py`

## Implementation Rules
1. **Models (`sam_models.py`)**:
   - `GarmentOperation`: `name` (e.g. دوخت یقه, دوخت زیپ, سردوزی لبه), `apparel_type` (e.g. مانتو, شلوار), `standard_minutes` (DecimalField).
   - `SewingLineEfficiency`: `date_jalali`, `sewer` (User FK), `job` (SewingJob FK), `actual_units`, `earned_sam_minutes`, `available_work_minutes` (default 480 mins for 8 hours), `efficiency_percentage` (calculated property or stored field).

2. **Schemas (`sam_schemas.py`)**:
   - `GarmentOperationIn`, `GarmentOperationOut`, `LineEfficiencyReportOut`.

3. **API Endpoints (`sam_api.py`)**:
   - `GET /api/sewing/operations`: List all sewing operation SAM values.
   - `POST /api/sewing/operations`: Create new operation SAM standard.
   - `GET /api/sewing/efficiency`: Generate daily efficiency report per tailor and for the entire workshop.

4. **Testing (`backend/tests/test_sam_efficiency.py`)**:
   - Test SAM calculation logic and efficiency percentage outputs.

## Verification Commands
```bash
cd backend
uv run python manage.py test tests.test_sam_efficiency
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_5_sam_efficiency_backend.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
