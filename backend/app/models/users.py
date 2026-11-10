from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
import datetime
from app.database import Base
from app.models.base import TimestampMixin

class Role(Base, TimestampMixin):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True) # Super Admin, College Admin, HOD, Faculty, Class Coordinator, Student
    description = Column(String(255), nullable=True)
    is_system_role = Column(Boolean, default=False)

    users = relationship("User", back_populates="role")
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(50), nullable=False) # ACADEMIC, STUDENT, FACULTY, ATTENDANCE, BIOMETRICS, REPORTS, SYSTEM
    code = Column(String(100), unique=True, nullable=False) # e.g. "attendance:mark_live", "student:create"
    description = Column(String(255), nullable=True)

    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class RolePermission(Base, TimestampMixin):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.id", ondelete="CASCADE"), nullable=False)

    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)

    role = relationship("Role", back_populates="users")
    student_profile = relationship("Student", back_populates="user", uselist=False)
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="user")
    consent_records = relationship("ConsentRecord", back_populates="user")


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False, index=True) # "LOGIN", "FACE_ENROLL", "ATTENDANCE_RECORD", etc.
    entity_type = Column(String(50), nullable=True) # "Student", "FaceTemplate", "AttendanceRecord"
    entity_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)

    user = relationship("User", back_populates="audit_logs")


class ConsentRecord(Base, TimestampMixin):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    consent_type = Column(String(100), default="BIOMETRIC_FACE_ENROLLMENT", nullable=False)
    is_granted = Column(Boolean, default=True, nullable=False)
    consent_version = Column(String(20), default="1.0", nullable=False)
    consent_statement = Column(Text, nullable=False)
    guardian_consent_verified = Column(Boolean, default=False)
    guardian_name = Column(String(150), nullable=True)
    ip_address = Column(String(45), nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    revocation_reason = Column(Text, nullable=True)

    user = relationship("User", back_populates="consent_records")
    student = relationship("Student", back_populates="consents")

