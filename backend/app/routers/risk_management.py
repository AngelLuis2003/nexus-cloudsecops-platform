from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db
from app.routers.risk_correlation import calculate_risk, load_module_data

router = APIRouter(prefix="/api/v1/risk-cases", tags=["Risk Case Management"])

RiskCaseStatus = Literal["Open", "In Progress", "Mitigated", "Accepted", "Closed"]


class RiskCaseCreate(BaseModel):
    asset_id: str = Field(min_length=3, max_length=80)
    owner: str = Field(default="Unassigned", min_length=2, max_length=80)
    treatment_plan: str = Field(default="", max_length=2000)
    analyst_notes: str = Field(default="", max_length=2000)


class RiskCaseUpdate(BaseModel):
    status: RiskCaseStatus | None = None
    owner: str | None = Field(default=None, min_length=2, max_length=80)
    treatment_plan: str | None = Field(default=None, max_length=2000)
    analyst_notes: str | None = Field(default=None, max_length=2000)


class RiskCase(BaseModel):
    id: str
    asset_id: str
    asset_name: str
    title: str
    risk_score: int
    risk_level: str
    criticality: str
    public_exposure: bool
    vulnerability_count: int
    threat_count: int
    contributing_factors: list[dict[str, Any]]
    recommended_actions: list[str]
    status: RiskCaseStatus
    owner: str
    treatment_plan: str
    analyst_notes: str
    activity: list[dict[str, str]]
    created_at: datetime
    updated_at: datetime


def _load_risk_snapshot(db: Session, asset_id: str) -> dict:
    assets = load_module_data(db, "assets")
    asset = next((item for item in assets if str(item.get("id")) == asset_id), None)
    if asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    vulnerabilities = [
        item for item in load_module_data(db, "vulnerabilities")
        if str(item.get("asset_id")) == asset_id
    ]
    threats = [
        item for item in load_module_data(db, "threats")
        if str(item.get("asset_id")) == asset_id
    ]
    return calculate_risk(asset, vulnerabilities, threats)


def _load_cases(db: Session) -> list[RiskCase]:
    rows = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "risk_cases")
    ).all()
    cases = [RiskCase.model_validate(row.payload) for row in rows]
    return sorted(cases, key=lambda item: item.updated_at, reverse=True)


@router.get("", response_model=list[RiskCase])
def list_risk_cases(db: Session = Depends(get_db)) -> list[RiskCase]:
    """List persisted risk treatment cases, newest activity first."""
    return _load_cases(db)


@router.post("", response_model=RiskCase, status_code=201)
def create_risk_case(payload: RiskCaseCreate, db: Session = Depends(get_db)) -> RiskCase:
    """Create one treatment case per asset from its latest correlated risk snapshot."""
    existing = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "risk_cases")
    ).all()
    if any(str(row.payload.get("asset_id")) == payload.asset_id for row in existing):
        raise HTTPException(
            status_code=409,
            detail="A risk treatment case already exists for this asset",
        )

    snapshot = _load_risk_snapshot(db, payload.asset_id)
    now = datetime.now(timezone.utc)
    case_id = f"NX-RISK-{uuid4().hex[:8].upper()}"
    case = RiskCase(
        id=case_id,
        asset_id=snapshot["asset_id"],
        asset_name=snapshot["asset_name"],
        title=f"Risk treatment — {snapshot['asset_name']}",
        risk_score=snapshot["risk_score"],
        risk_level=snapshot["risk_level"],
        criticality=snapshot.get("criticality") or "Unknown",
        public_exposure=snapshot["public_exposure"],
        vulnerability_count=snapshot["vulnerability_count"],
        threat_count=snapshot["threat_count"],
        contributing_factors=snapshot["factors"],
        recommended_actions=snapshot["recommended_actions"],
        status="Open",
        owner=payload.owner,
        treatment_plan=payload.treatment_plan,
        analyst_notes=payload.analyst_notes,
        activity=[{
            "event": "Case created",
            "details": f"Created from current asset risk score {snapshot['risk_score']}/100.",
            "timestamp": now.isoformat(),
        }],
        created_at=now,
        updated_at=now,
    )
    db.add(StoredRecord(
        module="risk_cases",
        record_id=case.id,
        payload=case.model_dump(mode="json"),
    ))
    db.commit()
    return case


@router.patch("/{case_id}", response_model=RiskCase)
def update_risk_case(
    case_id: str,
    payload: RiskCaseUpdate,
    db: Session = Depends(get_db),
) -> RiskCase:
    """Update treatment ownership or lifecycle and append an activity entry."""
    row = db.get(StoredRecord, {"module": "risk_cases", "record_id": case_id})
    if row is None:
        raise HTTPException(status_code=404, detail="Risk case not found")

    case = RiskCase.model_validate(row.payload)
    updates = payload.model_dump(exclude_unset=True)
    changes = {
        key: value for key, value in updates.items()
        if value is not None and getattr(case, key) != value
    }
    if not changes:
        return case

    now = datetime.now(timezone.utc)
    updated_data = case.model_dump()
    updated_data.update(changes)
    activity = list(case.activity)
    for key, value in changes.items():
        activity.append({
            "event": f"{key.replace('_', ' ').title()} updated",
            "details": f"Changed to: {value}",
            "timestamp": now.isoformat(),
        })
    updated_data["activity"] = activity
    updated_data["updated_at"] = now
    updated = RiskCase.model_validate(updated_data)

    row.payload = updated.model_dump(mode="json")
    db.commit()
    return updated
