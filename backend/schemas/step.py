from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime
from enum import Enum

class StepType(str, Enum):
    task = "task"
    approval = "approval"
    notification = "notification"

class StepCreate(BaseModel):
    name: str = Field(..., example="Manager Approval")
    step_type: StepType = Field(..., example="approval")
    order: int = Field(..., example=1)
    metadata_: Optional[Dict[str, Any]] = Field(default={}, alias="metadata", example={
        "assignee_email": "manager@example.com"
    })

    class Config:
        populate_by_name = True

class StepUpdate(BaseModel):
    name: Optional[str] = None
    step_type: Optional[StepType] = None
    order: Optional[int] = None
    metadata_: Optional[Dict[str, Any]] = Field(default=None, alias="metadata")

    class Config:
        populate_by_name = True

class StepResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    name: str
    step_type: str
    order: int
    metadata: Dict[str, Any] = Field(default={})
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        return cls(
            id=obj.id,
            workflow_id=obj.workflow_id,
            name=obj.name,
            step_type=obj.step_type,
            order=obj.order,
            metadata=obj.metadata_ or {},
            created_at=obj.created_at,
            updated_at=obj.updated_at
        )