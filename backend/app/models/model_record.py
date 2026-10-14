from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON
from app.database import Base

class ModelRecord(Base):
    __tablename__ = "model_records"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(100), nullable=False) # 'Logistic Regression', 'Random Forest', 'DistilBERT'
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    confusion_matrix = Column(JSON, nullable=True) # {"tp": ..., "fp": ..., "tn": ..., "fn": ...}
    is_active = Column(Boolean, default=False)
    parameters = Column(JSON, nullable=True)
    artifact_path = Column(String(500), nullable=True)
    dataset_name = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

