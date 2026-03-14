export interface Question {
    id: number;
    concept_id: number;
    content: string;
    difficulty: number;
    options: string[];
    correct_answer?: string; // Hidden usually, but for dev transparency
    explanation?: string;
}

export interface QuestionResponse {
    question_id: number;
    answer: string;
    time_taken: number;
}

export interface MasteryUpdate {
    concept_id: number;
    new_mastery: number;
}

export interface CustomQuizQuestion {
    content: string;
    type: 'MCQ' | 'FIB';
    options?: string[];
    correct_answer: string;
    explanation?: string;
    user_answer?: string;
    is_correct?: boolean;
}
