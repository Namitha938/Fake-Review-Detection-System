import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Veridex"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-jwt-key-for-fake-review-detection-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database: Default to MySQL, auto fallback to SQLite if MySQL unavailable
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "password")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT: str = os.getenv("MYSQL_PORT", "3306")
    MYSQL_DB: str = os.getenv("MYSQL_DB", "fake_review_db")
    
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    
    # Dedicated Admin Email: Only this email is granted admin access
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "namithaaa444@gmail.com")

    # Email / SMTP / Resend configuration for OTP delivery
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "")
    SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Veridex Security")
    SMTP_USE_SSL: bool = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1")
    RESEND_API_KEY: Optional[str] = os.getenv("RESEND_API_KEY", "")
    TESTING: bool = os.getenv("TESTING", "0") == "1"

    # AI Assistant Keys (Optional: Gemini, OpenAI, Groq)
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY", "")

    # Model Artifacts Path
    MODEL_STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml_models")
    DATA_STORAGE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    
    # Automatically locate backend/.env regardless of current working directory
    _backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    _backend_env = os.path.join(_backend_dir, ".env")
    model_config = SettingsConfigDict(env_file=(_backend_env, ".env"), extra="allow")

settings = Settings()

os.makedirs(settings.MODEL_STORAGE_DIR, exist_ok=True)
os.makedirs(settings.DATA_STORAGE_DIR, exist_ok=True)

