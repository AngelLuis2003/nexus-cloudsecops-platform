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


def test_vulnerability_management_endpoint():
    response = client.get("/api/v1/vulnerabilities")
    assert response.status_code == 200
    vulnerabilities = response.json()
    assert len(vulnerabilities) == 6
    assert vulnerabilities[0]["severity"] == "Critical"
    assert vulnerabilities[0]["cvss"] == 9.8
    assert vulnerabilities[0]["asset_id"] == "NX-ASSET-002"
    assert {"id", "cve", "title", "severity", "cvss", "asset_id", "asset_name", "package", "current_version", "fixed_version", "status", "discovered_at", "description"}.issubset(vulnerabilities[0].keys())
