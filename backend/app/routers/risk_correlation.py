
from datetime import datetime, timezone
from typing import Any
import json

from fastapi import APIRouter, HTTPException

from app.database import SessionLocal, StoredRecord


router = APIRouter(
    prefix="/api/v1",
    tags=["Risk Correlation"],
)


# Ponderación de los factores de riesgo
ASSET_CRITICALITY = {
    "critical": 35,
    "high": 25,
    "medium": 15,
    "low": 5,
}

SEVERITY_POINTS = {
    "critical": 15,
    "high": 10,
    "medium": 6,
    "low": 3,
}

INACTIVE_STATUSES = {
    "closed",
    "resolved",
    "remediated",
    "fixed",
    "false positive",
    "false_positive",
}


def normalize(value: Any) -> str:
    return str(value or "").strip().lower()


def read_payload(record: StoredRecord) -> dict:
    payload = record.payload

    if isinstance(payload, dict):
        return payload

    if isinstance(payload, str):
        try:
            result = json.loads(payload)
            return result if isinstance(result, dict) else {}
        except (json.JSONDecodeError, TypeError):
            return {}

    return {}


def load_module_data(db, module: str) -> list[dict]:
    records = (
        db.query(StoredRecord)
        .filter(StoredRecord.module == module)
        .all()
    )

    return [
        read_payload(record)
        for record in records
    ]


def is_active(item: dict) -> bool:
    return normalize(item.get("status")) not in INACTIVE_STATUSES


def calculate_risk(asset: dict, vulnerabilities: list, threats: list) -> dict:
    factors = []

    criticality = normalize(asset.get("criticality"))
    score = ASSET_CRITICALITY.get(criticality, 5)

    factors.append({
        "factor": "Asset criticality",
        "points": score,
        "description": f"Asset criticality: {criticality or 'unknown'}",
    })

    public_exposure = asset.get("public_exposure") is True

    if public_exposure:
        score += 20
        factors.append({
            "factor": "Public exposure",
            "points": 20,
            "description": "The asset is publicly exposed",
        })

    active_vulnerabilities = [
        item for item in vulnerabilities if is_active(item)
    ]

    vulnerability_points = 0

    for vulnerability in active_vulnerabilities:
        severity = normalize(vulnerability.get("severity"))
        points = SEVERITY_POINTS.get(severity, 3)
        vulnerability_points += points

    vulnerability_points = min(vulnerability_points, 30)
    score += vulnerability_points

    if active_vulnerabilities:
        factors.append({
            "factor": "Active vulnerabilities",
            "points": vulnerability_points,
            "description": (
                f"{len(active_vulnerabilities)} active vulnerabilities "
                "associated with this asset"
            ),
        })

    active_threats = [
        item for item in threats if is_active(item)
    ]

    threat_points = 0

    for threat in active_threats:
        severity = normalize(threat.get("severity"))
        points = SEVERITY_POINTS.get(severity, 3)
        threat_points += points

    threat_points = min(threat_points, 30)
    score += threat_points

    if active_threats:
        factors.append({
            "factor": "Active threat detections",
            "points": threat_points,
            "description": (
                f"{len(active_threats)} active threat detections "
                "associated with this asset"
            ),
        })

    score = min(score, 100)

    if score >= 75:
        risk_level = "Critical"
    elif score >= 50:
        risk_level = "High"
    elif score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    recommendations = []

    if public_exposure:
        recommendations.append(
            "Review public exposure and restrict unnecessary access."
        )

    if active_vulnerabilities:
        recommendations.append(
            "Prioritize vulnerability remediation and apply available patches."
        )

    if active_threats:
        recommendations.append(
            "Investigate active threat detections and review security events."
        )

    if criticality == "critical":
        recommendations.append(
            "Apply enhanced monitoring to this critical asset."
        )

    if not recommendations:
        recommendations.append(
            "Continue monitoring the asset and maintain security controls."
        )

    return {
        "asset_id": asset.get("id"),
        "asset_name": asset.get("name"),
        "resource_type": asset.get("resource_type"),
        "environment": asset.get("environment"),
        "criticality": asset.get("criticality"),
        "public_exposure": public_exposure,
        "risk_score": score,
        "risk_level": risk_level,
        "vulnerability_count": len(active_vulnerabilities),
        "threat_count": len(active_threats),
        "factors": factors,
        "recommended_actions": recommendations,
    }


@router.get("/risks")
def get_correlated_risks():
    db = SessionLocal()

    try:
        assets = load_module_data(db, "assets")
        vulnerabilities = load_module_data(db, "vulnerabilities")
        threats = load_module_data(db, "threats")

        risks = []

        for asset in assets:
            asset_id = asset.get("id")

            if not asset_id:
                continue

            asset_vulnerabilities = [
                item for item in vulnerabilities
                if str(item.get("asset_id")) == str(asset_id)
            ]

            asset_threats = [
                item for item in threats
                if str(item.get("asset_id")) == str(asset_id)
            ]

            risks.append(
                calculate_risk(
                    asset,
                    asset_vulnerabilities,
                    asset_threats,
                )
            )

        risks.sort(
            key=lambda item: item["risk_score"],
            reverse=True,
        )

        return {
            "status": "success",
            "engine": "NEXUS Risk Correlation Engine",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_assets_analyzed": len(risks),
            "total_active_vulnerabilities": sum(
                item["vulnerability_count"] for item in risks
            ),
            "total_active_threats": sum(
                item["threat_count"] for item in risks
            ),
            "risks": risks,
            "notice": (
                "Risk scores are calculated from currently stored records. "
                "They are prioritization estimates, not verified security assessments."
            ),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Risk correlation failed: {str(error)}",
        )

    finally:
        db.close()
