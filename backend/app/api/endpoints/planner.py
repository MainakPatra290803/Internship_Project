from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api import deps
from app.core.llm import get_llm_client

router = APIRouter()

@router.post("/generate", response_model=schemas.StudyPlan)
async def generate_study_plan(
    request: schemas.StudyPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")

    # 1. Fetch Target Topic from Database
    target_topic_db = db.query(models.Topic).filter(models.Topic.id == request.topic_id).first()
    if not target_topic_db:
        raise HTTPException(status_code=404, detail="Requested Topic ID not found")
        
    # 2. Fetch all concepts for this topic
    all_concepts = db.query(models.Concept).filter(models.Concept.topic_id == target_topic_db.id).all()
    if not all_concepts:
        raise HTTPException(status_code=400, detail="Topic has no underlying concepts to schedule.")

    # 3. Analyze Mastery & Interactions for prioritization
    weak_mastery = db.query(models.DomainMastery).filter(
        models.DomainMastery.student_id == student.student_id,
        models.DomainMastery.topic_id == target_topic_db.id,
        models.DomainMastery.mastery_level < 50.0
    ).all()
    
    recent_mistakes = db.query(models.Interaction).filter(
        models.Interaction.student_id == student.student_id,
        models.Interaction.is_correct == False
    ).order_by(models.Interaction.timestamp.desc()).limit(20).all()

    weak_concept_ids = set()
    for interaction in recent_mistakes:
        if interaction.content_item and interaction.content_item.concept_id:
            weak_concept_ids.add(interaction.content_item.concept_id)
            
    # Classify concepts
    weak_concepts = [c for c in all_concepts if c.id in weak_concept_ids]
    # If DomainMastery indicates weakness, mark all concepts in that topic as weak for thoroughness
    if weak_mastery:
        weak_concepts = all_concepts.copy()

    strong_or_new_concepts = [c for c in all_concepts if c not in weak_concepts]

    # 4. Deterministic Scheduling Algorithm
    # We want to distribute all concepts across 'duration_days'.
    # Weak concepts get scheduled first (as 'theory' then 'practice').
    tasks_to_create = []
    
    total_days = request.duration_days
    
    # Simple round-robin distribution
    all_learning_items = weak_concepts + strong_or_new_concepts
    
    if len(all_learning_items) == 0:
        raise HTTPException(status_code=400, detail="Not enough content to generate a plan")

    items_per_day = max(1, len(all_learning_items) // total_days)
    remainder = len(all_learning_items) % total_days
    
    current_item_idx = 0
    
    for day in range(1, total_days + 1):
        items_today = items_per_day + (1 if day <= remainder else 0)
        
        for _ in range(items_today):
            if current_item_idx < len(all_learning_items):
                concept = all_learning_items[current_item_idx]
                
                # Check if this was a known weak concept
                is_weak = concept in weak_concepts
                
                tasks_to_create.append({
                    "concept_id": concept.id,
                    "title": f"Study: {concept.name}",
                    "description": "Review the core theory for this concept." if is_weak else "Learn the core materials for this concept.",
                    "task_type": "theory",
                    "day_number": day,
                    "estimated_minutes": 20
                })
                
                # Add a practice/quiz task for reinforcement if there is room on the schedule
                if is_weak:
                    tasks_to_create.append({
                        "concept_id": concept.id,
                        "title": f"Reinforce: {concept.name}",
                        "description": "Take a quick quiz to reinforce your weak areas.",
                        "task_type": "quiz",
                        "day_number": day,
                        "estimated_minutes": 10
                    })
                    
                current_item_idx += 1

    # 5. Save to Database
    focus_areas = [c.name for c in weak_concepts]
    
    new_plan = models.StudyPlan(
        student_id=student.student_id,
        topic_id=target_topic_db.id,
        target_topic=target_topic_db.name,
        focus_areas=focus_areas,
        duration_days=request.duration_days,
        status="active"
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    for task_data in tasks_to_create:
        new_task = models.StudyTask(
            plan_id=new_plan.id,
            concept_id=task_data["concept_id"],
            title=task_data["title"],
            description=task_data["description"],
            task_type=task_data["task_type"],
            day_number=task_data["day_number"],
            estimated_minutes=task_data["estimated_minutes"],
            is_completed=False
        )
        db.add(new_task)
        
    db.commit()
    db.refresh(new_plan)
    
    return new_plan

@router.get("/topics")
def get_available_topics(db: Session = Depends(get_db)):
    topics = db.query(models.Topic).order_by(models.Topic.order_index).all()
    return [{"id": t.id, "name": t.name, "description": t.description} for t in topics]

@router.get("/my-plans", response_model=List[schemas.StudyPlan])
def get_my_plans(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
        
    plans = db.query(models.StudyPlan).filter(
        models.StudyPlan.student_id == student.student_id
    ).order_by(models.StudyPlan.created_at.desc()).all()
    
    return plans

@router.get("/task/{task_id}/content")
def get_task_content(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
        
    task = db.query(models.StudyTask).filter(models.StudyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if task.plan.student_id != student.student_id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if not task.concept_id:
        return {"error": "No concept linked to this task"}

    concept = db.query(models.Concept).filter(models.Concept.id == task.concept_id).first()
    if not concept:
        return {"error": "Linked concept not found"}
        
    if task.task_type == "theory":
        return {
            "type": "theory",
            "title": concept.name,
            "markdown_content": concept.content_text or f"No detailed text found for {concept.name}"
        }
    elif task.task_type == "quiz" or task.task_type == "practice":
        # Fetch related DB content items (MCQs)
        items = db.query(models.ContentItem).filter(
            models.ContentItem.concept_id == concept.id,
            models.ContentItem.type.in_(["quiz_question_mcq", "quiz_question_short"])
        ).limit(5).all()
        
        parsed_items = []
        for item in items:
            parsed_items.append({
                "id": item.id,
                "type": item.type,
                "content": item.content,
                "options": item.options or [],
                "explanation": item.explanation
            })
            
        return {
            "type": "quiz",
            "title": f"Quiz: {concept.name}",
            "questions": parsed_items
        }
        
    return {"error": "Unsupported task type"}

@router.put("/task/{task_id}/complete", response_model=schemas.StudyTask)
def toggle_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    student = current_user.student_profile
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found")
        
    task = db.query(models.StudyTask).filter(models.StudyTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Verify ownership
    if task.plan.student_id != student.student_id:
        raise HTTPException(status_code=403, detail="Not authorized to modify this task")
        
    task.is_completed = not task.is_completed
    db.commit()
    db.refresh(task)
    
    # Check if plan is complete
    all_tasks = db.query(models.StudyTask).filter(models.StudyTask.plan_id == task.plan_id).all()
    if all(t.is_completed for t in all_tasks):
        task.plan.status = "completed"
    else:
        task.plan.status = "active"
    db.commit()
        
    return task
