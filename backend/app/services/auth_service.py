import datetime
from typing import Optional, List
import jwt
from jwt.exceptions import PyJWTError as JWTError
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.users import User, Role, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
        to_encode = data.copy()
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        if expires_delta:
            expire = now_utc + expires_delta
        else:
            expire = now_utc + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id: int = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is deactivated or not found"
            )
        return user

    @staticmethod
    def require_roles(allowed_roles: List[str]):
        def role_checker(current_user: User = Depends(AuthService.get_current_user)) -> User:
            if not current_user.role or current_user.role.name not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied: Required role in {allowed_roles}, your role is '{current_user.role.name if current_user.role else 'None'}'"
                )
            return current_user
        return role_checker

    @staticmethod
    def log_audit(db: Session, user_id: Optional[int], action: str, entity_type: str = None, entity_id: str = None, details: dict = None, ip: str = None):
        try:
            log_entry = AuditLog(
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id is not None else None,
                details=details,
                ip_address=ip
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            # Non-blocking for audit failure
            pass

auth_service = AuthService()

