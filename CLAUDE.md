# Financial ERP v5 - Claude Code Instructions & Workspace Guide

Welcome to **Financial ERP v5**, an Iranian Garment Production & Sewing Workshop Management System built with Django Ninja and React Vite.

This project is governed by domain knowledge, behavioral constraints, and SOPs defined in the `.agents/` workspace. **Claude Code must always read, respect, and apply these rules:**

---

## 🧭 Core Directives & Development Philosophy

In this workspace, we strictly follow **Evidence-Based, Issue-Driven Development (EB-IDD)**:
1. **Discuss & Frame**: Collaboratively explore the problem and domain constraints before touching code.
2. **Investigate & Evidenced Research**: Inspect the existing codebase, models, helpers, and technical literature.
3. **Synthesize Architecture**: Design sound solutions using the least complex sufficient pattern (e.g. Draft & Review, HITL).
4. **Document via GitHub Issues**: Document complete context, architectural decisions, and tasks into a GitHub Epic and linked Sub-Issues with `gh issue create`.
5. **Issue-Guided Implementation**: Reference open issues (`gh issue list`), implement features step-by-step with automated tests, and link commits.

---

## 📂 Active Specifications in `.agents/`

1. **Behavioral Identity & Guardrails**: Read [.agents/SOUL.md](.agents/SOUL.md)
   - Professional, precise, constructive tone with complete RTL Persian support.
   - Non-destructive file ops: Never execute destructive `rm` or `rmdir`; move deprecated files to `.agents/trash/`.
   - Test & code integrity: Never modify or delete test assertions to fake green passes.
   - Circuit breaker: If an error or test failure repeats 3 times consecutively, stop, record the blocker in `.agents/memory/blockers.md`, and report root cause.

2. **Domain Model & User Preferences**: Read [.agents/USER.md](.agents/USER.md)
   - **Business Model**: Garment Sewing Workshop / Cut-Fabric Contractor (مزدی‌دوزی / پیمانکاری دوخت).
   - **Workforce & Portals**: 6 Tailors (piece-rate wages), 1 Ironer, Client Portals, Owner/Accountant ERP control.
   - **Machinery Fleet (16 Assets)**: 10 Sewing Machines, 2 Sergers, 1 Janome Buttonhole, 3 Industrial Steam Irons + 1 Central Steam Boiler.
   - **Expense & Overheads**: Fixed rent, utilities (electricity, water, gas), sewing consumables, machine maintenance, kitchen/welfare.

3. **Development Workflows & SOPs**: Read [.agents/WORKFLOW.md](.agents/WORKFLOW.md)
   - Follow the 5-stage EB-IDD lifecycle: Problem Framing ➔ Codebase Investigation ➔ Architectural Synthesis ➔ GitHub Issue Engineering ➔ Traceable Issue-Guided Implementation.

4. **Architectural Decisions (ADR)**: Read [.agents/memory/architectural_decisions.md](.agents/memory/architectural_decisions.md)
   - ADR 001: Multi-Layered Agent Workspace Structure.
   - ADR 002: Piece-Rate & Overhead Expense Accounting Model.
   - ADR 003: AI-Native Conversational Assistant with Governed Tool Gateway & HITL Draft/Review.

---

## 🎨 UI & Design Skills (RTL Persian)

- **Persian UI Library**: Always use the `shadcn-persian` skill (`.claude/skills/shadcn-persian` / `.agents/skills/shadcn-persian`).
- **Never Handcraft Primitives**: Install components using CLI:
  ```bash
  cd frontend
  npx shadcn@latest add @persianlabsui/<component-name>
  ```
- **Jalali Date Pickers & Iranian Inputs**: Use `@persianlabsui` date pickers, bank/shaba inputs, national ID validation, and price inputs with Toman/Rial formatting.

---

## 🚀 Quick Verification Commands

Always run verification commands after modifications to ensure zero regressions:

### Backend Commands (Django 5 + Django Ninja + `uv`)
```bash
cd backend
uv sync
uv run python manage.py makemigrations
uv run python manage.py migrate
uv run python manage.py test tests
uv run python manage.py runserver 8000
```

### Frontend Commands (React 18 + Vite + TypeScript + `npm`)
```bash
cd frontend
npm install
npm run test
npm run build
npm run dev
```
