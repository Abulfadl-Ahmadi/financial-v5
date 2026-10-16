# Task 1: Expenses Backend Report

## Summary of Changes
Implemented the backend Expense & Overhead Management Module. Added Expense models to track costs, defined Pydantic schemas for the endpoints, set up CRUD API routes using Django Ninja, and created comprehensive unit tests for all routes.

## Files Created/Modified
- ackend/apps/financial/models.py (Modified)
- ackend/apps/financial/schemas.py (Modified)
- ackend/apps/financial/api.py (Modified)
- ackend/tests/test_expenses.py (Created)

## Verification Results
Ran uv run python manage.py test tests.test_expenses. All 6 tests (create, list, filter, update, delete, summary) passed successfully.

## Trade-offs / Known Issues
- Used Django TextChoices for category enum for better database compatibility and simpler implementation.
- Decimal fields were configured with 0 decimal places per requirements (Toman).
