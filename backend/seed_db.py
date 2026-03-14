from sqlalchemy.orm import Session
from app.core.database import get_engine, get_base, get_sessionlocal
from app.models import models
import json

def seed_data():
    print("Seeding database...")
    engine = get_engine()
    Base = get_base()
    
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    SessionLocal = get_sessionlocal()
    db = SessionLocal()
    
    try:
        # Check if topics already exist
        if db.query(models.Topic).first():
            print("Database already contains data. Skipping seeding.")
            return

        # 1. Add Artificial Intelligence Topic
        ai_topic = models.Topic(
            name="Artificial Intelligence",
            description="Fundamentals of AI, Machine Learning, and Neural Networks.",
            order_index=1,
            prerequisites=[]
        )
        db.add(ai_topic)
        db.flush()

        # Add concepts for AI
        concepts = [
            models.Concept(
                topic_id=ai_topic.id,
                name="Introduction to Machine Learning",
                content_text="Machine Learning is a subset of AI that focuses on building systems that learn from data."
            ),
            models.Concept(
                topic_id=ai_topic.id,
                name="Neural Networks",
                content_text="Neural networks are computing systems inspired by the biological neural networks that constitute animal brains."
            )
        ]
        db.add_all(concepts)

        # 2. Add Python Programming Topic
        python_topic = models.Topic(
            name="Python Programming",
            description="Core concepts of the Python language for data science and web development.",
            order_index=2,
            prerequisites=[]
        )
        db.add(python_topic)
        db.flush()

        # Add concepts for Python
        python_concepts = [
            models.Concept(
                topic_id=python_topic.id,
                name="Data Structures",
                content_text="Python's built-in data structures like Lists, Tuples, Dictionaries, and Sets."
            ),
            models.Concept(
                topic_id=python_topic.id,
                name="Object Oriented Programming",
                content_text="Classes, Objects, Inheritance, and Polymorphism in Python."
            )
        ]
        db.add_all(python_concepts)

        db.commit()
        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
