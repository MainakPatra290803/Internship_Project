from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Personalized AI Tutor"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False # Default to False for production
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    FRONTEND_URL: Optional[str] = None  # Set to your Render frontend URL in production
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    
    # Database - defaults to SQLite for local dev, set DATABASE_URL in env for PostgreSQL
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # Security
    SECRET_KEY: str = "change-this-in-production-use-a-random-32-char-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@aitutor.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None

    # QuizAPI
    QUIZ_API_KEY: Optional[str] = None

    # AI & Integrations
    GOOGLE_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
