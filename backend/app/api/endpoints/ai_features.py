from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Dict, Any, Optional
import base64
import io
from app.core import llm
from app.api import deps
from app.models import models
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter()

@router.post("/emotion")
async def detect_emotion(
    data: Dict[str, str], 
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Detects emotion from a base64 encoded image frame.
    """
    image_b64 = data.get("image")
    if not image_b64:
        raise HTTPException(status_code=400, detail="No image data provided")
    
    try:
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        image_bytes = base64.b64decode(image_b64)
        
        client = llm.get_llm_client()
        system_prompt = "You are an expert at reading human emotions and cognitive states from facial expressions in a learning context. IMPORTANT: Return ONLY valid JSON."
        user_prompt = "Analyze this image and return a JSON object with: 'emotion' (one of: focused, confused, frustrated, bored, happy) and 'confidence' (0-1)."
        
        if hasattr(client, 'analyze_multimodal'):
            response_text = await client.analyze_multimodal(
                prompt=user_prompt,
                image_data=image_bytes,
                image_mime="image/jpeg",
                system_prompt=system_prompt
            )
            
            import json
            # Cleanup JSON formatting
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            return json.loads(response_text)
        return {"emotion": "focused", "confidence": 1.0}
            
    except Exception as e:
        print(f"Emotion Detection Error: {e}")
        return {"emotion": "focused", "error": str(e)}

@router.post("/voice")
async def process_voice(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Processes voice audio for Socratic dialogue using Gemini 2.0.
    """
    print(f"DEBUG VOICE: Received file {file.filename}, type {file.content_type}")
    try:
        audio_bytes = await file.read()
        print(f"DEBUG VOICE: Read {len(audio_bytes)} bytes")
        
        client = llm.get_llm_client()
        print(f"DEBUG VOICE: Client type: {type(client).__name__}")
        
        system_prompt = "You are a Socratic AI Tutor. Listen to the student's voice and respond as a helpful guide that leads them to the answer without giving it away."
        user_prompt = "What is the student saying and what is your helpful Socratic response? Be concise."
        
        if hasattr(client, 'analyze_multimodal'):
            print("DEBUG VOICE: Calling analyze_multimodal...")
            response_text = await client.analyze_multimodal(
                prompt=user_prompt,
                audio_data=audio_bytes,
                audio_mime="audio/webm",
                system_prompt=system_prompt
            )
            print(f"DEBUG VOICE: Success! Response length: {len(response_text)}")
            return {"response": response_text}
        
        print("DEBUG VOICE: ERROR - analyze_multimodal not found")
        raise HTTPException(status_code=501, detail="Multimodal support not available on this provider")
            
    except Exception as e:
        import traceback
        print(f"DEBUG VOICE EXCEPTION: {type(e).__name__}: {str(e)}")
        traceback.print_exc()
        # Return the actual error message in the detail for frontend debugging
        raise HTTPException(status_code=500, detail=f"Voice AI Error: {str(e)}")

@router.post("/vision/notes")
async def generate_quiz_from_notes(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_user)
):
    """
    Generates a quiz from study notes and PERSISTS it to the database.
    """
    image_bytes = await file.read()
    filename = file.filename
    
    try:
        client = llm.get_llm_client()
        system_prompt = "You are an expert educator. Read these notes and generate exactly 5 high-quality MCQ questions. Return ONLY valid JSON."
        user_prompt = """Generate a JSON object with:
        "title": "Topic from notes",
        "questions": [
           {"question": "...", "options": ["A", "B", "C", "D"], "correct": "...", "explanation": "..."}
        ]"""
        
        if hasattr(client, 'analyze_multimodal'):
            print(f"DEBUG VISION: Sending {len(image_bytes)} bytes to Gemini...")
            response_text = await client.analyze_multimodal(
                prompt=user_prompt,
                image_data=image_bytes,
                image_mime=file.content_type,
                system_prompt=system_prompt
            )
            print(f"DEBUG VISION: LLM Response received: {response_text[:200]}...")
            
            import json
            import re
            
            # Extract JSON using regex for better stability
            json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            else:
                # Fallback to old splitting if regex fails
                if "```json" in response_text:
                    response_text = response_text.split("```json")[1].split("```")[0]
                elif "```" in response_text:
                    response_text = response_text.split("```")[1].split("```")[0]
            
            print(f"DEBUG VISION: Cleaned JSON: {response_text[:200]}...")
            quiz_data = json.loads(response_text)
            
            # --- PERSISTENCE LOGIC ---
            # 1. Create a dynamic Assessment record
            new_assessment = models.Assessment(
                title=f"AI Generated: {quiz_data.get('title', 'Study Notes')}",
                admin_id=current_user.id,
                config={"source": "Vision AI", "filename": filename}
            )
            db.add(new_assessment)
            db.flush() # Get ID
            
            # 2. Save Questions
            for q_item in quiz_data.get("questions", []):
                q_record = models.AssessmentQuestion(
                    assessment_id=new_assessment.id,
                    type="MCQ",
                    topic=quiz_data.get("title", "General"),
                    difficulty="Medium",
                    statement=q_item.get("question", ""),
                    metadata_json={
                        "options": q_item.get("options", []),
                        "correct_answer": q_item.get("correct", ""),
                        "explanation": q_item.get("explanation", "")
                    }
                )
                db.add(q_record)
            
            db.commit()
            return {
                "assessment_id": new_assessment.id,
                "title": new_assessment.title,
                "questions": quiz_data.get("questions", [])
            }
            
        raise HTTPException(status_code=501, detail="Vision support not enabled.")
            
    except Exception as e:
        import traceback
        error_msg = f"Vision Notes Error: {type(e).__name__}: {str(e)}"
        print(error_msg)
        traceback.print_exc()
        db.rollback()
        return {"error": error_msg}

@router.get("/ai-test")
async def test_ai_connection():
    """
    Public diagnostic endpoint. Tests the Gemini API and returns the raw response or error.
    This helps diagnose key issues without requiring authentication.
    """
    import os
    client = llm.get_llm_client()
    model_name = getattr(client, 'model_name', 'MockLLM')
    api_key = os.getenv("GOOGLE_API_KEY", "NOT_SET")
    key_preview = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "INVALID"
    
    try:
        response = await client.generate_text(
            system_prompt="You are a helpful assistant.",
            user_prompt="Say 'AI is working!' in exactly 5 words."
        )
        return {
            "status": "success",
            "model": model_name,
            "key_preview": key_preview,
            "response": response
        }
    except Exception as e:
        return {
            "status": "error",
            "model": model_name,
            "key_preview": key_preview,
            "error_type": type(e).__name__,
            "error_detail": str(e)
        }
