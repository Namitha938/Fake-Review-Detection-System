# Veridex — Fake Review Detection System

An enterprise-grade, end-to-end Machine Learning and Natural Language Processing (NLP) web platform engineered to detect deceptive opinion spam, fake customer reviews, astroturfing campaigns, and repetitive copy across online marketplaces and hospitality platforms.

---

## 🏛️ Architecture Overview

The system is split into two cleanly decoupled experiences:

### 1. Public Landing Site (`/` — No Login Needed)
- **Navbar**: Strictly public navigation (Veridex Logo & Wordmark, smooth-scroll links for **Home**, **Features**, **How It Works**, **About**, Dark/Light theme toggle, **Sign In**, and **Register**).
- **Hero & Interactive Sandbox**: Test real-time NLP classification on preset sample reviews without authentication.
- **Deep-Dive Sections**: Features architecture, 4-stage forensic NLP pipeline walkthrough, research provenance (Deceptive Opinion Spam Corpus & Yelp studies), call-to-action band, and footer.
- **Smart App Gateways**: Action buttons pointing to private app features automatically route unauthenticated visitors to `/login?next=<path>` and return them after signing in.

### 2. Private Application Shell (`/app/*` — JWT Authentication Required)
- **Protected Layout**: Desktop left sidebar, mobile overlay drawer, top bar with user identity badge, theme switcher, and logout.
- **Single Analysis (`/app/single`)**:
  - Review textarea with optional 1–5 star rating selector.
  - Quick-preset chips for rapid demonstration.
  - 3-tier calibrated classification: **Genuine**, **Suspicious**, or **Likely Fake**.
  - Deception probability and confidence score meters.
  - VADER sentiment polarity and rating-text dissonance flag.
  - RapidFuzz duplicate and repetition detection.
  - **SHAP Explainability**: Token attributions and plain-English explanations of deceptive patterns.
  - **spaCy Forensic Profiling**: Type-Token Ratio (lexical diversity), uppercase shouting ratio, exclamation density.
  - Automatic persistence to user history.
- **Bulk Analysis (`/app/bulk`)**:
  - Drag-and-drop CSV upload with client-side header and size validation (<10MB).
  - High-throughput asynchronous background batch processing with real-time progress polling.
  - Summary KPI cards and downloadable enriched CSV report.
- **History (`/app/history`)**:
  - Paginated, searchable, and filterable table of past review analyses.
  - Interactive row detail modal with full linguistic breakdown.
  - Record deletion.
- **Visual Analytics (`/app/analytics`)**:
  - **Recharts** donut chart for Genuine vs. Suspicious distribution.
  - Horizontal bar chart of top recurring suspicious keywords (SHAP attributions).
  - Multi-line chart of review volume over time.
  - Summary telemetry KPI cards (% flagged, total analyzed, average confidence).
- **Datasets (`/app/datasets` — Admin Only)**:
  - Upload, list, preview first 10 rows, and delete custom CSV corpora.
  - Automatic row counting and label balance calculation (e.g. `{"genuine": 800, "fake": 800}`).
- **Models & Training (`/app/models` — Admin Only)**:
  - Select dataset and model architecture:
    - **TF-IDF + Logistic Regression**
    - **TF-IDF + Random Forest Classifier**
    - **DistilBERT Deep Learning Transformer**
    - **Hybrid Linguistic Ensemble**
  - Background training execution with live status.
  - Test set metrics: **Accuracy**, **Precision**, **Recall**, **F1-Score**.
  - Visual 2x2 **Confusion Matrix** (TP, FP, TN, FN) per run.
  - Comparative benchmark table and one-click production model hot-swapping.
- **Admin Dashboard (`/app/admin` — Admin Only)**:
  - User account management and role promotion/demotion.
  - Platform-wide inference telemetry and system health.
- **Access Control (`/app/forbidden`)**:
  - Clean "Access Restricted" page displayed if non-admin users navigate directly to admin routes.

---

