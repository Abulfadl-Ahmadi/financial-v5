from typing import Dict, Any, List
from django.db.models import Sum, F, FloatField, ExpressionWrapper, Q
from apps.sewing.models import SewingJob
from apps.users.models import User, UserRole

def calculate_incentive_payroll(completed_pieces: int, unit_price: float, daily_target: int, rejected_pieces: int) -> Dict[str, Any]:
    base_payroll = float(completed_pieces) * float(unit_price)
    
    extra_pieces = max(0, completed_pieces - daily_target)
    quota_bonus = float(extra_pieces) * (float(unit_price) * 0.10)
    
    zero_defect_bonus = 0.0
    if rejected_pieces == 0 and completed_pieces > 0:
        zero_defect_bonus = base_payroll * 0.05
        
    total_payable = base_payroll + quota_bonus + zero_defect_bonus
    
    return {
        "base_payroll": base_payroll,
        "quota_bonus": quota_bonus,
        "zero_defect_bonus": zero_defect_bonus,
        "total_payable": total_payable,
    }

def get_tailor_payroll_summary(daily_target: int = 100) -> List[Dict[str, Any]]:
    # We want a summary per sewer. A sewer may have multiple SewingJobs.
    # It says "Detailed payroll report for 6 tailors and 1 ironer".
    # For each user, we will aggregate their jobs, then apply the incentive logic.
    # Wait, the bonus is usually calculated per job or per day. Since we don't have a specific date filtering requirement,
    # and the incentive logic specifies "daily target (e.g. +20%)", we can aggregate all their completed pieces,
    # or calculate per job and sum it.
    # The requirement says "add 10% bonus per extra piece" if completed > daily target.
    # If a user has multiple jobs, the daily target applies to the sum of pieces or per job?
    # Let's assume daily target applies to the aggregated completed_pieces across all jobs, or we can just iterate jobs.
    # Let's iterate each user who is a WORKER and has SewingJobs, aggregate their pieces, then calculate.
    
    users = User.objects.filter(role=UserRole.WORKER).prefetch_related('sewing_assignments')
    
    summary = []
    
    for user in users:
        jobs = user.sewing_assignments.all()
        if not jobs:
            continue
            
        total_completed = sum(job.completed_pieces for job in jobs)
        total_rejected = sum(job.rejected_pieces for job in jobs)
        
        # Since unit price might differ per job, but the requirement simplifies the calculation,
        # let's assume we calculate the base payroll per job and sum it up.
        # But for the quota bonus, we need an aggregated "completed pieces" vs "daily target"
        # and an average unit price, OR calculate everything on a per-job basis and sum it up.
        # Let's calculate per job and sum up, using a "target per job"?
        # Or calculate aggregated completed pieces and calculate bonus based on an average unit price.
        # Let's look at the instruction:
        # "base_payroll = completed_pieces * unit_price"
        # "quota_bonus = extra_pieces * (unit_price * 0.10)"
        
        # Let's do it per user, but sum the base payroll, then calculate quota bonus based on total pieces
        # and an average unit price, or just sum it all per job.
        
        # Actually, let's do it per user by summing all jobs, and taking a weighted average unit price,
        # OR simpler: calculate the incentive per job, with the target applied per job.
        # No, "daily target" implies it applies per day. Without a day grouping, we just treat the sum as one batch.
        
        # Let's just calculate it using the first job's unit price as a simplification if there are multiple,
        # OR do it properly by computing base_payroll exactly, and for quota bonus use average unit price.
        
        total_base = 0.0
        for job in jobs:
            total_base += float(job.completed_pieces) * float(job.unit_sewing_price)
            
        avg_unit_price = (total_base / total_completed) if total_completed > 0 else 0.0
        
        extra_pieces = max(0, total_completed - daily_target)
        quota_bonus = float(extra_pieces) * (avg_unit_price * 0.10)
        
        zero_defect_bonus = 0.0
        if total_rejected == 0 and total_completed > 0:
            zero_defect_bonus = total_base * 0.05
            
        total_payable = total_base + quota_bonus + zero_defect_bonus
        
        summary.append({
            "sewer_id": user.id,
            "sewer_name": user.get_full_name() or user.username,
            "total_completed": total_completed,
            "total_rejected": total_rejected,
            "base_payroll": total_base,
            "quota_bonus": quota_bonus,
            "zero_defect_bonus": zero_defect_bonus,
            "total_payable": total_payable
        })
        
    return summary
