from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.base import TimestampMixin

class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="INFO", index=True) # LOW_ATTENDANCE, SESSION_STARTED, CORRECTION_REQUEST, ATTENDANCE_MARKED, SYSTEM
    is_read = Column(Boolean, default=False, index=True)
    action_url = Column(String(255), nullable=True)

    user = relationship("User")

