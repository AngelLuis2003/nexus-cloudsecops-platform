from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db

router = APIRouter(prefix="/api/v1/compliance", tags=["Compliance Center"])

ControlStatus = Literal["Implemented", "Partially implemented", "Gap", "Not assessed"]


class ComplianceControlUpdate(BaseModel):
    status: ControlStatus | None = None
    owner: str | None = Field(default=None, max_length=80)
    evidence: str | None = Field(default=None, max_length=1200)


class ComplianceControl(BaseModel):
    control_id: str
    function: str
    category: str
    title: str
    description: str
    status: ControlStatus
    owner: str
    evidence: str
    last_assessed: datetime


class ComplianceOverview(BaseModel):
    framework: str
    score: int
    total_controls: int
    implemented: int
    partial: int
    gaps: int
    not_assessed: int
    controls: list[ComplianceControl]


# Illustrative NIST CSF 2.0 assessment records, seeded once and then persisted in PostgreSQL.
_INITIAL_CONTROLS = [
    ComplianceControl(control_id="GV.OC-01", function="GOVERN", category="Organizational Context", title="Mission and stakeholder context", description="Document the organizational mission, stakeholders, and dependencies that shape cybersecurity risk.", status="Implemented", owner="Security Governance", evidence="Demo evidence: security charter and stakeholder register reviewed.", last_assessed=datetime(2026, 11, 10, tzinfo=timezone.utc)),
    ComplianceControl(control_id="GV.RR-02", function="GOVERN", category="Roles, Responsibilities, and Authorities", title="Cybersecurity roles and accountability", description="Establish and communicate cybersecurity roles, responsibilities, and authorities.", status="Partially implemented", owner="Security Governance", evidence="Demo evidence: role matrix exists; approval workflow is pending.", last_assessed=datetime(2026, 11, 9, tzinfo=timezone.utc)),
    ComplianceControl(control_id="ID.AM-01", function="IDENTIFY", category="Asset Management", title="Hardware asset inventory", description="Maintain an inventory of organizational hardware assets.", status="Implemented", owner="Cloud Security", evidence="Demo evidence: NEXUS asset inventory contains five sample cloud resources.", last_assessed=datetime(2026, 11, 12, tzinfo=timezone.utc)),
    ComplianceControl(control_id="ID.RA-01", function="IDENTIFY", category="Risk Assessment", title="Vulnerability identification", description="Identify, validate, and record vulnerabilities in assets.", status="Partially implemented", owner="Vulnerability Team", evidence="Demo evidence: six sample findings are available; no live scanner is connected.", last_assessed=datetime(2026, 11, 12, tzinfo=timezone.utc)),
    ComplianceControl(control_id="PR.AA-01", function="PROTECT", category="Identity Management, Authentication, and Access Control", title="Identity and credential management", description="Manage identities and credentials for authorized users and services.", status="Gap", owner="Identity Team", evidence="No verified production evidence supplied. Sample assessment only.", last_assessed=datetime(2026, 11, 8, tzinfo=timezone.utc)),
    ComplianceControl(control_id="PR.PS-01", function="PROTECT", category="Platform Security", title="Configuration management practices", description="Establish and maintain secure configuration practices for technology platforms.", status="Partially implemented", owner="Platform Team", evidence="Demo evidence: baseline configuration concepts documented; automated enforcement is not connected.", last_assessed=datetime(2026, 11, 11, tzinfo=timezone.utc)),
    ComplianceControl(control_id="DE.CM-01", function="DETECT", category="Continuous Monitoring", title="Network and service monitoring", description="Monitor networks and services for potentially adverse events.", status="Partially implemented", owner="Security Operations", evidence="Demo evidence: deterministic sample-event rules; no live AWS telemetry.", last_assessed=datetime(2026, 11, 13, tzinfo=timezone.utc)),
    ComplianceControl(control_id="DE.AE-02", function="DETECT", category="Adverse Event Analysis", title="Event analysis and correlation", description="Analyze detected events to understand potential cybersecurity incidents.", status="Gap", owner="Security Operations", evidence="No production event pipeline or correlation platform is connected.", last_assessed=datetime(2026, 11, 8, tzinfo=timezone.utc)),
    ComplianceControl(control_id="RS.MA-01", function="RESPOND", category="Incident Management", title="Incident response execution", description="Execute incident response activities in coordination with relevant stakeholders.", status="Partially implemented", owner="Incident Response", evidence="Demo evidence: NEXUS incident workflow supports case creation, assignment, and status updates.", last_assessed=datetime(2026, 11, 13, tzinfo=timezone.utc)),
    ComplianceControl(control_id="RS.AN-03", function="RESPOND", category="Incident Analysis", title="Incident investigation and analysis", description="Analyze incidents to determine scope, root cause, and impact.", status="Not assessed", owner="Incident Response", evidence="Assessment evidence has not yet been collected.", last_assessed=datetime(2026, 11, 7, tzinfo=timezone.utc)),
    ComplianceControl(control_id="RC.RP-01", function="RECOVER", category="Incident Recovery Plan Execution", title="Recovery plan execution", description="Execute recovery activities after an incident.", status="Gap", owner="Business Continuity", evidence="No verified recovery exercise or production recovery evidence supplied.", last_assessed=datetime(2026, 11, 7, tzinfo=timezone.utc)),
    ComplianceControl(control_id="RC.CO-03", function="RECOVER", category="Incident Recovery Communication", title="Recovery progress communication", description="Communicate recovery progress to designated internal and external stakeholders.", status="Not assessed", owner="Business Continuity", evidence="Assessment evidence has not yet been collected.", last_assessed=datetime(2026, 11, 7, tzinfo=timezone.utc)),
]


