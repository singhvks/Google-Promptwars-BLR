import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert "service" in response.json()

def test_dashboard_endpoint():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "hero_score" in data
    assert "pillars" in data
    assert "moksha" in data["pillars"]
    assert "artha" in data["pillars"]

def test_events_endpoint():
    response = client.get("/api/events")
    assert response.status_code == 200
    events = response.json()
    assert isinstance(events, list)
    if len(events) > 0:
        assert "source" in events[0]
        assert "category" in events[0]

def test_nudge_endpoint():
    response = client.get("/api/nudge")
    assert response.status_code == 200

def test_rate_limiting():
    # Attempt to exceed the limit of 20/minute for health endpoint
    for _ in range(21):
        res = client.get("/health")
    
    assert res.status_code == 429
    assert "Rate limit exceeded" in res.text
