from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from app.database import Base

class BulkJobRecord(Base):
    __tablename__ = "bulk_job_records"

    id = Column(String(50), primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    status = Column(String(50), default="processing") # 'processing', 'completed', 'failed'
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    fake_count = Column(Integer, default=0)
    suspicious_count = Column(Integer, default=0)
    genuine_count = Column(Integer, default=0)
    duplicate_count = Column(Integer, default=0)
    results_file_path = Column(String(500), nullable=True)
    results_preview = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

