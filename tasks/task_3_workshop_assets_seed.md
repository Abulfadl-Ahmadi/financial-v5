# Task 3: Seed Workshop Workforce, Contractor Accounts & Machinery Registry

## Global Context
Financial ERP v5 manages an Iranian sewing workshop operating under a contractor model (مزدی‌دوزی). The workshop has a specific workforce (6 tailors, 1 ironer, 1 accountant, 1 owner, contractors) and machinery setup (10 sewing machines, 2 sergers, 1 Janome buttonhole machine, 3 industrial steam irons + 1 central boiler).

## Objective
Create a dedicated management command `seed_workshop` to seed the database with the workshop's exact workforce users, contractor client logins, machinery assets, and sample bank accounts.

## Allowed Scope
- `backend/apps/users/management/commands/seed_workshop.py`
- `backend/tests/test_seed_workshop.py`

## Implementation Rules
1. **Users Seeding (Roles & Logins)**:
   - 6 Tailors (Role: `WORKER`, usernames: `sewer1` to `sewer6`, names: `خیاط ۱` تا `خیاط ۶`).
   - 1 Ironer (Role: `WORKER`, username: `ironer1`, name: `اتوکار ۱`).
   - 1 Contractor / Client (Role: `CLIENT`, username: `contractor1`, name: `پیمانکار نمونه (تولیدی پوشاک ایده‌آل)`).
   - 1 Owner (Role: `OWNER`, username: `owner`, name: `مدیر کارگاه`).
   - 1 Accountant (Role: `ACCOUNTANT`, username: `accountant`, name: `حسابدار`).

2. **Machinery Seeding**:
   - 10 Sewing Machines (چرخ خیاطی راسته‌دوز شماره ۱ تا ۱۰).
   - 2 Sergers (چرخ زیگزال/سردوز شماره ۱ و ۲).
   - 1 Janome Buttonhole Machine (چرخ جانومه دکمه‌دوز و مادگی).
   - 3 Industrial Steam Irons + 1 Boiler (۳ اتوبخار صنعتی + دیگ بخار مرکزی).

3. **Management Command (`seed_workshop.py`)**:
   - Must be idempotent (running multiple times will not duplicate users or machinery).

4. **Testing (`backend/tests/test_seed_workshop.py`)**:
   - Test command execution using `call_command('seed_workshop')` and verify created users & assets.

## Verification Commands
```bash
cd backend
uv run python manage.py seed_workshop
uv run python manage.py test tests.test_seed_workshop
```

## Report Requirements
Output execution summary to `./tasks/reports/report_task_3_workshop_assets_seed.md` containing:
- Summary of Changes
- Files Created/Modified
- Verification Results
- Trade-offs / Known Issues
