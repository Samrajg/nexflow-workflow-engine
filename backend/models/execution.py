import uuid
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Execution(Base):
    __tablename__ = "executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    workflow_version = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    input_data = Column(JSON, nullable=False, default=dict)
    step_logs = Column(JSON, nullable=False, default=list)
    current_step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="SET NULL"), nullable=True)
    retry_count = Column(Integer, nullable=False, default=0)
    started_by = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    workflow = relationship("Workflow", back_populates="executions")