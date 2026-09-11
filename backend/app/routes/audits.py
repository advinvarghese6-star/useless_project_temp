from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.session_service import SessionService
from app.services.audit_service import AuditService
from app.schemas.audit import (
    AuditEventCreate,
    AuditEventCreateResponse,
    AuditEventResponseItem,
    AuditHistoryResponse
)

router = APIRouter(prefix="/api/audits", tags=["Audits"])

@router.post("", response_model=AuditEventCreateResponse, status_code=status.HTTP_200_OK)
def create_audit_event(audit_data: AuditEventCreate, db: Session = Depends(get_db)):
    try:
        audit_obj = AuditService.record_audit_event(db, audit_data)
        return {
            "success": True,
            "event": AuditEventResponseItem.model_validate(audit_obj)
        }
    except ValueError as e:
        err_code = str(e)
        if err_code == "SESSION_NOT_FOUND":
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "error": "Session not found",
                    "code": "SESSION_NOT_FOUND"
                }
            )
        elif err_code == "SESSION_INACTIVE":
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": "Session is inactive",
                    "code": "SESSION_INACTIVE"
                }
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "error": str(e),
                    "code": "INVALID_EVENT"
                }
            )

@router.get("/{session_id}", response_model=AuditHistoryResponse)
def get_audit_history(session_id: str, db: Session = Depends(get_db)):
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

    events = AuditService.get_audit_history(db, session_id)
    event_items = [AuditEventResponseItem.model_validate(e) for e in events]
    return {
        "success": True,
        "session_id": session_id,
        "events": event_items
    }
