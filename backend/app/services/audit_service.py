from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.session import SessionModel, SessionStatus
from app.models.audit import AuditEventModel, AuditEventType
from app.schemas.audit import AuditEventCreate, GlobalStatistics, SessionStatistics

class AuditService:

    @staticmethod
    def record_audit_event(db: Session, audit_data: AuditEventCreate) -> Optional[AuditEventModel]:
        session_obj = db.query(SessionModel).filter(SessionModel.session_id == audit_data.session_id).first()
        if not session_obj:
            raise ValueError("SESSION_NOT_FOUND")

        if session_obj.status != SessionStatus.ACTIVE and audit_data.event_type != AuditEventType.SESSION_ENDED:
            raise ValueError("SESSION_INACTIVE")

        now = datetime.now(timezone.utc)
        audit_obj = AuditEventModel(
            session_id=audit_data.session_id,
            event_type=audit_data.event_type,
            message=audit_data.message,
            characters_deleted=audit_data.characters_deleted,
            created_at=now
        )

        # Handle specific side effects within single transaction
        if audit_data.event_type == AuditEventType.KEYSTROKE:
            session_obj.total_keystrokes += 1
        elif audit_data.event_type == AuditEventType.PURGE:
            session_obj.total_purges += 1
            session_obj.characters_deleted += audit_data.characters_deleted

        db.add(audit_obj)
        db.commit()
        db.refresh(audit_obj)
        return audit_obj

    @staticmethod
    def get_audit_history(db: Session, session_id: str) -> List[AuditEventModel]:
        return db.query(AuditEventModel).filter(
            AuditEventModel.session_id == session_id
        ).order_by(AuditEventModel.created_at.desc()).all()

    @staticmethod
    def get_global_statistics(db: Session) -> GlobalStatistics:
        total_sessions = db.query(func.count(SessionModel.id)).scalar() or 0
        active_sessions = db.query(func.count(SessionModel.id)).filter(SessionModel.status == SessionStatus.ACTIVE).scalar() or 0
        completed_sessions = db.query(func.count(SessionModel.id)).filter(SessionModel.status == SessionStatus.COMPLETED).scalar() or 0

        total_purges = db.query(func.sum(SessionModel.total_purges)).scalar() or 0
        total_characters_deleted = db.query(func.sum(SessionModel.characters_deleted)).scalar() or 0
        total_keystrokes = db.query(func.sum(SessionModel.total_keystrokes)).scalar() or 0

        return GlobalStatistics(
            total_sessions=total_sessions,
            active_sessions=active_sessions,
            completed_sessions=completed_sessions,
            total_purges=total_purges,
            total_characters_deleted=total_characters_deleted,
            total_keystrokes=total_keystrokes
        )

    @staticmethod
    def get_session_statistics(db: Session, session_id: str) -> Optional[SessionStatistics]:
        session_obj = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not session_obj:
            return None

        idle_events = db.query(func.count(AuditEventModel.id)).filter(
            AuditEventModel.session_id == session_id,
            AuditEventModel.event_type == AuditEventType.IDLE_DETECTED
        ).scalar() or 0

        warnings_escaped = db.query(func.count(AuditEventModel.id)).filter(
            AuditEventModel.session_id == session_id,
            AuditEventModel.event_type == AuditEventType.WARNING_ESCAPED
        ).scalar() or 0

        return SessionStatistics(
            keystrokes=session_obj.total_keystrokes,
            purges=session_obj.total_purges,
            characters_deleted=session_obj.characters_deleted,
            idle_events=idle_events,
            warnings_escaped=warnings_escaped
        )
