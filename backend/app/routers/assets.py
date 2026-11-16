from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord, get_db

router = APIRouter(prefix="/api/v1/assets", tags=["Cloud Asset Inventory"])


class CloudAsset(BaseModel):
    id: str
    name: str
    resource_type: str
    provider: str
    region: str
    environment: str
    status: str
    criticality: str
    public_exposure: bool


# Clearly identified sample records. These are not discovered AWS resources.
_INITIAL_ASSETS = [
    CloudAsset(
        id="NX-ASSET-001",
        name="prod-customer-data",
        resource_type="S3 bucket",
        provider="AWS",
        region="us-west-2",
        environment="Production",
        status="Active",
        criticality="Critical",
        public_exposure=True,
    ),
    CloudAsset(
        id="NX-ASSET-002",
        name="payments-api-cluster",
        resource_type="EKS cluster",
        provider="AWS",
        region="us-east-1",
        environment="Production",
        status="Active",
        criticality="High",
        public_exposure=False,
    ),
    CloudAsset(
        id="NX-ASSET-003",
        name="identity-db-primary",
        resource_type="RDS database",
        provider="AWS",
        region="us-west-2",
        environment="Production",
        status="Active",
        criticality="Critical",
        public_exposure=False,
    ),
    CloudAsset(
        id="NX-ASSET-004",
        name="staging-web-server",
        resource_type="EC2 instance",
        provider="AWS",
        region="us-east-2",
        environment="Staging",
        status="Stopped",
        criticality="Medium",
        public_exposure=False,
    ),
    CloudAsset(
        id="NX-ASSET-005",
        name="edge-security-group",
        resource_type="Security group",
        provider="AWS",
        region="us-west-2",
        environment="Production",
        status="Active",
        criticality="High",
        public_exposure=True,
    ),
]


def seed_assets(db: Session) -> None:
    """Insert the clearly labeled sample inventory once; preserve saved records."""
    existing = db.scalar(
        select(StoredRecord.record_id)
        .where(StoredRecord.module == "assets")
        .limit(1)
    )
    if existing is None:
        for asset in _INITIAL_ASSETS:
            db.add(
                StoredRecord(
                    module="assets",
                    record_id=asset.id,
                    payload=asset.model_dump(mode="json"),
                )
            )
        db.commit()


@router.get("", response_model=list[CloudAsset])
def list_assets(db: Session = Depends(get_db)) -> list[CloudAsset]:
    """Return asset inventory records persisted in the configured database."""
    rows = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "assets")
    ).all()
    return [
        CloudAsset.model_validate(row.payload)
        for row in sorted(rows, key=lambda row: row.record_id)
    ]
