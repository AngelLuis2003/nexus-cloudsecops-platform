from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db

router = APIRouter(prefix="/api/v1/incidents", tags=["Incident Response"])


class IncidentCreate(BaseModel):
    title: str = Field(min_length=5, max_length=140)
    description: str = Field(min_length=10, max_length=1000)
    severity: Literal["Critical", "High", "Medium", "Low"]
    asset_id: str = Field(min_length=3, max_length=40)
    asset_name: str = Field(min_length=2, max_length=100)
    assigned_to: str = Field(default="Unassigned", max_length=80)


class IncidentUpdate(BaseModel):
    status: Literal["Open", "Investigating", "Contained", "Resolved"] | None = None
    assigned_to: str | None = Field(default=None, max_length=80)
    response_notes: str | None = Field(default=None, max_length=1000)


class Incident(IncidentCreate):
    id: str
    status: Literal["Open", "Investigating", "Contained", "Resolved"]
    response_notes: str
    created_at: datetime
    updated_at: datetime


# Initial illustrative records are inserted only when the database has no incidents.
_INITIAL_INCIDENTS = [
    Incident(id="NX-INC-2001", title="Public customer data exposure", description="Investigate the storage policy that enabled public access to the customer data bucket.", severity="Critical", asset_id="NX-ASSET-001", asset_name="prod-customer-data", assigned_to="Security Analyst", status="Investigating", response_notes="Initial triage complete. Validate access scope and preserve audit evidence.", created_at=datetime(2026, 11, 13, 19, 12, tzinfo=timezone.utc), updated_at=datetime(2026, 11, 13, 19, 25, tzinfo=timezone.utc)),
    Incident(id="NX-INC-2002", title="Unapproved SSH ingress change", description="Review the new inbound SSH rule and confirm whether the change was authorized.", severity="High", asset_id="NX-ASSET-005", asset_name="edge-security-group", assigned_to="Cloud Security", status="Open", response_notes="", created_at=datetime(2026, 11, 13, 18, 54, tzinfo=timezone.utc), updated_at=datetime(2026, 11, 13, 18, 54, tzinfo=timezone.utc)),
    Incident(id="NX-INC-2003", title="Authentication brute-force investigation", description="Investigate repeated failed authentication attempts against the primary identity database.", severity="High", asset_id="NX-ASSET-003", asset_name="identity-db-primary", assigned_to="Identity Team", status="Contained", response_notes="Demo response: source temporarily blocked pending analyst validation.", created_at=datetime(2026, 11, 13, 18, 31, tzinfo=timezone.utc), updated_at=datetime(2026, 11, 13, 19, 2, tzinfo=timezone.utc)),
]


def seed_incidents(db: Session) -> None:
    existing = db.scalar(select(StoredRecord.record_id).where(StoredRecord.module == "incidents").limit(1))
    if existing is None:
        for incident in _INITIAL_INCIDENTS:
            db.add(StoredRecord(module="incidents", record_id=incident.id, payload=incident.model_dump(mode="json")))
        db.commit()


def _load_incidents(db: Session) -> list[Incident]:
    rows = db.scalars(select(StoredRecord).where(StoredRecord.module == "incidents")).all()
    incidents = [Incident.model_validate(row.payload) for row in rows]
    return sorted(incidents, key=lambda item: item.created_at, reverse=True)


@router.get("", response_model=list[Incident])
def list_incidents(db: Session = Depends(get_db)) -> list[Incident]:
    return _load_incidents(db)


@router.post("", response_model=Incident, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)) -> Incident:
    now = datetime.now(timezone.utc)
    incident = Incident(**payload.model_dump(), id=f"NX-INC-{uuid4().hex[:8].upper()}", status="Open", response_notes="", created_at=now, updated_at=now)
    db.add(StoredRecord(module="incidents", record_id=incident.id, payload=incident.model_dump(mode="json")))
    db.commit()
    return incident


@router.patch("/{incident_id}", response_model=Incident)
def update_incident(incident_id: str, payload: IncidentUpdate, db: Session = Depends(get_db)) -> Incident:
    row = db.get(StoredRecord, {"module": "incidents", "record_id": incident_id})
    if row is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident = Incident.model_validate(row.payload)
    updates = payload.model_dump(exclude_unset=True)
    updated = incident.model_copy(update={**updates, "updated_at": datetime.now(timezone.utc)})
    row.payload = updated.model_dump(mode="json")
    db.commit()
    return updated
