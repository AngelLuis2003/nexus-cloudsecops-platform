from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "operational"

def test_overview_endpoint():
    response = client.get("/api/v1/overview")
    assert response.status_code == 200
    assert response.json()["assets_monitored"] > 0
