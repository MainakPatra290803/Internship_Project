import requests
import time

BASE_URL = "http://localhost:8000/api/v1/learning"
USER_ID = 1

def test_stateful_chat():
    print("--- Starting Stateful Chat Test ---")
    
    # 1. Start Session
    print("\nMessage 1: Asking about Calculus")
    payload1 = {
        "content": "I want to learn Calculus.",
        "topic_context": "Calculus"
    }
    r1 = requests.post(f"{BASE_URL}/chat?user_id={USER_ID}", json=payload1)
    if r1.status_code != 200:
        print(f"FAILED Message 1: {r1.status_code} - {r1.text}")
        return
    
    data1 = r1.json()
    session_id = data1["session_id"]
    print(f"Success! Session ID: {session_id}")
    print(f"Tutor: {data1['content']}")
    
    # 2. Send follow-up
    print(f"\nMessage 2: Asking for a definition (Session {session_id})")
    payload2 = {
        "content": "What is a derivative?",
        "session_id": session_id
    }
    r2 = requests.post(f"{BASE_URL}/chat?user_id={USER_ID}", json=payload2)
    if r2.status_code != 200:
        print(f"FAILED Message 2: {r2.status_code} - {r2.text}")
        return
    
    data2 = r2.json()
    print(f"Tutor: {data2['content']}")
    
    # 3. Check persistence (simulated by checking if session_id is returned)
    if data2["session_id"] == session_id:
        print("\nSUCCESS: Session ID persisted correctly.")
    else:
        print("\nFAILED: Session ID changed.")

if __name__ == "__main__":
    test_stateful_chat()
