from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import settings

# psycopg2 driver for sync engine (simple and reliable for MVP)
SYNC_DATABASE_URL = settings.database_url.replace("postgresql://", "postgresql+psycopg2://")

engine = create_engine(SYNC_DATABASE_URL, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()