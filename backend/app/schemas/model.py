from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime

class ModelTrainRequest(BaseModel):
    model_type: str = "Logistic Regression" # "Logistic Regression", "Random Forest", "DistilBERT", "Hybrid (Ensemble)"
    dataset_name: Optional[str] = "deceptive_opinion_sample.csv"
    test_size: float = 0.2
    hyperparameters: Optional[Dict[str, Any]] = None

class ModelResponse(BaseModel):
    id: int
    model_name: str
    model_type: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    confusion_matrix: Optional[Dict[str, int]] = None
    is_active: bool
    parameters: Optional[Dict[str, Any]] = None
    dataset_name: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ModelActivateRequest(BaseModel):
    model_id: int
