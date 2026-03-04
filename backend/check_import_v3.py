
print("STEP 1: Importing sqlalchemy...")
from sqlalchemy import create_engine
print("STEP 2: Importing sqlalchemy.orm...")
from sqlalchemy.orm import sessionmaker, declarative_base
print("STEP 3: Importing config settings...")
from app.core.config import settings
print("STEP 4: Database URL:", settings.DATABASE_URL)
print("STEP 5: Creating engine...")
# engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
print("STEP 6: declarative_base()...")
# Base = declarative_base()
print("SUCCESS!")
