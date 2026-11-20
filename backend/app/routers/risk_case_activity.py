from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import StoredRecord


def append_risk_case_activity(
    db: Session,
    asset_id: str,
    event: str,
    details: str,
) -> None:
    """Append an auditable finding lifecycle event to related risk cases."""
    rows = db.scalars(
        select(StoredRecord).where(StoredRecord.module == "risk_cases")
    ).all()
    now = datetime.now(timezone.utc)
    for row in rows:
        case = dict(row.payload)
        if str(case.get("asset_id")) != str(asset_id):
            continue
        activity = list(case.get("activity") or [])
        activity.append({
            "event": event,
            "details": details,
            "timestamp": now.isoformat(),
        })
        case["activity"] = activity
        case["updated_at"] = now.isoformat()
        row.payload = case
