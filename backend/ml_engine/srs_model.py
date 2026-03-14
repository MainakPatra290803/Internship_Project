from datetime import datetime, timedelta

def calculate_sm2(quality: int, interval: int, repetition: int, easiness: float) -> tuple[int, int, float, datetime]:
    """
    SuperMemo-2 (SM-2) algorithm.
    
    Args:
        quality: User-assessed difficulty (0-5)
                 0: Complete blackout
                 1: Incorrect, but remembered correct one
                 2: Incorrect, seemed easy
                 3: Correct, but with serious difficulty
                 4: Correct, after hesitation
                 5: Perfect response
        interval: Previous interval in days
        repetition: Number of times successfully recalled consecutively
        easiness: Easiness factor
        
    Returns:
        tuple of (new_interval, new_repetition, new_easiness, next_review_date)
    """
    # Restrict quality to 0-5
    quality = max(0, min(5, quality))
    
    if quality >= 3:
        if repetition == 0:
            new_interval = 1
        elif repetition == 1:
            new_interval = 6
        else:
            new_interval = round(interval * easiness)
        new_repetition = repetition + 1
    else:
        new_repetition = 0
        new_interval = 1
        
    # Calculate new easiness factor
    easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_easiness = max(1.3, easiness) # Easiness factor must not go below 1.3
    
    next_review_date = datetime.utcnow() + timedelta(days=new_interval)
    
    return new_interval, new_repetition, new_easiness, next_review_date
