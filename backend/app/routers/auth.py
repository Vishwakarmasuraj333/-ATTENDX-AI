from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import datetime
from app.database import get_db
from app.models.users import User, Role
from app.schemas.auth import Token, LoginRequest, PasswordResetRequest, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not auth_service.verify_password(payload.password, user.hashed_password):
        auth_service.log_audit(
            db=db, 
            user_id=user.id if user else None, 
            action="LOGIN_FAILED", 
            entity_type="User", 
            details={"email": payload.email, "reason": "Invalid credentials"},
            ip=request.client.host if request.client else None
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact campus administrator."
        )

    # Update last login
    user.last_login = datetime.datetime.utcnow()
    db.commit()

    token = auth_service.create_access_token(
        data={"sub": str(user.id), "role": user.role.name if user.role else "Student", "email": user.email}
    )

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="LOGIN_SUCCESS",
        entity_type="User",
        entity_id=str(user.id),
        details={"role": user.role.name if user.role else None},
        ip=request.client.host if request.client else None
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.name if user.role else "Student",
            "role_id": user.role_id,
            "avatar_url": user.avatar_url
        }
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(auth_service.get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "full_name": current_user.full_name,
        "role_id": current_user.role_id,
        "role_name": current_user.role.name if current_user.role else "Student",
        "avatar_url": current_user.avatar_url,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at
    }

@router.post("/reset-password")
def reset_password(payload: PasswordResetRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No registered account found with this email.")

    user.hashed_password = auth_service.get_password_hash(payload.new_password)
    db.commit()

    auth_service.log_audit(
        db=db,
        user_id=user.id,
        action="PASSWORD_RESET",
        entity_type="User",
        entity_id=str(user.id),
        ip=request.client.host if request.client else None
    )

    return {"message": "Password updated successfully. Please log in with your new password."}

@router.get("/roles")
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [{"id": r.id, "name": r.name, "description": r.description} for r in roles]

