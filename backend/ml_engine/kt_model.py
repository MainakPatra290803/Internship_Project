from typing import List, Dict, Any
import numpy as np
from .bkt_model import BKTModel

class KnowledgeTracingEngine:
    def __init__(self):
        self.bkt = BKTModel()

    def predict_mastery(self, user_history: List[Any], all_concept_ids: List[int]) -> Dict[int, float]:
        """
        Predicts mastery for concepts based on user history.
        
        Args:
            user_history: List of interaction objects/dicts (must have concept_id and is_correct)
            all_concept_ids: List of all concept IDs to initialize mastery for.
            
        Returns:
            Dict mapping concept_id to mastery probability (0.0 to 1.0)
        """
        mastery = {cid: 0.5 for cid in all_concept_ids} # Default P(L0)
        
        # Sort history by timestamp if possible, or assume it's ordered
        for interaction in user_history:
            # Handle both object (ORM) and dict formats
            if hasattr(interaction, 'content_item'):
                 cid = interaction.content_item.concept_id
                 is_correct = interaction.is_correct
            elif isinstance(interaction, dict):
                 cid = interaction.get('concept_id')
                 is_correct = interaction.get('is_correct')
            else:
                continue
                
            if cid in mastery:
                mastery[cid] = self.bkt.update_mastery(mastery[cid], is_correct)
            
        return mastery

    def get_state_vector(self, mastery_dict: Dict[int, float], all_concept_ids: List[int]) -> np.ndarray:
        """
        Converts mastery dict to a fixed-length numpy array for RL agent.
        """
        return np.array([mastery_dict.get(cid, 0.5) for cid in all_concept_ids], dtype=np.float32)
