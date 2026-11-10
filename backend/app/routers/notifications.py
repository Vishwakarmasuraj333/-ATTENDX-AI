from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.notification import Notification
from app.models.users import User
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

@router.get("")
def get_user_notifications(
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [{
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "notification_type": n.notification_type,
        "is_read": n.is_read,
        "action_url": n.action_url,
        "created_at": n.created_at
    } for n in notifs]

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if notif:
        notif.is_read = True
        db.commit()
    return {"message": "Notification marked as read"}

