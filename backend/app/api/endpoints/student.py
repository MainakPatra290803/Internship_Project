from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from ml_engine.kt_model import KnowledgeTracingEngine

router = APIRouter()
kt_engine = KnowledgeTracingEngine()

from app.api import deps

@router.get("/stats")
def get_student_stats(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    interactions = db.query(models.Interaction).filter(models.Interaction.student_id == student.user_id).all()
    if not interactions:
        interactions = db.query(models.Interaction).filter(models.Interaction.student_id == student.student_id).all()

    total_time_ms = sum((i.response_time_ms or 0) for i in interactions)
    total_minutes = round(total_time_ms / 60000)

    # If they are very new, give them at least some credit for being here
    if total_minutes == 0 and len(interactions) > 0:
        total_minutes = 1

    return {
        "current_streak": student.current_streak,
        "total_active_minutes": total_minutes
    }

@router.get("/dashboard", response_model=Dict[str, Any])
def get_student_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    # 1. Verify student exists
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Get all concepts and mappings
    all_concepts = db.query(models.Concept).all()
    concept_map = {c.id: c.name for c in all_concepts}
    concept_topic_map = {c.id: c.topic.name for c in all_concepts if c.topic}
    all_concept_ids = list(concept_map.keys())

    # 3. Fetch interactions
    interactions = db.query(models.Interaction).join(models.ContentItem).filter(
        models.Interaction.student_id == student.user_id # Using user_id for interactions based on auth/learning mappings
    ).order_by(models.Interaction.timestamp.desc()).all()

    if not interactions:
        # Fallback if student_id was used instead of user_id in interactions table
        interactions = db.query(models.Interaction).join(models.ContentItem).filter(
            models.Interaction.student_id == student.student_id
        ).order_by(models.Interaction.timestamp.desc()).all()

    # Total Correct vs Incorrect
    total_correct = sum(1 for i in interactions if i.is_correct)
    total_incorrect = sum(1 for i in interactions if i.is_correct is False)

    # 4. Predict Mastery using BKT
    chronological_interactions = list(reversed(interactions))
    mastery_dict = kt_engine.predict_mastery(chronological_interactions, all_concept_ids)

    # 5. Topic Mastery (Bar Chart) & Concept Mastery List
    topic_scores = {}
    topic_counts = {}
    mastery_levels = []
    
    for concept_id, prob in mastery_dict.items():
        percent = round(prob * 100, 1)
        mastery_levels.append({
            "concept_id": concept_id,
            "concept_name": concept_map.get(concept_id, f"Concept {concept_id}"),
            "mastery_probability": prob,
            "mastery_percent": percent
        })
        topic_name = concept_topic_map.get(concept_id, "General")
        topic_scores[topic_name] = topic_scores.get(topic_name, 0) + percent
        topic_counts[topic_name] = topic_counts.get(topic_name, 0) + 1

    topic_mastery = [
        {"topic_name": topic, "mastery": round(score / topic_counts[topic], 1)} 
        for topic, score in topic_scores.items()
    ]

    # 6. Drift Detection
    is_drifting = False
    drift_message = ""
    valid_interactions = [i for i in chronological_interactions if i.is_correct is not None]
    if len(valid_interactions) >= 15:
        recent_10 = valid_interactions[-10:]
        older_history = valid_interactions[:-10]
        recent_acc = sum(1 for i in recent_10 if i.is_correct) / len(recent_10)
        older_acc = sum(1 for i in older_history if i.is_correct) / len(older_history) if older_history else 0
        
        if older_acc - recent_acc > 0.15: # 15% drop
            is_drifting = True
            drop_percentage = round((older_acc - recent_acc) * 100)
            drift_message = f"Trending Down: Recent accuracy dropped by {drop_percentage}% compared to historical."

    # 7. Format history
    recent_history = []
    for interaction in interactions[:20]:
        recent_history.append({
            "type": "Adaptive Practice",
            "title": interaction.content_item.concept.name if interaction.content_item and interaction.content_item.concept else "Unknown",
            "is_correct": interaction.is_correct,
            "timestamp": interaction.timestamp.isoformat()
        })
        
    assessments = db.query(models.AssessmentSubmission).filter(
        models.AssessmentSubmission.user_id == user_id
    ).order_by(models.AssessmentSubmission.timestamp.desc()).all()
    
    assessment_history = []
    for a in assessments:
        title = a.question.assessment.title if a.question and a.question.assessment else "Assessment Question"
        if a.question and a.question.topic:
            title += f" ({a.question.topic})"
            
        assessment_history.append({
            "type": "Assessment",
            "title": title,
            "score": round(a.score, 1),
            "timestamp": a.timestamp.isoformat()
        })

    return {
        "student_id": student.student_id,
        "current_streak": student.current_streak,
        "mastery_levels": mastery_levels,
        "topic_mastery": topic_mastery,
        "accuracy_stats": {
            "total_correct": total_correct,
            "total_incorrect": total_incorrect
        },
        "drift_detection": {
            "is_drifting": is_drifting,
            "message": drift_message
        },
        "recent_history": recent_history,
        "assessment_history": assessment_history
    }
