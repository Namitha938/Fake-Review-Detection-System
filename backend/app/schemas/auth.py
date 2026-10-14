from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = "user"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    avatar_url: Optional[str] = None
    is_2fa_enabled: bool = False
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    user: Optional[UserResponse] = None
    requires_2fa: bool = False
    temp_token: Optional[str] = None
    message: Optional[str] = None

class Verify2FARequest(BaseModel):
    temp_token: str
    otp: str

class Resend2FARequest(BaseModel):
    temp_token: str

class Toggle2FARequest(BaseModel):
    enable: bool
    password: Optional[str] = None

class AvatarUpdateRequest(BaseModel):
    avatar_url: str


class GoogleAuthRequest(BaseModel):
    id_token: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = ""
    target_role: Optional[str] = "user"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class VerifyOtpResponse(BaseModel):
    message: str
    reset_token: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_token: str
    new_password: str
    confirm_password: str

class MessageResponse(BaseModel):
    message: str

class ProfileUpdateRequest(BaseModel):
    full_name: str
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    twitter_url: Optional[str] = None
    website_url: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code: str
    otpauth_url: str

class TOTPConfirmRequest(BaseModel):
    code: str

class TOTPDisableRequest(BaseModel):
    password: Optional[str] = None
    code: Optional[str] = None


