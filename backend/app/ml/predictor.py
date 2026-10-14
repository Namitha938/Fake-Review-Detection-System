import os
import joblib
from typing import Dict, Any, List, Optional
from app.config import settings
from app.ml.preprocessor import clean_text, extract_linguistic_features
from app.ml.sentiment import analyze_sentiment
from app.ml.duplicate_detector import check_duplicate_review
from app.ml.explainability import explain_prediction
from app.ml.reviewer_analytics import analyze_reviewer_activity
from app.ml.trainer import train_and_evaluate_model

_LOADED_MODEL_ARTIFACT = None
_CURRENT_MODEL_PATH = None

def get_or_load_model(preferred_path: Optional[str] = None):
    global _LOADED_MODEL_ARTIFACT, _CURRENT_MODEL_PATH

    # If preferred path provided and matches loaded
    if preferred_path and preferred_path == _CURRENT_MODEL_PATH and _LOADED_MODEL_ARTIFACT:
        return _LOADED_MODEL_ARTIFACT

    if preferred_path and os.path.exists(preferred_path):
        _LOADED_MODEL_ARTIFACT = joblib.load(preferred_path)
        _CURRENT_MODEL_PATH = preferred_path
        return _LOADED_MODEL_ARTIFACT

    # Look in MODEL_STORAGE_DIR for any model
    storage_dir = settings.MODEL_STORAGE_DIR
    model_files = [f for f in os.listdir(storage_dir) if f.endswith(".joblib")] if os.path.exists(storage_dir) else []
    
    if model_files:
        path = os.path.join(storage_dir, model_files[0])
        _LOADED_MODEL_ARTIFACT = joblib.load(path)
        _CURRENT_MODEL_PATH = path
        return _LOADED_MODEL_ARTIFACT

    # If no model exists, train on sample dataset
    sample_dataset = os.path.join(settings.DATA_STORAGE_DIR, "deceptive_opinion_sample.csv")
    if os.path.exists(sample_dataset):
        result = train_and_evaluate_model(sample_dataset, model_type="Logistic Regression")
        _LOADED_MODEL_ARTIFACT = joblib.load(result["artifact_path"])
        _CURRENT_MODEL_PATH = result["artifact_path"]
        return _LOADED_MODEL_ARTIFACT

    return None

def analyze_review_text(
    review_text: str,
    rating: Optional[int] = None,
    reviewer_id: Optional[str] = None,
    reviewer_history: Optional[List[Dict[str, Any]]] = None,
    existing_reviews: Optional[List[Dict[str, Any]]] = None,
    model_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Comprehensive multi-modal fake review analysis combining:
    - ML probability (TF-IDF / DistilBERT + CalibratedClassifierCV)
    - Reviewer Activity Forensics (posting frequency, burst detection, rating dispersion)
    - Star Rating Dissonance Check
    - VADER Sentiment analysis
    - RapidFuzz duplicate detection
    - NLP linguistic & pattern markers
    - Feature importance & transparent explainability reasons
    """
    cleaned = clean_text(review_text)
    linguistic = extract_linguistic_features(cleaned)
    sentiment = analyze_sentiment(cleaned)
    
    # Duplicate check
    is_dup, dup_similarity, matched_id = check_duplicate_review(
        cleaned, existing_reviews or []
    )

    # Reviewer activity forensics
    reviewer_activity = analyze_reviewer_activity(
        reviewer_id=reviewer_id or "",
        current_rating=rating,
        reviewer_history=reviewer_history or []
    )

    # ML Inference
    artifact = get_or_load_model(model_path)
    ml_fake_prob = 0.5
    suspicious_keywords = []

    if artifact:
        model = artifact.get("model")
        vectorizer = artifact.get("vectorizer")
        
        if model and vectorizer:
            x_vec = vectorizer.transform([cleaned])
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(x_vec)[0]
                # Class 1 is fake
                ml_fake_prob = float(probs[1])
            else:
                pred = model.predict(x_vec)[0]
                ml_fake_prob = 0.85 if pred == 1 else 0.15

            # Explainability
            suspicious_keywords = explain_prediction(model, vectorizer, cleaned, top_n=8)

    # Signal fusion:
    combined_prob = ml_fake_prob

    # Exaggerated punctuation / shouting / pattern penalty
    suspicious_patterns_score = linguistic.get("suspicious_patterns_score", 0.0)
    if suspicious_patterns_score > 0.4:
        combined_prob = min(0.99, combined_prob + 0.15 * suspicious_patterns_score)

    # Star rating dissonance check:
    # 5 stars with negative sentiment or 1 star with high positive sentiment
    if rating is not None:
        if (rating >= 4 and sentiment["label"] == "negative") or (rating <= 2 and sentiment["label"] == "positive"):
            combined_prob = min(0.99, combined_prob + 0.18)

    # Reviewer Forensics fusion:
    # Burst detection and high risk reviewer patterns increase probability
    if reviewer_activity.get("burst_detected"):
        combined_prob = min(0.99, combined_prob + 0.20)
    elif reviewer_activity.get("reviewer_risk_score", 0.0) >= 0.5:
        combined_prob = min(0.99, combined_prob + 0.15)

    # Duplicate penalty (graduated risk boost instead of overriding classification)
    if is_dup and dup_similarity >= 85.0:
        dup_risk_boost = 0.12 if dup_similarity >= 95.0 else 0.06
        combined_prob = min(0.99, combined_prob + dup_risk_boost)

    # Clamp
    combined_prob = round(max(0.01, min(0.99, combined_prob)), 3)

    # 3-tier classification: Genuine (<0.50) / Suspicious (0.50 - 0.64) / Likely fake (>=0.65)
    if combined_prob < 0.50:
        prediction = "genuine"
    elif combined_prob < 0.65:
        prediction = "suspicious"
    else:
        prediction = "likely_fake"
    
    # Confidence represents certainty in the assigned classification
    if prediction == "genuine":
        confidence = round(max(55.0, (1.0 - combined_prob) * 100), 1)
    else:
        confidence = round(max(55.0, combined_prob * 100), 1)

    return {
        "review_text": review_text,
        "rating": rating,
        "reviewer_id": reviewer_id,
        "reviewer_activity": reviewer_activity,
        "prediction": prediction,
        "confidence": confidence,
        "fake_probability": combined_prob,
        "sentiment_label": sentiment["label"],
        "sentiment_score": sentiment["compound"],
        "is_duplicate": is_dup,
        "duplicate_similarity": dup_similarity,
        "matched_review_id": matched_id,
        "suspicious_keywords": suspicious_keywords,
        "features": {
            **linguistic,
            "sentiment": sentiment,
            "reviewer_activity": reviewer_activity
        }
    }
