
import os
import asyncio
import json
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

async def verify_quiz_gen():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in .env")
        return

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-flash-latest')

    system_prompt = (
        "You are an expert quiz generator. "
        "Create a comprehensive quiz with exactly 50 questions. "
        "The quiz should be a mix of Multiple Choice Questions (MCQ) and Fill-in-the-blank (FIB) questions. "
        "For MCQ, provide 4 options. For FIB, provide the exact word or phrase that fills the blank. "
        "Output ONLY strictly valid JSON matching the provided schema."
    )
    
    user_prompt = (
        f"Generate a 50-question quiz for the subject 'Computer Science' on the topic 'Python'.\n"
        "Include 25 MCQs and 25 Fill-in-the-blank questions.\n\n"
        "Schema requirement:\n"
        "{\n"
        "  'questions': [\n"
        "    {\n"
        "      'content': 'Question text...',\n"
        "      'type': 'MCQ' or 'FIB',\n"
        "      'options': ['opt1', 'opt2', 'opt3', 'opt4'] (null for FIB),\n"
        "      'correct_answer': 'The right answer',\n"
        "      'explanation': 'Brief explanation'\n"
        "    }, ...\n"
        "  ]\n"
        "}"
    )

    prompt = f"System: {system_prompt}\nUser: {user_prompt}\nIMPORTANT: Output ONLY valid JSON. No markdown formatting."
    
    print("Sending request to Gemini...")
    try:
        response = model.generate_content(prompt)
        print("Response received.")
        
        # Check feedback
        if hasattr(response, 'prompt_feedback'):
            print(f"Prompt Feedback: {response.prompt_feedback}")

        text = response.text
        print(f"Raw response text length: {len(text)}")
        
        # Cleanup markdown
        if text.startswith("```json"):
            text = text.replace("```json", "").replace("```", "")
        elif text.startswith("```"):
            text = text.replace("```", "")
            
        data = json.loads(text)
        print(f"Successfully parsed JSON. Number of questions: {len(data.get('questions', []))}")
        
    except Exception as e:
        print(f"Error during generation: {e}")
        if hasattr(e, 'response'):
             print(f"Error Response Feedback: {e.response.prompt_feedback}")

if __name__ == "__main__":
    asyncio.run(verify_quiz_gen())
