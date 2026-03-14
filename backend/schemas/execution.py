from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from uuid import UUID
from datetime import datetime

class ExecutionCreate(BaseModel):
    workflow_id: UUID
    input_data: Dict[str, Any]
    started_by: Optional[UUID] = None

class ExecutionResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    workflow_version: int
    status: str
    input_data: Dict[str, Any]
    step_logs: List[Any]
    current_step_id: Optional[UUID]
    retry_count: int
    started_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExecutionListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    executions: List[ExecutionResponse]