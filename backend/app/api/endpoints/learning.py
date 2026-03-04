import random
import io
import numpy as np
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core import llm
from ml_engine.bkt_model import BKTModel
from ml_engine.kt_model import KnowledgeTracingEngine
from ml_engine.rl_agent import RLAgent
from app.api import deps

router = APIRouter()

@router.get("/chat/sessions", response_model=list[schemas.ChatSessionResponse])
def get_chat_sessions(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student:
        return []
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.student_id == student.student_id,
        models.ChatSession.session_type == "chat"
    ).order_by(models.ChatSession.created_at.desc()).all()
    return sessions

@router.get("/chat/history/{session_id}", response_model=schemas.ChatHistoryResponse)
def get_chat_history(session_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Verify ownership
    student = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not student or session.student_id != student.student_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp.asc()).all()
    return schemas.ChatHistoryResponse(messages=[schemas.ChatMessage(role=msg.role, content=msg.content) for msg in messages])



# Global variables for lazy loading
_ai_client = None
_ai_client_key = None  # Track which key was used to build the client
_kt_engine = None
_rl_agent = None
_bkt = None

def get_ai_client_instance():
    """
    Returns the AI client, rebuilding it if the GOOGLE_API_KEY env var has changed.
    This allows hot-swapping API keys without restarting the server.
    """
    import os
    from dotenv import load_dotenv
    load_dotenv(override=True)  # Re-read .env to pick up any key changes
    global _ai_client, _ai_client_key
    current_key = os.getenv("GOOGLE_API_KEY", "")
    if _ai_client is None or _ai_client_key != current_key:
        print(f"DEBUG: Rebuilding AI client with key: {current_key[:10]}...")
        _ai_client = llm.get_llm_client()
        _ai_client_key = current_key
    return _ai_client

def get_kt_engine():
    global _kt_engine
    if _kt_engine is None:
        _kt_engine = KnowledgeTracingEngine()
    return _kt_engine

def get_rl_agent():
    global _rl_agent
    if _rl_agent is None:
        _rl_agent = RLAgent(action_space_size=5)
        _rl_agent.load_model()
    return _rl_agent

