import asyncio
import os
from app.core.quiz_api import quiz_api_client
from app.core.config import settings

async def verify_quiz_api():
    print(f"Checking Config...")
    key = settings.QUIZ_API_KEY
    if not key:
        print("ERROR: QUIZ_API_KEY is not set in settings.")
        return
        
    print(f"QUIZ_API_KEY found: {key[:5]}...")
    
    print("\nTesting QuizAPI Client directly...")
    # Topic 'Linux' is a safe bet for QuizAPI
    result = await quiz_api_client.get_questions(topic="Linux", difficulty="Easy", limit=5)
    
    if "error" in result:
        print(f"API Error: {result['error']}")
    elif "questions" in result:
        qs = result["questions"]
        print(f"SUCCESS: Retrieved {len(qs)} questions.")
        for q in qs[:2]:
            print(f"- {q['content']} (Answer: {q['correct_answer']})")
    else:
        print(f"Unexpected response: {result}")

if __name__ == "__main__":
    asyncio.run(verify_quiz_api())
