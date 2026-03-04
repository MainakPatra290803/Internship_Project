
import requests
import json

BASE_URL = "http://localhost:8000/api/v1/learning"

def verify_quiz_flow():
    # 1. Generate Quiz (fetch from QuizAPI)
    print("Step 1: generating quiz...")
    try:
        response = requests.post(f"{BASE_URL}/quiz/generate?topic=Linux&difficulty=Easy")
        if response.status_code != 200:
            print(f"Failed to generate quiz: {response.text}")
            return
        
        quiz_data = response.json()
        print(f"Quiz generated with {len(quiz_data.get('questions', []))} questions.")
        
        if not quiz_data.get('questions'):
            print("No questions returned.")
            return

        first_question = quiz_data['questions'][0]
        # Check if ID exists
        q_id = first_question.get('id')
        print(f"First Question ID: {q_id}")
        
        if q_id is None:
            print("FAILURE: Question ID is invalid (None). Cannot submit.")
            return

        # 2. Submit Answer
        print("Step 2: Submitting answer...")
        payload = {
            "question_id": q_id,
            "answer": first_question.get('correct_answer', "chmod"), # Guess if correct answer not exposed
            "time_taken": 5.0
        }
        
        submit_res = requests.post(
            f"{BASE_URL}/submit?user_id=1",
            json=payload
        )
        
        if submit_res.status_code == 200:
            print("SUCCESS: Answer submitted successfully.")
            print(f"Result: {submit_res.json()}")
        else:
            print(f"FAILURE: Submit failed with status {submit_res.status_code}")
            print(submit_res.text)

    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    verify_quiz_flow()
