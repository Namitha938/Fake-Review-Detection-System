import os
import io
import pandas as pd
from starlette.testclient import TestClient

def get_auth_token(client, email="bulk_downloader@example.com"):
    reg_res = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Bulk Downloader",
        "password": "Password123!"
    })
    if reg_res.status_code == 200:
        return reg_res.json()["access_token"]
    login_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return login_res.json()["access_token"]

def test_bulk_csv_upload_and_download_flow(client: TestClient):
    token = get_auth_token(client, "bulk_flow_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create test CSV with 30 rows
    rows = []
    for i in range(30):
        rows.append({
            "review": f"Test review number {i} with plenty of words to evaluate accuracy and quality.",
            "rating": 5 if i % 2 == 0 else 1,
            "reviewer_id": f"REV_{i}"
        })
    df_in = pd.DataFrame(rows)
    csv_bytes = df_in.to_csv(index=False).encode("utf-8")

    # 1. Upload bulk CSV
    upload_res = client.post(
        "/api/v1/bulk",
        files={"file": ("veridex_test_reviews.csv", io.BytesIO(csv_bytes), "text/csv")},
        headers=headers
    )
    assert upload_res.status_code == 200
    job_data = upload_res.json()
    job_id = job_data["id"]

    # 2. Poll until completed (in TestClient background tasks run synchronously)
    status_res = client.get(f"/api/v1/bulk/{job_id}/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "completed"
    assert status_data["processed_rows"] == 30

    # 3. Unauthenticated download must return 401
    unauth_res = client.get(f"/api/v1/bulk/{job_id}/download")
    assert unauth_res.status_code == 401

    # 4. Another user downloading must return 403
    other_token = get_auth_token(client, "other_user@example.com")
    other_res = client.get(f"/api/v1/bulk/{job_id}/download", headers={"Authorization": f"Bearer {other_token}"})
    assert other_res.status_code == 403

    # 5. Owner downloading must return 200, StreamingResponse text/csv
    dl_res = client.get(f"/api/v1/bulk/{job_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert "text/csv" in dl_res.headers.get("content-type", "")
    assert "attachment" in dl_res.headers.get("content-disposition", "")
    assert "veridex_test_reviews_analyzed.csv" in dl_res.headers.get("content-disposition", "")

    # 6. Verify downloaded CSV content and required columns
    df_downloaded = pd.read_csv(io.StringIO(dl_res.text))
    assert len(df_downloaded) == 30

    required_cols = [
        "review_text", "rating", "reviewer_id", "burst_status",
        "prediction", "confidence", "fake_probability", "top_attributions"
    ]
    for col in required_cols:
        assert col in df_downloaded.columns, f"Missing required column: {col}"

