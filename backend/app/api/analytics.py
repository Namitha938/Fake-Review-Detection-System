from collections import Counter
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.review import ReviewRecord
from app.schemas.analytics import (
    AnalyticsSummary, StatusCount, SentimentDistribution, 
    TimelinePoint, TopKeyword
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    reviews = db.query(ReviewRecord).all()
    total = len(reviews)

    if total == 0:
        return AnalyticsSummary(
            total_reviews_analyzed=0,
            genuine_count=0,
            fake_count=0,
            duplicate_count=0,
            average_confidence=0.0,
            sentiment_breakdown=[
                {"sentiment": "positive", "genuine": 0, "fake": 0},
                {"sentiment": "negative", "genuine": 0, "fake": 0},
                {"sentiment": "neutral", "genuine": 0, "fake": 0}
            ],
            status_distribution=[
                {"name": "Genuine", "value": 0, "color": "#10B981"},
                {"name": "Potentially Fake", "value": 0, "color": "#EF4444"}
            ],
            timeline=[],
            top_suspicious_keywords=[]
        )

    fake_count = sum(1 for r in reviews if r.prediction in ["likely_fake", "suspicious", "potentially_fake"])
    genuine_count = total - fake_count
    duplicate_count = sum(1 for r in reviews if r.is_duplicate)
    avg_conf = round(sum(r.confidence for r in reviews) / total, 1)

    # Sentiment cross-tabulation
    sent_map = {"positive": {"genuine": 0, "fake": 0}, "negative": {"genuine": 0, "fake": 0}, "neutral": {"genuine": 0, "fake": 0}}
    for r in reviews:
        s_lbl = r.sentiment_label if r.sentiment_label in sent_map else "neutral"
        if r.prediction in ["likely_fake", "suspicious", "potentially_fake"]:
            sent_map[s_lbl]["fake"] += 1
        else:
            sent_map[s_lbl]["genuine"] += 1

    sentiment_breakdown = [
        {"sentiment": "Positive", "genuine": sent_map["positive"]["genuine"], "fake": sent_map["positive"]["fake"]},
        {"sentiment": "Negative", "genuine": sent_map["negative"]["genuine"], "fake": sent_map["negative"]["fake"]},
        {"sentiment": "Neutral", "genuine": sent_map["neutral"]["genuine"], "fake": sent_map["neutral"]["fake"]},
    ]

    # Timeline (last 7 days or date grouping)
    date_map = {}
    for r in reviews:
        d_str = r.created_at.strftime("%b %d")
        if d_str not in date_map:
            date_map[d_str] = {"date": d_str, "genuine": 0, "fake": 0}
        if r.prediction in ["likely_fake", "suspicious", "potentially_fake"]:
            date_map[d_str]["fake"] += 1
        else:
            date_map[d_str]["genuine"] += 1
    
    timeline = list(date_map.values())[-10:]

    # Top suspicious keywords across all fake reviews
    suspicious_word_counter = Counter()
    for r in reviews:
        if r.suspicious_keywords:
            for item in r.suspicious_keywords:
                if isinstance(item, dict) and item.get("is_suspicious"):
                    w = item.get("word", "").lower()
                    if len(w) > 2:
                        suspicious_word_counter[w] += 1

    top_keywords = [
        TopKeyword(keyword=word, count=cnt, fake_ratio=0.85)
        for word, cnt in suspicious_word_counter.most_common(10)
    ]

    status_dist = [
        StatusCount(name="Genuine", value=genuine_count, color="#10B981"),
        StatusCount(name="Potentially Fake", value=fake_count, color="#EF4444")
    ]

    return AnalyticsSummary(
        total_reviews_analyzed=total,
        genuine_count=genuine_count,
        fake_count=fake_count,
        duplicate_count=duplicate_count,
        average_confidence=avg_conf,
        sentiment_breakdown=sentiment_breakdown,
        status_distribution=status_dist,
        timeline=timeline,
        top_suspicious_keywords=top_keywords
    )

