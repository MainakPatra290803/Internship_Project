import requests

def verify_chat():
    url = "http://localhost:8000/api/v1/learning/chat?user_id=1"
    payload = {"role": "user", "content": "Help me with Calculus"}
    try:
        r = requests.post(url, json=payload)
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        if r.status_code == 200 and "mock" in r.text.lower():
            print("SUCCESS: Chat endpoint working (Mock Mode).")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify_chat()