def seed_compliance(db: Session) -> None:
    existing = db.scalar(select(StoredRecord.record_id).where(StoredRecord.module == "compliance").limit(1))
    if existing is None:
        for control in _INITIAL_CONTROLS:
            db.add(StoredRecord(module="compliance", record_id=control.control_id, payload=control.model_dump(mode="json")))
        db.commit()


def _load_controls(db: Session) -> list[ComplianceControl]:
    rows = db.scalars(select(StoredRecord).where(StoredRecord.module == "compliance")).all()
    return sorted(
        [ComplianceControl.model_validate(row.payload) for row in rows],
        key=lambda control: control.control_id,
    )


def build_overview(controls: list[ComplianceControl]) -> ComplianceOverview:
    counts = {
        "Implemented": sum(c.status == "Implemented" for c in controls),
        "Partially implemented": sum(c.status == "Partially implemented" for c in controls),
        "Gap": sum(c.status == "Gap" for c in controls),
        "Not assessed": sum(c.status == "Not assessed" for c in controls),
    }
    total = len(controls)
    score = round(((counts["Implemented"] + counts["Partially implemented"] * 0.5) / total) * 100) if total else 0
    return ComplianceOverview(
        framework="NIST Cybersecurity Framework 2.0",
        score=score,
        total_controls=total,
        implemented=counts["Implemented"],
        partial=counts["Partially implemented"],
        gaps=counts["Gap"],
        not_assessed=counts["Not assessed"],
        controls=controls,
    )


@router.get("", response_model=ComplianceOverview)
def get_compliance_overview(db: Session = Depends(get_db)) -> ComplianceOverview:
    return build_overview(_load_controls(db))


@router.patch("/{control_id}", response_model=ComplianceOverview)
def update_compliance_control(
    control_id: str,
    payload: ComplianceControlUpdate,
    db: Session = Depends(get_db),
) -> ComplianceOverview:
    row = db.get(StoredRecord, {"module": "compliance", "record_id": control_id})
    if row is None:
        raise HTTPException(status_code=404, detail="Compliance control not found")
    control = ComplianceControl.model_validate(row.payload)
    updates = payload.model_dump(exclude_unset=True)
    updated = control.model_copy(update={**updates, "last_assessed": datetime.now(timezone.utc)})
    row.payload = updated.model_dump(mode="json")
    db.commit()
    return build_overview(_load_controls(db))
