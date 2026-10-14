from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class ReviewAnalyzeRequest(BaseModel):
    review_text: str = Field(..., min_length=3, description="Text of the review to analyze")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Optional 1-5 star customer rating")
    reviewer_id: Optional[str] = Field(None, max_length=100, description="Optional reviewer or author identifier")

class KeywordContribution(BaseModel):
    word: str
    score: float
    is_suspicious: bool
    reason: Optional[str] = None

class ReviewAnalyzeResponse(BaseModel):
    id: Optional[int] = None
    review_text: str
    rating: Optional[int] = None
    reviewer_id: Optional[str] = None
    reviewer_activity: Optional[Dict[str, Any]] = None
    prediction: str # 'genuine', 'suspicious', 'likely_fake'
    confidence: float # 0 - 100 percentage
    fake_probability: float # 0.0 - 1.0
    sentiment_label: str
    sentiment_score: float
    is_duplicate: bool
    duplicate_similarity: float
    matched_review_id: Optional[int] = None
    suspicious_keywords: List[KeywordContribution]
    features: Dict[str, Any]
    source: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BulkJobStatusResponse(BaseModel):
    id: str
    filename: str
    status: str # 'processing', 'completed', 'failed'
    total_rows: int
    processed_rows: int
    fake_count: int
    suspicious_count: int
    genuine_count: int
    duplicate_count: int
    error_message: Optional[str] = None
    results_preview: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class BulkAnalyzeItemResult(BaseModel):
    id: Optional[int] = None
    review_text: str
    rating: Optional[int] = None
    reviewer_id: Optional[str] = None
    reviewer_activity: Optional[Dict[str, Any]] = None
    prediction: str
    confidence: float
    fake_probability: float
    sentiment_label: str
    sentiment_score: float
    is_duplicate: bool
    duplicate_similarity: float
    top_suspicious_words: List[str]

class BulkAnalyzeResponse(BaseModel):
    job_id: str
    total_processed: int
    fake_count: int
    suspicious_count: int
    genuine_count: int
    duplicate_count: int
    reviewer_summary: Optional[Dict[str, Any]] = None
    results: List[BulkAnalyzeItemResult]
