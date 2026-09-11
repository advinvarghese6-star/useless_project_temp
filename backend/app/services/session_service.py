import random
import string
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.session import SessionModel, SessionStatus
from app.models.audit import AuditEventModel, AuditEventType

class SessionService:

    @staticmethod
    def generate_session_id() -> str:
        chars = string.ascii_uppercase + string.digits
        random_suffix = ''.join(random.choices(chars, k=6))
        return f"CR-{random_suffix}"

    @classmethod
    def create_session(cls, db: Session) -> SessionModel:
        # Generate unique session ID
        while True:
            session_id = cls.generate_session_id()
            existing = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
            if not existing:
                break

        now = datetime.now(timezone.utc)
        session_obj = SessionModel(
            session_id=session_id,
            started_at=now,
            status=SessionStatus.ACTIVE,
            total_keystrokes=0,
            total_purges=0,
            characters_deleted=0
        )

        audit_obj = AuditEventModel(
            session_id=session_id,
            event_type=AuditEventType.SESSION_STARTED,
            message="Session initialized",
            characters_deleted=0,
            created_at=now
        )

        db.add(session_obj)
        db.add(audit_obj)
        db.commit()
        db.refresh(session_obj)
        return session_obj

    @staticmethod
    def get_session(db: Session, session_id: str) -> SessionModel:
        return db.query(SessionModel).filter(SessionModel.session_id == session_id).first()

    @staticmethod
    def end_session(db: Session, session_id: str) -> SessionModel:
        session_obj = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not session_obj:
            return None

        if session_obj.status == SessionStatus.COMPLETED:
            return session_obj

        now = datetime.now(timezone.utc)
        session_obj.ended_at = now
        session_obj.status = SessionStatus.COMPLETED

        audit_obj = AuditEventModel(
            session_id=session_id,
            event_type=AuditEventType.SESSION_ENDED,
            message="Session completed",
            characters_deleted=0,
            created_at=now
        )

        db.add(audit_obj)
        db.commit()
        db.refresh(session_obj)
        return session_obj
