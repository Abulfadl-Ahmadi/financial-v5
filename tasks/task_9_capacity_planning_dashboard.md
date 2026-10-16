# Task 9: Frontend Capacity Utilization & 1-Year Growth Dashboard

## Global Context
Financial ERP v5 frontend is built with React 18, Vite, TypeScript, `shadcn/ui`, and Tailwind CSS with full RTL (Vazirmatn font) support. The workshop manager needs a strategic dashboard to analyze capacity utilization (6 active tailors out of 10 available sewing machines = 60% machinery utilization) and simulate break-even growth scenarios for adding tailors 7 through 10.

## Objective
Build React UI dashboard views for Capacity Utilization analysis and 1-Year Workshop Growth Simulation.

## Allowed Scope
- `frontend/src/features/financial/CapacityPlanningDashboard.tsx`
- `frontend/src/features/financial/GrowthSimulatorModal.tsx`
- `frontend/src/features/financial/types.ts`

## Implementation Rules
1. **Capacity Metrics Component (`CapacityPlanningDashboard.tsx`)**:
   - Machinery Utilization Gauge / Progress Bar (e.g. 6/10 active sewing machines = 60% active capacity, 4 machines reserved for growth).
   - Workshop Efficiency Score (SAM produced vs available operator minutes).
   - Average Turnaround Time per Contractor Batch.

2. **Growth Simulator Modal (`GrowthSimulatorModal.tsx`)**:
   - Interactive slider: "تعداد خیاط جدید" (0 to 4 new tailors).
   - Dynamic simulation output:
     - Projected Monthly Piece Output increase (e.g. +33% output with 2 new tailors).
     - Projected Net Revenue vs additional payroll & overhead.

3. **RTL & Design Compliance**:
   - Use `shadcn/ui` cards, badges, dialogs, sliders, and progress bars with Vazirmatn typography.

## Verification Commands
```bash
cd frontend
npm run test
npm run build
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_9_capacity_planning_dashboard.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
