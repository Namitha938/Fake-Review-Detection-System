import logging
import time
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
import hashlib
import secrets
import io
import base64
import pyotp
import qrcode
from datetime import datetime, timedelta
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    GoogleAuthRequest,
    ForgotPasswordRequest,
    VerifyOtpRequest,
    VerifyOtpResponse,
    ResetPasswordRequest,
    MessageResponse,
    ProfileUpdateRequest,
    ChangePasswordRequest,
    Verify2FARequest,
    Resend2FARequest,
    Toggle2FARequest,
    AvatarUpdateRequest,
    TOTPSetupResponse,
    TOTPConfirmRequest,
    TOTPDisableRequest,
)
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_temp_2fa_token,
    decode_temp_2fa_token,
)
from app.api.deps import get_current_user
from app.config import settings
from app.services.email_service import (
    send_otp_email,
    send_2fa_login_otp_email,
    is_email_service_configured,
    EmailDeliveryError,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Simple in-memory rate limiter for login
# Key: IP/Email -> list of timestamps
_LOGIN_ATTEMPTS = defaultdict(list)
MAX_ATTEMPTS = 10
WINDOW_SECONDS = 60

def check_login_rate_limit(key: str):
    now = time.time()
    # Prune old timestamps
    _LOGIN_ATTEMPTS[key] = [t for t in _LOGIN_ATTEMPTS[key] if now - t < WINDOW_SECONDS]
    if len(_LOGIN_ATTEMPTS[key]) >= MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait a minute and try again."
        )
    _LOGIN_ATTEMPTS[key].append(now)

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    email_clean = user_in.email.strip().lower()
    admin_email_clean = settings.ADMIN_EMAIL.strip().lower()
    role = "admin" if (email_clean == admin_email_clean) else "user"

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        role=role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}_{login_data.email}"
    check_login_rate_limit(rate_limit_key)

    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # If Two-Factor Authentication is enabled on this account
    if user.is_2fa_enabled:
        otp_digits = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(otp_digits.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        # Invalidate previous unused 2FA tokens for this email
        db.query(PasswordResetToken).filter(
            PasswordResetToken.email == user.email,
            PasswordResetToken.is_used == False
        ).update({"is_used": True})

        token_record = PasswordResetToken(
            email=user.email,
            otp_hash=otp_hash,
            expires_at=expires_at,
            is_used=False,
            attempts=0
        )
        db.add(token_record)
        db.commit()

        # Dispatch 2FA login code via email if service is configured or fallback to TOTP
        try:
            if is_email_service_configured():
                send_2fa_login_otp_email(to_email=user.email, otp_code=otp_digits, valid_minutes=5)
            elif not user.totp_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Email delivery service is not configured. Please set SMTP credentials or RESEND_API_KEY in backend/.env."
                )
        except EmailDeliveryError as err:
            if not user.totp_secret:
                token_record.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=str(err)
                )
            logger.warning(f"Could not send fallback 2FA login email: {err}")

        temp_token = create_temp_2fa_token(user_id=user.id, email=user.email, role=user.role)
        return Token(
            requires_2fa=True,
            temp_token=temp_token,
            message="Two-Factor Authentication is required. Enter the 6-digit code from your authenticator app or email."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate or register user using Firebase Google Auth."""
    email_clean = payload.email.strip().lower()
    admin_email_clean = settings.ADMIN_EMAIL.strip().lower()

    # If attempting to sign in directly into admin portal or target_role is admin
    if payload.target_role == "admin" and email_clean != admin_email_clean:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access: This account does not have administrative privileges."
        )

    user = db.query(User).filter(User.email == email_clean).first()
    
    # Strictly enforce that only the configured admin email gets the admin role
    is_admin = (email_clean == admin_email_clean)
    role = "admin" if is_admin else "user"

    if not user:
        user = User(
            email=email_clean,
            full_name=payload.full_name or email_clean.split("@")[0].title(),
            hashed_password=get_password_hash("google_oauth_" + email_clean),
            role=role,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Keep role synced: if this email is the dedicated admin email, ensure role is admin; otherwise user
        if user.role != role:
            user.role = role
            db.commit()
            db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    # If Two-Factor Authentication is enabled
    if user.is_2fa_enabled:
        otp_digits = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(otp_digits.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=5)

        db.query(PasswordResetToken).filter(
            PasswordResetToken.email == user.email,
            PasswordResetToken.is_used == False
        ).update({"is_used": True})

        token_record = PasswordResetToken(
            email=user.email,
            otp_hash=otp_hash,
            expires_at=expires_at,
            is_used=False,
            attempts=0
        )
        db.add(token_record)
        db.commit()

        # Dispatch 2FA login code via email if service is configured or fallback to TOTP
        try:
            if is_email_service_configured():
                send_2fa_login_otp_email(to_email=user.email, otp_code=otp_digits, valid_minutes=5)
            elif not user.totp_secret:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="Email delivery service is not configured. Please set SMTP credentials or RESEND_API_KEY in backend/.env."
                )
        except EmailDeliveryError as err:
            if not user.totp_secret:
                token_record.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=str(err)
                )
            logger.warning(f"Could not send fallback 2FA login email: {err}")

        temp_token = create_temp_2fa_token(user_id=user.id, email=user.email, role=user.role)
        return Token(
            requires_2fa=True,
            temp_token=temp_token,
            message="Two-Factor Authentication is required. Enter the 6-digit code from your authenticator app or email."
        )

    token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.post("/verify-2fa", response_model=Token)
def verify_2fa(req: Verify2FARequest, db: Session = Depends(get_db)):
    """
    Verify 2FA 6-digit OTP using the temporary token:
    - Decodes temp_token (rejects if expired/invalid)
    - Validates 6-digit OTP code against DB record
    - Enforces 5-minute expiry & max 5 failed attempts
    - Invalidates code upon successful verification
    - Issues full access JWT token
    """
    payload = decode_temp_2fa_token(req.temp_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )

    user_id = int(payload.get("sub", 0))
    email = payload.get("email")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or inactive.")

    is_valid = False

    # 1. First priority: Check Authenticator TOTP if user has totp_secret configured
    if user.totp_secret:
        totp = pyotp.TOTP(user.totp_secret)
        if totp.verify(req.otp.strip(), valid_window=1):
            is_valid = True

    # 2. Second priority: Check Email OTP record if available
    if not is_valid:
        candidate_hash = hashlib.sha256(req.otp.strip().encode()).hexdigest()
        record = db.query(PasswordResetToken).filter(
            PasswordResetToken.email == email,
            PasswordResetToken.is_used == False,
            PasswordResetToken.expires_at > datetime.utcnow()
        ).order_by(PasswordResetToken.id.desc()).first()

        if record:
            if record.attempts >= 5:
                record.is_used = True
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Too many incorrect attempts. This code has been deactivated. Please request a new code."
                )

            if record.otp_hash == candidate_hash:
                record.is_used = True
                db.commit()
                is_valid = True
            else:
                record.attempts += 1
                db.commit()
                remaining = 5 - record.attempts
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
                )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect or expired verification code. Please check your authenticator app or request a new code."
        )

    access_token = create_access_token(subject=user.id, role=user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

_RESEND_2FA_TIMESTAMPS = defaultdict(float)

@router.post("/resend-2fa", response_model=MessageResponse)
def resend_2fa(req: Resend2FARequest, db: Session = Depends(get_db)):
    """
    Resend 2FA login verification code:
    - Enforces a 30-second cooldown between resends
    - Issues a new 6-digit OTP code with 5-minute expiry
    - Dispatches email
    """
    payload = decode_temp_2fa_token(req.temp_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please sign in again."
        )

    email = payload.get("email")
    user = db.query(User).filter(User.email == email, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    now = time.time()
    last_sent = _RESEND_2FA_TIMESTAMPS.get(email, 0)
    cooldown_seconds = 30
    if now - last_sent < cooldown_seconds:
        wait_remaining = int(cooldown_seconds - (now - last_sent))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {wait_remaining} seconds before requesting a new code."
        )
    _RESEND_2FA_TIMESTAMPS[email] = now

    otp_digits = f"{secrets.randbelow(1000000):06d}"
    otp_hash = hashlib.sha256(otp_digits.encode()).hexdigest()
    expires_at = datetime.utcnow() + timedelta(minutes=5)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})

    token_record = PasswordResetToken(
        email=email,
        otp_hash=otp_hash,
        expires_at=expires_at,
        is_used=False,
        attempts=0
    )
    db.add(token_record)
    if not is_email_service_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery service is not configured. Please set SMTP credentials or RESEND_API_KEY in backend/.env."
        )

    try:
        send_2fa_login_otp_email(to_email=email, otp_code=otp_digits, valid_minutes=5)
    except EmailDeliveryError as err:
        token_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(err)
        )

    return MessageResponse(message="A new verification code has been sent to your email.")


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    """Refresh access token with current user session."""
    token = create_access_token(subject=current_user.id, role=current_user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(current_user)
    )

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information (Full Name and Social Links)."""
    clean_name = req.full_name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name cannot be blank."
        )
    current_user.full_name = clean_name
    current_user.github_url = req.github_url.strip() if req.github_url and req.github_url.strip() else None
    current_user.linkedin_url = req.linkedin_url.strip() if req.linkedin_url and req.linkedin_url.strip() else None
    current_user.twitter_url = req.twitter_url.strip() if req.twitter_url and req.twitter_url.strip() else None
    current_user.website_url = req.website_url.strip() if req.website_url and req.website_url.strip() else None
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password", response_model=MessageResponse)
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change account password for authenticated user."""
    # Verify current password
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    
    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match."
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long."
        )

    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return MessageResponse(message="Password has been changed successfully.")

@router.post("/2fa/setup", response_model=TOTPSetupResponse)
def setup_2fa(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a new TOTP secret and QR code for authenticator apps (Google Authenticator, Microsoft Authenticator, Authy, etc.).
    """
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(
        name=current_user.email,
        issuer_name="Veridex"
    )

    # Generate QR Code image in PNG format as base64 data URI
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2
    )
    qr.add_data(otpauth_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_code_base64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

    # Store candidate secret on user record pending confirmation
    current_user.totp_secret = secret
    db.commit()

    return TOTPSetupResponse(
        secret=secret,
        qr_code=qr_code_base64,
        otpauth_url=otpauth_url
    )

@router.post("/2fa/confirm", response_model=UserResponse)
def confirm_2fa(
    req: TOTPConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Confirm and activate 2FA using the 6-digit TOTP code from user's Authenticator app.
    """
    if not current_user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA setup has not been initiated. Please start 2FA setup first."
        )

    totp = pyotp.TOTP(current_user.totp_secret)
    if not totp.verify(req.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit authenticator code. Please check your authenticator app and try again."
        )

    current_user.is_2fa_enabled = True
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/2fa/disable", response_model=UserResponse)
def disable_2fa(
    req: TOTPDisableRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disable Two-Factor Authentication.
    """
    if not current_user.is_2fa_enabled:
        return current_user

    verified = False
    if req.code and current_user.totp_secret:
        totp = pyotp.TOTP(current_user.totp_secret)
        if totp.verify(req.code.strip(), valid_window=1):
            verified = True
    if not verified and req.password:
        if verify_password(req.password, current_user.hashed_password):
            verified = True
    if not verified and not req.code and not req.password:
        verified = True

    if not verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password or verification code to disable 2FA."
        )

    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/toggle-2fa", response_model=UserResponse)
def toggle_2fa(
    req: Toggle2FARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct toggle for backward compatibility."""
    current_user.is_2fa_enabled = req.enable
    if not req.enable:
        current_user.totp_secret = None
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/avatar", response_model=UserResponse)
def update_avatar(
    req: AvatarUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile picture (URL or base64 data URI)."""
    current_user.avatar_url = req.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


# In-memory rate limiter for password reset requests
# Key: email -> list of request timestamps
_RESET_REQUESTS = defaultdict(list)
RESET_MAX_PER_WINDOW = 3
RESET_WINDOW_SECONDS = 300 # 5 minutes

@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Initiate password reset:
    - Generates a cryptographically secure 6-digit OTP
    - Hashes and stores the OTP with an expiration timestamp (10 minutes)
    - Sends the code via email (or logs in dev environment)
    - Rate limits resend requests (max 3 per 5 minutes per email)
    - Always returns generic message to prevent email enumeration
    """
    email_clean = req.email.strip().lower()

    # Rate limiting per email
    now = time.time()
    _RESET_REQUESTS[email_clean] = [t for t in _RESET_REQUESTS[email_clean] if now - t < RESET_WINDOW_SECONDS]
    if len(_RESET_REQUESTS[email_clean]) >= RESET_MAX_PER_WINDOW:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many verification requests. Please wait a few minutes before trying again."
        )
    _RESET_REQUESTS[email_clean].append(now)

    # Verify email delivery service is configured before attempting delivery
    if not is_email_service_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery service is not configured. Please set SMTP credentials (e.g. Gmail App Password) or RESEND_API_KEY in backend/.env to receive verification codes."
        )

    # Check if user exists (silently succeed if not found to avoid user enumeration)
    user = db.query(User).filter(User.email == email_clean).first()
    if user and user.is_active:
        # Generate 6-digit OTP using secrets
        otp_digits = f"{secrets.randbelow(1000000):06d}"
        otp_hash = hashlib.sha256(otp_digits.encode()).hexdigest()
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # Invalidate previous unused OTP tokens for this email
        db.query(PasswordResetToken).filter(
            PasswordResetToken.email == email_clean,
            PasswordResetToken.is_used == False
        ).update({"is_used": True})

        # Record new OTP token
        token_record = PasswordResetToken(
            email=email_clean,
            otp_hash=otp_hash,
            expires_at=expires_at,
            is_used=False,
            attempts=0
        )
        db.add(token_record)
        db.commit()

        # Send OTP via email service with real error propagation
        try:
            send_otp_email(to_email=email_clean, otp_code=otp_digits, valid_minutes=10)
        except EmailDeliveryError as err:
            # Mark the token as used so incomplete state is not left
            token_record.is_used = True
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=str(err)
            )

    # Always return standard response regardless of user existence
    return MessageResponse(
        message="If an account with that email address exists, a verification code has been sent."
    )

@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)):
    """
    Verify the 6-digit OTP code:
    - Verifies single-use OTP hash and expiration (10 min)
    - Throttles invalid attempts (max 5 attempts before invalidating)
    - Generates a short-lived, secure reset_token valid for resetting password
    """
    email_clean = req.email.strip().lower()
    candidate_hash = hashlib.sha256(req.otp.strip().encode()).hexdigest()

    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email_clean,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).order_by(PasswordResetToken.id.desc()).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code is invalid, expired, or has already been used. Please request a new code."
        )

    # Check brute-force attempts
    if record.attempts >= 5:
        record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many incorrect attempts. This code has been deactivated. Please request a new code."
        )

    if record.otp_hash != candidate_hash:
        record.attempts += 1
        db.commit()
        remaining = 5 - record.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
        )

    # OTP is verified! Generate a secure reset token valid for 15 minutes
    secure_reset_token = secrets.token_urlsafe(32)
    record.reset_token = secure_reset_token
    # Set expiration for reset token completion
    record.expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()

    return VerifyOtpResponse(
        message="Verification successful. You may now reset your password.",
        reset_token=secure_reset_token
    )

@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Reset password using verified reset_token:
    - Validates passwords match and minimum length
    - Hashes new password with Argon2
    - Invalidates the reset_token (single use)
    """
    email_clean = req.email.strip().lower()

    if req.new_password != req.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation password do not match."
        )

    if len(req.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Validate reset token
    record = db.query(PasswordResetToken).filter(
        PasswordResetToken.email == email_clean,
        PasswordResetToken.reset_token == req.reset_token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset session. Please restart the password reset process."
        )

    # Update user password
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    user.hashed_password = get_password_hash(req.new_password)
    # Mark reset token as consumed
    record.is_used = True
    db.commit()

    return MessageResponse(
        message="Password has been reset successfully. You can now sign in with your new password."
    )
