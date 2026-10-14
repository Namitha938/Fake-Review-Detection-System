import os
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.config import settings
from app.models.user import User
from app.models.model_record import ModelRecord
from app.models.dataset import DatasetRecord
from app.schemas.model import ModelTrainRequest, ModelResponse
from app.api.deps import get_current_user, get_current_admin_user
from app.ml.trainer import train_and_evaluate_model
from app.ml.predictor import get_or_load_model

router = APIRouter(prefix="/models", tags=["Models & Training"])

def train_model_background(payload_dict: dict, model_id: int):
    """Background training task."""
    db = SessionLocal()
    try:
        record = db.query(ModelRecord).filter(ModelRecord.id == model_id).first()
        if not record:
            return

        dataset_path = payload_dict.get("dataset_path")
        model_type = payload_dict.get("model_type", "Logistic Regression")
        test_size = payload_dict.get("test_size", 0.2)

        res = train_and_evaluate_model(
            dataset_path=dataset_path,
            model_type=model_type,
            test_size=test_size
        )

        record.accuracy = res["accuracy"]
        record.precision = res["precision"]
        record.recall = res["recall"]
        record.f1_score = res["f1_score"]
        record.confusion_matrix = res["confusion_matrix"]
        record.artifact_path = res["artifact_path"]
        record.parameters = res["parameters"]
        db.commit()
    except Exception as e:
        record = db.query(ModelRecord).filter(ModelRecord.id == model_id).first()
        if record:
            record.parameters = {"error": str(e)}
            db.commit()
    finally:
        db.close()

@router.get("", response_model=List[ModelResponse])
@router.get("/runs", response_model=List[ModelResponse])
def list_models(db: Session = Depends(get_db), current_user: User = Depends(get_current_admin_user)):
    """Admin-only: list all trained model runs, metrics, and confusion matrices."""
    models = db.query(ModelRecord).order_by(ModelRecord.id.desc()).all()
    if not models:
        # Seed initial model benchmark
        dataset_path = os.path.join(settings.DATA_STORAGE_DIR, "deceptive_opinion_sample.csv")
        if os.path.exists(dataset_path):
            result = train_and_evaluate_model(dataset_path, model_type="Logistic Regression")
            initial_rec = ModelRecord(
                model_name=result["model_name"],
                model_type=result["model_type"],
                accuracy=result["accuracy"],
                precision=result["precision"],
                recall=result["recall"],
                f1_score=result["f1_score"],
                confusion_matrix=result["confusion_matrix"],
                is_active=True,
                parameters=result["parameters"],
                artifact_path=result["artifact_path"],
                dataset_name="deceptive_opinion_sample.csv"
            )
            db.add(initial_rec)
            db.commit()
            db.refresh(initial_rec)
            return [initial_rec]
    return models

@router.post("/train", response_model=ModelResponse)
def train_model(
    payload: ModelTrainRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    """Admin-only: trigger background training of ML / Deep Learning / Hybrid model."""
    dataset_name = payload.dataset_name or "deceptive_opinion_sample.csv"
    dataset_path = os.path.join(settings.DATA_STORAGE_DIR, dataset_name)
    
    if not os.path.exists(dataset_path):
        db_ds = db.query(DatasetRecord).filter(
            (DatasetRecord.name == dataset_name) | (DatasetRecord.filename == dataset_name)
        ).first()
        if db_ds and os.path.exists(db_ds.file_path):
            dataset_path = db_ds.file_path
        else:
            dataset_path = os.path.join(settings.DATA_STORAGE_DIR, "deceptive_opinion_sample.csv")

    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=404, detail=f"Dataset {dataset_name} not found")

    # Fast synchronous training for responsiveness or background
    try:
        res = train_and_evaluate_model(
            dataset_path=dataset_path,
            model_type=payload.model_type,
            test_size=payload.test_size
        )
        model_record = ModelRecord(
            model_name=res["model_name"],
            model_type=res["model_type"],
            accuracy=res["accuracy"],
            precision=res["precision"],
            recall=res["recall"],
            f1_score=res["f1_score"],
            confusion_matrix=res["confusion_matrix"],
            is_active=False,
            parameters=res["parameters"],
            artifact_path=res["artifact_path"],
            dataset_name=os.path.basename(dataset_path)
        )
        db.add(model_record)
        db.commit()
        db.refresh(model_record)
        return model_record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")

@router.post("/{model_id}/activate", response_model=ModelResponse)
def activate_model(
    model_id: int, 
    db: Session = Depends(get_db), 
    admin: User = Depends(get_current_admin_user)
):
    """Admin-only: activate model for live prediction serving."""
    target = db.query(ModelRecord).filter(ModelRecord.id == model_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Model record not found")

    db.query(ModelRecord).update({ModelRecord.is_active: False})
    target.is_active = True
    db.commit()
    db.refresh(target)

    # Hot reload active model into predictor memory
    get_or_load_model(target.artifact_path)

    return target
