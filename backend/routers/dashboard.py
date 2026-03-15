from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta

from database import get_db
from models.workflow import Workflow
from models.execution import Execution

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    # Total workflows
    total_workflows = db.query(Workflow).filter(Workflow.is_active == True).count()

    # Pending approvals
    pending_approvals = db.query(Execution).filter(
        Execution.status == "waiting_approval"
    ).count()

    # Completed today
    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    completed_today = db.query(Execution).filter(
        Execution.status == "completed",
        Execution.updated_at >= today_start
    ).count()

    # Failed executions
    total_failed = db.query(Execution).filter(
        Execution.status == "failed"
    ).count()

    # Total executions
    total_executions = db.query(Execution).count()

    # Success rate
    total_done = db.query(Execution).filter(
        Execution.status.in_(["completed", "failed"])
    ).count()
    success_rate = round((db.query(Execution).filter(
        Execution.status == "completed"
    ).count() / total_done * 100), 1) if total_done > 0 else 0

    # Last 7 days execution trend
    trend = []
    for i in range(6, -1, -1):
        day_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ) - timedelta(days=i)
        day_end = day_start + timedelta(days=1)

        completed = db.query(Execution).filter(
            Execution.status == "completed",
            Execution.created_at >= day_start,
            Execution.created_at < day_end
        ).count()

        failed = db.query(Execution).filter(
            Execution.status == "failed",
            Execution.created_at >= day_start,
            Execution.created_at < day_end
        ).count()

        trend.append({
            "date": day_start.strftime("%b %d"),
            "completed": completed,
            "failed": failed
        })

    # Recent executions
    recent = db.query(Execution).order_by(
        Execution.created_at.desc()
    ).limit(5).all()

    recent_list = []
    for ex in recent:
        recent_list.append({
            "id": str(ex.id),
            "workflow_id": str(ex.workflow_id),
            "status": ex.status,
            "workflow_version": ex.workflow_version,
            "created_at": ex.created_at.isoformat(),
            "retry_count": ex.retry_count
        })

    # Pending approvals list
    pending_list = db.query(Execution).filter(
        Execution.status == "waiting_approval"
    ).order_by(Execution.created_at.asc()).all()

    pending_executions = []
    for ex in pending_list:
        # Find the waiting step name from logs
        waiting_step = None
        for log in (ex.step_logs or []):
            if log.get("status") == "waiting_approval":
                waiting_step = log.get("step_name")
                break
        pending_executions.append({
            "id": str(ex.id),
            "workflow_id": str(ex.workflow_id),
            "status": ex.status,
            "waiting_step": waiting_step,
            "created_at": ex.created_at.isoformat(),
            "input_data": ex.input_data
        })

    return {
        "stats": {
            "total_workflows": total_workflows,
            "pending_approvals": pending_approvals,
            "completed_today": completed_today,
            "total_failed": total_failed,
            "total_executions": total_executions,
            "success_rate": success_rate
        },
        "trend": trend,
        "recent_executions": recent_list,
        "pending_executions": pending_executions
    }