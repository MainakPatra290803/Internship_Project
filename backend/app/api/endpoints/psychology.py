from fastapi import APIRouter, Depends
from pydantic import BaseModel
import random

router = APIRouter()

class PsychInput(BaseModel):
    mood_score: int # 1-10
    stress_level: int # 1-10
    sleep_quality: int # 1-10
    focus_level: int # 1-10

class PsychAnalysis(BaseModel):
    state: str
    recommendation: str
    cognitive_load: float # 0.0 - 1.0
    neuro_plasticity_score: float # 0.0 - 1.0
    
@router.post("/analyze", response_model=PsychAnalysis)
def analyze_mental_state(data: PsychInput):
    # Simulated Deep Learning Logic
    # In a real app, this would feed into a NN or LLM
    
    score = (data.mood_score + data.sleep_quality + data.focus_level) - data.stress_level
    
    cognitive_load = data.stress_level / 10.0
    neuro_score = (data.focus_level + data.sleep_quality) / 20.0
    
    if score > 20:
        state = "Flow State"
        rec = "You are in a prime state for complex problem solving. Challenge yourself with advanced concepts."
    elif score > 10:
        state = "Balanced"
        rec = "Your mental state is stable. Good time for routine practice and reinforcement."
    else:
        state = "High Cognitive Load"
        rec = "Detected signs of fatigue. Recommendation: Take a 15-minute break or try breathing exercises."
        
    return PsychAnalysis(
        state=state,
        recommendation=rec,
        cognitive_load=cognitive_load,
        neuro_plasticity_score=neuro_score
    )
