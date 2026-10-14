import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, ReviewRecord, DatasetRecord, ModelRecord
from app.api.auth import router as auth_router
from app.api.reviews import router as reviews_router
from app.api.datasets import router as datasets_router, ensure_sample_datasets_in_db
from app.api.models import router as models_router
from app.api.analytics import router as analytics_router
from app.api.admin import router as admin_router
from app.api.assistant import router as assistant_router
from app.core.security import get_password_hash

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column auto-migration for newly added fields
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check dataset_records
            res = conn.execute(text("PRAGMA table_info(dataset_records)"))
            cols = [r[1] for r in res.fetchall()]
            if cols and "label_balance" not in cols:
                conn.execute(text("ALTER TABLE dataset_records ADD COLUMN label_balance JSON"))
                conn.commit()
            
            # Check model_records
            res = conn.execute(text("PRAGMA table_info(model_records)"))
            cols = [r[1] for r in res.fetchall()]
            if cols and "confusion_matrix" not in cols:
                conn.execute(text("ALTER TABLE model_records ADD COLUMN confusion_matrix JSON"))
                conn.commit()

            # Check review_records
            res = conn.execute(text("PRAGMA table_info(review_records)"))
            cols = [r[1] for r in res.fetchall()]
            if cols and "rating" not in cols:
                conn.execute(text("ALTER TABLE review_records ADD COLUMN rating INTEGER"))
                conn.commit()
            if cols and "reviewer_id" not in cols:
                conn.execute(text("ALTER TABLE review_records ADD COLUMN reviewer_id VARCHAR(100)"))
                conn.commit()
            if cols and "reviewer_activity" not in cols:
                conn.execute(text("ALTER TABLE review_records ADD COLUMN reviewer_activity JSON"))
                conn.commit()

            # Check users table
            res = conn.execute(text("PRAGMA table_info(users)"))
            cols = [r[1] for r in res.fetchall()]
            if cols and "avatar_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
                conn.commit()
            if cols and "is_2fa_enabled" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_2fa_enabled BOOLEAN DEFAULT 0"))
                conn.commit()
            if cols and "totp_secret" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN totp_secret VARCHAR(64)"))
                conn.commit()
            if cols and "github_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN github_url VARCHAR(255)"))
                conn.commit()
            if cols and "linkedin_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(255)"))
                conn.commit()
            if cols and "twitter_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN twitter_url VARCHAR(255)"))
                conn.commit()
            if cols and "website_url" not in cols:
                conn.execute(text("ALTER TABLE users ADD COLUMN website_url VARCHAR(255)"))
                conn.commit()
    except Exception:
        pass

    # Initialize sample datasets & initial admin if database is fresh
    db = SessionLocal()
    try:
        ensure_sample_datasets_in_db(db)
        
        # Ensure dedicated admin user exists with admin privileges
        admin_email = settings.ADMIN_EMAIL.strip().lower()
        admin_user = db.query(User).filter(User.email == admin_email).first()
        if not admin_user:
            default_admin = User(
                email=admin_email,
                full_name="System Administrator",
                hashed_password=get_password_hash("AdminPass123!"),
                role="admin",
                is_active=True
            )
            db.add(default_admin)
            db.commit()
        else:
            if admin_user.role != "admin":
                admin_user.role = "admin"
                db.commit()
    finally:
        db.close()

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Fake Review Detection System API with NLP, explainability, and multi-model evaluation.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount API routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(reviews_router, prefix=settings.API_V1_STR)
app.include_router(datasets_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0"
    }

@app.get("/")
def root():
    return {
        "message": "Welcome to Fake Review Detection System API",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

