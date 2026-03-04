from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
import os
import json
import asyncio
import google.genai as genai
from google.genai import types as genai_types
import openai
from PIL import Image
import io
import base64
from dotenv import load_dotenv
load_dotenv(override=True)  # Always reload .env so key changes take effect

class LLMProvider(ABC):
    @abstractmethod
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        pass

    @abstractmethod
    async def generate_json(self, system_prompt: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def generate_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        pass

class MockLLM(LLMProvider):
    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        return f"[MOCK AI RESPONSE] System: {system_prompt[:20]}... User: {user_prompt}"

    async def generate_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        last_msg = messages[-1]["content"] if messages else ""
        return f"[MOCK CHAT RESPONSE] Socratic hint for: {last_msg}"

    async def generate_json(self, system_prompt: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        if "flashcard" in user_prompt.lower():
             return {
                "flashcards": [
                    {"front": "What is x^2 derivative?", "back": "2x"},
                    {"front": "What is Integration?", "back": "Area under curve"}
                ]
            }
        return {
            "questions": [
                {
                    "content": "What is the derivative of x^2?",
                    "type": "MCQ",
                    "options": ["x", "2x", "x^2", "2"],
                    "correct_answer": "2x",
                    "explanation": "The power rule states d/dx x^n = nx^(n-1). So d/dx x^2 = 2x^(2-1) = 2x."
                }
            ]
        }
        

class LocalLLMProvider(LLMProvider):
    def __init__(self, model_name: str):
        try:
            from ctransformers import AutoModelForCausalLM
            print(f"Loading local GGUF model: {model_name}...")
            
            model_type = os.getenv("LOCAL_MODEL_TYPE", "llama")
            self.model_type = model_type
            # AutoModelForCausalLM from ctransformers handles GGUF automatically
            self.model = AutoModelForCausalLM.from_pretrained(
                model_name, 
                model_type=model_type, 
                gpu_layers=0 # Set to >0 if GPU available (e.g. 50)
            )
            print(f"Local GGUF model ({model_type}) loaded.")
        except ImportError:
            print("ctransformers not installed. Please run: pip install ctransformers")
            raise
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

    def _build_prompt(self, system_prompt: str, user_prompt: str) -> str:
        if self.model_type == "phi2":
            return f"Instruct: {system_prompt}\n{user_prompt}\nOutput:"
        # Default to TinyLlama / ChatML-like
        return f"<|system|>\n{system_prompt}</s>\n<|user|>\n{user_prompt}</s>\n<|assistant|>"

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        prompt = self._build_prompt(system_prompt, user_prompt)
        return self.model(prompt, max_new_tokens=256)

    async def generate_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        # Simplistic chat to text conversion
        full_conversation = ""
        for m in messages:
            full_conversation += f"{m['role']}: {m['content']}\n"
        
        return await self.generate_text(system_prompt or "", full_conversation)

    async def stream_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None):
        """Yields tokens as they are generated."""
        # Re-use logic
        full_conversation = ""
        for m in messages:
            role = m['role']
            content = m['content']
            if self.model_type == "phi2":
                 full_conversation += f"{content}\n"
            else:
                 full_conversation += f"{role}: {content}\n"

        prompt = self._build_prompt(system_prompt, full_conversation)
        
        # ctransformers model(stream=True) returns a generator
        for token in self.model(prompt, max_new_tokens=256, stream=True):
            yield token

    async def generate_json(self, system_prompt: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_prompt(f"{system_prompt}\nIMPORTANT: You must output strictly valid JSON only. No markdown.", user_prompt)
        text = self.model(prompt, max_new_tokens=256)
        
        # Optimistic cleanup
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
            
        try:
            return json.loads(text)
        except:
            return {"error": "Failed to generate JSON locally", "raw": text}


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        try:
            # Using new Responses API as requested
            prompt = f"System: {system_prompt}\nUser: {user_prompt}"
            response = await self.client.responses.create(
                model="gpt-5-nano",
                input=prompt
            )
            # Assuming response structure matches user snippet: response.output_text
            # Use getattr to be safe if attribute is missing
            return getattr(response, "output_text", str(response))
        except Exception as e:
            print(f"OpenAI Text Error: {e}")
            return "I'm having trouble thinking right now. Please try again."

    async def generate_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        try:
            # Convert messages to string format for 'input'
            prompt_parts = []
            if system_prompt:
                prompt_parts.append(f"System: {system_prompt}")
            
            for m in messages:
                role = m["role"].capitalize()
                prompt_parts.append(f"{role}: {m['content']}")
            
            full_prompt = "\n".join(prompt_parts)

            response = await self.client.responses.create(
                model="gpt-5-nano",
                input=full_prompt
            )
            return getattr(response, "output_text", str(response))
        except Exception as e:
            print(f"OpenAI Chat Error: {e}")
            return "I'm having trouble following the conversation. Can you repeat that?"

    async def generate_json(self, system_prompt: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Responses API might support json via input instructions for now
            prompt = f"System: {system_prompt}\nUser: {user_prompt}\nIMPORTANT: Output ONLY valid JSON."
            response = await self.client.responses.create(
                model="gpt-5-nano",
                input=prompt
            )
            content = getattr(response, "output_text", "")
            if not content and hasattr(response, "choices"): # Fallback if structure is different
                 content = response.choices[0].message.content
                 
            # Clean markdown
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "")
            elif content.startswith("```"):
                content = content.replace("```", "")

            return json.loads(content)
        except Exception as e:
            print(f"OpenAI JSON Error: {e}")
            return {"error": "Failed to generate structured data", "details": str(e)}


class GoogleGeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        # New official google-genai SDK (v1+)
        self.client = genai.Client(api_key=api_key)
        self.model_name = "models/gemini-2.5-flash-lite"

    async def generate_text(self, system_prompt: str, user_prompt: str) -> str:
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                )
            )
            return response.text
        except Exception as e:
            error_str = str(e)
            print(f"Gemini Text Error: {type(e).__name__}: {e}")
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                return "⚠️ The AI is rate-limited right now. Please wait ~30 seconds and try again."
            return f"⚠️ AI error: {type(e).__name__}. Please try again."

    async def generate_chat_response(self, messages: List[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append(
                genai_types.Content(
                    role=role,
                    parts=[genai_types.Part(text=m["content"])]
                )
            )
        config = genai_types.GenerateContentConfig(
            system_instruction=system_prompt or "You are a helpful AI Tutor."
        )
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )
            return response.text
        except Exception as e:
            error_str = str(e)
            print(f"Gemini Chat Error: {type(e).__name__}: {e}")
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                return "⚠️ The AI is rate-limited right now. Please wait ~30 seconds and try again."
            return f"⚠️ AI error: {type(e).__name__}. Please try again."

    async def generate_json(self, system_prompt: str, user_prompt: str, schema: Dict[str, Any]) -> Dict[str, Any]:
        try:
            print(f"DEBUG LLM: Sending async JSON request to Gemini...")
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=user_prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    response_mime_type="application/json"
                )
            )
            text = response.text
            print(f"DEBUG LLM: Received JSON response (length: {len(text)})")
            return json.loads(text)
        except Exception as e:
            print(f"DEBUG LLM ERROR: Gemini JSON Error: {type(e).__name__}: {str(e)}")
            return {"error": "Failed to generate structured data", "details": str(e)}


