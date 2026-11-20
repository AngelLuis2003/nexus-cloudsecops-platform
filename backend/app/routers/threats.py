from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db

router = APIRouter(prefix="/api/v1/threats", tags=["Threat Detection"])


class ThreatDetection(BaseModel):
    id: str
    rule_id: str
    title: str
    description: str
    severity: str
    asset_id: str
    asset_name: str
    event_type: str
    source: str
    status: str
    detected_at: str
    evidence: str


class ThreatStatusUpdate(BaseModel):
    status: Literal["New", "Investigating", "Resolved", "False Positive"]


# Deterministic sample telemetry. These records are not collected from AWS.
DEMO_EVENTS = [
    {"id": "EVT-1001", "event_type": "storage_acl_changed", "asset_id": "NX-ASSET-001", "asset_name": "prod-customer-data", "public_access": True, "source": "CloudTrail sample", "detected_at": "2026-11-13T19:12:00Z"},
    {"id": "EVT-1002", "event_type": "security_group_rule_added", "asset_id": "NX-ASSET-005", "asset_name": "edge-security-group", "port": 22, "source": "Config sample", "detected_at": "2026-11-13T18:54:00Z"},
    {"id": "EVT-1003", "event_type": "authentication_failed", "asset_id": "NX-ASSET-003", "asset_name": "identity-db-primary", "failed_attempts": 38, "source": "Auth log sample", "detected_at": "2026-11-13T18:31:00Z"},
    {"id": "EVT-1004", "event_type": "api_call_anomaly", "asset_id": "NX-ASSET-002", "asset_name": "payments-api-cluster", "calls_per_minute": 940, "baseline_calls_per_minute": 120, "source": "API telemetry sample", "detected_at": "2026-11-13T17:46:00Z"},
]


def evaluate_event(event: dict) -> ThreatDetection | None:
    """Evaluate one sample event against deterministic detection rules."""
    event_type = event["event_type"]

    if event_type == "storage_acl_changed" and event.get("public_access"):
        rule_id, title, severity = "NEXUS-CLOUD-001", "Public access enabled on storage", "Critical"
        evidence = "Storage access control changed to allow public access."
        description = "A storage access policy now permits public access."

    elif event_type == "security_group_rule_added" and event.get("port") == 22:
        rule_id, title, severity = "NEXUS-NET-002", "SSH ingress rule added", "High"
        evidence = "An inbound SSH rule was added to the security group."
        description = "An administrative SSH port was exposed by a network rule change."

    elif event_type == "authentication_failed" and event.get("failed_attempts", 0) >= 20:
        rule_id, title, severity = "NEXUS-IAM-003", "Possible authentication brute force", "High"
        evidence = f'{event["failed_attempts"]} failed authentication attempts in the sample window.'
        description = "A burst of failed sign-in attempts may indicate credential guessing."

    elif event_type == "api_call_anomaly" and event.get("calls_per_minute", 0) >= event.get("baseline_calls_per_minute", 0) * 5:
        rule_id, title, severity = "NEXUS-API-004", "Unusual API request volume", "Medium"
        evidence = f'{event["calls_per_minute"]} calls/min versus a baseline of {event["baseline_calls_per_minute"]}.'
        description = "API activity exceeded five times its configured sample baseline."

    else:
        return None

    return ThreatDetection(
        id=event["id"].replace("EVT-", "NX-DET-"),
        rule_id=rule_id,
        title=title,
        description=description,
        severity=severity,
        asset_id=event["asset_id"],
        asset_name=event["asset_name"],
        event_type=event_type,
        source=event["source"],
        status="New",
        detected_at=event["detected_at"],
        evidence=evidence,
    )


def seed_threats(db: Session) -> None:
    """Persist the sample detections once without overwriting saved records."""
    existing = db.scalar(
        select(StoredRecord.record_id)
        .where(StoredRecord.module == "threats")
        .limit(1)
    )

    if existing is not None:
        return

    for event in DEMO_EVENTS:
        detection = evaluate_event(event)
        if detection is not None:
            db.add(
                StoredRecord(
                    module="threats",
                    record_id=detection.id,
                    payload=detection.model_dump(mode="json"),
                )
            )

    db.commit()


@router.get("", response_model=list[ThreatDetection])
def list_threat_detections(
    db: Session = Depends(get_db),
) -> list[ThreatDetection]:
    """Return threat detections persisted in the configured database."""
    rows = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "threats")
    ).all()

    return [
        ThreatDetection.model_validate(row.payload)
        for row in sorted(rows, key=lambda row: row.record_id)
    ]


@router.patch("/{detection_id}", response_model=ThreatDetection)
def update_threat_status(
    detection_id: str,
    payload: ThreatStatusUpdate,
    db: Session = Depends(get_db),
) -> ThreatDetection:
    """Persist an analyst-reviewed threat detection lifecycle status."""
    row = db.get(StoredRecord, {"module": "threats", "record_id": detection_id})
    if row is None:
        raise HTTPException(status_code=404, detail="Threat detection not found")

    updated_data = dict(row.payload)
    if updated_data.get("status") != payload.status:
        updated_data["status"] = payload.status
        row.payload = updated_data
        db.commit()
        db.refresh(row)

    return ThreatDetection.model_validate(row.payload)
