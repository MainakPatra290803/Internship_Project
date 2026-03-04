from stable_baselines3 import PPO
from .tutor_env import TutorEnv
from .simulator import StudentSimulator
import os

def train_rl_agent():
    sim = StudentSimulator(num_concepts=5)
    env = TutorEnv(sim)
    
    # Check enviroment
    # from stable_baselines3.common.env_checker import check_env
    # check_env(env)
    
    model = PPO("MlpPolicy", env, verbose=1)
    
    print("Training RL Agent...")
    model.learn(total_timesteps=1000) # Short train for demo
    
    path = os.path.join(os.path.dirname(__file__), "ppo_tutor_agent")
    model.save(path)
    print(f"Model saved to {path}")
    return model

def load_agent(path):
    return PPO.load(path)
