import numpy as np

class BKTModel:
    def __init__(self, p_init=0.5, p_transit=0.1, p_guess=0.2, p_slip=0.1):
        """
        Initializes BKT parameters.
        p_init: P(L0) - Initial probability of knowing the concept
        p_transit: P(T) - Probability of learning the concept after an opportunity
        p_guess: P(G) - Probability of guessing correctly without knowing
        p_slip: P(S) - Probability of answering incorrectly despite knowing
        """
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update_mastery(self, p_known: float, is_correct: bool) -> float:
        """
        Updates the probability of mastery given an observation.
        Using the standard BKT update rules.
        """
        # 1. Evidence Update (Posterior of knowing L given Evidence E)
        if is_correct:
            # P(L|Correct) = P(Correct|L) * P(L) / P(Correct)
            # P(Correct|L) = 1 - P(S)
            # P(Correct|~L) = P(G)
            p_evidence = (p_known * (1 - self.p_slip)) / (
                p_known * (1 - self.p_slip) + (1 - p_known) * self.p_guess
            )
        else:
            # P(L|Incorrect) = P(Incorrect|L) * P(L) / P(Incorrect)
            # P(Incorrect|L) = P(S)
            # P(Incorrect|~L) = 1 - P(G)
            p_evidence = (p_known * self.p_slip) / (
                p_known * self.p_slip + (1 - p_known) * (1 - self.p_guess)
            )

        # 2. Transition Update (Project to next timestep)
        # P(L_t+1) = P(L_t|E) + (1 - P(L_t|E)) * P(T)
        p_new = p_evidence + (1 - p_evidence) * self.p_transit
        
        return p_new

    def predict_correctness(self, p_known: float) -> float:
        """
        Predicts probability of correct answer given mastery.
        """
        return p_known * (1 - self.p_slip) + (1 - p_known) * self.p_guess
