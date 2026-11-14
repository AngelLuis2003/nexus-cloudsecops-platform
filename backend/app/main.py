import os
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.routers.assets import router as assets_router

app = FastAPI(
    title="NEXUS CloudSecOps API",
    description="Cloud security operations platform API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(assets_router)


class HealthResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime


class OverviewResponse(BaseModel):
    assets_monitored: int
    critical_findings: int
    open_incidents: int
    compliance_score: int
    threat_level: str


@app.get("/api/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    return HealthResponse(
        status="operational",
        service="nexus-api",
        timestamp=datetime.now(timezone.utc),
    )


@app.get("/api/v1/overview", response_model=OverviewResponse, tags=["Overview"])
def overview() -> OverviewResponse:
    # Demonstration data only. No cloud account is connected at this stage.
    return OverviewResponse(
        assets_monitored=1284,
        critical_findings=7,
        open_incidents=3,
        compliance_score=94,
        threat_level="elevated",
    )
