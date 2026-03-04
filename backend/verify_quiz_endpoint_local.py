import os
# Force disable local LLM for this test to speed up loading
os.environ["USE_LOCAL_LLM"] = "false"

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

def verify_endpoint():
    print("Verifying /quiz/generate endpoint with QuizAPI...")
    
    # Ensure KEY is loaded
    if not settings.QUIZ_API_KEY:
        print("Warning: QUIZ_API_KEY not loaded in settings for this test process.")
        # Attempt to patch it if needed, or rely on .env being loaded by app
    
    with TestClient(app) as client:
        # QuizAPI supports specific tags. "Linux" is a good test topic.
        response = client.post("/api/v1/learning/quiz/generate?topic=Linux&difficulty=Easy")
        
        if response.status_code == 200:
            data = response.json()
            if "questions" in data and len(data["questions"]) > 0:
                print("SUCCESS: Endpoint returned questions.")
                print(f"Sample Question: {data['questions'][0]['content']}")
                print(f"Sample Answer: {data['questions'][0]['correct_answer']}")
            else:
                print(f"FAILURE: No questions returned. Body: {data}")
        else:
            print(f"FAILURE: Status {response.status_code}. Body: {response.text}")

if __name__ == "__main__":
    verify_endpoint()
