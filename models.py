import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB

from database import Base


class PredictionLog(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    input_payload = Column(JSONB, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_label = Column(String, nullable=False)
    top_factors = Column(JSONB, nullable=False)
