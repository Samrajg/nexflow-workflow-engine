from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime

class WorkflowCreate(BaseModel):
    name: str = Field(..., example="Expense Approval")
    description: Optional[str] = Field(None, example="Handles expense approvals")
    input_schema: Optional[Dict[str, Any]] = Field(default={}, example={
        "amount": {"type": "number", "required": True},
        "country": {"type": "string", "required": True},
        "priority": {"type": "string", "required": True, "allowed_values": ["High", "Medium", "Low"]}
    })
    created_by: Optional[UUID] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class WorkflowResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    version: int
    is_active: bool
    input_schema: Dict[str, Any]
    first_step_id: Optional[UUID]
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    workflows: List[WorkflowResponse]