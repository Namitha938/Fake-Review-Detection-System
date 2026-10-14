import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

def analyze_reviewer_activity(
    reviewer_id: str,
    current_rating: Optional[int] = None,
    reviewer_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Perform deep behavioral forensics on a reviewer:
    - Posting frequency & volume
    - Rapid burst detection (temporal clustering)
    - Rating pattern & dispersion (extreme bias vs balanced)
    - Reviewer composite risk score (0.0 - 1.0)
    """
    if not reviewer_id:
        return {
            "reviewer_id": None,
            "has_data": False,
            "posting_frequency": "Unknown (Anonymous)",
            "total_reviews": 1,
            "burst_detected": False,
            "burst_count": 0,
            "rating_mean": float(current_rating) if current_rating else None,
            "rating_std": 0.0,
            "extreme_rating_ratio": 1.0 if current_rating in (1, 5) else 0.0,
            "pattern_label": "Unattributed Reviewer",
            "reviewer_risk_score": 0.0,
            "risk_flags": []
        }

    history = reviewer_history or []
    total_count = len(history) + 1  # including current review

    ratings = [float(h["rating"]) for h in history if h.get("rating") is not None]
    if current_rating is not None:
        ratings.append(float(current_rating))

    timestamps: List[datetime] = []
    for h in history:
        t = h.get("created_at") or h.get("date") or h.get("timestamp")
        if t:
            if isinstance(t, str):
                try:
                    timestamps.append(pd.to_datetime(t).to_pydatetime())
                except Exception:
                    pass
            elif isinstance(t, datetime):
                timestamps.append(t)
    
    # Sort timestamps
    timestamps.sort()

    # 1. Burst Detection
    burst_detected = False
    burst_count = 0
    min_delta_hours = None

    if len(timestamps) >= 2:
        for i in range(1, len(timestamps)):
            diff_hours = (timestamps[i] - timestamps[i-1]).total_seconds() / 3600.0
            if min_delta_hours is None or diff_hours < min_delta_hours:
                min_delta_hours = diff_hours
            if diff_hours <= 24.0: # 24-hour rapid burst window
                burst_detected = True
                burst_count += 1
    elif total_count >= 3:
        # If no dates available but high volume from same reviewer ID in current batch
        burst_detected = True
        burst_count = total_count - 1

    # 2. Rating Pattern Analysis
    if len(ratings) > 0:
        rating_mean = float(np.mean(ratings))
        rating_std = float(np.std(ratings)) if len(ratings) > 1 else 0.0
        extreme_count = sum(1 for r in ratings if r in (1.0, 5.0))
        extreme_ratio = float(extreme_count / len(ratings))
    else:
        rating_mean = None
        rating_std = 0.0
        extreme_ratio = 0.0

    # 3. Frequency Classification
    if total_count >= 5:
        freq_label = f"High Velocity ({total_count} reviews)"
    elif total_count >= 2:
        freq_label = f"Repeated Reviewer ({total_count} reviews)"
    else:
        freq_label = "Single Activity (1 review)"

    # 4. Pattern & Risk Flags
    risk_flags = []
    risk_score = 0.05

    if burst_detected:
        risk_flags.append(f"Temporal Burst Detected ({burst_count} rapid reviews within 24h)")
        risk_score += 0.35

    if total_count >= 3 and extreme_ratio >= 0.8:
        if rating_mean and rating_mean >= 4.5:
            pattern_label = "Monolithic 5-Star Shill Profile"
            risk_flags.append("100% Extreme 5-Star bias across all submissions")
            risk_score += 0.30
        elif rating_mean and rating_mean <= 1.5:
            pattern_label = "Targeted 1-Star Review Bombing"
            risk_flags.append("Aggressive 1-Star smear pattern detected")
            risk_score += 0.30
        else:
            pattern_label = "Bimodal Polarized Reviewer"
            risk_flags.append("Exclusively polarized (1 or 5 star) rating pattern")
            risk_score += 0.20
    elif rating_std >= 1.0 and total_count >= 3:
        pattern_label = "Organic Varied Feedback"
    else:
        pattern_label = "Standard Consumer Profile"

    if total_count >= 6:
        risk_flags.append(f"Abnormally high posting volume ({total_count} reviews)")
        risk_score += 0.20

    risk_score = min(0.99, max(0.01, round(risk_score, 2)))

    return {
        "reviewer_id": reviewer_id,
        "has_data": True,
        "posting_frequency": freq_label,
        "total_reviews": total_count,
        "burst_detected": burst_detected,
        "burst_count": burst_count,
        "min_delta_hours": round(min_delta_hours, 1) if min_delta_hours is not None else None,
        "rating_mean": round(rating_mean, 2) if rating_mean is not None else None,
        "rating_std": round(rating_std, 2),
        "extreme_rating_ratio": round(extreme_ratio, 2),
        "pattern_label": pattern_label,
        "reviewer_risk_score": risk_score,
        "risk_flags": risk_flags
    }

def process_batch_reviewer_analytics(df: pd.DataFrame, reviewer_col: str, rating_col: Optional[str] = None, date_col: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
    """
    Compute aggregate reviewer activity profiles for an entire batch or CSV file.
    Returns a dict mapping reviewer_id -> profile.
    """
    profiles = {}
    if reviewer_col not in df.columns:
        return profiles

    grouped = df.groupby(reviewer_col)
    for r_id, group in grouped:
        r_str = str(r_id).strip()
        history = []
        for _, row in group.iterrows():
            item = {}
            if rating_col and rating_col in row and pd.notna(row[rating_col]):
                try:
                    item["rating"] = int(float(row[rating_col]))
                except Exception:
                    pass
            if date_col and date_col in row and pd.notna(row[date_col]):
                item["created_at"] = row[date_col]
            history.append(item)

        # Analyze full group history
        profile = analyze_reviewer_activity(
            reviewer_id=r_str,
            current_rating=None,
            reviewer_history=history
        )
        # Fix total_reviews count for batch
        profile["total_reviews"] = len(history)
        profiles[r_str] = profile

    return profiles

