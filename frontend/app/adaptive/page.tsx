"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchNextQuestion, submitAnswer } from '../lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, CheckCircle2, XCircle, ArrowRight, MessageSquare, Loader2, Trophy, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AuthNavbar } from '@/components/ui/AuthNavbar';

// API call for AI Hints (Socratic Method)
const fetchAIHint = async (questionContent: string, currentTopic: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/learning/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
            content: `I am stuck on this question: "${questionContent}". Please give me a very clear and direct hint in a pointwise (bulleted) format that helps me solve it (but do not give me the final answer).`,
            topic_context: currentTopic,
            session_type: 'hint'
        })
    });
    if (!res.ok) throw new Error('Failed to get hint');
    return res.json();
};

export default function AdaptivePracticePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        }>
            <AdaptivePracticeContent />
        </Suspense>
    );
}

function AdaptivePracticeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const topicIdParam = searchParams.get('topic_id');
    const topicNameParam = searchParams.get('topic_name') || 'Adaptive Practice';
    const topicId = topicIdParam ? parseInt(topicIdParam) : undefined;

    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [question, setQuestion] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answer, setAnswer] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback state
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    const [explanation, setExplanation] = useState<string | null>(null);

    // Agentic features state
    const [messages, setMessages] = useState<any[]>([]);
    const [isHintLoading, setIsHintLoading] = useState(false);

    // Timer state
    const [timeLeft, setTimeLeft] = useState(35);

    // Stats
    const [streak, setStreak] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [level, setLevel] = useState(1);

    // Strict block leveling state
    const [windowCorrect, setWindowCorrect] = useState(0);
    const [windowTotal, setWindowTotal] = useState(0);
    const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);

    const startTimeRef = useRef(Date.now());

    // We no longer randomly passively level up based on `correctCount`.
    // We will handle leveling explicitly during `handleAnswerSubmit` block windows.
    // So we can remove this useEffect for leveling!

    useEffect(() => {
        // Check token simply
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        setIsAuthenticated(true);
    }, [router]);

    const isSubmittingRef = useRef(isSubmitting);
    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    useEffect(() => {
        if (feedback !== null || loading || !question) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (isSubmittingRef.current) return prev;
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedback, loading, question]);

    const handleTimeUp = async () => {
        if (isSubmittingRef.current || !question) return;
        setIsSubmitting(true);
        try {
            const isCorrect = await submitAnswer({
                question_id: question.id,
                answer: "Time's up (Unanswered)",
                time_taken: 35
            });
            setFeedback('incorrect');
            setExplanation(question.explanation || `Time's up! The correct answer is ${question.correct_answer}.`);
            setStreak(0);
            setQuestionsAnswered(q => q + 1);
            setWindowTotal(w => w + 1);
            checkLevelUpLogic(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !question && !feedback && !loading) {
            loadNextQuestion();
        } else if (isAuthenticated && loading) {
            loadNextQuestion();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const checkLevelUpLogic = (isCorrect: boolean) => {
        if (isCorrect) {
            const newTotalCount = questionsAnswered + 1;
            if (newTotalCount > 0 && newTotalCount % 10 === 0) {
                setLevel(l => l + 1);
                setLevelUpMessage(`Level Up! You've answered ${newTotalCount} questions correctly. Increased difficulty unlocked!`);
            } else {
                setLevelUpMessage(null);
            }
        }
    };

    const loadNextQuestion = async () => {
        setLoading(true);
        setFeedback(null);
        setExplanation(null);
        setLevelUpMessage(null);
        setMessages([]);
        setAnswer("");
        setTimeLeft(35);
        try {
            const q = await fetchNextQuestion(topicId);
            setQuestion(q);
            startTimeRef.current = Date.now();
        } catch (error) {
            console.error(error);
            // Handle end of questions or error
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSubmit = async () => {
        if (!answer || !question || isSubmitting) return;

        setIsSubmitting(true);
        const timeTaken = (Date.now() - startTimeRef.current) / 1000;

        try {
            const isCorrect = await submitAnswer({
                question_id: question.id,
                answer: answer,
                time_taken: timeTaken
            });

            setFeedback(isCorrect ? 'correct' : 'incorrect');
            setExplanation(question.explanation || (isCorrect ? "Great job! That's correct." : `The correct answer is ${question.correct_answer}.`));

            if (isCorrect) {
                setStreak(s => s + 1);
                checkLevelUpLogic(true);
            } else {
                setStreak(0);
                setLevelUpMessage(null);
            }
            setQuestionsAnswered(q => q + 1);

        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const requestHint = async () => {
        if (!question || isHintLoading) return;
        setIsHintLoading(true);
        try {
            // Provide a generic topic if concept name is not directly available in question object
            const data = await fetchAIHint(question.content, "General Knowledge");
            const newMessage = { role: 'assistant', content: data.content };
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't generate a hint right now." }]);
        } finally {
            setIsHintLoading(false);
        }
    };

    if (loading && !question) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col font-sans">
                <AuthNavbar />
                <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 gap-6 max-w-7xl mx-auto w-full">
                    <Brain className="w-16 h-16 text-blue-500 animate-pulse mb-6" />
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                        AI Tutor is designing your next question...
                    </h2>
                    <p className="text-gray-400 mt-2">Loading next challenge...</p>
                </div>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-8">
                <h2 className="text-2xl font-bold mb-4">No more questions available right now!</h2>
                <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-gray-900 to-black text-white p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header Stats */}
                <div className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                            <Brain className="w-5 h-5 text-blue-400" />
                        </div>
                        <h1 className="text-xl font-bold">{topicNameParam}</h1>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm font-medium">
                        <div className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg flex items-center gap-2 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                            <Trophy className="w-4 h-4 text-purple-400" />
                            <span>Level {level}</span>
                        </div>
                        <div className="bg-white/10 px-4 py-2 rounded-lg">
                            <span className="text-gray-400 mr-2">Answered:</span>
                            <span className="text-white">{questionsAnswered}</span>
                        </div>
                        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 px-4 py-2 rounded-lg flex items-center gap-2 border border-orange-500/30">
                            <Sparkles className="w-4 h-4" />
                            <span>Streak: {streak}</span>
                        </div>
                    </div>
                </div>

                {/* Question Card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={question.id + (feedback || 'new')}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="w-full"
                    >
                        <Card className={`p-8 md:p-10 mb-6 backdrop-blur-2xl border relative overflow-hidden transition-colors ${feedback === 'correct' ? 'border-green-500/50 bg-green-500/10' :
                            feedback === 'incorrect' ? 'border-red-500/50 bg-red-500/10' :
                                'border-white/10 bg-white/5'
                            }`}>

                            {/* Difficulty Indicator */}
                            <div className="absolute top-0 left-0 w-full h-1 flex">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={`h-full flex-1 ${i < Math.round(question.difficulty) ? 'bg-blue-500' : 'bg-transparent'}`} />
                                ))}
                            </div>

                            <div className="mb-4 flex flex-wrap gap-4 justify-between items-start">
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                                    Concept ID: {question.concept_id}
                                </span>
                                <div className="flex gap-4">
                                    {!feedback && (
                                        <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${timeLeft <= 10 ? 'text-red-400 bg-red-400/10 animate-pulse' : 'text-orange-400 bg-orange-400/10'}`}>
                                            <Clock className="w-4 h-4" />
                                            {timeLeft}s
                                        </div>
                                    )}
                                    <span className="text-xs text-gray-400 flex items-center">Difficulty: {question.difficulty.toFixed(1)}/5</span>
                                </div>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold mb-8 leading-tight">
                                {question.content}
                            </h3>

                            {!feedback ? (
                                // Answer Input Area
                                <div className="space-y-6">
                                    {question.options && question.options.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {question.options.map((opt: string, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setAnswer(opt)}
                                                    className={`p-5 rounded-2xl border text-left transition-all ${answer === opt
                                                        ? 'border-blue-500 bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                                        : 'border-white/10 bg-white/5 hover:border-blue-400/50 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            placeholder="Type your answer here..."
                                            className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-lg"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleAnswerSubmit();
                                            }}
                                        />
                                    )}

                                    {/* Action Bar */}
                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
                                        <button
                                            onClick={requestHint}
                                            disabled={isHintLoading}
                                            className="flex items-center gap-2 text-yellow-500 hover:text-yellow-400 disabled:opacity-50 transition-colors text-sm font-medium px-4 py-2 rounded-lg hover:bg-yellow-500/10"
                                        >
                                            {isHintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                            {messages.length > 0 ? "Ask for another hint" : "Ask AI Tutor for a hint"}
                                        </button>

                                        <Button
                                            onClick={handleAnswerSubmit}
                                            disabled={!answer || isSubmitting}
                                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 disabled:bg-gray-600 shadow-lg shadow-blue-900/50"
                                        >
                                            {isSubmitting ? "Checking..." : "Submit Answer"}
                                        </Button>
                                    </div>

                                    {/* Agentic Hint Display & History */}
                                    <AnimatePresence>
                                        {messages.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-6 space-y-4"
                                            >
                                                {/* History Divider */}
                                                {messages.length > 1 && (
                                                    <div className="flex items-center gap-4 py-2">
                                                        <div className="h-px flex-1 bg-white/10" />
                                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Chat History</span>
                                                        <div className="h-px flex-1 bg-white/10" />
                                                    </div>
                                                )}

                                                {/* Previous Messages */}
                                                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                                                    {messages.map((msg, idx) => {
                                                        const isLast = idx === messages.length - 1;
                                                        return (
                                                            <motion.div
                                                                key={idx}
                                                                initial={isLast ? { x: 20, opacity: 0 } : {}}
                                                                animate={{ x: 0, opacity: 1 }}
                                                                className={`p-4 rounded-xl border transition-all duration-500 ${isLast
                                                                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200 shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                                                                    : 'bg-white/5 border-white/10 text-gray-400'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 p-1 rounded-md ${isLast ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/10 text-gray-500'}`}>
                                                                        <Brain className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="prose prose-sm prose-invert max-w-none flex-1">
                                                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                                    </div>
                                                                </div>
                                                                {isLast && (
                                                                    <div className="mt-2 flex items-center gap-2">
                                                                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                                                        <span className="text-[10px] font-bold text-yellow-500/70 uppercase">Latest Guidance</span>
                                                                    </div>
                                                                )}
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            ) : (
                                // Feedback Area
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="pt-6 border-t border-white/10"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        {feedback === 'correct' ? (
                                            <div className="bg-green-500/20 p-3 rounded-full border border-green-500/50 text-green-400">
                                                <CheckCircle2 className="w-8 h-8" />
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50 text-red-400">
                                                <XCircle className="w-8 h-8" />
                                            </div>
                                        )}
                                        <div>
                                            <h4 className={`text-xl font-bold ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                                                {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
                                            </h4>
                                            {/* Agentic Explanation */}
                                            <div className="mt-3 text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="flex items-center gap-2 mb-2 text-sm text-blue-400 font-semibold">
                                                    <Sparkles className="w-4 h-4" /> AI Tutor Insight
                                                </div>
                                                <p>{explanation}</p>
                                            </div>

                                            {/* Adaptive Motivational Feedback based on RL State conceptually */}
                                            {streak > 2 && feedback === 'correct' && !levelUpMessage && (
                                                <p className="mt-4 text-orange-400 font-medium text-sm animate-pulse">
                                                    🔥 You're on fire! The model is adapting to challenge you further.
                                                </p>
                                            )}

                                            {levelUpMessage && (
                                                <div className={`mt-4 p-4 rounded-xl border font-bold text-center ${levelUpMessage.includes("Level Up") ? "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-lg shadow-purple-500/20 animate-pulse" : "bg-gray-800 text-gray-300 border-gray-700"}`}>
                                                    {levelUpMessage}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-8">
                                        {feedback === 'incorrect' ? (
                                            <Button
                                                onClick={() => {
                                                    setFeedback(null);
                                                    setExplanation(null);
                                                    setAnswer("");
                                                }}
                                                className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] rounded-xl flex items-center gap-2 text-lg font-bold"
                                            >
                                                Try Again <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={loadNextQuestion}
                                                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] rounded-xl flex items-center gap-2 text-lg font-bold"
                                            >
                                                Next Question <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
