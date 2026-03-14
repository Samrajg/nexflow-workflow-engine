import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, TIMESTAMP, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Rule(Base):
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)
    condition = Column(Text, nullable=False)
    next_step_id = Column(UUID(as_uuid=True), ForeignKey("steps.id", ondelete="SET NULL"), nullable=True)
    priority = Column(Integer, nullable=False, default=1)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    step = relationship("Step", back_populates="rules", foreign_keys=[step_id])