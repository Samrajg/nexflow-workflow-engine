from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from database import get_db
from models.step import Step
from models.rule import Rule
from schemas.rule import RuleCreate, RuleUpdate, RuleResponse

router = APIRouter(
    prefix="/api/steps/{step_id}/rules",
    tags=["Rules"]
)

@router.post("", response_model=RuleResponse, status_code=201)
def create_rule(step_id: UUID, payload: RuleCreate, db: Session = Depends(get_db)):
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    # Check duplicate priority
    existing = db.query(Rule).filter(
        Rule.step_id == step_id,
        Rule.priority == payload.priority
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule with priority {payload.priority} already exists for this step")

    rule = Rule(
        step_id=step_id,
        condition=payload.condition,
        next_step_id=payload.next_step_id,
        priority=payload.priority
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("", response_model=list[RuleResponse])
def list_rules(step_id: UUID, db: Session = Depends(get_db)):
    step = db.query(Step).filter(Step.id == step_id).first()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found")

    rules = db.query(Rule).filter(
        Rule.step_id == step_id
    ).order_by(Rule.priority).all()

    return rules


@router.put("/{rule_id}", response_model=RuleResponse)
def update_rule(step_id: UUID, rule_id: UUID, payload: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.step_id == step_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Check duplicate priority if changing
    if payload.priority and payload.priority != rule.priority:
        existing = db.query(Rule).filter(
            Rule.step_id == step_id,
            Rule.priority == payload.priority
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Rule with priority {payload.priority} already exists")

    if payload.condition is not None:
        rule.condition = payload.condition
    if payload.next_step_id is not None:
        rule.next_step_id = payload.next_step_id
    if payload.priority is not None:
        rule.priority = payload.priority

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_rule(step_id: UUID, rule_id: UUID, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(
        Rule.id == rule_id,
        Rule.step_id == step_id
    ).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return None