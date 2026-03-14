from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, JSON, Text, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import get_base

Base = get_base()

# --- Users & Auth ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="student") # student, instructor, admin
    hashed_password = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student_profile = relationship("Student", back_populates="user", uselist=False)

class OTP(Base):
    __tablename__ = "otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp_code = Column(String)
    expires_at = Column(DateTime)

# --- Student Profile ---
class Student(Base):
    __tablename__ = "students"
    student_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    cohort_id = Column(String, nullable=True)
    current_streak = Column(Integer, default=0)
    last_activity_date = Column(DateTime, nullable=True)
    metadata_json = Column(JSON, default={})
    
    user = relationship("User", back_populates="student_profile")
    interactions = relationship("Interaction", back_populates="student")
    mastery_records = relationship("DomainMastery", back_populates="student")
    chat_sessions = relationship("ChatSession", back_populates="student")

# --- Learning Content ---
class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String)
    order_index = Column(Integer)
    prerequisites = Column(JSON, default=[]) # List of topic_ids
    
    concepts = relationship("Concept", back_populates="topic")
    quizzes = relationship("Quiz", back_populates="topic")

class Concept(Base):
    __tablename__ = "concepts"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    name = Column(String, index=True)
    content_text = Column(Text) # Main explanation
    
    topic = relationship("Topic", back_populates="concepts")
    content_items = relationship("ContentItem", back_populates="concept")

class ContentItem(Base):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"))
    type = Column(String) # explain, example, quiz_question_mcq, quiz_question_short
    difficulty = Column(Float) # 1.0 to 5.0
    content = Column(Text)
    correct_answer = Column(Text, nullable=True)
    options = Column(JSON, nullable=True) # For MCQs
    explanation = Column(Text, nullable=True)
    
    concept = relationship("Concept", back_populates="content_items")
    interactions = relationship("Interaction", back_populates="content_item")

# --- Quiz System ---
class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    topic_id = Column(Integer, ForeignKey("topics.id"))
    difficulty = Column(String) # Easy, Medium, Hard
    created_at = Column(DateTime, default=datetime.utcnow)
    
    topic = relationship("Topic", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(Text)
    question_type = Column(String) # MCQ, OPEN
    options = Column(JSON, nullable=True)
    correct_answer = Column(Text)
    explanation = Column(Text)
    
    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float)
    feedback_json = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    quiz = relationship("Quiz", back_populates="attempts")

# --- Chat & Tutor ---
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    topic_context = Column(String, nullable=True)
    session_type = Column(String, default="chat")  # 'chat' or 'hint'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String) # user, assistant, system
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

# --- Interactions & Mastery ---
class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"), nullable=True)
    type = Column(String) # view, quiz, chat
    is_correct = Column(Boolean, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="interactions")
    content_item = relationship("ContentItem", back_populates="interactions")

class SpacedRepetitionState(Base):
    __tablename__ = "spaced_repetition_states"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"))
    easiness_factor = Column(Float, default=2.5)
    interval = Column(Integer, default=0)
    repetition = Column(Integer, default=0)
    next_review_date = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student")
    content_item = relationship("ContentItem")

class DomainMastery(Base):
    __tablename__ = "domain_mastery"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    topic_id = Column(Integer, ForeignKey("topics.id"))
    mastery_level = Column(Float, default=0.0) # 0 to 100
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student", back_populates="mastery_records")

# --- Assessment & AI Proctoring ---
class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    admin_id = Column(Integer, ForeignKey("users.id"))
    config = Column(JSON, default={}) # e.g., {"mcq": 30, "coding": {"easy":1, "hard":1}, "sql": 2}
    created_at = Column(DateTime, default=datetime.utcnow)

    admin = relationship("User")
    questions = relationship("AssessmentQuestion", back_populates="assessment")
    sessions = relationship("ProctorSession", back_populates="assessment")

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    type = Column(String) # MCQ, CODING, SQL
    topic = Column(String)
    difficulty = Column(String)
    statement = Column(Text)
    gemini_fingerprint = Column(String, unique=True, nullable=True)
    metadata_json = Column(JSON, default={}) # Constraints, I/O formats, options

    assessment = relationship("Assessment", back_populates="questions")
    hidden_test_cases = relationship("HiddenTestCase", back_populates="question")
    submissions = relationship("AssessmentSubmission", back_populates="question")

class HiddenTestCase(Base):
    __tablename__ = "hidden_test_cases"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("assessment_questions.id"))
    input_data = Column(Text)
    expected_output = Column(Text)
    is_hidden = Column(Boolean, default=True)

    question = relationship("AssessmentQuestion", back_populates="hidden_test_cases")

class AssessmentSubmission(Base):
    __tablename__ = "assessment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question_id = Column(Integer, ForeignKey("assessment_questions.id"))
    submitted_code = Column(Text)
    language = Column(String)
    score = Column(Float, default=0.0)
    execution_time_ms = Column(Integer, nullable=True)
    memory_used_kb = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    question = relationship("AssessmentQuestion", back_populates="submissions")

class ProctorSession(Base):
    __tablename__ = "proctor_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    risk_score = Column(Float, default=0.0)
    violation_logs = Column(JSON, default=[]) # e.g., [{"time": "...", "event": "tab_switch"}]
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)

    user = relationship("User")
    assessment = relationship("Assessment", back_populates="sessions")

# --- Planner ---
class StudyPlan(Base):
    __tablename__ = "study_plans"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True) # Linking to actual DB Subject
    target_topic = Column(String)
    focus_areas = Column(JSON, default=[]) # e.g. ["Arrays", "Pointers"]
    duration_days = Column(Integer)
    status = Column(String, default="active") # active, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student")
    topic = relationship("Topic")
    tasks = relationship("StudyTask", back_populates="plan", cascade="all, delete")

class StudyTask(Base):
    __tablename__ = "study_tasks"
    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id"))
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=True) # Linking to actual DB Concept
    title = Column(String)
    description = Column(Text)
    task_type = Column(String) # theory, practice, quiz
    day_number = Column(Integer)
    estimated_minutes = Column(Integer)
    is_completed = Column(Boolean, default=False)
    
    plan = relationship("StudyPlan", back_populates="tasks")
    concept = relationship("Concept")

