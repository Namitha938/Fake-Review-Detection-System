import os
import shutil
from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import pandas as pd
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.dataset import DatasetRecord
from app.schemas.dataset import DatasetResponse, DatasetPreview
from app.api.deps import get_current_user, get_current_admin_user

router = APIRouter(prefix="/datasets", tags=["Datasets"])

def calculate_label_balance(filepath: str) -> Dict[str, int]:
    try:
        df = pd.read_csv(filepath)
        label_col = None
        for col in ["label", "is_fake", "fake", "deceptive", "class"]:
            if col in df.columns:
                label_col = col
                break
        if not label_col:
            return {"total": len(df)}
        y = df[label_col].apply(lambda v: 1 if str(v).strip().lower() in ["1", "fake", "deceptive", "spam", "filtered"] else 0)
        fake_count = int(y.sum())
        genuine_count = int(len(y) - fake_count)
        return {"genuine": genuine_count, "fake": fake_count}
    except Exception:
        return {}

def ensure_sample_datasets_in_db(db: Session):
    """Seed sample datasets if not already registered in database."""
    samples = [
        {
            "name": "Deceptive Opinion Spam Corpus",
            "filename": "deceptive_opinion_sample.csv",
            "description": "Gold-standard corpus containing truthful and deceptive hotel reviews by Ott et al."
        },
        {
            "name": "Yelp Reviews Dataset",
            "filename": "yelp_sample.csv",
            "description": "Yelp restaurant reviews with genuine and algorithmic spam/filtered flags."
        }
    ]
    for s in samples:
        path = os.path.join(settings.DATA_STORAGE_DIR, s["filename"])
        if os.path.exists(path):
            existing = db.query(DatasetRecord).filter(DatasetRecord.filename == s["filename"]).first()
            if not existing:
                try:
                    df = pd.read_csv(path)
                    count = len(df)
                    balance = calculate_label_balance(path)
                except Exception:
                    count = 0
                    balance = {}
                record = DatasetRecord(
                    name=s["name"],
                    filename=s["filename"],
                    file_path=path,
                    row_count=count,
                    label_balance=balance,
                    description=s["description"]
                )
                db.add(record)
    db.commit()

@router.get("", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Admin only: list datasets with row count, label balance, and upload date."""
    ensure_sample_datasets_in_db(db)
    datasets = db.query(DatasetRecord).order_by(DatasetRecord.id.desc()).all()
    return datasets

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    name: str = Form(...),
    description: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Admin only: upload custom CSV dataset."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    save_filename = f"{int(pd.Timestamp.now().timestamp())}_{file.filename}"
    save_path = os.path.join(settings.DATA_STORAGE_DIR, save_filename)

    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        df = pd.read_csv(save_path)
        row_count = len(df)
        balance = calculate_label_balance(save_path)
    except Exception as e:
        if os.path.exists(save_path):
            os.remove(save_path)
        raise HTTPException(status_code=400, detail=f"Invalid CSV file format: {str(e)}")

    record = DatasetRecord(
        name=name,
        filename=save_filename,
        file_path=save_path,
        row_count=row_count,
        label_balance=balance,
        description=description,
        uploaded_by=admin.id
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return record

@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def preview_dataset(dataset_id: int, db: Session = Depends(get_db), admin: User = Depends(get_current_admin_user)):
    """Admin only: preview dataset columns and top rows."""
    record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not record or not os.path.exists(record.file_path):
        raise HTTPException(status_code=404, detail="Dataset not found on server")

    try:
        df = pd.read_csv(record.file_path)
        preview_rows = df.head(10).fillna("").to_dict(orient="records")
        columns = list(df.columns)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read dataset: {str(e)}")

    return DatasetPreview(
        dataset=DatasetResponse.model_validate(record),
        columns=columns,
        preview_rows=preview_rows
    )

@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int, 
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Admin only: delete dataset."""
    record = db.query(DatasetRecord).filter(DatasetRecord.id == dataset_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if os.path.exists(record.file_path) and "sample" not in record.filename:
        try:
            os.remove(record.file_path)
        except OSError:
            pass

    db.delete(record)
    db.commit()
    return {"message": "Dataset deleted successfully"}
