import os

from sqlalchemy import JSON, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


class StoredRecord(Base):
    __tablename__ = "nexus_records"

    module: Mapped[str] = mapped_column(String(40), primary_key=True)
    record_id: Mapped[str] = mapped_column(String(80), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)


def _database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        # Local/test fallback. Render uses the PostgreSQL DATABASE_URL environment variable.
        return "sqlite:///:memory:"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


_url = _database_url()
_engine_options = {"pool_pre_ping": True}
if _url.startswith("sqlite"):
    _engine_options["connect_args"] = {"check_same_thread": False}
    if _url == "sqlite:///:memory:":
        _engine_options["poolclass"] = StaticPool

engine = create_engine(_url, **_engine_options)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, class_=Session)


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
