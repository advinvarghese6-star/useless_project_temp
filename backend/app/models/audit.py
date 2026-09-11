import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum
from app.database import Base

class AuditEventType(str, enum.Enum):
    SESSION_STARTED = "SESSION_STARTED"
    KEYSTROKE = "KEYSTROKE"
    IDLE_DETECTED = "IDLE_DETECTED"
    WARNING_ESCAPED = "WARNING_ESCAPED"
    PURGE = "PURGE"
    SESSION_ENDED = "SESSION_ENDED"

class AuditEventModel(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(32), index=True, nullable=False)
    event_type = Column(SQLEnum(AuditEventType), nullable=False)
    message = Column(String(500), nullable=False)
    characters_deleted = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
