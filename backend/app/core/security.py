from datetime import datetime, timedelta
from typing import Any, Union, Optional
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.config import settings

ph = PasswordHasher()

def get_password_hash(password: str) -> str:
    """Hash password using Argon2."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, Exception):
        return False

def create_access_token(subject: Union[str, Any], role: str = "user", expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
        "iat": datetime.utcnow()
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        # Prevent 2FA temporary tokens from accessing regular protected endpoints
        if payload.get("type") == "2fa_pending":
            return None
        return payload
    except jwt.PyJWTError:
        return None

def create_temp_2fa_token(user_id: int, email: str, role: str) -> str:
    """Generate a short-lived (5 min) temporary token for completing 2FA verification."""
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {
        "exp": expire,
        "sub": str(user_id),
        "email": email,
        "role": role,
        "type": "2fa_pending",
        "iat": datetime.utcnow()
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_temp_2fa_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "2fa_pending":
            return None
        return payload
    except jwt.PyJWTError:
        return None


