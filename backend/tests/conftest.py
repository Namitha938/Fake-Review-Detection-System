import pytest
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ["TESTING"] = "1"
os.environ["DATABASE_URL"] = "sqlite:///./test_fake_reviews.db"

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db, engine
from app.main import app

TEST_DB_URL = "sqlite:///./test_fake_reviews.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    try:
        Base.metadata.create_all(bind=engine)
    except Exception:
        pass
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_fake_reviews.db"):
        try:
            os.remove("./test_fake_reviews.db")
        except OSError:
            pass

@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

import app.database as app_db
import app.api.reviews as app_reviews

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    orig_session = app_db.SessionLocal
    app_db.SessionLocal = TestingSessionLocal
    app_reviews.SessionLocal = TestingSessionLocal
    with TestClient(app) as test_client:
        yield test_client
    app_db.SessionLocal = orig_session
    app_reviews.SessionLocal = orig_session
    app.dependency_overrides.clear()

