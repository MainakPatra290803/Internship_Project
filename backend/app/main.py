from fastapi import FastAPI, Request, Depends, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
import traceback
from datetime import datetime
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
    import traceback
    error_details = traceback.format_exc()
    
    # Log to console
    print(f"--- CRITICAL ERROR at {request.url.path} ---")
    print(error_details)
    
    # Log to file
    with open("error_log.txt", "a") as f:
        f.write(f"\n[{datetime.utcnow()}] ERROR at {request.url.path}:\n{error_details}\n")
        
    # Determine detail and status code
    detail = str(exc)
    status_code = 500
    
    if hasattr(exc, "detail"):
        detail = exc.detail
    if hasattr(exc, "status_code"):
        status_code = exc.status_code
        
    print(f"Returning {status_code}: {detail}")
    
    return JSONResponse(
        status_code=status_code,
        content={"detail": f"{type(exc).__name__}: {detail}"},
    )

# Build CORS allowed origins
# For security when allow_credentials=True, origins must be explicit OR use '*' and allow_credentials=False
# Since we need credentials for Auth, we use the request's origin if it matches a pattern, or just echo it for now for debug
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else ["https://ai-tutor-frontend-17jd.onrender.com", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Better: use a middleware to echo the origin if we want broad access with credentials
@app.middleware("http")
async def add_cors_header(request: Request, call_next):
    response = await call_next(request)
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(learning.router, prefix="/api/v1/learning", tags=["learning"])


app.include_router(student.router, prefix="/api/v1/student", tags=["student"])
app.include_router(assessment.router, prefix="/api/v1/assessment", tags=["assessment"])
app.include_router(psychology.router, prefix="/api/v1/psychology", tags=["psychology"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(assessment_bank.router, prefix="/api/v1/assessment", tags=["assessment-bank"])
app.include_router(ai_features.router, prefix="/api/v1/ai", tags=["ai-features"])
app.include_router(planner.router, prefix="/api/v1/planner", tags=["planner"])


import pathlib
pathlib.Path("uploads").mkdir(parents=True, exist_ok=True)
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
