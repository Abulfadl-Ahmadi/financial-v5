from ninja import Router, Schema
from typing import List
from apps.sewing.incentive_services import get_tailor_payroll_summary
from apps.users.permissions import require_finance_manager

router = Router(tags=["Incentives (پاداش و دستمزد)"])

class PayrollSummaryOut(Schema):
    sewer_id: int
    sewer_name: str
    total_completed: int
    total_rejected: int
    base_payroll: float
    quota_bonus: float
    zero_defect_bonus: float
    total_payable: float

@router.get("/payroll-summary", response=List[PayrollSummaryOut])
def get_payroll_summary(request, daily_target: int = 100):
    require_finance_manager(request)
    return get_tailor_payroll_summary(daily_target=daily_target)
