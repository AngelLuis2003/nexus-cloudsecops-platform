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


def test_asset_inventory_endpoint():
    response = client.get("/api/v1/assets")
    assert response.status_code == 200

    assets = response.json()
    assert len(assets) == 5
    assert assets[0]["id"] == "NX-ASSET-001"
    assert assets[0]["provider"] == "AWS"
    assert assets[0]["public_exposure"] is True
    assert {
        "id",
        "name",
        "resource_type",
        "provider",
        "region",
        "environment",
        "status",
        "criticality",
        "public_exposure",
    }.issubset(assets[0].keys())
