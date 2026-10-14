from pydantic import BaseModel
from typing import List, Dict, Any

class StatusCount(BaseModel):
    name: str
    value: int
    color: str

class SentimentDistribution(BaseModel):
    sentiment: str
    genuine: int
    fake: int

class TimelinePoint(BaseModel):
    date: str
    genuine: int
    fake: int

class TopKeyword(BaseModel):
    keyword: str
    count: int
    fake_ratio: float

class AnalyticsSummary(BaseModel):
    total_reviews_analyzed: int
    genuine_count: int
    fake_count: int
    duplicate_count: int
    average_confidence: float
    sentiment_breakdown: List[SentimentDistribution]
    status_distribution: List[StatusCount]
    timeline: List[TimelinePoint]
    top_suspicious_keywords: List[TopKeyword]

