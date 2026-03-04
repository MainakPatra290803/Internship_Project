import numpy as np
from ml_engine.rl_agent import RLAgent
agent = RLAgent(5)
agent.load_model()
state = np.array([0.5, 0.4, 0.9])
padding = np.zeros(5 - len(state))
state = np.concatenate((state, padding))
state = np.append(state, [1.0])
print(state.shape)
print(agent.select_action(state))