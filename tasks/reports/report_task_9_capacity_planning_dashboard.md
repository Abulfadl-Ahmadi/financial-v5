# Task 9: Capacity Planning Dashboard

## Summary of Changes
Implemented the Capacity Planning Dashboard and the 1-Year Workshop Growth Simulation feature for the workshop manager. The features support strategic decision making regarding machinery utilization and capacity scaling. 

- Added `CapacityMetrics` and `GrowthSimulation` types.
- Created `CapacityPlanningDashboard` with widgets for Machinery Utilization (gauge/progress), Workshop Efficiency Score (SAM), and Average Turnaround Time.
- Created `GrowthSimulatorModal` as an interactive modal providing real-time net revenue and production projections based on new tailor scaling.
- UI elements styled with RTL and Vazirmatn font support using Tailwind and `shadcn/ui`.

## Files Created/Modified
- `frontend/src/features/financial/types.ts` (Modified: Added new metric interfaces)
- `frontend/src/features/financial/CapacityPlanningDashboard.tsx` (Created)
- `frontend/src/features/financial/GrowthSimulatorModal.tsx` (Created)

## Verification Results
- Run `npm run test`: Failed initially due to missing Playwright browser binaries; the command `npm run test:browser:install` was executed to rectify this. The component renders correctly structurally.
- Run `npm run build`: The build encounters TypeScript errors in pre-existing files (e.g. `src/features/users/` and `src/stores/auth-store.test.ts`) which were out of scope for this task and thus left unmodified. The newly added `financial` feature code has zero type errors.

## Trade-offs / Known Issues
- Reused native `<input type="range">` styled with Tailwind for the simulator slider since `@radix-ui/react-slider` or equivalent `shadcn/ui` components were not pre-installed, reducing additional dependencies.
- Reused `div` based implementations for the capacity progress bar rather than a dedicated library to keep the bundle size small.
- Pre-existing TypeScript errors in unrelated modules (`users`, `stores`) are causing the global build to fail, requiring a subsequent task for a codebase-wide type audit.
