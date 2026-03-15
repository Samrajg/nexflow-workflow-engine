from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from uuid import UUID

from models.execution import Execution
from models.step import Step
from models.rule import Rule
from engine.rule_engine import evaluate_condition
from engine.notifier import send_notification_email, send_approval_request_email


def run_execution(execution_id: str, db: Session):
    execution = db.query(Execution).filter(
        Execution.id == execution_id
    ).first()
    if not execution:
        raise ValueError(f"Execution {execution_id} not found")

    execution.status = "running"
    db.commit()

    input_data = execution.input_data
    step_logs = list(execution.step_logs or [])

    from models.workflow import Workflow
    workflow = db.query(Workflow).filter(
        Workflow.id == execution.workflow_id
    ).first()
    if not workflow or not workflow.first_step_id:
        execution.status = "failed"
        db.commit()
        raise ValueError("Workflow has no first step defined")

    if execution.current_step_id and execution.retry_count > 0:
        current_step_id = execution.current_step_id
    else:
        current_step_id = workflow.first_step_id

    max_steps = 50
    step_count = 0

    while current_step_id and step_count < max_steps:
        step_count += 1
        step = db.query(Step).filter(Step.id == current_step_id).first()
        if not step:
            break

        execution.current_step_id = step.id
        db.commit()

        started_at = datetime.now(timezone.utc)

        # ─── APPROVAL STEP ─────────────────────────────────
        if step.step_type == "approval":
            assignee_email = step.metadata_.get("assignee_email") if step.metadata_ else None
            if assignee_email:
                send_approval_request_email(
                    to_email=assignee_email,
                    step_name=step.name,
                    workflow_name=workflow.name,
                    execution_id=str(execution.id),
                    input_data=input_data
                )
            execution.status = "waiting_approval"
            step_logs.append({
                "step_id": str(step.id),
                "step_name": step.name,
                "step_type": step.step_type,
                "evaluated_rules": [],
                "selected_next_step": None,
                "status": "waiting_approval",
                "error_message": None,
                "assignee_email": assignee_email,
                "started_at": started_at.isoformat(),
                "ended_at": None,
                "duration_seconds": None
            })
            execution.step_logs = step_logs
            flag_modified(execution, "step_logs")
            db.commit()
            return execution

        # ─── NOTIFICATION STEP ─────────────────────────────
        if step.step_type == "notification":
            to_email = step.metadata_.get("assignee_email") if step.metadata_ else None
            template = step.metadata_.get("template", "default") if step.metadata_ else "default"
            if to_email:
                send_notification_email(
                    to_email=to_email,
                    step_name=step.name,
                    workflow_name=workflow.name,
                    input_data=input_data,
                    template=template
                )

        # ─── EVALUATE RULES ────────────────────────────────
        rules = db.query(Rule).filter(
            Rule.step_id == step.id
        ).order_by(Rule.priority).all()

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

        if not matched_rule:
            execution.status = "failed"
            execution.step_logs = step_logs
            flag_modified(execution, "step_logs")
            db.commit()
            return execution

        current_step_id = UUID(next_step_id) if next_step_id else None

    execution.status = "completed"
    execution.step_logs = step_logs
    execution.current_step_id = None
    flag_modified(execution, "step_logs")
    db.commit()
    db.refresh(execution)
    return execution


