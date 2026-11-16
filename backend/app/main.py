
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import SessionLocal, initialize_database
from app.routers.assets import router as assets_router, seed_assets
from app.routers.vulnerabilities import (
    router as vulnerabilities_router,
    seed_vulnerabilities,
)
from app.routers.threats import router as threats_router, seed_threats
from app.routers.incidents import router as incidents_router, seed_incidents
from app.routers.compliance import router as compliance_router, seed_compliance


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    with SessionLocal() as db:
        seed_assets(db)
        seed_incidents(db)
        seed_compliance(db)
        seed_threats(db)
        seed_vulnerabilities(db)
    yield


app = FastAPI(
    title="NEXUS CloudSecOps API",
    description="Cloud security operations platform API.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_URL", "http://localhost:5173"
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

app.include_router(assets_router)
app.include_router(vulnerabilities_router)
app.include_router(threats_router)
app.include_router(incidents_router)
app.include_router(compliance_router)


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
