# Financial ERP v5 - Agent Workspace & Operations Guide

Welcome to **Financial ERP v5**, an Iranian Garment Production & Sewing Workshop Management System built with Django Ninja and React Vite.

---

## 🏛️ Core Engineering Workflow: Evidence-Based, Issue-Driven Development (EB-IDD)

In this workspace, AI agents must strictly adhere to the user's disciplined 5-stage development methodology:

1. **Collaborative Problem Framing (طرح و بحث مسئله)**:
   - Discuss requirements, user intent, domain boundaries, and edge cases. Never jump prematurely into code.
2. **Codebase & Evidence Investigation (کاوش کدبیس و شواهد)**:
   - Read and trace existing models, schemas, ownership helpers, and frontend components. Find verifiable documentation, research papers, and technical evidence.
3. **Architectural Solution Synthesis (ارائه راهکار اصولی بر پایه شواهد)**:
   - Formulate the least complex sufficient solution (e.g. Bounded Workflow + Draft & Review over uncontrolled autonomy). Produce a verified technical plan.
4. **Full-Context GitHub Issue Engineering (مستندسازی و ثبت ایشوها در گیت‌هاب)**:
   - Package all discussions, evidence, architectural decisions, and phased roadmaps into a GitHub Epic and linked Sub-Issues with full context using `gh issue create`.
5. **Issue-Driven Implementation (پیاده‌سازی گام‌به‌گام مبتنی بر ایشوها)**:
   - Check open issues (`gh issue list`), tackle the target sub-issue step-by-step, verify with automated tests, and link commits (`Refs #issue` / `Closes #issue`).

---

## 🚀 Quick Commands & Verification Scripts

Always run verification commands after making changes to ensure zero regressions.

### Backend Commands (Django 5 + Django Ninja + `uv`)
```bash
# Location: ./backend
cd backend

# Environment Sync & Dependencies
uv sync

# Run Migrations
uv run python manage.py makemigrations
uv run python manage.py migrate

# Run Backend Automated Tests
uv run python manage.py test tests

# Seed Test Data
uv run python manage.py seed_data # or uv run python seed_data.py

# Run Development Server (Port 8000)
uv run python manage.py runserver 8000
```

### Frontend Commands (React 18 + Vite + TypeScript + `npm`)
```bash
# Location: ./frontend
cd frontend

# Install Dependencies
npm install

# Run Development Server (Port 5173)
npm run dev

# Run Frontend Automated Tests
npm run test

# Typecheck & Build Verification
npm run build
```

---

## 🏗 Stack & Architecture Overview

- **Backend**: Python 3.12+, Django 5, Django Ninja API (FastAPI-like with OpenAPI Swagger at `/api/docs`), `uv` package manager, SQLite / PostgreSQL.
- **Frontend**: React 18, Vite, TypeScript, `shadcn/ui` + `PersianLabs/ui` (RTL-first Persian components from `./shadcn-persian/`), Tailwind CSS v3, Vazirmatn font (RTL layout).
- **Persian UI Skill**: Use the `shadcn-persian` skill and read local offline docs in `./shadcn-persian/` before building UI components.
- **Core Domain Modules**:
  - `apps/users`: Authentication, RBAC (Owner, Accountant, Sewing Supervisor, Cutting Supervisor, Warehouse Manager, Worker).
  - `apps/inventory`: Fabric rolls (طاقه پارچه), fabric types, shade codes, stock statuses, machine fleet maintenance.
  - `apps/cutting`: Fabric layering (لایه‌بندی), piece calculations, cutting margin profitability.
  - `apps/sewing`: Sewing jobs (کارگاه خیاطی), piece-rate payroll (اجرت دوخت), defect tracking (ضایعات), tailor progress.
  - `apps/financial`: Bank accounts (BIN auto-detection), incoming/outgoing receipts (فیش‌های واریزی), expenses & overheads.
  - `apps/ai_assistant`: AI-native conversational assistant, action drafts, audit logging, and tool gateway.

---

## 🛡 Execution Guardrails

1. **Issue-Driven Discipline**: Always check open issue threads (`gh issue list`) before starting implementation. Keep issues updated as work progresses.
2. **Test Integrity**: Never modify test assertions or delete failing test cases just to make a suite pass. Fix the core implementation.
3. **File Deletion Safety**: Do not execute destructive `rm` or `rmdir` commands. Move deprecated files to `.trash/` or `.agents/trash/`.
4. **Git Safety**: Never execute `git reset --hard`, `git checkout .`, or `git push --force` without explicit confirmation.
5. **Circuit Breaker**: If a build error or test failure repeats 3 times consecutively, stop execution, document the blocker in `.agents/memory/blockers.md`, and ask for guidance.
