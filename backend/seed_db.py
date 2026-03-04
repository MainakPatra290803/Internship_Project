from app.core.database import SessionLocal, engine, Base
from app.models import models

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if questions exist
    if db.query(models.ContentItem).count() > 0:
        print("Data already exists. Skipping seed.")
        db.close()
        return

    print("Seeding Math Topics...")
    
    topics = [
        {"name": "Arithmetic", "desc": "Basic operations, order of operations, integers.", "idx": 1},
        {"name": "Algebra I", "desc": "Variables, linear equations, functions.", "idx": 2},
        {"name": "Geometry", "desc": "Shapes, area, volume, theorems.", "idx": 3},
        {"name": "Trigonometry", "desc": "Sine, cosine, tangent, triangles.", "idx": 4},
        {"name": "Calculus I", "desc": "Limits, derivatives, integrals.", "idx": 5},
    ]
    
    topic_objs = []
    # Check if topics exist, if not create them
    existing_topics = db.query(models.Topic).all()
    if not existing_topics:
        for t in topics:
            topic = models.Topic(
                name=t["name"],
                description=t["desc"],
                order_index=t["idx"],
                prerequisites=[] 
            )
            db.add(topic)
            topic_objs.append(topic)
        db.commit()
    else:
        topic_objs = existing_topics
        
    for t in topic_objs:
        db.refresh(t)
        
    # Concepts for Arithmetic
    # Find Arithmetic topic
    arithmetic = next((t for t in topic_objs if t.name == "Arithmetic"), None)
    if not arithmetic:
        print("Arithmetic topic not found!")
        return

    concepts_data = [
        {"name": "Order of Operations", "text": "PEMDAS: Parentheses, Exponents, Multiplication/Division, Addition/Subtraction."},
        {"name": "Integers", "text": "Whole numbers including negative numbers."},
        {"name": "Fractions", "text": "Part of a whole, numerator and denominator."},
    ]
    
    concept_objs = []
    # Check/Create concepts
    for c in concepts_data:
        concept = db.query(models.Concept).filter(models.Concept.name == c["name"]).first()
        if not concept:
            concept = models.Concept(
                topic_id=arithmetic.id,
                name=c["name"],
                content_text=c["text"]
            )
            db.add(concept)
            db.commit()
            db.refresh(concept)
        concept_objs.append(concept)
        
    # Add Questions (ContentItems)
    print("Seeding Questions...")
    
    # Questions for Order of Operations
    op_concept = next(c for c in concept_objs if c.name == "Order of Operations")
    
    questions = [
        {
            "cid": op_concept.id, "diff": 1.0, "content": "What is 2 + 2?", 
            "options": ["3", "4", "5", "22"], "correct": "4", "type": "quiz_question"
        },
        {
            "cid": op_concept.id, "diff": 1.5, "content": "What is 5 - 3?", 
            "options": ["1", "2", "3", "8"], "correct": "2", "type": "quiz_question"
        },
        {
            "cid": op_concept.id, "diff": 2.0, "content": "Calculate: 2 + 3 * 4", 
            "options": ["20", "14", "24", "10"], "correct": "14", "type": "quiz_question"
        },
        {
            "cid": op_concept.id, "diff": 2.5, "content": "Evaluate: (2 + 3) * 4", 
            "options": ["20", "14", "24", "9"], "correct": "20", "type": "quiz_question"
        },
        {
            "cid": op_concept.id, "diff": 3.0, "content": "Solve: 10 - 2^3", 
            "options": ["2", "4", "16", "6"], "correct": "2", "type": "quiz_question"
        },
        {
            "cid": op_concept.id, "diff": 4.0, "content": "Simplify: 3 + 6 * (5 + 4) / 3 - 7", 
            "options": ["14", "11", "20", "12"], "correct": "14", "type": "quiz_question"
        }
    ]
    
    # Questions for Integers
    int_concept = next(c for c in concept_objs if c.name == "Integers")
    questions.extend([
        {
            "cid": int_concept.id, "diff": 1.0, "content": "Which is an integer?", 
            "options": ["-1", "1.5", "pi", "sqrt(2)"], "correct": "-1", "type": "quiz_question"
        },
        {
            "cid": int_concept.id, "diff": 1.5, "content": "Calculate: -5 + 3", 
            "options": ["-2", "-8", "2", "8"], "correct": "-2", "type": "quiz_question"
        },
        {
            "cid": int_concept.id, "diff": 2.0, "content": "Evaluate: -4 * -3", 
            "options": ["-12", "12", "7", "-7"], "correct": "12", "type": "quiz_question"
        }
    ])

    # Questions for Fractions
    frac_concept = next(c for c in concept_objs if c.name == "Fractions")
    questions.extend([
        {
            "cid": frac_concept.id, "diff": 1.5, "content": "Simplify: 2/4", 
            "options": ["1/2", "3/4", "1/4", "1"], "correct": "1/2", "type": "quiz_question"
        },
        {
            "cid": frac_concept.id, "diff": 2.0, "content": "Add: 1/2 + 1/4", 
            "options": ["3/4", "2/6", "1/3", "1/2"], "correct": "3/4", "type": "quiz_question"
        }
    ])
    
    for q in questions:
        # Check duplicates
        exists = db.query(models.ContentItem).filter(models.ContentItem.content == q["content"]).first()
        if not exists:
            item = models.ContentItem(
                concept_id=q["cid"],
                type=q["type"],
                difficulty=q["diff"],
                content=q["content"],
                correct_answer=q["correct"],
                options=q["options"]
            )
            db.add(item)
            
    db.commit()
    print("Seeding Complete!")
    db.close()

if __name__ == "__main__":
    seed()
