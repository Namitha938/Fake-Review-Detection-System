# Veridex - Resume Section & Technical Project Write-up

Use the following resume entries, technical descriptions, and bullet points tailored for **Software Engineer (Full-Stack / Backend / ML)** and **Machine Learning Engineer** roles.

---

## 📌 Option 1: Bullet Points for Software Engineer / Full-Stack

**Veridex – AI-Powered Review Credibility & Forensics Platform** | *Python, FastAPI, PyTorch, React, TypeScript, Docker, MySQL*
- Engineered an end-to-end multi-modal fake review detection platform fusing transformer attention (DistilBERT), calibrated logistic regression, VADER sentiment polarity, and RapidFuzz near-duplicate clustering.
- Developed reviewer behavioral forensics engine detecting temporal bursts ($\le 24$-hour posting clusters), posting velocity, and monolithic 5-star shill distributions with custom heuristic risk scoring.
- Implemented transparent prediction explainability by extracting feature attributions and coefficients from scikit-learn `CalibratedClassifierCV` models, surfacing plain-English keyword justifications to users.
- Built a high-throughput developer REST inference endpoint (`POST /api/v1/predict`) and asynchronous batch CSV ingest engine processing $10,000+$ reviews with background job tracking.
- Designed responsive React 19 + TypeScript SPA with dark/light theming, side-by-side review duel comparers, interactive in-text token highlighters, and cryptographically verified forensic certificates.
- Containerized application via Docker Compose (FastAPI, React/Nginx, MySQL 8.0) and configured two-factor authentication (TOTP via Google Authenticator + Gmail SMTP OTP email dispatch).

---

## 📌 Option 2: Bullet Points for Machine Learning / AI Engineer

**Veridex – Calibrated NLP Deception Detection & Review Forensics Pipeline** | *PyTorch, Hugging Face, Scikit-Learn, spaCy, NLTK*
- Fine-tuned **DistilBERT** transformer alongside TF-IDF + Logistic Regression baselines on deceptive opinion corpora; DistilBERT reached **91.3% F1** vs **90.1%** for the TF-IDF baseline (+1.2% gain) and 85.5% for Random Forest, but runs at 48.2 ms vs 3.4 ms latency, so the calibrated baseline serves live production traffic.
- Calibrated posterior deception probabilities using **`CalibratedClassifierCV` (Platt Sigmoid scaling)** across 5-fold cross-validation, eliminating overconfident predictions and guaranteeing reliable risk percentages.
- Engineered multi-signal fusion architecture integrating linguistic marker extraction (lexical diversity, punctuation shouting, uppercase ratio), star-rating sentiment dissonance, and RapidFuzz Levenshtein duplicate matching.
- Implemented interpretable feature attributions extracting fold-averaged coefficients from calibrated pipelines to explain model decisions and pinpoint hyperbolic promotional spam phrases.
- Optimized model deployment with sub-4ms inference latency on calibrated linear models and sub-50ms latency on transformer pipelines via PyTorch and vectorized batching.

---

## 📌 Option 3: Short 2-Bullet Format (Space-Constrained Resumes)

**Veridex – Enterprise Fake Review Detection & Forensics System** *(FastAPI, PyTorch, DistilBERT, React, Docker)*
- Built an enterprise fake review detection platform evaluating fine-tuned DistilBERT (91.3% F1) against calibrated TF-IDF Logistic Regression (90.1% F1 at 3.4 ms latency) and Random Forest (85.5% F1) with Platt calibration and reviewer burst forensics.
- Shipped production REST inference API (`/api/v1/predict`) and Docker Compose microservices stack with asynchronous 10k+ row batch processing, explainable AI keyword attributions, and TOTP 2FA.

---

## 📊 Real Production Benchmarks (Ott et al. Deceptive Opinion Spam Corpus — 1,600 reviews, 80/20 split)

| Model Architecture | Accuracy | Precision | Recall | F1-Score | Δ vs Baseline | Inference Latency | Production Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DistilBERT Transformer** | **91.2%** | **90.7%** | **91.9%** | **91.3%** | **+1.2%** | 48.2 ms | Offline High-Precision Audits |
| **TF-IDF + Logistic Regression (Calibrated)** | **90.0%** | **89.0%** | **91.3%** | **90.1%** | Baseline | **3.4 ms** | **Active Production Model** |
| **TF-IDF + Random Forest Classifier** | **85.6%** | **85.5%** | **85.5%** | **85.5%** | -4.6% | 12.1 ms | Exploratory Ensemble |

> **Key Resume Soundbite**: *“DistilBERT reached 91.3% F1 vs 90.1% for the TF-IDF baseline, but at 48.2 ms vs 3.4 ms latency, so the baseline runs in production.”*

---

## 🛠️ Complete Tech Stack Keywords for Resume

- **Languages & Frameworks**: Python 3.11, TypeScript, React 19, FastAPI, Node.js, HTML5/CSS3.
- **Machine Learning & NLP**: PyTorch, Hugging Face Transformers (`distilbert-base-uncased`), Scikit-Learn (`CalibratedClassifierCV`, `TfidfVectorizer`), NLTK (VADER), spaCy, RapidFuzz.
- **Explainability & Forensics**: Platt Scaling, SHAP-style attribution, Temporal Burst Detection, Rating Dispersions, Linguistic Profiling.
- **Databases & Storage**: MySQL 8.0, SQLAlchemy ORM, SQLite (local fallback), Joblib serialization.
- **DevOps & Cloud**: Docker, Docker Compose, Nginx, Linux, Git, GitHub Actions, AWS ECS / GCP Cloud Run ready.
- **Security & Auth**: JWT (JSON Web Tokens), PBKDF2/Bcrypt Password Hashing, 2FA TOTP (RFC 6238), SMTP OTP verification.

