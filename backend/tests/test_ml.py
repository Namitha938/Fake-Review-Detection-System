import os
from app.ml.sentiment import analyze_sentiment
from app.ml.preprocessor import clean_text, extract_linguistic_features
from app.ml.duplicate_detector import check_duplicate_review
from app.ml.trainer import train_and_evaluate_model
from app.config import settings

def test_sentiment_vader():
    res = analyze_sentiment("This product is absolutely wonderful, glorious, and top notch!")
    assert res["label"] == "positive"
    assert res["compound"] > 0

    neg_res = analyze_sentiment("Horrible, terrible scam and disgusting nightmare.")
    assert neg_res["label"] == "negative"
    assert neg_res["compound"] < 0

def test_linguistic_features():
    text = "AMAZING EXPERIENCE!!! WOW!!!"
    features = extract_linguistic_features(text)
    assert features["exclamation_count"] == 6
    assert features["uppercase_ratio"] > 0

def test_duplicate_check_rapidfuzz():
    existing = [{"id": 1, "text": "I had a wonderful dinner at the steakhouse"}]
    is_dup, sim, m_id = check_duplicate_review(
        "I had a wonderful dinner at the steakhouse!", existing
    )
    assert is_dup is True
    assert sim >= 90.0
    assert m_id == 1

def test_short_review_not_duplicate():
    existing = [{"id": 1, "text": "Great phone. Fast delivery."}]
    is_dup, sim, m_id = check_duplicate_review("Great phone. Fast delivery.", existing)
    assert is_dup is False
    assert sim == 0.0
    assert m_id is None

def test_train_model():
    dataset_path = os.path.join(settings.DATA_STORAGE_DIR, "deceptive_opinion_sample.csv")
    result = train_and_evaluate_model(dataset_path, model_type="Logistic Regression")
    assert "accuracy" in result
    assert "f1_score" in result
    assert os.path.exists(result["artifact_path"])

