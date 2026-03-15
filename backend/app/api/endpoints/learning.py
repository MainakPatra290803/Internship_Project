import random
import io
import numpy as np
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core import llm
import PyPDF2
import docx
from ml_engine.srs_model import calculate_sm2
from app.api import deps

router = APIRouter()

@router.get("/chat/sessions", response_model=List[schemas.ChatSessionResponse])
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

def get_ai_client_instance():
    """
    Returns the AI client, rebuilding it if the GOOGLE_API_KEY env var has changed.
    This allows hot-swapping API keys without restarting the server.
    """
    import os
    # load_dotenv(override=True)  # REMOVED: Render environment variables should take precedence
    global _ai_client, _ai_client_key
    current_key = os.getenv("GOOGLE_API_KEY", "")
    if _ai_client is None or _ai_client_key != current_key:
        print(f"DEBUG: Rebuilding AI client with key: {current_key[:10]}...")
        _ai_client = llm.get_llm_client()
        _ai_client_key = current_key
    return _ai_client

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


@router.post("/chat/upload")
async def upload_chat_document(
    file: UploadFile = File(...),
    session_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Handles document uploads for the chat interface. Extracts text from PDFs, DOCX, TXT.
    If it's an image, relies on the frontend/LLM to handle it, or extracts using vision.
    For now, it returns the extracted text to the frontend so the frontend can append it to the chat.
    """
    try:
        content_bytes = await file.read()
        extracted_text = ""
        filename = file.filename.lower()

        if filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content_bytes))
            for page in pdf_reader.pages:
                extracted_text += page.extract_text() + "\n"
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content_bytes))
            for para in doc.paragraphs:
                extracted_text += para.text + "\n"
        elif filename.endswith(".txt") or filename.endswith(".csv"):
            extracted_text = content_bytes.decode('utf-8')
        elif filename.endswith((".png", ".jpg", ".jpeg", ".webp")):
            # Fallback to LLM vision if we have image
            client = get_ai_client_instance()
            if hasattr(client, 'analyze_multimodal'):
                mime = file.content_type
                if not mime or mime == "application/octet-stream":
                    if filename.endswith(".png"): mime = "image/png"
                    elif filename.endswith(".webp"): mime = "image/webp"
                    else: mime = "image/jpeg"

                extracted_text = await client.analyze_multimodal(
                    prompt="Extract all text and describe this image deeply for study purposes.",
                    image_data=content_bytes,
                    image_mime=mime,
                    system_prompt="You are an AI extracting study notes from an image."
                )
            else:
                 raise HTTPException(status_code=501, detail="Vision support not enabled.")
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, TXT, CSV, or Image files.")

        return {
            "filename": file.filename,
            "extracted_text": extracted_text.strip()
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"DEBUG: upload_chat_document failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.post("/next", response_model=schemas.Question)
def get_next_question(topic_id: int = Query(None), db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    
    # 1. Get Concepts (Filter by topic_id if provided)
    concept_query = db.query(models.Concept)
    if topic_id is not None:
        concept_query = concept_query.filter(models.Concept.topic_id == topic_id)
        
    all_concepts = concept_query.all()
    if not all_concepts:
        raise HTTPException(status_code=404, detail="No concepts found for this topic")
    
    concept_map = {c.id: c for c in all_concepts}
    all_concept_ids = list(concept_map.keys())

    # 2. Get student history to calculate mastery
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if student:
        interactions = db.query(models.Interaction).filter(
            models.Interaction.student_id == (student.user_id if student.user_id else student.student_id)
        ).order_by(models.Interaction.timestamp.asc()).all()
        
        from ml_engine.kt_model import KnowledgeTracingEngine
        kt_engine = KnowledgeTracingEngine()
        mastery_dict = kt_engine.predict_mastery(interactions, all_concept_ids)
        
        # Filter mastery to only include concepts in the requested topic
        topic_mastery = {cid: mastery_dict[cid] for cid in all_concept_ids}
        
        # 3. Adaptive logic: Pick the concept with the lowest mastery
        # We add a tiny bit of randomness to avoid getting stuck on one concept if multiple are 0.5
        sorted_concepts = sorted(topic_mastery.items(), key=lambda x: x[1] + random.uniform(0, 0.05))
        target_concept_id = sorted_concepts[0][0]
    else:
        # Fallback to random if no student profile
        target_concept_id = random.choice(all_concept_ids)

    # 4. Get questions for the selected concept
    questions = db.query(models.ContentItem).filter(
        models.ContentItem.concept_id == target_concept_id,
        models.ContentItem.type.in_(["quiz_question", "quiz_question_mcq"])
    ).all()

    # Fallback: if no questions for that specific concept, pick any from the topic
    if not questions:
        questions = db.query(models.ContentItem).filter(
            models.ContentItem.concept_id.in_(all_concept_ids),
            models.ContentItem.type.in_(["quiz_question", "quiz_question_mcq"])
        ).all()

    if not questions:
        raise HTTPException(status_code=404, detail="No questions found for this topic")
        
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


@router.get("/reviews/due", response_model=List[schemas.Question])
def get_due_reviews(db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    now = datetime.utcnow()
    
    # Get SRS items due before now
    due_states = db.query(models.SpacedRepetitionState).filter(
        models.SpacedRepetitionState.student_id == user_id,
        models.SpacedRepetitionState.next_review_date <= now
    ).all()
    
    if not due_states:
        return []
        
    due_content_ids = [state.content_item_id for state in due_states]
    
    questions = db.query(models.ContentItem).filter(
        models.ContentItem.id.in_(due_content_ids),
        models.ContentItem.type.in_(["quiz_question", "quiz_question_mcq"])
    ).all()
    
    return [
        schemas.Question(
            id=q.id,
            concept_id=q.concept_id,
            content=q.content,
            difficulty=q.difficulty,
            options=q.options or [],
            correct_answer=q.correct_answer,
            explanation=q.explanation
        ) for q in questions
    ]

@router.post("/reviews/submit", response_model=bool)
def submit_review(review: schemas.SRSReviewSubmit, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    user_id = current_user.id
    
    # Upsert the SRS state
    state = db.query(models.SpacedRepetitionState).filter(
        models.SpacedRepetitionState.student_id == user_id,
        models.SpacedRepetitionState.content_item_id == review.content_item_id
    ).first()
    
    if not state:
        state = models.SpacedRepetitionState(
            student_id=user_id,
            content_item_id=review.content_item_id,
            easiness_factor=2.5,
            interval=0,
            repetition=0,
            next_review_date=datetime.utcnow()
        )
        db.add(state)
        # Flush to get the behavior of a new state object or just calculate immediately
    
    new_interval, new_repetition, new_easiness, next_review_date = calculate_sm2(
        quality=review.quality,
        interval=state.interval,
        repetition=state.repetition,
        easiness=state.easiness_factor
    )
    
    state.interval = new_interval
    state.repetition = new_repetition
    state.easiness_factor = new_easiness
    state.next_review_date = next_review_date
    
    # Log the interaction as well for overall tracking
    is_correct = review.quality >= 3
    interaction = models.Interaction(
        student_id=user_id, 
        content_item_id=review.content_item_id, 
        is_correct=is_correct, 
        response_time_ms=0,
        type="srs_review"
    )
    db.add(interaction)
    
    db.commit()
    return True
