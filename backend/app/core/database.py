from app.core.config import settings
from sqlalchemy.orm import Session
from typing import Iterator

# Global variables to store the engine and sessionmaker
_engine = None
_SessionLocal = None
_Base = None

def get_engine():
    global _engine
    if _engine is None:
        from sqlalchemy import create_engine
        connect_args = {}
        if settings.DATABASE_URL.startswith("sqlite"):
            connect_args["check_same_thread"] = False
            
        _engine = create_engine(
            settings.DATABASE_URL, connect_args=connect_args
        )
    return _engine

def get_sessionlocal():
    global _SessionLocal
    if _SessionLocal is None:
        from sqlalchemy.orm import sessionmaker
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())
    return _SessionLocal

def get_base():
    global _Base
    if _Base is None:
        from sqlalchemy.orm import declarative_base
        _Base = declarative_base()
    return _Base

def get_db() -> Iterator[Session]:
    SessionLocal = get_sessionlocal()
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
