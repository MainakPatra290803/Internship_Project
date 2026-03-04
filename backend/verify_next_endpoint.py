import os
os.environ["USE_LOCAL_LLM"] = "false"
from fastapi.testclient import TestClient
from app.main import app

def verify_next():
    with TestClient(app) as client:
        print("Testing /api/v1/learning/next?user_id=1")
        response = client.post("/api/v1/learning/next?user_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"SUCCESS: {data}")
        else:
            print(f"FAILURE: {response.status_code} {response.text}")

if __name__ == "__main__":
    verify_next()
