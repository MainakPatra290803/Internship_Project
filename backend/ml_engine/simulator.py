import random
import numpy as np

class StudentSimulator:
    def __init__(self, num_concepts=5, initial_mastery_mean=0.3):
        self.num_concepts = num_concepts
        # True latent mastery state (0.0 to 1.0)
        self.mastery_state = np.random.normal(initial_mastery_mean, 0.1, num_concepts)
        self.mastery_state = np.clip(self.mastery_state, 0.0, 1.0)
        
        # Learning characteristics
        self.learning_rate = np.random.uniform(0.05, 0.2, num_concepts)
        self.forgetting_rate = 0.01
        
    def step(self, action):
        """
        Simulates one interaction step.
        Action: dict with 'concept_id', 'difficulty'
        Returns: observation (is_correct), reward
        """
        concept_id = action['concept_id']
        difficulty = action['difficulty']
        
        if concept_id >= self.num_concepts:
            raise ValueError("Invalid concept_id")

        # 1. Determine Correctness (IRT-like: P(Correct) = sigmoid(Mastery - Difficulty))
        # We assume Difficulty is 0-1 normalized for now, or match mastery scale
        # Simple Logistic: 1 / (1 + exp(-k * (theta - b)))
        theta = self.mastery_state[concept_id]
        prob_correct = 1.0 / (1.0 + np.exp(-10 * (theta - difficulty * 0.2))) # Scaling factor
        
        is_correct = random.random() < prob_correct
        
        # 2. Update Internal State (Learning)
        if is_correct:
            # Slower gain if already mastered
            gain = self.learning_rate[concept_id] * (1 - self.mastery_state[concept_id])
            self.mastery_state[concept_id] += gain
        else:
            # Small gain even on failure (learning from mistakes)
            self.mastery_state[concept_id] += self.learning_rate[concept_id] * 0.2

        # 3. Forgetting (global)
        self.mastery_state -= self.forgetting_rate
        self.mastery_state = np.clip(self.mastery_state, 0.0, 1.0)
        
        return {
            "is_correct": is_correct,
            "response_time": int(np.random.exponential(30 if is_correct else 60)), # Faster if correct
            "true_mastery": self.mastery_state[concept_id] # debugging/oracle
        }

    def reset(self):
         self.mastery_state = np.random.uniform(0.0, 0.5, self.num_concepts)
         return self.mastery_state
