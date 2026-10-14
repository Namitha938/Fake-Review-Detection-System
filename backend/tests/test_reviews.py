def get_auth_token(client):
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "review_tester@example.com",
        "full_name": "Review Tester",
        "password": "Password123!"
    })
    if reg_res.status_code == 200:
        return reg_res.json()["access_token"]
    login_res = client.post("/api/v1/auth/login", json={
        "email": "review_tester@example.com",
        "password": "Password123!"
    })
    return login_res.json()["access_token"]

def test_analyze_public_sandbox(client):
    res = client.post("/api/v1/analyze/public", json={
        "review_text": "The hotel room was very clean and quiet. We really enjoyed the breakfast buffet and the staff was courteous."
    })
    assert res.status_code == 200
    data = res.json()
    assert "prediction" in data
    assert data["prediction"] in ["genuine", "suspicious", "likely_fake"]
    assert "confidence" in data
    assert "fake_probability" in data
    assert "sentiment_label" in data
    assert data["sentiment_label"] in ["positive", "negative", "neutral"]

def test_analyze_review_single_authenticated(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/analyze", json={
        "review_text": "The hotel room was very clean and quiet. We really enjoyed the breakfast buffet and the staff was courteous.",
        "rating": 5
    }, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "prediction" in data
    assert data["prediction"] in ["genuine", "suspicious", "likely_fake"]
    assert "features" in data

def test_duplicate_detection(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    text = "WORST HOTEL ON EARTH! SCAM AND RUDE STAFF! NEVER COME HERE!"
    # Analyze first time
    res1 = client.post("/api/v1/analyze", json={"review_text": text}, headers=headers)
    assert res1.status_code == 200

    # Analyze same text again
    res2 = client.post("/api/v1/analyze", json={"review_text": text}, headers=headers)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["is_duplicate"] is True
    assert data2["duplicate_similarity"] >= 85.0

def test_review_history(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/history", headers=headers)
    assert res.status_code == 200
    history = res.json()
    assert isinstance(history, list)
    assert len(history) >= 1

def test_verify_certificate_endpoint(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post("/api/v1/analyze", json={
        "review_text": "Great location and very quiet rooms. The front desk was helpful.",
        "rating": 4
    }, headers=headers)
    assert res.status_code == 200
    record_id = res.json()["id"]

    # Test via /reviews/verify/{record_id}
    v_res = client.get(f"/api/v1/reviews/verify/{record_id}")
    assert v_res.status_code == 200
    v_data = v_res.json()
    assert v_data["is_valid"] is True
    assert v_data["status"] == "Certificate valid"
    assert v_data["cert_id"] == f"VRX-{record_id}"
    assert "verdict" in v_data
    assert "review_text" not in v_data  # Privacy check: review text not exposed

    # Test via /verify/VRX-{record_id}
    v_res2 = client.get(f"/api/v1/verify/VRX-{record_id}")
    assert v_res2.status_code == 200
    assert v_res2.json()["id"] == record_id

    # Test non-existent ID
    err_res = client.get("/api/v1/verify/999999")
    assert err_res.status_code == 404
