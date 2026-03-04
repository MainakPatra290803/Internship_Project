
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api/v1/learning"

def test_chat():
    print("Testing Chat API...")
    url = f"{BASE_URL}/chat?user_id=1"
    payload = {
        "role": "user",
        "content": "Explain gravity in one sentence."
    }
    try:
        res = requests.post(url, json=payload)
        if res.status_code == 200:
            data = res.json()
            print(f"Success! Response: {data['content']}")
            return True
        else:
            print(f"Failed: {res.status_code} - {res.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_chat()
