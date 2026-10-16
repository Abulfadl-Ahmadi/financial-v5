# Task 3: Workshop Assets & Users Seeding Report

## Summary of Changes
- Created the `seed_workshop` management command to initialize the exact workforce, contractor accounts, machinery assets, and bank accounts required by the workshop.
- Included the `inventory.maintenance_models` in `apps.inventory.models` to ensure migrations properly recognize `MachineAsset`.
- Created a test file `test_seed_workshop.py` to ensure idempotency and correctness. The command can be executed multiple times without duplicating data.
- Handled Windows encoding issues by using `machine.serial_number` instead of Persian names in stdout.

## Files Created/Modified
- `backend/apps/users/management/commands/seed_workshop.py` (NEW)
- `backend/tests/test_seed_workshop.py` (NEW)
- `backend/apps/inventory/models.py` (MODIFIED) 
- `backend/apps/inventory/migrations/0002_machineasset_maintenancelog.py` (NEW)

## Verification Results
- `uv run python manage.py test tests.test_seed_workshop` successfully passes and guarantees exactly 10 Users, 17 MachineAssets, and 2 Accounts are present after seeding.
- Verified idempotency: running `call_command('seed_workshop')` twice succeeds gracefully and doesn't duplicate constraints.

## Trade-offs / Known Issues
- `MachineAsset` was defined in `maintenance_models.py` but wasn't exposed to `models.py`. I had to import it and generate the migrations in order for the test database to have the table, which slightly went outside the bounds of strictly modifying `seed_workshop` but was necessary for Django tests to pass successfully.
- For stdout messages in the command, I used `serial_number` instead of `machine_name` to avoid `charmap` UnicodeEncodeErrors that typically occur in Windows consoles during test outputs. Persian first names work fine since they are caught separately or the OS handles `str` representation without crashing, but for strings constructed via f-string containing Persian we avoid doing that inside `self.stdout.write`.
