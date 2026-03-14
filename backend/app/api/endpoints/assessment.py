from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import uuid
import base64

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.core.llm import generate_assessment_problem
from app.core.execution import sandbox
from app.api import deps
from app.core import proctoring

router = APIRouter()

@router.post("/generate-live")
async def generate_live_questions(topic: str = "Computer Science Engineering"):
    """
    Generates fresh MCQ, Coding, and SQL questions via Gemini in one shot.
    Returns structured JSON directly — no DB needed.
    """
    import asyncio
    from app.core.llm import get_llm_client
    import json

    llm = get_llm_client()

    # --- Section A: 5 MCQ Questions ---
    mcq_system = """You are a CSE exam question generator.
Generate exactly 5 multiple-choice questions on the given topic.
Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct": "A) option1",
      "explanation": "Brief explanation"
    }
  ]
}"""
    mcq_prompt = f"Generate 5 MCQ questions about: {topic}"

    # --- Section B: 1 Coding Question ---
    coding_system = """You are a coding interview problem generator.
Generate exactly 1 Python coding problem.
Return ONLY valid JSON in this exact format:
{
  "title": "Problem Title",
  "statement": "Full problem description with examples",
  "input_format": "Input description",
  "output_format": "Output description",
  "sample_input": "sample input here",
  "sample_output": "sample output here",
  "constraints": ["constraint1", "constraint2"]
}"""
    coding_prompt = f"Generate 1 medium-difficulty Python coding problem about: {topic}"

    # --- Section C: 1 SQL Question ---
    sql_system = """You are a database SQL problem generator.
Generate exactly 1 SQL problem with schema.
Return ONLY valid JSON in this exact format:
{
  "title": "Problem Title",
  "statement": "Problem description",
  "schema": "CREATE TABLE example (id INT, name VARCHAR(100)); -- with sample INSERT statements",
  "task": "Write a SQL query to...",
  "expected_result": "Description of expected output"
}"""
    sql_prompt = "Generate 1 medium-difficulty SQL JOIN/subquery problem"

    try:
        mcq_result, coding_result, sql_result = await asyncio.gather(
            llm.generate_json(mcq_system, mcq_prompt, {}),
            llm.generate_json(coding_system, coding_prompt, {}),
            llm.generate_json(sql_system, sql_prompt, {}),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")

    return {
        "section_a_mcq": mcq_result,
        "section_b_coding": coding_result,
        "section_c_sql": sql_result,
    }


@router.post("/create", response_model=schemas.AssessmentResponse)
def create_assessment(assessment_in: schemas.AssessmentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    # 1. Create Assessment Record
    new_assessment = models.Assessment(
        title=assessment_in.title,
        admin_id=current_user.id, 
        config=assessment_in.config
    )
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return new_assessment

@router.post("/{assessment_id}/generate", status_code=202)
async def generate_questions_for_assessment(
    assessment_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Kicks off background generation of assessment questions based on the Config.
    """
    assessment = db.query(models.Assessment).filter(models.Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    async def _bg_generate(assmt_id: int, config: dict):
        bg_db = SessionLocal()
        try:
            # Example config: {"coding": {"easy":1, "hard":1}, "sql": 1, "topic": "General CSE"}
            topic = config.get("topic", "Computer Science Engineering")
            
            # Generate Coding Questions
            coding_cfg = config.get("coding", {})
            for diff, count in coding_cfg.items():
                for _ in range(count):
                    problem_data = await generate_assessment_problem(topic, diff, "CODING")
                    q = models.AssessmentQuestion(
                        assessment_id=assmt_id,
                        type="CODING",
                        topic=topic,
                        difficulty=diff,
                        statement=problem_data.get("statement", ""),
                        metadata_json=problem_data
                    )
                    bg_db.add(q)
                    bg_db.flush()
                    # Add hidden test cases
                    for ht in problem_data.get("hidden_test_cases", []):
                        ht_record = models.HiddenTestCase(
                            question_id=q.id,
                            input_data=ht.get("input", ""),
                            expected_output=ht.get("output", "")
                        )
                        bg_db.add(ht_record)
                        
            # Generate SQL Questions
            sql_count = config.get("sql", 0)
            for _ in range(sql_count):
                problem_data = await generate_assessment_problem("Database Subqueries and Joins", "Medium", "SQL")
                q = models.AssessmentQuestion(
                    assessment_id=assmt_id,
                    type="SQL",
                    topic="SQL",
                    difficulty="Medium",
                    statement=problem_data.get("statement", ""),
                    metadata_json=problem_data
                )
                bg_db.add(q)
                bg_db.flush()
                # Hidden cases for SQL (if any)
                for ht in problem_data.get("hidden_test_cases", []):
                    ht_record = models.HiddenTestCase(
                        question_id=q.id,
                        input_data=ht.get("expected_output_json", "[]"),
                        expected_output=""
                    )
                    bg_db.add(ht_record)
                    
            bg_db.commit()
            print(f"Background generation completed for assessment {assmt_id}.")
        except Exception as e:
            print(f"Background generation failed: {e}")
            bg_db.rollback()
        finally:
            bg_db.close()

    background_tasks.add_task(_bg_generate, assessment.id, assessment.config)
    return {"message": "Question generation explicitly started in background"}

@router.get("/{assessment_id}/questions", response_model=List[schemas.AssessmentQuestionResponse])
def get_assessment_questions(assessment_id: int, db: Session = Depends(get_db)):
    questions = db.query(models.AssessmentQuestion).filter(
        models.AssessmentQuestion.assessment_id == assessment_id
    ).all()
    return questions

@router.post("/submit", response_model=schemas.AssessmentSubmissionResponse)
def submit_code(submission_in: schemas.AssessmentSubmissionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    # 1. Fetch Question and Test Cases
    question = db.query(models.AssessmentQuestion).filter(models.AssessmentQuestion.id == submission_in.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    hidden_cases_db = db.query(models.HiddenTestCase).filter(models.HiddenTestCase.question_id == question.id).all()
    
    test_cases = []
    # Mix visible test cases from metadata with hidden ones
    visible_cases = question.metadata_json.get("test_cases", [])
    for vc in visible_cases:
        test_cases.append({"input": vc.get("input", ""), "output": vc.get("output", "")})
        
    for hc in hidden_cases_db:
        test_cases.append({"input": hc.input_data, "output": hc.expected_output})
        
    # 2. Execute Code
    if submission_in.language.lower() != "python":
        raise HTTPException(status_code=400, detail="Only Python is supported in this MVP phase.")
        
    execution_results = sandbox.run_python_code(submission_in.submitted_code, test_cases)
    
    # 3. Save Submission
    new_submission = models.AssessmentSubmission(
        user_id=current_user.id,
        question_id=question.id,
        submitted_code=submission_in.submitted_code,
        language=submission_in.language,
        score=execution_results["score"],
        execution_time_ms=execution_results["execution_time_ms"],
        memory_used_kb=execution_results["memory_used_kb"]
    )
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return new_submission

@router.post("/proctor/start", response_model=Dict[str, Any])
def start_proctor_session(session_in: schemas.ProctorSessionStart, db: Session = Depends(get_db), current_user: models.User = Depends(deps.get_current_user)):
    new_session = models.ProctorSession(
        user_id=current_user.id,
        assessment_id=session_in.assessment_id,
        risk_score=0.0,
        violation_logs=[]
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"session_id": new_session.id}

@router.post("/proctor/telemetry", response_model=Dict[str, Any])
def receive_telemetry(telemetry_in: schemas.ProctorSessionTelemetry, db: Session = Depends(get_db)):
    session = db.query(models.ProctorSession).filter(models.ProctorSession.id == telemetry_in.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Proctor Session not found")
        
    logs = session.violation_logs or []
    logs.append({
        "event": telemetry_in.event,
        "timestamp": telemetry_in.timestamp
    })
    
    weight = 0.0
    if telemetry_in.event == "tab_switch":
        weight = 10.0
    elif telemetry_in.event == "audio_anomaly":
        weight = 15.0
    elif telemetry_in.event == "no_face_detected":
        weight = 20.0
    elif telemetry_in.event == "multiple_faces_detected":
        weight = 30.0
        
    session.violation_logs = logs
    session.risk_score += weight
    
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(session, "violation_logs")
    
    db.commit()
    return {"status": "Logged", "current_risk_score": session.risk_score}

@router.websocket("/proctor/stream/{session_id}")
async def proctor_stream(websocket: WebSocket, session_id: int):
    await websocket.accept()
    try:
        while True:
            # Receive base64 image data from client
            data = await websocket.receive_text()
            
            # Extract base64 part
            if "," in data:
                header, base64_data = data.split(",", 1)
            else:
                base64_data = data
                
            try:
                img_bytes = base64.b64decode(base64_data)
                
                # Analyze frame
                result = proctoring.analyze_frame(img_bytes)
                
                # Send back the analysis result
                await websocket.send_json(result)
            except Exception as e:
                print(f"Error processing frame: {e}")
                await websocket.send_json({"error": "Failed to process frame"})
                
    except WebSocketDisconnect:
        print(f"WebSocket client {session_id} disconnected")
    except Exception as e:
        print(f"WebSocket error for {session_id}: {e}")
