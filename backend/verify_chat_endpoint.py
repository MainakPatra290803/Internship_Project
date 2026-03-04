
import os
os.environ["USE_LOCAL_LLM"] = "false"
from fastapi.testclient import TestClient
from app.main import app

def verify_chat():
    with TestClient(app) as client:
        print("Testing /api/v1/learning/chat?user_id=1")
        payload = {
            "content": "Hello, clean world!",
            "session_id": 0 # New session
        }
        try:
            response = client.post("/api/v1/learning/chat?user_id=1", json=payload)
            if response.status_code == 200:
                print(f"SUCCESS: {response.json()}")
            else:
                print(f"FAILURE: {response.status_code} {response.text}")
        except Exception as e:
            print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    verify_chat()
