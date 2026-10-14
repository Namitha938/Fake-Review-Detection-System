from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="user", nullable=False) # 'user' or 'admin'
    avatar_url = Column(Text, nullable=True) # Profile picture URL or base64 data URI
    is_2fa_enabled = Column(Boolean, default=False)
    totp_secret = Column(String(64), nullable=True) # Base32 secret for TOTP authenticator
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    twitter_url = Column(String(255), nullable=True)
    website_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    reviews = relationship("ReviewRecord", back_populates="user", cascade="all, delete-orphan")
    datasets = relationship("DatasetRecord", back_populates="user", cascade="all, delete-orphan")