def _run_steps_from(current_step_id: UUID, execution, step_logs: list, input_data: dict, db: Session):
    from models.workflow import Workflow
    workflow = db.query(Workflow).filter(
        Workflow.id == execution.workflow_id
    ).first()

    max_steps = 50
    step_count = 0

    while current_step_id and step_count < max_steps:
        step_count += 1
        step = db.query(Step).filter(Step.id == current_step_id).first()
        if not step:
            break

        execution.current_step_id = step.id
        db.commit()

        started_at = datetime.now(timezone.utc)

        # APPROVAL
        if step.step_type == "approval":
            assignee_email = step.metadata_.get("assignee_email") if step.metadata_ else None
            if assignee_email:
                send_approval_request_email(
                    to_email=assignee_email,
                    step_name=step.name,
                    workflow_name=workflow.name,
                    execution_id=str(execution.id),
                    input_data=input_data
                )
            execution.status = "waiting_approval"
            step_logs.append({
                "step_id": str(step.id),
                "step_name": step.name,
                "step_type": step.step_type,
                "evaluated_rules": [],
                "selected_next_step": None,
                "status": "waiting_approval",
                "error_message": None,
                "assignee_email": assignee_email,
                "started_at": started_at.isoformat(),
                "ended_at": None,
                "duration_seconds": None
            })
            execution.step_logs = step_logs
            flag_modified(execution, "step_logs")
            db.commit()
            return execution

        # NOTIFICATION
        if step.step_type == "notification":
            to_email = step.metadata_.get("assignee_email") if step.metadata_ else None
            template = step.metadata_.get("template", "default") if step.metadata_ else "default"
            if to_email:
                send_notification_email(
                    to_email=to_email,
                    step_name=step.name,
                    workflow_name=workflow.name,
                    input_data=input_data,
                    template=template
                )

        # EVALUATE RULES
        rules = db.query(Rule).filter(
            Rule.step_id == step.id
        ).order_by(Rule.priority).all()

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

        if not matched_rule:
            execution.status = "failed"
            execution.step_logs = step_logs
            flag_modified(execution, "step_logs")
            db.commit()
            return execution

        current_step_id = UUID(next_step_id) if next_step_id else None

    execution.status = "completed"
    execution.step_logs = step_logs
    execution.current_step_id = None
    flag_modified(execution, "step_logs")
    db.commit()
    db.refresh(execution)
    return execution


def approve_step(execution_id: str, approved: bool, approver_id: str, db: Session):
    execution = db.query(Execution).filter(
        Execution.id == execution_id
    ).first()
    if not execution:
        raise ValueError("Execution not found")

    if execution.status not in ["waiting_approval", "failed"]:
        raise ValueError(f"Execution is not waiting for approval, current status: {execution.status}")

    execution.status = "waiting_approval"
    db.commit()

    step_logs = list(execution.step_logs or [])

    # Update the LAST waiting_approval log
    for log in reversed(step_logs):
        if log.get("status") == "waiting_approval":
            log["status"] = "approved" if approved else "rejected"
            log["approver_id"] = approver_id
            log["ended_at"] = datetime.now(timezone.utc).isoformat()
            break

    execution.step_logs = step_logs
    flag_modified(execution, "step_logs")

    if not approved:
        execution.status = "failed"
        db.commit()
        return execution

    current_step = db.query(Step).filter(
        Step.id == execution.current_step_id
    ).first()

    if not current_step:
        execution.status = "failed"
        db.commit()
        return execution

    rules = db.query(Rule).filter(
        Rule.step_id == current_step.id
    ).order_by(Rule.priority).all()

    matched_rule = None
    next_step_id = None
    evaluated_rules = []
    input_data = execution.input_data

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

    # Update the approved log with rule results
    for log in reversed(step_logs):
        if log.get("step_id") == str(current_step.id):
            log["evaluated_rules"] = evaluated_rules
            log["selected_next_step"] = next_step_id
            break

    execution.step_logs = step_logs
    flag_modified(execution, "step_logs")
    db.commit()

    # No rules at all — end of workflow
    if len(rules) == 0:
        execution.status = "completed"
        execution.current_step_id = None
        flag_modified(execution, "step_logs")
        db.commit()
        return execution

    if not matched_rule:
        execution.status = "failed"
        db.commit()
        return execution

    next_id = UUID(next_step_id) if next_step_id else None

    if not next_id:
        execution.status = "completed"
        execution.current_step_id = None
        db.commit()
        return execution

    execution.current_step_id = next_id
    execution.status = "running"
    db.commit()

    return _run_steps_from(next_id, execution, step_logs, input_data, db)