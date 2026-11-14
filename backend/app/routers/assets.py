from fastapi import APIRouter
from pydantic import BaseModel

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
DEMO_ASSETS = [
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


@router.get("", response_model=list[CloudAsset])
def list_assets() -> list[CloudAsset]:
    """Return sample cloud assets until a cloud discovery integration is configured."""
    return DEMO_ASSETS
