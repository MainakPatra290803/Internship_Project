import gymnasium as gym
import numpy as np
from gymnasium import spaces
from .simulator import StudentSimulator

class TutorEnv(gym.Env):
    """
    Custom Gym environment for the AI Tutor.
    State: [Mastery_C1, Mastery_C2, ... , Last_Correct, Fatigue]
    Action: [Concept_ID, Difficulty]
    """
    def __init__(self, simulator: StudentSimulator):
        super(TutorEnv, self).__init__()
        self.sim = simulator
        self.num_concepts = simulator.num_concepts
        
        # Action space: Tuple(Concept (Discrete), Difficulty (Box))
        # Flattened for simple algorithms: N concepts * 5 difficulty levels?
        # Let's keep it simple: Concept ID selection only for now, auto-difficulty
        self.action_space = spaces.Discrete(self.num_concepts)
        
        # Observation space: Mastery Vector (0-1) + Last Response (0/1)
        self.observation_space = spaces.Box(
            low=0, high=1, shape=(self.num_concepts + 1,), dtype=np.float32
        )
        
        self.current_step = 0
        self.max_steps = 50
        self.last_clean_mastery = None

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        self.last_clean_mastery = self.sim.reset()
        obs = np.concatenate([self.last_clean_mastery, [0.0]]) # Append dummy last result
        return obs.astype(np.float32), {}

    def step(self, action):
        # Translate action to concept/difficulty
        concept_id = int(action)
        # Heuristic difficulty: target current mastery + 0.1 (Zone of Proximal Development)
        current_m = self.last_clean_mastery[concept_id]
        difficulty = np.clip(current_m + 0.1, 0.1, 1.0)
        
        # Execute sim step
        result = self.sim.step({"concept_id": concept_id, "difficulty": difficulty})
        
        # Reward Calculation
        # R = Correctness + Delta_Mastery
        new_mastery = self.sim.mastery_state
        delta = np.sum(new_mastery) - np.sum(self.last_clean_mastery)
        
        reward = (1.0 if result["is_correct"] else -0.1) + (delta * 10.0)
        
        self.last_clean_mastery = new_mastery.copy()
        
        # Next State
        obs = np.concatenate([new_mastery, [1.0 if result["is_correct"] else 0.0]])
        
        self.current_step += 1
        terminated = self.current_step >= self.max_steps
        truncated = False
        
        return obs.astype(np.float32), reward, terminated, truncated, {}
