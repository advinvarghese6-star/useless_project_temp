from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.session_service import SessionService
from app.services.audit_service import AuditService
from app.schemas.audit import GlobalStatisticsResponse, SessionStatisticsResponse

router = APIRouter(prefix="/api/statistics", tags=["Statistics"])

@router.get("", response_model=GlobalStatisticsResponse)
def get_global_statistics(db: Session = Depends(get_db)):
    stats = AuditService.get_global_statistics(db)
    return {
        "success": True,
        "statistics": stats
    }

@router.get("/{session_id}", response_model=SessionStatisticsResponse)
def get_session_statistics(session_id: str, db: Session = Depends(get_db)):
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

    stats = AuditService.get_session_statistics(db, session_id)
    return {
        "success": True,
        "session_id": session_id,
        "statistics": stats
    }
