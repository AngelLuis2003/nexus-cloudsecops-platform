import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import User, get_db
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 1800


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    email = str(payload.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if (
        user is None
        or not user.is_active
        or not verify_password(payload.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email or password is incorrect.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return TokenResponse(access_token=create_access_token(user))


@router.get("/me", response_model=UserResponse)
def current_user(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
    )


def bootstrap_admin(db: Session) -> None:
    email = os.getenv("NEXUS_ADMIN_EMAIL", "").strip().lower()
    password = os.getenv("NEXUS_ADMIN_PASSWORD", "")
    if not email and not password:
        print("NEXUS_AUTH_BOOTSTRAP_SKIPPED reason=admin_environment_not_configured", flush=True)
        return
    if not email or not password or len(password) < 12:
        print("NEXUS_AUTH_BOOTSTRAP_SKIPPED reason=invalid_admin_environment", flush=True)
        return

    # Bootstrap only the first account; never overwrite an existing user or password.
    if db.query(User).count() > 0:
        return

    from app.security import hash_password

    db.add(
        User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
            created_at=datetime.now(timezone.utc),
        )
    )
    db.commit()
    print("NEXUS_AUTH_ADMIN_BOOTSTRAPPED", flush=True)
