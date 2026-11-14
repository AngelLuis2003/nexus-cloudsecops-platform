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


def test_threat_detection_rules_endpoint():
    response = client.get("/api/v1/threats")
    assert response.status_code == 200
    detections = response.json()
    assert len(detections) == 4
    assert detections[0]["rule_id"] == "NEXUS-CLOUD-001"
    assert detections[0]["severity"] == "Critical"
    assert detections[1]["asset_id"] == "NX-ASSET-005"
    assert detections[2]["rule_id"] == "NEXUS-IAM-003"
    assert detections[3]["rule_id"] == "NEXUS-API-004"
    assert all(item["status"] == "New" for item in detections)

def test_incident_response_list_endpoint():
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 3
    assert incidents[0]["id"] == "NX-INC-2001"
    assert incidents[0]["severity"] == "Critical"
    assert incidents[0]["status"] == "Investigating"
    assert {"id", "title", "description", "severity", "asset_id", "asset_name", "assigned_to", "status", "response_notes", "created_at", "updated_at"}.issubset(incidents[0].keys())

def test_incident_response_update_endpoint():
    response = client.patch("/api/v1/incidents/NX-INC-2002", json={"status": "Investigating", "assigned_to": "Cloud Security"})
    assert response.status_code == 200
    assert response.json()["status"] == "Investigating"
    assert response.json()["assigned_to"] == "Cloud Security"

def test_incident_response_create_endpoint():
    response = client.post("/api/v1/incidents", json={"title": "Demo incident created by API test", "description": "Validate incident creation and assignment workflow.", "severity": "Medium", "asset_id": "NX-ASSET-002", "asset_name": "payments-api-cluster", "assigned_to": "Platform Team"})
    assert response.status_code == 201
    assert response.json()["status"] == "Open"
    assert response.json()["assigned_to"] == "Platform Team"
