
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/learning"

def test_quiz_gen():
    print("Testing Quiz Generation API...")
    url = f"{BASE_URL}/quiz/generate?topic=Python&difficulty=Easy"
    try:
        res = requests.post(url)
        if res.status_code == 200:
            data = res.json()
            print(f"Success! Quiz Data: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Failed: {res.status_code} - {res.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_quiz_gen()
