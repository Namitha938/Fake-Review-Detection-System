import os
import io
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, BackgroundTasks, status
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db, SessionLocal
from app.config import settings
from app.models.user import User
from app.models.review import ReviewRecord
from app.models.model_record import ModelRecord
from app.models.bulk_job import BulkJobRecord
from app.schemas.review import (
    ReviewAnalyzeRequest, ReviewAnalyzeResponse, 
    BulkJobStatusResponse, BulkAnalyzeResponse, BulkAnalyzeItemResult
)
from app.api.deps import get_current_user_optional, get_current_user
from app.ml.predictor import analyze_review_text
from app.ml.reviewer_analytics import process_batch_reviewer_analytics, analyze_reviewer_activity

router = APIRouter(tags=["Reviews & Analysis"])

os.makedirs(os.path.join(settings.DATA_STORAGE_DIR, "bulk_jobs"), exist_ok=True)

# -------------------------------------------------------------
# 1. Single Analysis (Public Sandbox, Authenticated App & REST API)
# -------------------------------------------------------------

@router.post("/predict", response_model=ReviewAnalyzeResponse, tags=["Inference API"])
def predict_review_inference(payload: ReviewAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Public / Developer REST API Inference Endpoint:
    Accepts raw review payload, rating, and optional reviewer_id.
    Performs calibrated classification (CalibratedClassifierCV), sentiment attribution,
    SHAP-style keyword explainability, and reviewer behavioral forensics.
    """
    active_model = db.query(ModelRecord).filter(ModelRecord.is_active == True).first()
    model_path = active_model.artifact_path if active_model else None

    reviewer_history = []
    if payload.reviewer_id:
        prev_records = db.query(ReviewRecord.rating, ReviewRecord.created_at)\
            .filter(ReviewRecord.reviewer_id == payload.reviewer_id.strip())\
            .order_by(ReviewRecord.created_at.desc()).limit(50).all()
        reviewer_history = [{"rating": r.rating, "created_at": r.created_at} for r in prev_records]

    analysis = analyze_review_text(
        review_text=payload.review_text,
        rating=payload.rating,
        reviewer_id=payload.reviewer_id,
        reviewer_history=reviewer_history,
        existing_reviews=[],
        model_path=model_path
    )
    analysis["id"] = 0
    analysis["source"] = "rest_api"
    analysis["created_at"] = pd.Timestamp.utcnow().to_pydatetime()
    return analysis

@router.post("/analyze/public", response_model=ReviewAnalyzeResponse)
def analyze_public_sandbox(payload: ReviewAnalyzeRequest, db: Session = Depends(get_db)):
    """Public sandbox endpoint for landing page preview (does not persist to user history)."""
    active_model = db.query(ModelRecord).filter(ModelRecord.is_active == True).first()
    model_path = active_model.artifact_path if active_model else None

    analysis = analyze_review_text(
        review_text=payload.review_text,
        rating=payload.rating,
        reviewer_id=payload.reviewer_id,
        existing_reviews=[],
        model_path=model_path
    )
    analysis["id"] = 0
    analysis["source"] = "public_sandbox"
    analysis["created_at"] = pd.Timestamp.utcnow().to_pydatetime()
    return analysis

@router.post("/analyze", response_model=ReviewAnalyzeResponse)
def analyze_single_review(
    payload: ReviewAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Authenticated Single Review analysis. Saves result to user's history."""
    active_model = db.query(ModelRecord).filter(ModelRecord.is_active == True).first()
    model_path = active_model.artifact_path if active_model else None

    # Fetch existing reviews in DB to check for duplicates before saving this new record
    recent_reviews = db.query(ReviewRecord.id, ReviewRecord.review_text)\
        .order_by(ReviewRecord.id.desc()).limit(200).all()
    existing_samples = [{"id": r.id, "text": r.review_text} for r in recent_reviews]

    # Fetch reviewer history if reviewer_id is provided
    reviewer_history = []
    if payload.reviewer_id:
        prev_records = db.query(ReviewRecord.rating, ReviewRecord.created_at)\
            .filter(ReviewRecord.reviewer_id == payload.reviewer_id.strip())\
            .order_by(ReviewRecord.created_at.desc()).limit(50).all()
        reviewer_history = [{"rating": r.rating, "created_at": r.created_at} for r in prev_records]

    analysis = analyze_review_text(
        review_text=payload.review_text,
        rating=payload.rating,
        reviewer_id=payload.reviewer_id,
        reviewer_history=reviewer_history,
        existing_reviews=existing_samples,
        model_path=model_path
    )

    record = ReviewRecord(
        user_id=current_user.id,
        review_text=analysis["review_text"],
        rating=payload.rating,
        reviewer_id=payload.reviewer_id,
        reviewer_activity=analysis.get("reviewer_activity"),
        prediction=analysis["prediction"],
        confidence=analysis["confidence"],
        fake_probability=analysis["fake_probability"],
        sentiment_label=analysis["sentiment_label"],
        sentiment_score=analysis["sentiment_score"],
        is_duplicate=analysis["is_duplicate"],
        duplicate_similarity=analysis["duplicate_similarity"],
        matched_review_id=analysis["matched_review_id"],
        suspicious_keywords=analysis["suspicious_keywords"],
        features=analysis["features"],
        source="single_input"
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record

# -------------------------------------------------------------
# 2. Review History & Detail Endpoints
# -------------------------------------------------------------

@router.get("/history", response_model=List[ReviewAnalyzeResponse])
def get_user_history(
    prediction: Optional[str] = Query(None, description="'genuine', 'suspicious', 'likely_fake'"),
    sentiment: Optional[str] = Query(None, description="'positive', 'negative', 'neutral'"),
    search: Optional[str] = Query(None, description="Search query string"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Paginated, searchable, filterable history for authenticated user."""
    query = db.query(ReviewRecord)
    if current_user.role != "admin":
        query = query.filter(ReviewRecord.user_id == current_user.id)

    if prediction:
        query = query.filter(ReviewRecord.prediction == prediction)
    if sentiment:
        query = query.filter(ReviewRecord.sentiment_label == sentiment)
    if search:
        query = query.filter(ReviewRecord.review_text.ilike(f"%{search}%"))

    return query.order_by(ReviewRecord.created_at.desc()).offset(offset).limit(limit).all()

@router.get("/history/{record_id}", response_model=ReviewAnalyzeResponse)
def get_history_detail(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full details for a single saved review record."""
    record = db.query(ReviewRecord).filter(ReviewRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review record not found")
    if current_user.role != "admin" and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this record")
    return record

@router.delete("/history/{record_id}")
def delete_history_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a saved review record from user history."""
    record = db.query(ReviewRecord).filter(ReviewRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Review record not found")
    if current_user.role != "admin" and record.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this record")

    db.delete(record)
    db.commit()
    return {"message": "Review deleted successfully"}

# -------------------------------------------------------------
# 2b. Public Forensic Certificate Verification
# -------------------------------------------------------------

@router.get("/reviews/verify/{record_id}")
@router.get("/verify/{record_id}")
def verify_review_certificate(record_id: str, db: Session = Depends(get_db)):
    """
    Public Verification API for Veridex Forensic Certificates.
    Accepts integer ID (e.g. 133) or prefixed format (e.g. VRX-133).
    Returns verification validity, verdict, and timestamp (no review text for privacy).
    """
    clean_id = record_id.upper().replace("VRX-CERT-", "").replace("VRX-", "").strip()
    try:
        int_id = int(clean_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid certificate identifier format"
        )

    record = db.query(ReviewRecord).filter(ReviewRecord.id == int_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forensic certificate not found or record does not exist"
        )

    return {
        "id": record.id,
        "cert_id": f"VRX-{record.id}",
        "verdict": record.prediction,
        "confidence": record.confidence,
        "fake_probability": record.fake_probability,
        "sentiment_label": record.sentiment_label,
        "created_at": record.created_at,
        "is_valid": True,
        "status": "Certificate valid"
    }

# -------------------------------------------------------------
# 3. Bulk CSV Ingestion & Background Job Processing
# -------------------------------------------------------------

def process_bulk_csv_job(job_id: str, file_path: str, user_id: Optional[int]):
    db = SessionLocal()
    try:
        job = db.query(BulkJobRecord).filter(BulkJobRecord.id == job_id).first()
        if not job:
            return

        df = pd.read_csv(file_path)
        # Find review text column
        text_col = None
        for col in ["review", "text", "review_text", "content", "comments"]:
            if col in df.columns:
                text_col = col
                break
        if not text_col:
            text_col = df.columns[0]

        # Optional rating column
        rating_col = None
        for col in ["rating", "stars", "star_rating", "score"]:
            if col in df.columns:
                rating_col = col
                break

        # Optional reviewer ID column
        reviewer_col = None
        for col in ["reviewer_id", "reviewer", "user_id", "author", "author_id", "username", "customer_id", "profile_id"]:
            if col in df.columns:
                reviewer_col = col
                break

        # Optional timestamp/date column
        date_col = None
        for col in ["date", "review_date", "timestamp", "created_at", "time"]:
            if col in df.columns:
                date_col = col
                break

        reviewer_profiles = {}
        if reviewer_col:
            reviewer_profiles = process_batch_reviewer_analytics(df, reviewer_col, rating_col, date_col)

        active_model = db.query(ModelRecord).filter(ModelRecord.is_active == True).first()
        model_path = active_model.artifact_path if active_model else None

        # Track reviews within the uploaded batch for internal syndication detection
        seen_in_batch = []

        predictions = []
        confidences = []
        fake_probs = []
        sentiments = []
        is_dups = []
        top_words_list = []
        burst_flags = []
        reviewer_risk_scores = []

        fake_c = 0
        susp_c = 0
        gen_c = 0
        dup_c = 0

        preview_items = []
        records_to_insert = []

        for idx, row in df.iterrows():
            text = str(row[text_col]) if pd.notna(row[text_col]) else ""
            if not text.strip():
                continue

            rating_val = None
            if rating_col and pd.notna(row[rating_col]):
                try:
                    rating_val = int(float(row[rating_col]))
                except ValueError:
                    rating_val = None

            reviewer_id_val = None
            reviewer_act = None
            if reviewer_col and pd.notna(row[reviewer_col]):
                reviewer_id_val = str(row[reviewer_col]).strip()
                reviewer_act = reviewer_profiles.get(reviewer_id_val)

            analysis = analyze_review_text(
                review_text=text,
                rating=rating_val,
                reviewer_id=reviewer_id_val,
                reviewer_history=[],
                existing_reviews=seen_in_batch,
                model_path=model_path
            )
            seen_in_batch.append({"id": idx, "text": text})

            if reviewer_act:
                analysis["reviewer_activity"] = reviewer_act
                if reviewer_act.get("burst_detected") and analysis["prediction"] == "genuine":
                    analysis["prediction"] = "suspicious"

            pred = analysis["prediction"]
            if pred == "likely_fake":
                fake_c += 1
            elif pred == "suspicious":
                susp_c += 1
            else:
                gen_c += 1

            if analysis["is_duplicate"]:
                dup_c += 1

            top_kw = [k["word"] for k in analysis["suspicious_keywords"] if k.get("is_suspicious")]

            predictions.append(pred)
            confidences.append(analysis["confidence"])
            fake_probs.append(analysis["fake_probability"])
            sentiments.append(analysis["sentiment_label"])
            is_dups.append("Yes" if analysis["is_duplicate"] else "No")
            top_words_list.append(", ".join(top_kw[:4]))
            burst_flags.append("Yes" if (reviewer_act and reviewer_act.get("burst_detected")) else "No")
            reviewer_risk_scores.append(reviewer_act.get("reviewer_risk_score", 0.0) if reviewer_act else 0.0)

            rec = ReviewRecord(
                user_id=user_id,
                review_text=text,
                rating=rating_val,
                reviewer_id=reviewer_id_val,
                reviewer_activity=analysis.get("reviewer_activity"),
                prediction=pred,
                confidence=analysis["confidence"],
                fake_probability=analysis["fake_probability"],
                sentiment_label=analysis["sentiment_label"],
                sentiment_score=analysis["sentiment_score"],
                is_duplicate=analysis["is_duplicate"],
                duplicate_similarity=analysis["duplicate_similarity"],
                matched_review_id=analysis["matched_review_id"],
                suspicious_keywords=analysis["suspicious_keywords"],
                features=analysis["features"],
                source="bulk_csv"
            )
            records_to_insert.append(rec)

            if len(preview_items) < 15:
                preview_items.append({
                    "review_text": text,
                    "rating": rating_val,
                    "reviewer_id": reviewer_id_val,
                    "reviewer_activity": analysis.get("reviewer_activity"),
                    "prediction": pred,
                    "confidence": analysis["confidence"],
                    "fake_probability": analysis["fake_probability"],
                    "sentiment_label": analysis["sentiment_label"],
                    "sentiment_score": analysis["sentiment_score"],
                    "is_duplicate": analysis["is_duplicate"],
                    "duplicate_similarity": analysis["duplicate_similarity"],
                    "top_suspicious_words": top_kw[:4]
                })

        # Save result CSV with required standardized columns:
        # review_text, rating, reviewer_id, burst_status, prediction, confidence, fake_probability, top_attributions
        output_df = pd.DataFrame({
            "review_text": [r.review_text for r in records_to_insert],
            "rating": [r.rating for r in records_to_insert],
            "reviewer_id": [r.reviewer_id for r in records_to_insert],
            "burst_status": [
                ("Burst Detected" if (r.reviewer_activity and r.reviewer_activity.get("burst_detected")) else "Normal")
                for r in records_to_insert
            ],
            "prediction": predictions,
            "confidence": confidences,
            "fake_probability": fake_probs,
            "top_attributions": top_words_list
        })

        out_path = file_path.replace(".csv", "_analyzed.csv")
        output_df.to_csv(out_path, index=False)

        db.add_all(records_to_insert)

        job.status = "completed"
        job.processed_rows = len(predictions)
        job.fake_count = fake_c
        job.suspicious_count = susp_c
        job.genuine_count = gen_c
        job.duplicate_count = dup_c
        job.results_file_path = out_path
        job.results_preview = preview_items
        db.commit()
    except Exception as e:
        job = db.query(BulkJobRecord).filter(BulkJobRecord.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()

@router.post("/bulk", response_model=BulkJobStatusResponse)
async def upload_bulk_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload CSV for batch processing (size & format validated, processed via background task)."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are accepted.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024: # 10MB limit
        raise HTTPException(status_code=400, detail="File exceeds maximum size limit (10MB).")

    try:
        df_preview = pd.read_csv(io.StringIO(contents.decode("utf-8", errors="ignore")), nrows=5)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV structure: {str(e)}")

    # Column validation: review text required
    text_col = None
    for col in ["review", "text", "review_text", "content", "comments"]:
        if col in df_preview.columns:
            text_col = col
            break
    if not text_col:
        raise HTTPException(
            status_code=400,
            detail="CSV must contain a column named 'review', 'text', 'review_text', or 'content'."
        )

    job_id = str(uuid.uuid4())
    save_path = os.path.join(settings.DATA_STORAGE_DIR, "bulk_jobs", f"{job_id}.csv")
    with open(save_path, "wb") as f:
        f.write(contents)

    job = BulkJobRecord(
        id=job_id,
        user_id=current_user.id,
        filename=file.filename,
        status="processing",
        total_rows=len(contents.splitlines()) - 1
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Process in background task
    background_tasks.add_task(process_bulk_csv_job, job_id, save_path, current_user.id)

    return job

@router.get("/bulk/{job_id}/status", response_model=BulkJobStatusResponse)
def get_bulk_job_status(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Check progress status and metrics of a bulk analysis job."""
    job = db.query(BulkJobRecord).filter(BulkJobRecord.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job not found")
    if current_user.role != "admin" and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this job")
    return job

@router.get("/bulk/{job_id}/download")
def download_bulk_job_results(job_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Download the output CSV with classification and sentiment predictions."""
    job = db.query(BulkJobRecord).filter(BulkJobRecord.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Bulk job record not found")
    if current_user.role != "admin" and job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to download this file")
    if not job.results_file_path or not os.path.exists(job.results_file_path):
        raise HTTPException(status_code=404, detail="Processed results file not available on server yet")

    filename = f"veridex_{job.filename.replace('.csv', '')}_analyzed.csv"

    def iterfile():
        with open(job.results_file_path, mode="rb") as f:
            while chunk := f.read(64 * 1024):
                yield chunk

    return StreamingResponse(
        iterfile(),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
