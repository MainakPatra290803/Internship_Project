import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure we can import app
sys.path.append(os.getcwd())

load_dotenv()

from app.core.llm import get_llm_client

async def main():
    print("Loading LLM Client...")
    client = get_llm_client()
    print(f"Client type: {type(client)}")
    
    print("\n--- Testing Text Generation ---")
    try:
        text = await client.generate_text("You are a helpful assistant. Be concise.", "What is the capital of France?")
        print(f"Text Response: {text}", flush=True)
    except Exception as e:
        print(f"Text Generation Failed: {e}")
    
    print("\n--- Testing JSON Generation ---")
    try:
        json_res = await client.generate_json("Math Tutor", "Create a simple addition question.", {})
        print(f"JSON Response: {json_res}")
    except Exception as e:
        print(f"JSON Generation Failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
