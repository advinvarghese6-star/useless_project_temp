from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.session_service import SessionService
from app.schemas.session import (
    SessionCreateResponse,
    SessionGetResponse,
    SessionEndResponse,
    SessionDetail,
    SessionEndStatistics
)

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("", response_model=SessionCreateResponse, status_code=status.HTTP_200_OK)
def create_session(db: Session = Depends(get_db)):
    session_obj = SessionService.create_session(db)
    return {
        "success": True,
        "session_id": session_obj.session_id,
        "status": session_obj.status,
        "started_at": session_obj.started_at
    }

@router.get("/{session_id}", response_model=SessionGetResponse)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session_obj = SessionService.get_session(db, session_id)
    if not session_obj:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": "Session not found",
                "code": "SESSION_NOT_FOUND"
            }
        )
    
    return {
        "success": True,
        "session": SessionDetail.model_validate(session_obj)
    }

@router.post("/{session_id}/end", response_model=SessionEndResponse)
def end_session(session_id: str, db: Session = Depends(get_db)):
    session_obj = SessionService.get_session(db, session_id)
    if not session_obj:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "error": "Session not found",
                "code": "SESSION_NOT_FOUND"
            }
        )

    ended_session = SessionService.end_session(db, session_id)
    return {
        "success": True,
        "message": "Session completed.",
        "statistics": SessionEndStatistics(
            keystrokes=ended_session.total_keystrokes,
            purges=ended_session.total_purges,
            characters_deleted=ended_session.characters_deleted
        )
    }
