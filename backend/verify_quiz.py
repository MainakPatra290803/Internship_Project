import requests

def verify_quiz_gen():
    url = "http://localhost:8000/api/v1/learning/quiz/generate?topic=Calculus&difficulty=Hard"
    try:
        r = requests.post(url, json={}) # Params in query
        print(f"Status: {r.status_code}")
        print(f"Response: {r.json()}")
        if r.status_code == 200 and "questions" in r.json():
            print("SUCCESS: Quiz Gen API working.")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify_quiz_gen()
