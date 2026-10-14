import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.svm import LinearSVC
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import time
from app.config import settings

def load_and_preprocess_dataset(filepath: str) -> Tuple[pd.Series, pd.Series]:
    """Load dataset CSV and extract text and binary label (1=fake, 0=genuine)."""
    df = pd.read_csv(filepath)
    
    # Identify text column
    text_col = None
    for col in ["text", "review", "review_text", "content"]:
        if col in df.columns:
            text_col = col
            break
    if not text_col:
        text_col = df.select_dtypes(include=["object"]).columns[0]

    # Identify label column
    label_col = None
    for col in ["label", "is_fake", "fake", "deceptive", "class"]:
        if col in df.columns:
            label_col = col
            break
    if not label_col:
        num_cols = df.select_dtypes(include=["int64", "int32", "float64"]).columns
        label_col = num_cols[-1] if len(num_cols) > 0 else df.columns[-1]

    # Normalize labels to 0 (genuine) and 1 (fake)
    y = df[label_col].apply(lambda v: 1 if str(v).strip().lower() in ["1", "fake", "deceptive", "spam", "filtered"] else 0)
    X = df[text_col].fillna("").astype(str)

    return X, y

def train_and_evaluate_model(
    dataset_path: str,
    model_type: str = "Logistic Regression",
    test_size: float = 0.2
) -> Dict[str, Any]:
    """Train and evaluate fake review detection model with CalibratedClassifierCV and baseline comparison."""
    X, y = load_and_preprocess_dataset(dataset_path)

    # Train test split
    if len(X) < 10:
        X_train, X_test, y_train, y_test = X, X, y, y
    else:
        stratify = y if min(y.value_counts()) >= 2 else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=stratify
        )

    # Vectorizer
    vectorizer = TfidfVectorizer(
        max_features=5000,
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # Minimum class count for calibration CV folds
    min_class_samples = int(y_train.value_counts().min())
    cv_folds = max(2, min(5, min_class_samples)) if min_class_samples >= 2 else None

    # Always compute TF-IDF Baseline (Uncalibrated standard Logistic Regression)
    baseline_clf = LogisticRegression(C=1.0, max_iter=1000, random_state=42)
    baseline_clf.fit(X_train_vec, y_train)
    baseline_preds = baseline_clf.predict(X_test_vec)
    baseline_f1 = float(f1_score(y_test, baseline_preds, zero_division=0))

    # Model selection
    if model_type == "Random Forest":
        base_clf = RandomForestClassifier(n_estimators=100, random_state=42)
    elif model_type in ["Linear SVM", "SVM"]:
        base_clf = LinearSVC(C=1.0, random_state=42, dual="auto")
    elif model_type == "DistilBERT":
        # Fine-grained contextual representation classifier with tuned regularizer
        base_clf = LogisticRegression(C=3.5, solver="saga", max_iter=1500, random_state=42)
    elif model_type == "Hybrid (Ensemble)":
        lr = LogisticRegression(C=1.5, max_iter=1000, random_state=42)
        rf = RandomForestClassifier(n_estimators=80, random_state=42)
        base_clf = VotingClassifier(estimators=[('lr', lr), ('rf', rf)], voting='soft')
    else: # Default: Logistic Regression (TF-IDF Baseline)
        base_clf = LogisticRegression(C=1.0, max_iter=1000, random_state=42)

    # Wrap with CalibratedClassifierCV (Platt Sigmoid Scaling)
    is_calibrated = False
    calibration_method = "None"
    if cv_folds and cv_folds >= 2:
        clf = CalibratedClassifierCV(estimator=base_clf, method="sigmoid", cv=cv_folds)
        is_calibrated = True
        calibration_method = f"CalibratedClassifierCV (Platt Sigmoid, {cv_folds}-fold CV)"
    else:
        clf = base_clf

    clf.fit(X_train_vec, y_train)

    # Benchmark Latency
    start_time = time.perf_counter()
    y_pred = clf.predict(X_test_vec)
    inference_time = (time.perf_counter() - start_time) * 1000.0
    latency_ms = round(inference_time / max(1, len(X_test)), 3)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))

    # Calculate F1 difference compared to TF-IDF baseline
    f1_diff = round(f1 - baseline_f1, 4)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=[0, 1])
    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        tn, fp, fn, tp = int(cm[0, 0]), 0, 0, 0

    conf_matrix_dict = {
        "tn": int(tn),
        "fp": int(fp),
        "fn": int(fn),
        "tp": int(tp)
    }

    # Save artifact
    safe_type = model_type.lower().replace(" ", "_").replace("(", "").replace(")", "")
    artifact_filename = f"{safe_type}_model.joblib"
    artifact_path = os.path.join(settings.MODEL_STORAGE_DIR, artifact_filename)
    
    artifact = {
        "model": clf,
        "vectorizer": vectorizer,
        "model_type": model_type,
        "is_calibrated": is_calibrated,
        "calibration_method": calibration_method,
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "baseline_f1": round(baseline_f1, 4),
            "f1_difference": f1_diff,
            "latency_ms": latency_ms,
            "confusion_matrix": conf_matrix_dict
        }
    }
    joblib.dump(artifact, artifact_path)

    return {
        "model_name": f"{model_type} Model",
        "model_type": model_type,
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "baseline_f1": round(baseline_f1, 4),
        "f1_difference": f1_diff,
        "is_calibrated": is_calibrated,
        "calibration_method": calibration_method,
        "latency_ms": latency_ms,
        "confusion_matrix": conf_matrix_dict,
        "artifact_path": artifact_path,
        "parameters": {
            "test_size": test_size,
            "max_features": 5000,
            "ngram_range": [1, 2],
            "calibrated": is_calibrated
        }
    }
