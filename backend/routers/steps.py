from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from models.workflow import Workflow
from models.step import Step
from schemas.step import StepCreate, StepUpdate, StepResponse

router = APIRouter(
    prefix="/api/workflows/{workflow_id}/steps",
    tags=["Steps"]
)

@router.post("", response_model=StepResponse, status_code=201)
def create_step(workflow_id: UUID, payload: StepCreate, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    # Check duplicate order
    existing_order = db.query(Step).filter(
        Step.workflow_id == workflow_id,
        Step.order == payload.order
    ).first()
    if existing_order:
        raise HTTPException(status_code=400, detail=f"Step with order {payload.order} already exists in this workflow")

    step = Step(
        workflow_id=workflow_id,
        name=payload.name,
        step_type=payload.step_type,
        order=payload.order,
        metadata_=payload.metadata_ or {}
    )
    db.add(step)

    # Set as first step if workflow has none
    if not workflow.first_step_id:
        db.flush()
        workflow.first_step_id = step.id
        db.add(workflow)

    db.commit()
    db.refresh(step)
    return StepResponse.from_orm(step)


@router.get("", response_model=list[StepResponse])
def list_steps(workflow_id: UUID, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    steps = db.query(Step).filter(
        Step.workflow_id == workflow_id
    ).order_by(Step.order).all()

    return [StepResponse.from_orm(s) for s in steps]


@router.put("/{step_id}", response_model=StepResponse)
def update_step(workflow_id: UUID, step_id: UUID, payload: StepUpdate, db: Session = Depends(get_db)):
    step = db.query(Step).filter(
        Step.id == step_id,
        Step.workflow_id == workflow_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Check duplicate order if order is being changed
    if payload.order and payload.order != step.order:
        existing_order = db.query(Step).filter(
            Step.workflow_id == workflow_id,
            Step.order == payload.order
        ).first()
        if existing_order:
            raise HTTPException(status_code=400, detail=f"Step with order {payload.order} already exists")

    if payload.name is not None:
        step.name = payload.name
    if payload.step_type is not None:
        step.step_type = payload.step_type
    if payload.order is not None:
        step.order = payload.order
    if payload.metadata_ is not None:
        step.metadata_ = payload.metadata_

    db.commit()
    db.refresh(step)
    return StepResponse.from_orm(step)


@router.delete("/{step_id}", status_code=204)
def delete_step(workflow_id: UUID, step_id: UUID, db: Session = Depends(get_db)):
    step = db.query(Step).filter(
        Step.id == step_id,
        Step.workflow_id == workflow_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # If this was the first step, clear it from workflow
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if workflow and workflow.first_step_id == step_id:
        workflow.first_step_id = None
        db.add(workflow)

    db.delete(step)
    db.commit()
    return None