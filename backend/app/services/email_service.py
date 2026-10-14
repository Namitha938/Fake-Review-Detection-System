import smtplib
import logging
import httpx
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)

class EmailDeliveryError(Exception):
    """Raised when email delivery fails or service is misconfigured."""
    pass

def is_email_service_configured() -> bool:
    """
    Checks if an email delivery provider is configured:
    - Resend API (RESEND_API_KEY)
    - SMTP (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)
    - Or TESTING mode (for unit test suites)
    """
    if settings.TESTING:
        return True
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
        return True
    if (
        settings.SMTP_HOST
        and settings.SMTP_HOST.strip()
        and settings.SMTP_USER
        and settings.SMTP_USER.strip()
        and settings.SMTP_PASSWORD
        and settings.SMTP_PASSWORD.strip()
    ):
        return True
    return False

def _send_via_resend(to_email: str, subject: str, html_content: str, plain_content: str) -> bool:
    """Send transactional email using Resend HTTP API."""
    api_key = settings.RESEND_API_KEY.strip()
    from_addr = settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else "onboarding@resend.dev"
    from_header = f"{settings.SMTP_FROM_NAME} <{from_addr}>"

    try:
        with httpx.Client(timeout=12.0) as client:
            resp = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": from_header,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                    "text": plain_content,
                }
            )
        if resp.status_code in (200, 201):
            logger.info(f"Resend API successfully accepted email to {to_email}")
            return True
        else:
            try:
                err_data = resp.json()
                msg = err_data.get("message", resp.text)
            except Exception:
                msg = resp.text
            logger.error(f"Resend API error ({resp.status_code}): {msg}")
            raise EmailDeliveryError(f"Email service error: {msg}")
    except httpx.RequestError as e:
        logger.error(f"Failed to connect to Resend API: {e}")
        raise EmailDeliveryError(f"Network error connecting to email service: {str(e)}")

def _send_via_smtp(to_email: str, subject: str, html_content: str, plain_content: str) -> bool:
    """Send transactional email using SMTP (supports Gmail, Outlook, TLS/SSL)."""
    host = settings.SMTP_HOST.strip()
    port = settings.SMTP_PORT
    user = (settings.SMTP_USER.strip() if settings.SMTP_USER else "").strip() or (settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else "").strip()
    pwd = settings.SMTP_PASSWORD.strip().replace(" ", "")
    from_email = settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else user
    from_header = f"{settings.SMTP_FROM_NAME} <{from_email}>"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header
    msg["To"] = to_email
    msg.attach(MIMEText(plain_content, "plain"))
    msg.attach(MIMEText(html_content, "html"))

    try:
        if port == 465 or settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(user, pwd)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(user, pwd)
                server.sendmail(from_email, [to_email], msg.as_string())
        
        logger.info(f"Successfully delivered email via SMTP to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failure for {user}@{host}: {e}")
        raise EmailDeliveryError(
            "SMTP authentication failed. If you are using Gmail, you must generate a 16-character App Password "
            "at https://myaccount.google.com/apppasswords with 2-Step Verification enabled, rather than your standard account password."
        )
    except (smtplib.SMTPConnectError, smtplib.SMTPServerDisconnected, TimeoutError) as e:
        logger.error(f"SMTP connection error to {host}:{port}: {e}")
        raise EmailDeliveryError(
            f"Could not connect to SMTP server ({host}:{port}). Please check SMTP_HOST, port, and network connection."
        )
    except Exception as e:
        logger.error(f"SMTP delivery error to {to_email}: {e}")
        raise EmailDeliveryError(f"Email delivery error via SMTP: {str(e)}")

