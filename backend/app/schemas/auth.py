from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    new_password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role_id: int
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    role_id: int
    role_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

