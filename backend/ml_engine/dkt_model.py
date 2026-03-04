import torch
import torch.nn as nn

class DKT(nn.Module):
    def __init__(self, num_concepts, embed_dim=64, hidden_dim=64, num_layers=1):
        super(DKT, self).__init__()
        self.num_concepts = num_concepts
        self.hidden_dim = hidden_dim
        
        # Input is concept_id + correctness (2 * num_concepts) 
        # offset concept_id by num_concepts if correct
        self.embedding = nn.Embedding(2 * num_concepts, embed_dim)
        
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers, batch_first=True)
        
        # Output layer predicts probability for EACH concept (multitask) 
        # or just the next one. Standard DKT predicts all.
        self.out = nn.Linear(hidden_dim, num_concepts)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, input_seq):
        # input_seq: [batch, seq_len] of indices
        embeds = self.embedding(input_seq)
        lstm_out, _ = self.lstm(embeds)
        logits = self.out(lstm_out)
        return self.sigmoid(logits)

class DKTService:
    def __init__(self, num_concepts=100, model_path=None):
        self.num_concepts = num_concepts
        self.model = DKT(num_concepts)
        self.model.eval()
        if model_path:
            # self.model.load_state_dict(torch.load(model_path))
            pass

    def predict_next_mastery(self, concept_history, correct_history):
        """
        concept_history: list of concept ids
        correct_history: list of booleans
        """
        if not concept_history:
            return torch.zeros(self.num_concepts)
            
        # Prepare sequence
        seq = []
        for c, r in zip(concept_history, correct_history):
            # x_t = c_t + (N if r_t else 0)
            idx = c + (self.num_concepts if r else 0)
            seq.append(idx)
            
        input_tensor = torch.tensor([seq], dtype=torch.long)
        
        with torch.no_grad():
            preds = self.model(input_tensor)
            
        # Return probability vector for the NEXT timestep (last output)
        return preds[0, -1, :] # [num_concepts]