def get_llm_client() -> LLMProvider:
    if os.getenv("USE_LOCAL_LLM", "false").lower() == "true":
        model_name = os.getenv("LOCAL_MODEL_NAME", "TinyLlama/TinyLlama-1.1B-Chat-v1.0")
        print(f"Using Local LLM Provider: {model_name}")
        return LocalLLMProvider(model_name)

    google_key = os.getenv("GOOGLE_API_KEY")
    if google_key:
        print("Using Google Gemini Provider")
        return GoogleGeminiProvider(google_key)

    openai_key = os.getenv("OPENAI_API_KEY")
    if openai_key:
        print("Using OpenAI Provider")
        return OpenAIProvider(openai_key)
    
    print("Using Mock Provider (No API Key found)")
    return MockLLM()

async def generate_assessment_problem(topic: str, difficulty: str, q_type: str = "CODING") -> Dict[str, Any]:
    llm = get_llm_client()
    
    if q_type.upper() == "CODING":
        system_prompt = """You are an expert Software Engineering interviewer for a MANGA company.
Generate a strictly JSON formatted CSE interview problem. Provide a unique story-based scenario.
The JSON must strictly follow this schema:
{
  "title": "Short title",
  "statement": "Detailed story-based problem description",
  "input_format": "String explaining input format",
  "output_format": "String explaining output format",
  "constraints": ["Constraint 1", "Constraint 2"],
  "test_cases": [
    {"input": "...", "output": "...", "explanation": "..."} 
  ],
  "hidden_test_cases": [
     {"input": "...", "output": "..."}
  ],
  "optimal_complexity": "Time: O(N), Space: O(1)"
}"""
    elif q_type.upper() == "SQL":
        system_prompt = """You are an expert Database Architect for a MANGA company.
Generate a strictly JSON formatted SQL interview problem. Provide a unique business-case scenario and schema.
The JSON must strictly follow this schema:
{
  "title": "Short title",
  "statement": "Detailed story-based problem description + explicitly state the tables and columns.",
  "schema_sql": "CREATE TABLE ... INSERT INTO ... (Some sample data)",
  "test_cases": [
    {"expected_output_json": "[{...}]", "explanation": "..."}
  ],
  "hidden_test_cases": [
    {"expected_output_json": "[{...}]"}
  ],
  "optimal_solution_sql": "SELECT ..."
}"""
    else: # MCQ
        system_prompt = """You are an expert CSE Professor.
Generate a strictly JSON formatted MCQ question.
The JSON must strictly follow this schema:
{
  "title": "Question topic",
  "statement": "The question text",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "exactly matching one of the options",
  "explanation": "Why this is correct",
  "test_cases": [],
  "hidden_test_cases": []
}"""

    user_prompt = f"Generate a {difficulty} level {q_type} problem about {topic}."
    
    result = await llm.generate_json(system_prompt, user_prompt, {})
    return result
