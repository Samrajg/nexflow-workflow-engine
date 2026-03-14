from datetime import datetime, timezone
from typing import Any, Dict
from sqlalchemy.orm import Session
from uuid import UUID

from models.execution import Execution
from models.step import Step
from models.rule import Rule
from engine.rule_engine import evaluate_rules, evaluate_condition


def run_execution(execution_id: str, db: Session):
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise ValueError(f"Execution {execution_id} not found")

    execution.status = "running"
    db.commit()

    input_data = execution.input_data
    step_logs = []

    # Get first step from workflow
    from models.workflow import Workflow
    workflow = db.query(Workflow).filter(Workflow.id == execution.workflow_id).first()
    if not workflow or not workflow.first_step_id:
        execution.status = "failed"
        db.commit()
        raise ValueError("Workflow has no first step defined")

    current_step_id = workflow.first_step_id
    max_steps = 50  # prevent infinite loops
    step_count = 0

    while current_step_id and step_count < max_steps:
        step_count += 1
        step = db.query(Step).filter(Step.id == current_step_id).first()
        if not step:
            break

        execution.current_step_id = step.id
        db.commit()

        started_at = datetime.now(timezone.utc)

        # Get rules for this step ordered by priority
        rules = db.query(Rule).filter(
            Rule.step_id == step.id
        ).order_by(Rule.priority).all()

        # Evaluate all rules and log results
        evaluated_rules = []
        matched_rule = None
        next_step_id = None

        for rule in rules:
            try:
                result = evaluate_condition(rule.condition, input_data)
                evaluated_rules.append({
                    "rule_id": str(rule.id),
                    "condition": rule.condition,
                    "result": result,
                    "priority": rule.priority
                })
                if result and matched_rule is None:
                    matched_rule = rule
                    next_step_id = str(rule.next_step_id) if rule.next_step_id else None
            except ValueError as e:
                evaluated_rules.append({
                    "rule_id": str(rule.id),
                    "condition": rule.condition,
                    "result": False,
                    "error": str(e),
                    "priority": rule.priority
                })

        ended_at = datetime.now(timezone.utc)
        duration = (ended_at - started_at).total_seconds()

        # Build step log
        step_log = {
            "step_id": str(step.id),
            "step_name": step.name,
            "step_type": step.step_type,
            "evaluated_rules": evaluated_rules,
            "selected_next_step": next_step_id,
            "status": "completed" if matched_rule else "failed",
            "error_message": None if matched_rule else "No rule matched",
            "started_at": started_at.isoformat(),
            "ended_at": ended_at.isoformat(),
            "duration_seconds": duration
        }
        step_logs.append(step_log)

        # If no rule matched, fail
        if not matched_rule:
            execution.status = "failed"
            execution.step_logs = step_logs
            db.commit()
            return execution

        # Move to next step
        current_step_id = UUID(next_step_id) if next_step_id else None

    # All steps completed
    execution.status = "completed"
    execution.step_logs = step_logs
    execution.current_step_id = None
    db.commit()
    db.refresh(execution)
    return execution