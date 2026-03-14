from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from uuid import UUID

from database import get_db
from models.workflow import Workflow
from schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowResponse, WorkflowListResponse

router = APIRouter(
    prefix="/api/workflows",
    tags=["Workflows"]
)

@router.post("", response_model=WorkflowResponse, status_code=201)
def create_workflow(payload: WorkflowCreate, db: Session = Depends(get_db)):
    # Check if workflow with same name exists — increment version
    existing = db.query(Workflow).filter(
        Workflow.name == payload.name
    ).order_by(Workflow.version.desc()).first()

    new_version = 1
    if existing:
        new_version = existing.version + 1
        # Deactivate old version
        existing.is_active = False
        db.add(existing)

    workflow = Workflow(
        name=payload.name,
        description=payload.description,
        version=new_version,
        input_schema=payload.input_schema or {},
        created_by=payload.created_by,
        is_active=True
    )
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow


@router.get("", response_model=WorkflowListResponse)
def list_workflows(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Workflow)

    if search:
        query = query.filter(
            or_(
                Workflow.name.ilike(f"%{search}%"),
                Workflow.description.ilike(f"%{search}%")
            )
        )

    if is_active is not None:
        query = query.filter(Workflow.is_active == is_active)

    total = query.count()
    workflows = query.order_by(Workflow.created_at.desc()) \
                     .offset((page - 1) * page_size) \
                     .limit(page_size) \
                     .all()

    return WorkflowListResponse(
        total=total,
        page=page,
        page_size=page_size,
        workflows=workflows
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: UUID, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(workflow_id: UUID, payload: WorkflowUpdate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Every update creates a new version
    new_workflow = Workflow(
        name=payload.name or workflow.name,
        description=payload.description if payload.description is not None else workflow.description,
        version=workflow.version + 1,
        input_schema=payload.input_schema or workflow.input_schema,
        is_active=True,
        created_by=workflow.created_by
    )

    # Deactivate current version
    workflow.is_active = False
    db.add(workflow)
    db.add(new_workflow)
    db.commit()
    db.refresh(new_workflow)
    return new_workflow


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: UUID, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(workflow)
    db.commit()
    return None