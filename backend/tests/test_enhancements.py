import pytest
from datetime import datetime, timedelta
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.ml.reviewer_analytics import analyze_reviewer_activity, process_batch_reviewer_analytics
from app.ml.trainer import train_and_evaluate_model
from app.ml.explainability import explain_prediction
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.calibration import CalibratedClassifierCV

client = TestClient(app)

def test_reviewer_activity_burst_detection():
    """Test rapid temporal burst detection (clustering within 24 hours)."""
    now = datetime.utcnow()
    # 3 reviews within 4 hours
    history = [
        {"rating": 5, "created_at": (now - timedelta(hours=3)).isoformat()},
        {"rating": 5, "created_at": (now - timedelta(hours=1)).isoformat()},
    ]
    activity = analyze_reviewer_activity(
        reviewer_id="REV-SHILL-01",
        current_rating=5,
        reviewer_history=history
    )
    assert activity["reviewer_id"] == "REV-SHILL-01"
    assert activity["has_data"] is True
    assert activity["burst_detected"] is True
    assert activity["total_reviews"] == 3
    assert activity["rating_mean"] == 5.0
    assert activity["extreme_rating_ratio"] == 1.0
    assert "Shill" in activity["pattern_label"]
    assert activity["reviewer_risk_score"] > 0.5

def test_reviewer_activity_organic_user():
    """Test organic reviewer with normal spaced intervals and varied ratings."""
    now = datetime.utcnow()
    history = [
        {"rating": 3, "created_at": (now - timedelta(days=60)).isoformat()},
        {"rating": 5, "created_at": (now - timedelta(days=20)).isoformat()},
    ]
    activity = analyze_reviewer_activity(
        reviewer_id="REV-ORGANIC-USER",
        current_rating=4,
        reviewer_history=history
    )
    assert activity["reviewer_id"] == "REV-ORGANIC-USER"
    assert activity["burst_detected"] is False
    assert activity["total_reviews"] == 3
    assert activity["reviewer_risk_score"] < 0.35

def test_process_batch_reviewer_analytics():
    """Test batch dataframe processing of reviewer activity."""
    df = pd.DataFrame([
        {"reviewer": "UserA", "text": "Great product!", "rating": 5, "date": "2026-01-01 10:00:00"},
        {"reviewer": "UserA", "text": "Loved this too!", "rating": 5, "date": "2026-01-01 12:00:00"},
        {"reviewer": "UserB", "text": "Okay item", "rating": 3, "date": "2026-01-01 10:00:00"},
    ])
    profiles = process_batch_reviewer_analytics(df, reviewer_col="reviewer", rating_col="rating", date_col="date")
    assert "UserA" in profiles
    assert "UserB" in profiles
    assert profiles["UserA"]["burst_detected"] is True
    assert profiles["UserB"]["burst_detected"] is False

def test_calibrated_classifier_explainability():
    """Test explain_prediction with CalibratedClassifierCV model."""
    texts = [
        "best hotel amazing luxurious paradise wonderful",
        "scam mafia dirty terrible worst disgusting",
        "clean rooms convenient good stay breakfast okay",
        "absolute perfection angel feathers dream experience",
        "standard hotel quiet room comfortable bed",
        "horrible fraud never coming back fake staff",
        "pleasant trip polite staff clean bathroom",
        "greatest place on earth unbelievable service 10/10"
    ]
    labels = [1, 1, 0, 1, 0, 1, 0, 1] # at least 3 zeros and 5 ones

    vec = TfidfVectorizer(max_features=20)
    X = vec.fit_transform(texts)
    base_clf = LogisticRegression()
    calibrated = CalibratedClassifierCV(estimator=base_clf, method="sigmoid", cv=2)
    calibrated.fit(X, labels)

    explanations = explain_prediction(calibrated, vec, "amazing luxurious hotel scam", top_n=5)
    assert isinstance(explanations, list)
    assert len(explanations) > 0
    assert all("word" in e and "score" in e and "is_suspicious" in e for e in explanations)

def test_rest_api_predict_endpoint():
    """Test production REST endpoint /api/v1/predict with reviewer forensics."""
    payload = {
        "review_text": "BEST HOTEL IN THE ENTIRE WORLD! 100/10 stars, angel pillows and divine luxury!",
        "rating": 5,
        "reviewer_id": "TEST-REST-CLIENT-01"
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "confidence" in data
    assert "fake_probability" in data
    assert "reviewer_activity" in data
    assert "suspicious_keywords" in data
    assert data["source"] == "rest_api"
    assert data["reviewer_id"] == "TEST-REST-CLIENT-01"
