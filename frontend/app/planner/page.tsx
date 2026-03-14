"use client";

import { useState, useEffect } from 'react';
import { AuthNavbar } from '@/components/ui/AuthNavbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Brain, Calendar, CheckCircle2, Circle, Clock, Loader2, Sparkles, Target, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';

export default function PlannerPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [activePlan, setActivePlan] = useState<any | null>(null);
    const [loadingPlans, setLoadingPlans] = useState(true);

    const [isGenerating, setIsGenerating] = useState(false);
    const [availableTopics, setAvailableTopics] = useState<any[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [durationDays, setDurationDays] = useState(7);
    const [generateError, setGenerateError] = useState("");

    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
    const [taskContent, setTaskContent] = useState<any | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        fetchPlans();
        fetchTopics();
    }, [router]);

    const fetchTopics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/planner/topics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAvailableTopics(data);
                if (data.length > 0) setSelectedTopicId(data[0].id.toString());
            }
        } catch (e) {
            console.error("Failed to fetch topics", e);
        }
    };

    const fetchPlans = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/planner/my-plans', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPlans(data);
                // Auto Select the first active plan
                const active = data.find((p: any) => p.status === 'active');
                if (active) {
                    setActivePlan(active);
                } else if (data.length > 0) {
                    setActivePlan(data[0]); // fallback to most recent completed
                }
            }
        } catch (e) {
            console.error("Failed to fetch plans", e);
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTopicId) return;

        setIsGenerating(true);
        setGenerateError("");
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/planner/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    topic_id: parseInt(selectedTopicId),
                    duration_days: durationDays
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Failed to generate plan");
            }

            const newPlan = await res.json();
            setPlans([newPlan, ...plans]);
            setActivePlan(newPlan);
        } catch (e: any) {
            setGenerateError(e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleTask = async (taskId: number) => {
        if (!activePlan) return;

        // Optimistic update
        const updatedPlan = { ...activePlan };
        const taskIdx = updatedPlan.tasks.findIndex((t: any) => t.id === taskId);
        if (taskIdx > -1) {
            updatedPlan.tasks[taskIdx].is_completed = !updatedPlan.tasks[taskIdx].is_completed;
            setActivePlan(updatedPlan);
        }

        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/v1/planner/task/${taskId}/complete`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Re-fetch to ensure system state (like plan status) is synced
            fetchPlans();
        } catch (e) {
            console.error("Failed to toggle task", e);
        }
    };

    const fetchTaskContent = async (taskId: number) => {
        if (expandedTaskId === taskId) {
            setExpandedTaskId(null); // toggle off
            return;
        }

        setExpandedTaskId(taskId);
        setLoadingContent(true);
        setTaskContent(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/planner/task/${taskId}/content`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTaskContent(data);
            }
        } catch (e) {
            console.error("Failed to fetch task content", e);
        } finally {
            setLoadingContent(false);
        }
    };

    // Calculation for progress
    const completedTasks = activePlan?.tasks.filter((t: any) => t.is_completed).length || 0;
    const totalTasks = activePlan?.tasks.length || 0;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Group tasks by day
    const tasksByDay = activePlan?.tasks.reduce((acc: any, task: any) => {
        const day = task.day_number;
        if (!acc[day]) acc[day] = [];
        acc[day].push(task);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black text-white font-sans">
            <AuthNavbar />

            <div className="max-w-7xl mx-auto px-4 py-8 relative">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 border-b border-white/10 pb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 mb-4 flex items-center gap-3">
                            <Brain className="w-10 h-10 text-blue-500" />
                            AI Study Planner
                        </h1>
                        <p className="text-gray-400 max-w-2xl text-lg mt-2">
                            An algorithmic scheduling engine that distributes curriculum based on your historical mastery and Spaced Repetition principles.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <span className="px-3 py-1 bg-purple-900/40 text-purple-300 text-xs rounded-full border border-purple-500/30 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Deterministic DB Resolver
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Form & Plan List */}
                    <div className="space-y-6">
                        <Card className="p-6 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Generate Context-Aware Plan
                            </h2>
                            <form onSubmit={handleGenerate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Target Curriculum</label>
                                    <select
                                        value={selectedTopicId}
                                        onChange={e => setSelectedTopicId(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    >
                                        {availableTopics.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Duration (Days)</label>
                                    <input
                                        type="number"
                                        min="1" max="30"
                                        value={durationDays}
                                        onChange={e => setDurationDays(parseInt(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                                {generateError && <p className="text-red-400 text-sm">{generateError}</p>}
                                <Button
                                    type="submit"
                                    disabled={isGenerating}
                                    className="w-full justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all"
                                >
                                    {isGenerating ? (
                                        <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Analyzing Profile & Generating...</>
                                    ) : "Generate Smart Curriculum"}
                                </Button>
                            </form>
                        </Card>

                        <div className="mt-8">
                            <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-4">Your Plans</h3>
                            {loadingPlans ? (
                                <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-gray-500" /></div>
                            ) : plans.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No plans created yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {plans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setActivePlan(plan)}
                                            className={`w-full text-left p-4 rounded-xl border transition-all ${activePlan?.id === plan.id ? 'bg-blue-900/20 border-blue-500/50 shadow-sm' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                                        >
                                            <div className="font-bold flex items-center justify-between">
                                                <span className="truncate">{plan.target_topic}</span>
                                                {plan.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" /> {plan.duration_days} Days
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Timeline & Tasks */}
                    <div className="lg:col-span-2">
                        {isGenerating ? (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md">
                                <Brain className="w-16 h-16 text-blue-500 animate-pulse mb-6" />
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                    Building your personalized curriculum...
                                </h3>
                                <p className="text-gray-400 mt-2 text-center max-w-sm">
                                    Agent is analyzing your past mistakes and constructing a JSON schedule targeting your weak spots.
                                </p>
                            </div>
                        ) : activePlan ? (
                            <div className="space-y-6">
                                {/* Analytics Header */}
                                <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-white/10 rounded-2xl backdrop-blur-md">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2">{activePlan.target_topic}</h2>
                                            {activePlan.focus_areas && activePlan.focus_areas.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    <span className="text-xs text-gray-400 flex items-center mt-0.5 mr-1">Targeting Weak Spots:</span>
                                                    {activePlan.focus_areas.map((fa: string, i: number) => (
                                                        <span key={i} className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-md flex items-center gap-1">
                                                            <Target className="w-3 h-3" /> {fa}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 bg-black/40 p-4 rounded-xl border border-white/10">
                                            <div className="text-center">
                                                <div className="text-3xl font-bold text-blue-400">{progressPercent}%</div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Completion</div>
                                            </div>
                                            <div className="h-10 w-px bg-white/10 mx-2" />
                                            <div className="text-center">
                                                <div className="text-3xl font-bold">{completedTasks}<span className="text-lg text-gray-500">/{totalTasks}</span></div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Tasks Done</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-6 h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                </Card>

                                {/* Timeline */}
                                <div className="space-y-8 pl-2">
                                    {Object.keys(tasksByDay).sort((a, b) => parseInt(a) - parseInt(b)).map(day => (
                                        <div key={day} className="relative">
                                            {/* Timeline Line */}
                                            <div className="absolute left-[15px] top-8 bottom-[-32px] w-0.5 bg-white/10 z-0 last:hidden" />

                                            <h3 className="text-lg font-bold flex items-center gap-3 mb-4 sticky top-16 bg-black z-10 py-2">
                                                <div className="bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-[0_0_10px_rgba(37,99,235,0.5)] z-10">
                                                    D{day}
                                                </div>
                                                <span className="text-gray-300">Phase {day}</span>
                                            </h3>

                                            <div className="space-y-3 pl-12 relative z-10">
                                                {tasksByDay[day].map((task: any) => (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => toggleTask(task.id)}
                                                        className={`p-4 rounded-xl border cursor-pointer transition-all ${task.is_completed
                                                            ? 'bg-green-900/10 border-green-500/30 opacity-75 hover:opacity-100'
                                                            : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                                            }`}
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="mt-1">
                                                                {task.is_completed ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : (
                                                                    <Circle className="w-5 h-5 text-gray-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1" onClick={() => fetchTaskContent(task.id)}>
                                                                <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                                                    <h4 className={`font-bold text-lg ${task.is_completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                                                        {task.title}
                                                                    </h4>
                                                                    <div className="flex gap-2 items-center">
                                                                        {task.task_type === 'theory' && <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1"><BookOpen className="w-3 h-3 inline pb-0.5" /> Theory</span>}
                                                                        {task.task_type === 'practice' && <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1"><Brain className="w-3 h-3 inline pb-0.5" /> Practice</span>}
                                                                        {task.task_type === 'quiz' && <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-1 rounded-sm uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3 inline pb-0.5" /> Quiz</span>}
                                                                        <span className="text-[10px] text-gray-400 border border-white/10 px-2 py-1 rounded-sm flex items-center gap-1">
                                                                            <Clock className="w-3 h-3" /> {task.estimated_minutes}m
                                                                        </span>
                                                                        {expandedTaskId === task.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                                    </div>
                                                                </div>
                                                                <p className={`text-sm leading-relaxed ${task.is_completed ? 'text-gray-500' : 'text-gray-400'}`}>
                                                                    {task.description}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Content View */}
                                                        {expandedTaskId === task.id && (
                                                            <div className="mt-4 pt-4 border-t border-white/10 ml-9">
                                                                {loadingContent ? (
                                                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                                        <Loader2 className="w-4 h-4 animate-spin" /> Fetching DB Content...
                                                                    </div>
                                                                ) : taskContent?.error ? (
                                                                    <p className="text-red-400 text-sm">{taskContent.error}</p>
                                                                ) : taskContent?.type === 'theory' ? (
                                                                    <div className="bg-black/50 p-4 rounded-xl border border-white/5 prose prose-invert prose-sm max-w-none text-gray-300">
                                                                        <ReactMarkdown>{taskContent.markdown_content}</ReactMarkdown>
                                                                    </div>
                                                                ) : taskContent?.type === 'quiz' ? (
                                                                    <div className="space-y-4">
                                                                        {taskContent.questions?.map((q: any, i: number) => (
                                                                            <div key={q.id || i} className="bg-black/50 p-4 rounded-xl border border-white/5">
                                                                                <p className="font-bold text-sm mb-3">Q{i + 1}. {q.content}</p>
                                                                                <div className="space-y-2">
                                                                                    {q.options?.map((opt: string, j: number) => (
                                                                                        <label key={j} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                                                                                            <input type="radio" name={`q_${q.id}`} className="accent-blue-500" />
                                                                                            <span className="text-sm text-gray-300">{opt}</span>
                                                                                        </label>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-gray-500 text-sm italic border border-white/10 p-4 rounded-xl bg-black/40">Open related subject tabs to complete this practice task.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border border-white/10 rounded-2xl bg-white/5 border-dashed">
                                <Calendar className="w-16 h-16 text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg">Select or generate a plan to view your timeline.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
