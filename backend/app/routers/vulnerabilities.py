from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db
from app.routers.risk_case_activity import append_risk_case_activity

router = APIRouter(
    prefix="/api/v1/vulnerabilities",
    tags=["Vulnerability Management"],
)


class Vulnerability(BaseModel):
    id: str
    cve: str
    title: str
    severity: str
    cvss: float
    asset_id: str
    asset_name: str
    package: str
    current_version: str
    fixed_version: str
    status: str
    discovered_at: str
    description: str


class VulnerabilityStatusUpdate(BaseModel):
    status: Literal["Open", "In progress", "Remediated", "False Positive"]


# Demonstration findings only; no live vulnerability scanner is connected.
DEMO_VULNERABILITIES = [
    Vulnerability(id="NX-VULN-001", cve="CVE-2025-24813", title="Apache Tomcat path-equivalence vulnerability", severity="Critical", cvss=9.8, asset_id="NX-ASSET-002", asset_name="payments-api-cluster", package="Apache Tomcat", current_version="9.0.80", fixed_version="9.0.99", status="Open", discovered_at="2026-11-13T18:42:00Z", description="Potential remote code execution under vulnerable deployment conditions."),
    Vulnerability(id="NX-VULN-002", cve="CVE-2024-3094", title="XZ Utils supply-chain backdoor", severity="Critical", cvss=10.0, asset_id="NX-ASSET-004", asset_name="staging-web-server", package="XZ Utils", current_version="5.6.1", fixed_version="5.6.2", status="In progress", discovered_at="2026-11-13T17:20:00Z", description="Compromised package release may enable unauthorized access."),
    Vulnerability(id="NX-VULN-003", cve="CVE-2024-21626", title="Container escape vulnerability", severity="High", cvss=8.6, asset_id="NX-ASSET-002", asset_name="payments-api-cluster", package="runc", current_version="1.1.11", fixed_version="1.1.12", status="Open", discovered_at="2026-11-12T14:05:00Z", description="A container runtime flaw may allow access outside the intended container boundary."),
    Vulnerability(id="NX-VULN-004", cve="CVE-2023-44487", title="HTTP/2 rapid reset denial of service", severity="High", cvss=7.5, asset_id="NX-ASSET-005", asset_name="edge-security-group", package="nginx", current_version="1.24.0", fixed_version="1.25.3", status="In progress", discovered_at="2026-11-11T09:30:00Z", description="Rapid stream resets can cause resource exhaustion on affected HTTP/2 services."),
    Vulnerability(id="NX-VULN-005", cve="CVE-2024-22243", title="Spring Framework URL parsing issue", severity="Medium", cvss=6.1, asset_id="NX-ASSET-002", asset_name="payments-api-cluster", package="Spring Framework", current_version="6.1.3", fixed_version="6.1.4", status="Remediated", discovered_at="2026-11-10T12:10:00Z", description="URL parsing behavior may cause security policy bypass in specific configurations."),
    Vulnerability(id="NX-VULN-006", cve="CVE-2023-38545", title="SOCKS5 heap buffer overflow", severity="Medium", cvss=5.3, asset_id="NX-ASSET-003", asset_name="identity-db-primary", package="curl", current_version="8.3.0", fixed_version="8.4.0", status="Open", discovered_at="2026-11-09T08:15:00Z", description="A SOCKS5 handshake flaw may trigger a heap buffer overflow."),
]


def seed_vulnerabilities(db: Session) -> None:
    """Persist the sample findings once without overwriting saved records."""
    existing = db.scalar(
        select(StoredRecord.record_id)
        .where(StoredRecord.module == "vulnerabilities")
        .limit(1)
    )

    if existing is not None:
        return

    for vulnerability in DEMO_VULNERABILITIES:
        db.add(
            StoredRecord(
                module="vulnerabilities",
                record_id=vulnerability.id,
                payload=vulnerability.model_dump(mode="json"),
            )
        )

    db.commit()


@router.get("", response_model=list[Vulnerability])
def list_vulnerabilities(
    db: Session = Depends(get_db),
) -> list[Vulnerability]:
    """Return vulnerability findings persisted in the configured database."""
    rows = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "vulnerabilities")
    ).all()

    return [
        Vulnerability.model_validate(row.payload)
        for row in sorted(rows, key=lambda row: row.record_id)
    ]


@router.patch("/{finding_id}", response_model=Vulnerability)
def update_vulnerability_status(
    finding_id: str,
    payload: VulnerabilityStatusUpdate,
    db: Session = Depends(get_db),
) -> Vulnerability:
    """Persist an analyst-reviewed vulnerability lifecycle status."""
    row = db.get(StoredRecord, {"module": "vulnerabilities", "record_id": finding_id})
    if row is None:
        raise HTTPException(status_code=404, detail="Vulnerability finding not found")

    updated_data = dict(row.payload)
    previous_status = updated_data.get("status")
    if previous_status != payload.status:
        updated_data["status"] = payload.status
        row.payload = updated_data
        append_risk_case_activity(
            db,
            str(updated_data.get("asset_id", "")),
            "Vulnerability status updated",
            f'{finding_id} — {updated_data.get("title", "Vulnerability")}: {previous_status} → {payload.status}',
        )
        db.commit()
        db.refresh(row)

    return Vulnerability.model_validate(row.payload)
