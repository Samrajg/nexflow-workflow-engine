from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class RuleCreate(BaseModel):
    condition: str
    next_step_id: Optional[UUID] = None
    priority: int = 1

class RuleUpdate(BaseModel):
    condition: Optional[str] = None
    next_step_id: Optional[UUID] = None
    priority: Optional[int] = None

class RuleResponse(BaseModel):
    id: UUID
    step_id: UUID
    condition: str
    next_step_id: Optional[UUID]
    priority: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True