def get_bkt():
    global _bkt
    if _bkt is None:
        _bkt = BKTModel()
    return _bkt

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_tutor(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    session_id = request.session_id
    if not session_id:
        student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if not student:
            student = models.Student(user_id=user_id)
            db.add(student)
            db.commit()
            db.refresh(student)
        new_session = models.ChatSession(
            student_id=student.student_id,
            topic_context=request.topic_context,
            session_type=request.session_type or "chat"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
    else:
        session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    past_messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp).all()
    history = [{"role": msg.role, "content": msg.content} for msg in past_messages]
    history.append({"role": "user", "content": request.content})
    system_prompt = "You are an AI Tutor. When a student asks for a hint, give them a very clear, helpful, and direct hint that gently guides them toward the correct answer without making it too strictly hidden or difficult. IMPORTANT: provide your hint in a clear, pointwise (bulleted) format. If they ask a direct question, provide a clear explanation. Be encouraging. CRITICAL: Keep your response concise and use markdown formatting."
    if request.topic_context:
        system_prompt += f" Topic: {request.topic_context}."
    response_text = await get_ai_client_instance().generate_chat_response(history, system_prompt)
    user_msg = models.ChatMessage(session_id=session_id, role="user", content=request.content)
    assistant_msg = models.ChatMessage(session_id=session_id, role="assistant", content=response_text)
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()
    return schemas.ChatResponse(role="assistant", content=response_text, session_id=session_id)

@router.post("/chat/stream")
async def chat_tutor_stream(request: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    session_id = request.session_id
    if not session_id:
        student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
        if not student:
            student = models.Student(user_id=user_id)
            db.add(student)
            db.commit()
            db.refresh(student)
        new_session = models.ChatSession(
            student_id=student.student_id,
            topic_context=request.topic_context,
            session_type=request.session_type or "chat"
        )
        db.add(new_session)
        db.commit()
        db.refresh(new_session)
        session_id = new_session.id
    else:
        session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
    past_messages = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.timestamp).all()
    history = [{"role": msg.role, "content": msg.content} for msg in past_messages]
    history.append({"role": "user", "content": request.content})
    system_prompt = "You are an AI Tutor. When a student asks for a hint, give them a very clear, helpful, and direct hint that gently guides them toward the correct answer without making it too strictly hidden or difficult. IMPORTANT: provide your hint in a clear, pointwise (bulleted) format. If they ask a direct question, provide a clear explanation. Be encouraging. CRITICAL: Keep your response concise and use markdown formatting."
    async def response_generator():
        full_response = ""
        if not hasattr(get_ai_client_instance(), 'stream_chat_response'):
             text = await get_ai_client_instance().generate_chat_response(history, system_prompt)
             full_response = text
             yield text
        else:
            async for token in get_ai_client_instance().stream_chat_response(history, system_prompt):
                full_response += token
                yield token
        try:
            user_msg = models.ChatMessage(session_id=session_id, role="user", content=request.content)
            assistant_msg = models.ChatMessage(session_id=session_id, role="assistant", content=full_response)
            db.add(user_msg)
            db.add(assistant_msg)
            db.commit()
        except Exception as e:
            print(f"Error saving chat history: {e}")
    return StreamingResponse(response_generator(), media_type="text/plain", headers={"X-Session-ID": str(session_id)})




@router.post("/next", response_model=schemas.Question)
def get_next_question(topic_id: int = Query(None), db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    # 1. Fetch Interactions (User History)
    interactions = db.query(models.Interaction).join(models.ContentItem).filter(models.Interaction.student_id == user_id).all()
    
    # 2. Get Concepts (Filter by topic_id if provided)
    concept_query = db.query(models.Concept)
    if topic_id is not None:
        concept_query = concept_query.filter(models.Concept.topic_id == topic_id)
        
    all_concepts = concept_query.all()
    if not all_concepts:
        raise HTTPException(status_code=500, detail="No concepts found for this topic")
    all_concept_ids = [c.id for c in all_concepts]
    
    # 3. Predict Mastery using KT Engine
    mastery_dict = get_kt_engine().predict_mastery(interactions, all_concept_ids)
    
    # 4. Use RL Agent to select next Concept ID
    last_interaction = interactions[-1] if interactions else None
    last_correct = 1.0 if (last_interaction and last_interaction.is_correct) else 0.0
    
    if get_rl_agent().action_space_size != len(all_concept_ids):
        # We don't dynamically change action space because the model was trained with a fixed size
        pass
        
    state_vector = get_kt_engine().get_state_vector(mastery_dict, all_concept_ids)
    
    # Pad the state_vector to length 5 if there are fewer than 5 concepts in the DB
    # The loaded PPO agent was trained with action_space_size=5, and expects observation shape (6,)
    target_concepts_len = 5
    if len(state_vector) < target_concepts_len:
        padding = np.zeros(target_concepts_len - len(state_vector))
        state_vector = np.concatenate((state_vector, padding))
    elif len(state_vector) > target_concepts_len:
        state_vector = state_vector[:target_concepts_len]
        
    state_vector = np.append(state_vector, [last_correct])
    
    action_idx = get_rl_agent().select_action(state_vector)
    action_idx = min(action_idx, len(all_concept_ids) - 1)
    target_concept_id = all_concept_ids[action_idx]

        
    # 5. Select ContentItem for this concept
    m = mastery_dict[target_concept_id]
    target_difficulty = max(1.0, min(5.0, m * 5 + 0.5)) 
    
    questions = db.query(models.ContentItem).filter(
        models.ContentItem.concept_id == target_concept_id,
        models.ContentItem.type == "quiz_question",
        models.ContentItem.difficulty >= target_difficulty - 1.0,
        models.ContentItem.difficulty <= target_difficulty + 1.0
    ).all()
    
    if not questions:
        questions = db.query(models.ContentItem).filter(models.ContentItem.concept_id == target_concept_id, models.ContentItem.type == "quiz_question").all()
    if not questions:
        questions = db.query(models.ContentItem).filter(models.ContentItem.type == "quiz_question").all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions found")
        
    selected_q = random.choice(questions)
    
    return schemas.Question(
        id=selected_q.id,
        concept_id=selected_q.concept_id,
        content=selected_q.content,
        difficulty=selected_q.difficulty,
        options=selected_q.options or [],
        correct_answer=selected_q.correct_answer,
        explanation=selected_q.explanation
    )

@router.post("/submit", response_model=bool)
def submit_answer(response: schemas.QuestionResponse, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    item = db.query(models.ContentItem).filter(models.ContentItem.id == response.question_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Question not found")
    is_correct = (response.answer == item.correct_answer)
    interaction = models.Interaction(student_id=user_id, content_item_id=item.id, is_correct=is_correct, response_time_ms=int(response.time_taken * 1000))
    db.add(interaction)
    db.commit()
    return is_correct
