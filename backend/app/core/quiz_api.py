from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings
import random
import json

class QuizAPIClient:
    def __init__(self):
        self.api_key = settings.QUIZ_API_KEY
        self.base_url = "https://quizapi.io/api/v1"
        self.headers = {"X-Api-Key": self.api_key}

    async def get_questions(self, topic: str, difficulty: str, limit: int = 10) -> Dict[str, Any]:
        if not self.api_key:
             return {"error": "QUIZ_API_KEY not set"}

        params = {
            "limit": limit,
        }
        
        if difficulty:
            params["difficulty"] = difficulty
            
        if topic:
            params["tags"] = topic
            
        async with httpx.AsyncClient() as client:
            try:
                print(f"QuizAPI Request: {self.base_url}/questions with params {params}")
                response = await client.get(f"{self.base_url}/questions", headers=self.headers, params=params)
                if response.status_code != 200:
                    print(f"QuizAPI Error Status: {response.status_code} - {response.text}")
                    return {"error": f"QuizAPI returned {response.status_code}"}
                    
                data = response.json()
                return self.transform_to_schema(data)
            except Exception as e:
                print(f"QuizAPI Exception: {e}")
                return {"error": str(e)}

    def transform_to_schema(self, quiz_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        questions = []
        for q in quiz_data:
            # Extract options
            answers_map = q.get("answers", {})
            correct_map = q.get("correct_answers", {})
            
            valid_options = []
            correct_option_text = None
            
            # Collect valid options
            for key, value in answers_map.items():
                if value:
                    valid_options.append(value)
            
            # Find correct answer
            # correct_answers keys are like 'answer_a_correct', 'answer_b_correct'
            # answers keys are like 'answer_a', 'answer_b'
            
            for key, is_correct_str in correct_map.items():
                if is_correct_str == "true":
                    # key is 'answer_x_correct', we need 'answer_x'
                    answer_key = key.replace("_correct", "")
                    correct_option_text = answers_map.get(answer_key)
                    break
            
            if not valid_options or not correct_option_text:
                continue
                
            questions.append({
                "content": q.get("question"),
                "type": "MCQ", # QuizAPI mostly returns MCQs
                "options": valid_options,
                "correct_answer": correct_option_text,
                "explanation": q.get("explanation") or "Correct answer provided by QuizAPI."
            })
            
        return {"questions": questions}

# Global instance
quiz_api_client = QuizAPIClient()
