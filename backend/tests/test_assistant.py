def test_assistant_chat_general(client):
    res = client.post("/api/v1/assistant/chat", json={
        "message": "How do I spot fake Amazon reviews?"
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "suggested_prompts" in data
    assert "provider" in data
    assert len(data["reply"]) > 50

def test_assistant_chat_with_context(client):
    res = client.post("/api/v1/assistant/chat", json={
        "message": "Why was this review flagged?",
        "context": {
            "review_text": "WORST PRODUCT IN THE WORLD SCAM SCAM SCAM!",
            "rating": 1,
            "prediction": "suspicious",
            "fake_probability": 0.62,
            "confidence": 62.0,
            "sentiment_label": "negative",
            "sentiment_score": -0.92,
            "features": {
                "word_count": 8,
                "uppercase_ratio": 1.0,
                "exclamation_count": 1,
                "exclamation_ratio": 0.12,
                "lexical_diversity": 0.6
            },
            "suspicious_keywords": [
                {"word": "scam", "is_suspicious": True, "score": 0.09, "reason": "Defamatory cue"}
            ]
        }
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "SUSPICIOUS" in data["reply"] or "Deception" in data["reply"]

