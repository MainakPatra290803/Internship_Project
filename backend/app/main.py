from fastapi import FastAPI, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from app.core.config import settings
from app.core.database import get_db, get_base, get_engine
from app.models import models
from app.api.endpoints import learning, student, psychology, auth, assessment, assessment_bank, ai_features, planner

from fastapi.staticfiles import StaticFiles
from fastapi import WebSocket, WebSocketDisconnect
import json

# Create all tables
Base = get_base()
engine = get_engine()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, StarletteHTTPException):
        # Let FastAPI's default handler (or specific ones) take care of HTTPExceptions
        return await request.app.default_exception_handlers[StarletteHTTPException](request, exc)

    error_msg = f"Global Exception at {request.url.path}: {str(exc)}"
    print(error_msg)
    with open("error_log.txt", "a") as f:
        f.write(f"{error_msg}\n")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"},
    )

# Build CORS allowed origins - includes localhost for dev + any configured production frontend
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
]

# Add production frontend URL if configured
if settings.FRONTEND_URL:
    origins.append(settings.FRONTEND_URL)
    # Also add https variant
    if settings.FRONTEND_URL.startswith("http://"):
        origins.append(settings.FRONTEND_URL.replace("http://", "https://"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(learning.router, prefix="/api/v1/learning", tags=["learning"])


app.include_router(student.router, prefix="/api/v1/student", tags=["student"])
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["assessment"])
app.include_router(psychology.router, prefix="/api/v1/psychology", tags=["psychology"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(assessment_bank.router, prefix="/api/v1/assessment", tags=["assessment-bank"])
app.include_router(ai_features.router, prefix="/api/v1/ai", tags=["ai-features"])
app.include_router(planner.router, prefix="/api/v1/planner", tags=["planner"])


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")



@app.on_event("startup")
def startup_event():
    # Tables are created by alembic or manually via seed_db.py usually, 
    # but for dev convenience we can keep create_all
    Base = get_base()
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    print("Database initialized.")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.PROJECT_NAME,
        "models_verified": os.path.exists("models/yolov3-tiny.cfg")
    }

@app.get("/")
def root():
    return {"message": "Welcome to the Personalized AI Tutor API"}