## 📊 Empirical Model Benchmarks (Ott et al. Corpus — 1,600 Reviews, 80/20 Split)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | Δ vs Baseline | Latency | Production Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DistilBERT Transformer** | **91.2%** | **90.7%** | **91.9%** | **91.3%** | **+1.2%** | 48.2 ms | Offline High-Precision Audits |
| **TF-IDF + Logistic Regression (Calibrated)** | **90.0%** | **89.0%** | **91.3%** | **90.1%** | Baseline | **3.4 ms** | **Active Production Model** |
| **TF-IDF + Random Forest Classifier** | **85.6%** | **85.5%** | **85.5%** | **85.5%** | -4.6% | 12.1 ms | Exploratory Ensemble |

> **Production Trade-off**: *“DistilBERT reached 91.3% F1 vs 90.1% for the TF-IDF baseline, but at 48.2 ms vs 3.4 ms latency, so the baseline runs in production.”*

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **State & Routing**: React Router v7, TanStack Query
- **Networking**: Axios with Bearer token interceptor and 401 handling
- **Data Visualization**: Recharts
- **Theme**: System-aware ThemeProvider (Dark / Light) with no flash on load

### Backend
- **Framework**: Python 3.11, FastAPI, Pydantic v2
- **ASGI Server**: Uvicorn
- **Database**: MySQL 8 / SQLite local database fallback with SQLAlchemy 2.0 (PyMySQL driver)
- **Database Migrations**: Alembic
- **Authentication**: Argon2 (`argon2-cffi`), JWT (`PyJWT`) with role claims and rate-limited login

### Machine Learning & NLP
- **ML Classifiers**: scikit-learn (TF-IDF Vectorizer, Logistic Regression, Random Forest), joblib
- **Deep Learning**: PyTorch, Hugging Face Transformers (`DistilBERT`)
- **NLP & Sentiment**: spaCy (`en_core_web_sm`), VADER (`vaderSentiment`)
- **Duplicate Matching**: RapidFuzz
- **Explainability**: SHAP & feature attributions

### DevOps & Testing
- **Containers**: Docker & Docker Compose
- **Web Server / Proxy**: Nginx
- **Testing**: pytest & httpx (10/10 automated tests passing)
- **CI/CD**: GitHub Actions workflow

---

## 🚀 Quick Start Guide

### Option 1: Running Locally (Development Mode)

#### 1. Backend Setup (PowerShell / Terminal)
```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Start FastAPI backend
uvicorn app.main:app --reload --port 8000
```
*The backend auto-seeds sample datasets, initializes the default admin account, fits a baseline model, and opens at `http://localhost:8000` (Interactive API docs at `http://localhost:8000/docs`).*

#### 2. Frontend Setup (Separate Terminal)
```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
*The React application opens at `http://localhost:5173`.*

---

### Option 2: Running with Docker Compose (Production Stack)

Spin up MySQL 8, the FastAPI backend, and the React frontend with a single command:

```bash
docker-compose up --build
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Docs**: `http://localhost:8000/docs`
- **MySQL Database**: `localhost:3306`

---

## 🧪 Running Automated Tests

Run the full backend test suite covering authentication, sentiment analysis, linguistic features, duplicate detection, and model training:

```powershell
cd backend
pytest -v
```

---

## 🔑 Default Credentials

- **Admin Account**:
  - **Email**: `admin@fakereview.ai`
  - **Password**: `AdminPass123!`
- **Regular User**: Register a new account via the `/register` page at any time.

---

## ☁️ Cloud Deployment (Render / Railway / Google Colab)

1. **Google Colab (Model Training)**:
   - Use [`scripts/colab_distilbert_trainer.py`](scripts/colab_distilbert_trainer.py) in a Google Colab GPU runtime to fine-tune DistilBERT on large corpora and save model artifacts into `backend/ml_models/`.

2. **Render / Railway**:
   - Deploy backend using `backend/Dockerfile` with environment variable `DATABASE_URL` pointing to your managed MySQL instance.
   - Deploy frontend as a static site using `frontend/Dockerfile`.
