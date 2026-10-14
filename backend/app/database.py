import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_engine():
    # If DATABASE_URL is explicitly set, try that first
    db_url = settings.DATABASE_URL
    if not db_url:
        db_url = f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DB}"
    
    try:
        if db_url.startswith("sqlite"):
            engine = create_engine(db_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)
            # Test connection
            with engine.connect() as conn:
                pass
            logger.info(f"Connected successfully to database: {db_url.split('@')[-1] if '@' in db_url else db_url}")
            return engine
    except Exception as e:
        logger.warning(f"Could not connect to configured DB ({e}). Falling back to SQLite local database.")
        sqlite_url = "sqlite:///./fake_reviews.db"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        return engine
    return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

