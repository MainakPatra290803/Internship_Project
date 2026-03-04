print('Loading main.py')
from fastapi import FastAPI
print('Loaded FastAPI')
from app.core.config import settings
print('Loaded config')
from app.core.database import get_db, get_base, get_engine
print('Loaded database')
from app.models import models
print('Loaded models')
from app.api.endpoints import learning, student, psychology, auth, assessment
print('Loaded endpoints')