def send_otp_email(to_email: str, otp_code: str, valid_minutes: int = 10) -> bool:
    """
    Send OTP verification email for Password Reset.
    """
    subject = f"Your Veridex Password Reset Code: {otp_code}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #818cf8; margin-bottom: 24px; }}
        .title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }}
        .desc {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
        .otp-box {{ background: #0f172a; border: 1px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #a5b4fc; font-family: monospace; }}
        .expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
        .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🛡️ Veridex Security</div>
        <div class="title">Password Reset Verification</div>
        <div class="desc">
          We received a request to reset the password for your account (<strong>{to_email}</strong>).
          Enter the verification code below to proceed:
        </div>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
          <div class="expiry">Expires in {valid_minutes} minutes • Single-use only</div>
        </div>
        <div class="desc">
          If you did not request a password reset, please ignore this email or review your account security.
        </div>
        <div class="footer">
          © {settings.PROJECT_NAME}. Automated security notification.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"Veridex Security\n\nYour password reset verification code is: {otp_code}\nThis code will expire in {valid_minutes} minutes.\nIf you did not request this, please ignore this email."

    # In unit tests, log and succeed without external network calls
    if settings.TESTING:
        logger.info(f"[TESTING] OTP for {to_email} is: {otp_code}")
        return True

    # Prioritize SMTP first (supports sending to ANY user without sandbox restrictions)
    smtp_user = (settings.SMTP_USER.strip() if settings.SMTP_USER else "").strip() or (settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else "").strip()
    if (
        settings.SMTP_HOST
        and settings.SMTP_HOST.strip()
        and smtp_user
        and settings.SMTP_PASSWORD
        and settings.SMTP_PASSWORD.strip()
    ):
        return _send_via_smtp(to_email, subject, html_content, plain_content)

    # Fallback to Resend API
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
        return _send_via_resend(to_email, subject, html_content, plain_content)

    # If neither is configured, do not pretend it succeeded
    raise EmailDeliveryError(
        "Email delivery service is not configured. Please set SMTP credentials (e.g. Gmail App Password) "
        "or RESEND_API_KEY in backend/.env to receive verification codes in your inbox."
    )

def send_2fa_login_otp_email(to_email: str, otp_code: str, valid_minutes: int = 5) -> bool:
    """
    Send 2FA login verification code email.
    """
    subject = f"Your Veridex 2FA Login Code: {otp_code}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }}
        .logo {{ font-size: 20px; font-weight: bold; color: #818cf8; margin-bottom: 24px; }}
        .title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }}
        .desc {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }}
        .otp-box {{ background: #0f172a; border: 1px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }}
        .otp-code {{ font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #34d399; font-family: monospace; }}
        .expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
        .footer {{ font-size: 12px; color: #64748b; border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🛡️ Veridex Security</div>
        <div class="title">Two-Factor Authentication Code</div>
        <div class="desc">
          A sign-in attempt was initiated for your Veridex account (<strong>{to_email}</strong>).
          Enter the verification code below to authorize this session:
        </div>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
          <div class="expiry">Expires in {valid_minutes} minutes • Single-use only</div>
        </div>
        <div class="desc">
          Never share this code with anyone. If you did not initiate this login, please secure your password immediately.
        </div>
        <div class="footer">
          © {settings.PROJECT_NAME}. Two-Factor Authentication Security.
        </div>
      </div>
    </body>
    </html>
    """

    plain_content = f"Veridex Security\n\nYour Two-Factor Authentication code is: {otp_code}\nExpires in {valid_minutes} minutes.\nIf you did not initiate this login, secure your account immediately."

    if settings.TESTING:
        logger.info(f"[TESTING] 2FA OTP for {to_email} is: {otp_code}")
        return True

    # Prioritize SMTP first (supports sending to ANY user without sandbox restrictions)
    smtp_user = (settings.SMTP_USER.strip() if settings.SMTP_USER else "").strip() or (settings.SMTP_FROM_EMAIL.strip() if settings.SMTP_FROM_EMAIL else "").strip()
    if (
        settings.SMTP_HOST
        and settings.SMTP_HOST.strip()
        and smtp_user
        and settings.SMTP_PASSWORD
        and settings.SMTP_PASSWORD.strip()
    ):
        return _send_via_smtp(to_email, subject, html_content, plain_content)

    # Fallback to Resend API
    if settings.RESEND_API_KEY and settings.RESEND_API_KEY.strip():
        return _send_via_resend(to_email, subject, html_content, plain_content)

    raise EmailDeliveryError(
        "Email delivery service is not configured. Please set SMTP credentials or RESEND_API_KEY in backend/.env."
    )
