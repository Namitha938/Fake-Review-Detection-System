from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.review import ReviewRecord
from app.models.dataset import DatasetRecord
from app.models.model_record import ModelRecord
from app.schemas.auth import UserResponse
from app.api.deps import get_current_admin_user

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    return db.query(User).order_by(User.id.desc()).all()

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
):
    if role not in ["admin", "user"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'admin' or 'user'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@router.get("/stats")
def get_admin_system_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin_user)
) -> Dict[str, Any]:
    total_users = db.query(User).count()
    total_reviews = db.query(ReviewRecord).count()
    total_datasets = db.query(DatasetRecord).count()
    total_models = db.query(ModelRecord).count()
    active_model = db.query(ModelRecord).filter(ModelRecord.is_active == True).first()

    return {
        "total_users": total_users,
        "total_reviews": total_reviews,
        "total_datasets": total_datasets,
        "total_models": total_models,
        "active_model_name": active_model.model_name if active_model else "None"
    }

