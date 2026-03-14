import uuid
from sqlalchemy import Column, String, Integer, JSON, ForeignKey, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Step(Base):
    __tablename__ = "steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    step_type = Column(String(50), nullable=False)
    order = Column("order", Integer, nullable=False, default=0)
    metadata_ = Column("metadata", JSON, nullable=False, default=dict)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    workflow = relationship("Workflow", back_populates="steps", foreign_keys=[workflow_id])
    rules = relationship("Rule", back_populates="step", foreign_keys="Rule.step_id", cascade="all, delete-orphan")