from typing import Any, Dict, Optional
from engine.currency import convert_to_inr


def evaluate_condition(condition: str, input_data: Dict[str, Any]) -> bool:
    if condition.strip().upper() == "DEFAULT":
        return True

    expr = condition.replace("&&", " and ").replace("||", " or ")
    expr = expr.replace("!=", " != ")

    safe_globals = {"__builtins__": {}}
    safe_locals = dict(input_data)

    # Add amount_inr to locals if amount and country exist
    if "amount" in input_data and "country" in input_data:
        try:
            amount_inr = convert_to_inr(
                float(input_data["amount"]),
                str(input_data["country"])
            )
            safe_locals["amount_inr"] = amount_inr
        except Exception:
            pass

    try:
        result = eval(expr, safe_globals, safe_locals)
        return bool(result)
    except Exception as e:
        raise ValueError(
            f"Rule evaluation error: {e} | Expression: {expr} | Data: {input_data}"
        )


def evaluate_rules(rules: list, input_data: Dict[str, Any]) -> Optional[Dict]:
    sorted_rules = sorted(rules, key=lambda r: r.priority)

    for rule in sorted_rules:
        try:
            matched = evaluate_condition(rule.condition, input_data)
            if matched:
                return {
                    "rule_id": str(rule.id),
                    "condition": rule.condition,
                    "matched": True,
                    "next_step_id": str(rule.next_step_id) if rule.next_step_id else None
                }
        except ValueError as e:
            raise e

    return None