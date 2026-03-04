import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1/learning"
USER_ID = 1

def test_adaptive_flow():
    print("Starting Adaptive Learning Flow Test...")
    
    # 1. Get several questions in a row to see adaptation
    history = []
    
    for i in range(5):
        print(f"\n--- Interaction {i+1} ---")
        
        # Get Next Question
        try:
            resp = requests.post(f"{BASE_URL}/next", params={"user_id": USER_ID})
            if resp.status_code != 200:
                print(f"Error getting question (Status {resp.status_code}):")
                try:
                    print(json.dumps(resp.json(), indent=2))
                except:
                    print(resp.text)
                break
                
            question = resp.json()
            print(f"Question ID: {question['id']}")
            print(f"Concept ID: {question['concept_id']}")
            print(f"Difficulty: {question['difficulty']}")
            print(f"Content: {question['content'][:50]}...")
            
            # Simulate Answer (Force correct for even interactions, incorrect for odd)
            answer = question['correct_answer'] if i % 2 == 0 else "Wrong Answer"
            is_correct_sim = (i % 2 == 0)
            
            # Submit Answer
            submit_data = {
                "question_id": question['id'],
                "answer": answer,
                "time_taken": 2.5
            }
            sub_resp = requests.post(f"{BASE_URL}/submit?user_id={USER_ID}", json=submit_data)
            
            if sub_resp.status_code == 200:
                is_correct = sub_resp.json()
                print(f"Submitted answer. Correct: {is_correct} (Simulated: {is_correct_sim})")
            else:
                 print(f"Error submitting answer: {sub_resp.text}")
            
            history.append({
                "concept_id": question['concept_id'],
                "is_correct": is_correct_sim
            })
            
        except Exception as e:
            print(f"Connection error: {e}")
            print("Make sure the backend server is running!")
            return

    print("\nTest Summary:")
    for h in history:
        print(f"Concept: {h['concept_id']}, Correct: {h['is_correct']}")

if __name__ == "__main__":
    test_adaptive_flow()
