from typing import List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.audit import AuditEventType

class AuditEventCreate(BaseModel):
    session_id: str = Field(..., description="Session identifier (e.g. CR-A7X29K)")
    event_type: AuditEventType = Field(..., description="Allowed event type")
    message: str = Field(..., max_length=500, description="Audit log message")
    characters_deleted: int = Field(default=0, ge=0, le=10, description="Number of deleted characters (0-10)")

class AuditEventResponseItem(BaseModel):
    event_type: AuditEventType
    message: str
    characters_deleted: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditEventCreateResponse(BaseModel):
    success: bool = True
    event: AuditEventResponseItem

class AuditHistoryResponse(BaseModel):
    success: bool = True
    session_id: str
    events: List[AuditEventResponseItem]

class GlobalStatistics(BaseModel):
    total_sessions: int
    active_sessions: int
    completed_sessions: int
    total_purges: int
    total_characters_deleted: int
    total_keystrokes: int

class GlobalStatisticsResponse(BaseModel):
    success: bool = True
    statistics: GlobalStatistics

class SessionStatistics(BaseModel):
    keystrokes: int
    purges: int
    characters_deleted: int
    idle_events: int
    warnings_escaped: int

class SessionStatisticsResponse(BaseModel):
    success: bool = True
    session_id: str
    statistics: SessionStatistics
