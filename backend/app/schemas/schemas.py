from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth ---
class OTPRequest(BaseModel):
    email: str

class SignupRequest(BaseModel):
    email: str
    otp: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str


class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

class CustomQuizRequest(BaseModel):
    subject: str
    topic: str

class CustomQuizQuestion(BaseModel):
    id: Optional[int] = None
    content: str
    type: str  # MCQ or FIB
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None

class CustomQuizResponse(BaseModel):
    questions: List[CustomQuizQuestion]

class QuizResultEntry(BaseModel):
    question: str
    user_answer: str
    correct_answer: str
    is_correct: bool

class CustomQuizReportRequest(BaseModel):
    results: List[QuizResultEntry]
    subject: str
    topic: str

class Token(BaseModel):
    access_token: str
    token_type: str

# --- Content ---
class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int

class Topic(TopicBase):
    id: int
    class Config:
        from_attributes = True

class Question(BaseModel):
    id: int
    concept_id: int
    content: str
    difficulty: float
    options: Optional[List[Any]] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    
    class Config:
        from_attributes = True

class QuestionResponse(BaseModel):
    question_id: int
    answer: str
    time_taken: float

class SRSReviewSubmit(BaseModel):
    content_item_id: int
    quality: int # 0-5

# --- Chat ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatSessionStart(BaseModel):
    topic_context: Optional[str] = None

class ChatRequest(BaseModel):
    content: str
    session_id: Optional[int] = None
    topic_context: Optional[str] = None
    session_type: Optional[str] = "chat"  # 'chat' or 'hint'

class ChatResponse(BaseModel):
    role: str
    content: str
    session_id: int

class ChatSessionResponse(BaseModel):
    id: int
    topic_context: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessage]


# --- Assessment & AI Proctoring ---
class AssessmentCreate(BaseModel):
    title: str
    config: Dict[str, Any]

class AssessmentResponse(AssessmentCreate):
    id: int
    admin_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssessmentQuestionCreate(BaseModel):
    type: str # MCQ, CODING, SQL
    topic: str
    difficulty: str
    statement: str
    metadata_json: Optional[Dict[str, Any]] = None

class AssessmentQuestionResponse(AssessmentQuestionCreate):
    id: int
    assessment_id: int
    
    class Config:
        from_attributes = True

class AssessmentSubmissionCreate(BaseModel):
    question_id: int
    submitted_code: str
    language: str

class AssessmentSubmissionResponse(AssessmentSubmissionCreate):
    id: int
    user_id: int
    score: float
    execution_time_ms: Optional[int] = None
    memory_used_kb: Optional[int] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

class ProctorSessionStart(BaseModel):
    assessment_id: int

class ProctorSessionTelemetry(BaseModel):
    session_id: int
    event: str
    timestamp: str

# --- Planner ---
class StudyTaskBase(BaseModel):
    title: str
    description: str
    task_type: str
    day_number: int
    estimated_minutes: int
    is_completed: bool = False

class StudyTaskCreate(StudyTaskBase):
    concept_id: Optional[int] = None

class StudyTask(StudyTaskBase):
    id: int
    plan_id: int
    concept_id: Optional[int] = None

    class Config:
        from_attributes = True

class StudyPlanBase(BaseModel):
    topic_id: int
    duration_days: int

class StudyPlanCreate(StudyPlanBase):
    pass

class StudyPlan(StudyPlanBase):
    id: int
    student_id: int
    target_topic: str
    focus_areas: List[str] = []
    status: str
    created_at: datetime
    tasks: List[StudyTask] = []
    
    class Config:
        from_attributes = True
