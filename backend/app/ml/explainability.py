from typing import List, Dict, Any, Optional
import numpy as np

REASON_TEMPLATES = {
    "superlative": "Extreme superlative rarely seen in authentic, balanced customer experiences.",
    "hyperbolic": "Hyperbolic praise or dramatic exclamation characteristic of paid astroturfing.",
    "defamatory": "Highly emotional or aggressive phrasing common in retaliatory/smear campaigns.",
    "promotional": "Marketing-style promotional phrasing indicating sponsored or solicited content.",
    "generic": "Generic filler phrase lacking concrete experiential specifics.",
    "authentic": "Specific descriptive terminology standard in verified user feedback."
}

SUSPICIOUS_CUES = {
    "angel": "hyperbolic",
    "feathers": "hyperbolic",
    "divine": "hyperbolic",
    "perfection": "superlative",
    "magical": "hyperbolic",
    "unbelievable": "superlative",
    "paradise": "superlative",
    "greatest": "superlative",
    "scam": "defamatory",
    "poison": "defamatory",
    "criminals": "defamatory",
    "mafia": "defamatory",
    "monsters": "defamatory",
    "stars": "hyperbolic",
    "best": "superlative",
    "worst": "defamatory",
    "god": "hyperbolic",
    "miracle": "hyperbolic",
    "flawless": "superlative",
    "ever": "superlative",
    "disgusting": "defamatory",
    "stole": "defamatory",
}

def get_word_reason(word: str, score: float, is_suspicious: bool) -> str:
    lower = word.lower()
    if lower in SUSPICIOUS_CUES:
        category = SUSPICIOUS_CUES[lower]
        return REASON_TEMPLATES.get(category, REASON_TEMPLATES["hyperbolic"])
    if is_suspicious or score > 0.05:
        return f"Positive statistical feature weight (+{round(score, 3)}) pushing classification toward fake."
    if score < -0.05:
        return f"Grounding descriptive term (-{abs(round(score, 3))}) indicating authentic, measured review."
    return "Neutral descriptive token with balanced contribution."

def explain_prediction(
    model: Any, 
    vectorizer: Any, 
    text: str, 
    top_n: int = 8
) -> List[Dict[str, Any]]:
    """
    Generate explainability attributions using SHAP or TF-IDF feature importance.
    Returns list of tokens with their impact and plain-English reasoning.
    """
    if not text or not model or not vectorizer:
        return []

    try:
        # Transform input
        x_vec = vectorizer.transform([text])
        feature_names = np.array(vectorizer.get_feature_names_out())
        
        # Check non-zero feature indices in this review
        non_zero_indices = x_vec.nonzero()[1]
        if len(non_zero_indices) == 0:
            return []

        # If model has coefficients (e.g. LogisticRegression or CalibratedClassifierCV)
        coef = None
        if hasattr(model, "coef_"):
            coef = model.coef_[0]
        elif hasattr(model, "calibrated_classifiers_") and len(model.calibrated_classifiers_) > 0:
            coefs = [
                c.estimator.coef_[0]
                for c in model.calibrated_classifiers_
                if hasattr(c.estimator, "coef_")
            ]
            if len(coefs) > 0:
                coef = np.mean(coefs, axis=0)
            elif hasattr(model, "estimator") and hasattr(model.estimator, "coef_"):
                coef = model.estimator.coef_[0]

        if coef is not None:
            contributions = []
            for idx in non_zero_indices:
                word = str(feature_names[idx])
                weight = float(coef[idx])
                tf_val = float(x_vec[0, idx])
                impact = weight * tf_val
                is_susp = impact > 0.05 or word.lower() in SUSPICIOUS_CUES
                contributions.append({
                    "word": word,
                    "score": round(impact, 4),
                    "is_suspicious": is_susp,
                    "reason": get_word_reason(word, impact, is_susp)
                })
            
            contributions.sort(key=lambda x: x["score"], reverse=True)
            return contributions[:top_n]

        # For Tree-based or other models
        if hasattr(model, "feature_importances_"):
            importances = model.feature_importances_
            contributions = []
            for idx in non_zero_indices:
                word = str(feature_names[idx])
                imp = float(importances[idx])
                is_susp = imp > 0.01 or word.lower() in SUSPICIOUS_CUES
                contributions.append({
                    "word": word,
                    "score": round(imp, 4),
                    "is_suspicious": is_susp,
                    "reason": get_word_reason(word, imp, is_susp)
                })
            contributions.sort(key=lambda x: x["score"], reverse=True)
            return contributions[:top_n]

    except Exception:
        pass

    # Generic fallback token analysis
    tokens = text.lower().split()
    fallback_res = []
    for t in set(tokens):
        if t in SUSPICIOUS_CUES:
            fallback_res.append({
                "word": t,
                "score": 0.5,
                "is_suspicious": True,
                "reason": REASON_TEMPLATES.get(SUSPICIOUS_CUES[t], REASON_TEMPLATES["hyperbolic"])
            })
    return fallback_res[:top_n]
