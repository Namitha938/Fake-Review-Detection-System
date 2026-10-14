from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class ReviewRecord(Base):
    __tablename__ = "review_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    review_text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True) # Optional 1-5 star rating
    reviewer_id = Column(String(100), nullable=True, index=True) # Optional reviewer/author ID
    reviewer_activity = Column(JSON, nullable=True) # Burst detection, frequency & rating pattern
    prediction = Column(String(50), nullable=False) # 'genuine', 'suspicious', or 'likely_fake'
    confidence = Column(Float, nullable=False) # 0.0 - 1.0 (or percentage)
    fake_probability = Column(Float, nullable=False) # 0.0 - 1.0
    
    # NLP & Sentiment features
    sentiment_label = Column(String(50), nullable=False) # 'positive', 'negative', 'neutral'
    sentiment_score = Column(Float, nullable=False) # compound -1.0 to 1.0
    
    # Duplication & Repetition
    is_duplicate = Column(Boolean, default=False)
    duplicate_similarity = Column(Float, default=0.0) # 0 - 100
    matched_review_id = Column(Integer, nullable=True)
    
    # Explainability & patterns (top keywords, metrics)
    suspicious_keywords = Column(JSON, nullable=True) # list of str/dict
    features = Column(JSON, nullable=True) # readability, exclamation ratio, etc.
    
    source = Column(String(50), default="single_input") # 'single_input' or 'csv_upload'
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    user = relationship("User", back_populates="reviews")

