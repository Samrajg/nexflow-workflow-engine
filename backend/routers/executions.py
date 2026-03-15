from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from pydantic import BaseModel

from database import get_db
from models.execution import Execution
from models.workflow import Workflow
from schemas.execution import ExecutionCreate, ExecutionResponse, ExecutionListResponse
from engine.executor import run_execution, approve_step

router = APIRouter(
    prefix="/api/executions",
    tags=["Executions"]
)

class ApprovalPayload(BaseModel):
    approved: bool
    approver_id: Optional[str] = "anonymous"


@router.post("", response_model=ExecutionResponse, status_code=201)
def start_execution(payload: ExecutionCreate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(
        Workflow.id == payload.workflow_id,
        Workflow.is_active == True
    ).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found or inactive")

    if not workflow.first_step_id:
        raise HTTPException(status_code=400, detail="Workflow has no steps defined")

    execution = Execution(
        workflow_id=payload.workflow_id,
        workflow_version=workflow.version,
        status="pending",
        input_data=payload.input_data,
        step_logs=[],
        started_by=payload.started_by,
        retry_count=0
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    try:
        result = run_execution(str(execution.id), db)
        return result
    except Exception as e:
        execution.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=ExecutionListResponse)
def list_executions(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: Optional[str] = Query(None),
    workflow_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Execution)
    if status:
        query = query.filter(Execution.status == status)
    if workflow_id:
        query = query.filter(Execution.workflow_id == workflow_id)

    total = query.count()
    executions = query.order_by(Execution.created_at.desc()) \
                      .offset((page - 1) * page_size) \
                      .limit(page_size).all()

    return ExecutionListResponse(
        total=total,
        page=page,
        page_size=page_size,
        executions=executions
    )


@router.get("/{execution_id}", response_model=ExecutionResponse)
def get_execution(execution_id: UUID, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(
        Execution.id == execution_id
    ).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.post("/{execution_id}/approve", response_model=ExecutionResponse)
def approve_execution(
    execution_id: UUID,
    payload: ApprovalPayload,
    db: Session = Depends(get_db)
):
    try:
        result = approve_step(
            str(execution_id),
            payload.approved,
            payload.approver_id or "anonymous",
            db
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{execution_id}/cancel", response_model=ExecutionResponse)
def cancel_execution(execution_id: UUID, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(
        Execution.id == execution_id
    ).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    if execution.status not in ["pending", "running", "waiting_approval"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel execution with status {execution.status}"
        )
    execution.status = "cancelled"
    db.commit()
    db.refresh(execution)
    return execution


@router.post("/{execution_id}/retry", response_model=ExecutionResponse)
def retry_execution(execution_id: UUID, db: Session = Depends(get_db)):
    execution = db.query(Execution).filter(
        Execution.id == execution_id
    ).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    if execution.status != "failed":
        raise HTTPException(
            status_code=400,
            detail="Only failed executions can be retried"
        )
    execution.status = "pending"
    execution.retry_count += 1
    execution.step_logs = []
    db.commit()

    try:
        result = run_execution(str(execution.id), db)
        return result
    except Exception as e:
        execution.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))