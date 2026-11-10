from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.users import AuditLog, User, ConsentRecord
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/audit", tags=["Security & Compliance Audit"])

@router.get("/logs")
def list_audit_logs(
    action: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin"]))
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    logs = q.order_by(AuditLog.created_at.desc()).limit(limit).all()

    return [{
        "id": l.id,
        "user_id": l.user_id,
        "user_email": l.user.email if l.user else "System",
        "action": l.action,
        "entity_type": l.entity_type,
        "entity_id": l.entity_id,
        "details": l.details,
        "ip_address": l.ip_address,
        "timestamp": l.created_at
    } for l in logs]

@router.get("/consents")
def list_consent_records(
    db: Session = Depends(get_db),
    user: User = Depends(auth_service.require_roles(["Super Admin", "College Admin"]))
):
    consents = db.query(ConsentRecord).order_by(ConsentRecord.created_at.desc()).limit(50).all()
    return [{
        "id": c.id,
        "student_id": c.student_id,
        "student_name": c.student.full_name if c.student else None,
        "enrollment_number": c.student.enrollment_number if c.student else None,
        "consent_type": c.consent_type,
        "is_granted": c.is_granted,
        "consent_version": c.consent_version,
        "guardian_consent_verified": c.guardian_consent_verified,
        "guardian_name": c.guardian_name,
        "ip_address": c.ip_address,
        "revoked_at": c.revoked_at,
        "created_at": c.created_at
    } for c in consents]

