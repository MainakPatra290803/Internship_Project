import numpy as np
import os

# stable_baselines3 is optional — server runs fine without it using the heuristic fallback
try:
    from stable_baselines3 import PPO
    _SB3_AVAILABLE = True
except ImportError:
    _SB3_AVAILABLE = False
    print("RL Agent: stable_baselines3 not installed. Using heuristic fallback.")

class RLAgent:
    def __init__(self, action_space_size: int):
        self.action_space_size = action_space_size
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "ppo_tutor_agent.zip")

    def load_model(self):
        """Loads the trained PPO model if it exists."""
        if not _SB3_AVAILABLE:
            print("RL Agent: stable_baselines3 not available, skipping model load.")
            return
        if os.path.exists(self.model_path):
            self.model = PPO.load(self.model_path)
            print(f"RL Agent: Model loaded from {self.model_path}")
        else:
            print("RL Agent: No trained model found, using heuristic/random.")

    def select_action(self, state_vector: np.ndarray) -> int:
        """
        Selects the next best concept based on student mastery state.
        
        Args:
            state_vector: Array containing [Mastery_C1, ..., Mastery_Cn, Last_Correct]
        
        Returns:
            Action index (Concept ID).
        """
        if self.model:
            # Predict returns (action, _states)
            action, _ = self.model.predict(state_vector, deterministic=True)
            return int(action)
        
        # Fallback Heuristic: Pick concept with lowest mastery
        # The state_vector contains mastery (0 to n-1) and last_correct (n)
        mastery_only = state_vector[:-1]
        return int(np.argmin(mastery_only))
