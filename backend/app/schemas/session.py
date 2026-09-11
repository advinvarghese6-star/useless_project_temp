from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.session import SessionStatus

class SessionDetail(BaseModel):
    session_id: str
    status: SessionStatus
    started_at: datetime
    ended_at: Optional[datetime] = None
    total_keystrokes: int
    total_purges: int
    characters_deleted: int

    model_config = ConfigDict(from_attributes=True)

class SessionCreateResponse(BaseModel):
    success: bool = True
    session_id: str
    status: SessionStatus
    started_at: datetime

class SessionGetResponse(BaseModel):
    success: bool = True
    session: SessionDetail

class SessionEndStatistics(BaseModel):
    keystrokes: int
    purges: int
    characters_deleted: int

class SessionEndResponse(BaseModel):
    success: bool = True
    message: str
    statistics: SessionEndStatistics
