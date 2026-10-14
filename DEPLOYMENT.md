# Veridex - Production Deployment & REST API Reference

This document outlines the containerized deployment architecture, orchestration configurations, and developer REST API inference specifications for **Veridex (AI-Powered Fake Review Detection System)**.

---

## 1. System Architecture Overview

```
                                +---------------------------+
                                |  Client / Browser / Apps  |
                                +-------------+-------------+
                                              |
                                     HTTP / HTTPS (Port 80/443)
                                              |
                                              v
                                   +---------------------+
                                   | Nginx Reverse Proxy |
                                   +----+-----------+----+
                                        |           |
                   /api/v1/*, /docs, /predict       |  Static Assets / SPA
                                        |           |
                                        v           v
                         +--------------------+  +--------------------+
                         |  FastAPI Backend   |  |   React Frontend   |
                         |  (Uvicorn Worker)  |  |   (Vite Build)     |
                         |    [Port 8000]     |  |    [Port 3000]     |
                         +---------+----------+  +--------------------+
                                   |
                         +---------+----------+
                         |                    |
                         v                    v
              +--------------------+   +-----------------------+
              |    MySQL 8.0 DB    |   | ML Inference Artifacts|
              | (Auth & Hist Data) |   |  (DistilBERT / TF-IDF |
              |    [Port 3306]     |   |   + CalibratedCV)     |
              +--------------------+   +-----------------------+
```

---

## 2. Docker & Container Orchestration

### Prerequisites
- Docker Engine $\ge 20.10$
- Docker Compose v2

### Quick Start (Single-Command Launch)
```bash
# 1. Clone repository
git clone https://github.com/your-username/fake-review-detection-system.git
cd "fake-review-detection-system"

# 2. Configure environment
cp .env.example .env

# 3. Spin up all containers in detached mode
docker compose up -d --build

# 4. Verify running health checks
docker compose ps
```

### Services Breakdown
| Service | Container Name | Internal Port | Exposed Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| **db** | `fake_review_mysql` | 3306 | 3306 | Persistent relational database (users, 2FA keys, review history, dataset metadata) |
| **backend** | `fake_review_backend` | 8000 | 8000 | FastAPI REST API, PyTorch & DistilBERT inference, Platt calibrated scikit-learn models |
| **frontend** | `fake_review_frontend` | 80 | 3000 | Production Nginx web server serving compiled React 19 + TypeScript SPA bundle |

---

## 3. Production Cloud Deployment Options

### A. AWS Elastic Container Service (ECS) / AWS Fargate
1. Build and push container images to Amazon Elastic Container Registry (ECR):
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
   docker build -t veridex-backend ./backend
   docker tag veridex-backend:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/veridex-backend:latest
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/veridex-backend:latest
   ```
2. Deploy backend service on AWS Fargate with an Application Load Balancer (ALB) and AWS RDS Aurora MySQL.

### B. Google Cloud Run / GCP Artifact Registry
```bash
gcloud builds submit --tag gcr.io/<project-id>/veridex-backend ./backend
gcloud run deploy veridex-backend \
  --image gcr.io/<project-id>/veridex-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2
```

---

## 4. Developer REST API: Model Inference Specification

Veridex provides an unauthenticated developer REST API endpoint for microservice integration, CI/CD pipelines, and third-party e-commerce review ingest pipelines.

### Endpoint: `POST /api/v1/predict` (or `/predict`)
**Content-Type**: `application/json`

#### Request Schema
```json
{
  "review_text": "string (Required, min 3 chars)",
  "rating": 5,                  // Optional integer (1-5 stars)
  "reviewer_id": "REV-90214"     // Optional string identifier for posting cadence & burst detection
}
```

#### Response Schema
```json
{
  "id": 0,
  "review_text": "BEST HOTEL IN THE WORLD! The pillows are made of angel feathers! Perfection 100/10 stars!",
  "rating": 5,
  "reviewer_id": "REV-BOT-BURST-01",
  "prediction": "likely_fake",
  "confidence": 98.2,
  "fake_probability": 0.982,
  "sentiment_label": "positive",
  "sentiment_score": 0.892,
  "is_duplicate": false,
  "duplicate_similarity": 0.0,
  "suspicious_keywords": [
    {
      "word": "angel",
      "score": 0.84,
      "is_suspicious": true,
      "reason": "Hyperbolic superlative indicator (+0.84 deception weight)"
    },
    {
      "word": "perfection",
      "score": 0.72,
      "is_suspicious": true,
      "reason": "Exaggerated satisfaction token (+0.72 deception weight)"
    }
  ],
  "reviewer_activity": {
    "reviewer_id": "REV-BOT-BURST-01",
    "has_data": true,
    "posting_frequency": "High Velocity (5 reviews)",
    "total_reviews": 5,
    "burst_detected": true,
    "burst_count": 4,
    "min_delta_hours": 0.4,
    "rating_mean": 5.0,
    "rating_std": 0.0,
    "extreme_rating_ratio": 1.0,
    "pattern_label": "Monolithic 5-Star Shill Profile",
    "reviewer_risk_score": 0.85,
    "risk_flags": [
      "Temporal Burst Detected (4 rapid reviews within 24h)",
      "100% Extreme 5-Star bias across all submissions"
    ]
  },
  "features": {
    "char_count": 105,
    "word_count": 16,
    "exclamation_ratio": 0.048,
    "uppercase_ratio": 0.38,
    "suspicious_patterns_score": 0.65
  },
  "source": "rest_api",
  "created_at": "2026-10-14T07:30:00.000Z"
}
```

#### cURL Example
```bash
curl -X POST "http://localhost:8000/api/v1/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "review_text": "DO NOT BUY! Total scam, rat poison in soup and rude managers. Absolute fraud!",
    "rating": 1,
    "reviewer_id": "REV-SMEAR-BOT-99"
  }'
```

#### Python `requests` Integration
```python
import requests

url = "http://localhost:8000/api/v1/predict"
payload = {
    "review_text": "We stayed for three nights. The location on Michigan Avenue was ideal. Clean room and friendly staff.",
    "rating": 4,
    "reviewer_id": "USER-TRAVELER-102"
}

response = requests.post(url, json=payload, timeout=5)
data = response.json()

print(f"Status: {data['prediction'].upper()}")
print(f"Confidence: {data['confidence']}%")
print(f"Burst Detected: {data['reviewer_activity']['burst_detected']}")
```

