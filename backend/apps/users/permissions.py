from ninja.errors import HttpError
from apps.users.models import UserRole


def require_authenticated(request):
    """Ensure the user is authenticated via JWT or session."""
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        raise HttpError(401, "Authentication required")
    return user


def require_roles(request, *allowed_roles):
    """Ensure authenticated user has one of the allowed roles."""
    user = require_authenticated(request)
    role_values = [r.value if isinstance(r, UserRole) else r for r in allowed_roles]
    if user.role not in role_values:
        raise HttpError(403, "Permission denied for current user role")
    return user


def require_owner(request):
    """Access restricted strictly to the workshop owner."""
    return require_roles(request, UserRole.OWNER)


def require_finance_manager(request):
    """Access restricted to workshop financial managers (Owner & Accountant)."""
    return require_roles(request, UserRole.OWNER, UserRole.ACCOUNTANT)


def require_cutting_supervisor(request):
    """Access restricted to Cutting Supervisors, Owner, and Accountant."""
    return require_roles(request, UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.CUTTING_SUPERVISOR)


def require_sewing_supervisor(request):
    """Access restricted to Sewing Supervisors, Owner, and Accountant."""
    return require_roles(request, UserRole.OWNER, UserRole.ACCOUNTANT, UserRole.SEWING_SUPERVISOR)


def require_inventory_manager(request):
    """Access restricted to Warehouse Manager, Cutting Supervisor, Owner, and Accountant."""
    return require_roles(
        request,
        UserRole.OWNER,
        UserRole.ACCOUNTANT,
        UserRole.WAREHOUSE_MANAGER,
        UserRole.CUTTING_SUPERVISOR,
    )
