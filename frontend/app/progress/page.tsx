"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Target, Clock, AlertCircle, AlertTriangle, BookOpen, GraduationCap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Pie, Cell, Legend } from 'recharts';
import { AuthNavbar } from '@/components/ui/AuthNavbar';

// Dynamically import Recharts to avoid SSR hydration issues
const BarChart = dynamic(() => import('recharts').then((mod) => mod.BarChart), { ssr: false });
const PieChart = dynamic(() => import('recharts').then((mod) => mod.PieChart), { ssr: false });

const PIE_COLORS = ['#22c55e', '#ef4444']; // Green, Red
const BAR_COLOR = '#8b5cf6'; // Purple

export default function ProgressDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [historyTab, setHistoryTab] = useState<'adaptive' | 'assessment'>('adaptive');
    const router = useRouter();

    useEffect(() => {
        const fetchDashboardData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch(`/api/v1/student/dashboard`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        router.push('/login');
                        return;
                    }
                    const errorText = await res.text();
                    console.error("Dashboard API Error:", res.status, errorText);
                    throw new Error('Failed to fetch dashboard data');
                }

                const dashboardData = await res.json();
                console.log("Dashboard Data Success:", dashboardData);
                setData(dashboardData);
            } catch (err: any) {
                console.error("Dashboard Catch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl text-red-400 mb-2">Error Loading Dashboard</h2>
                <p className="text-gray-400">{error}</p>
            </div>
        );
    }

    const pieData = data?.accuracy_stats ? [
        { name: 'Correct', value: data.accuracy_stats.total_correct },
        { name: 'Incorrect', value: data.accuracy_stats.total_incorrect }
    ] : [];

    const totalInteractions = (data?.accuracy_stats?.total_correct || 0) + (data?.accuracy_stats?.total_incorrect || 0);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
            <AuthNavbar />

            <div className="p-6 flex flex-col items-center flex-grow relative z-10 w-full">
                {/* Background Effects */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-6xl w-full">
                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                My Progress Dashboard
                            </h1>
                            <p className="text-gray-400 mt-2">Comprehensive analytics of your learning journey & mastery.</p>
                        </div>
                    </div>

                    {/* Drift Detection Alert */}
                    {data?.drift_detection?.is_drifting && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-4">
                                <div className="p-3 bg-red-500/20 rounded-full text-red-400 shrink-0">
                                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-red-400 font-bold text-lg">Performance Drift Detected</h3>
                                    <p className="text-red-300 text-sm mt-1">{data.drift_detection.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Top Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-gray-900/50 border-gray-800 p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Current Streak</p>
                                <h3 className="text-2xl font-bold">{data?.current_streak} <span className="text-sm text-gray-500 font-normal">days</span></h3>
                            </div>
                        </Card>
                        <Card className="bg-gray-900/50 border-gray-800 p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-green-500">
                                <Target className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Concepts Tracked</p>
                                <h3 className="text-2xl font-bold">{data?.mastery_levels?.length || 0}</h3>
                            </div>
                        </Card>
                        <Card className="bg-gray-900/50 border-gray-800 p-6 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Total Interactions</p>
                                <h3 className="text-2xl font-bold">{totalInteractions}</h3>
                            </div>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        {/* Mastery Bar Chart */}
                        <Card className="bg-gray-900/40 border-gray-800 p-6 lg:col-span-2 flex flex-col">
                            <h2 className="text-xl font-semibold mb-6 text-gray-200">Topic Mastery</h2>
                            <div className="flex-grow w-full h-[300px]">
                                {data?.topic_mastery && data.topic_mastery.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.topic_mastery} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                            <XAxis dataKey="topic_name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} fontSize={12} />
                                            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} domain={[0, 100]} fontSize={12} unit="%" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }}
                                                itemStyle={{ color: '#a78bfa' }}
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            />
                                            <Bar dataKey="mastery" name="Mastery %" fill={BAR_COLOR} radius={[4, 4, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl">
                                        No topic data available yet. Practice some concepts to see your mastery!
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Overall Accuracy Pie Chart */}
                        <Card className="bg-gray-900/40 border-gray-800 p-6 flex flex-col">
                            <h2 className="text-xl font-semibold mb-6 text-gray-200">Overall Accuracy</h2>
                            <div className="flex-grow w-full h-[300px]">
                                {totalInteractions > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                                itemStyle={{ color: '#fff' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-gray-500 border border-dashed border-gray-800 rounded-xl px-4 text-center">
                                        Start practicing to track your accuracy here.
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Granular BKT Levels & History */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* BKT Mastery Detail */}
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-200">Detailed Concept Mastery (BKT)</h2>
                            <Card className="bg-gray-900/40 border-gray-800 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                                <div className="space-y-4">
                                    {data?.mastery_levels?.map((concept: any) => (
                                        <div key={concept.concept_id} className="bg-black/50 p-4 rounded-xl border border-gray-800">
                                            <div className="flex justify-between items-end mb-2">
                                                <h3 className="font-medium text-slate-300">{concept.concept_name}</h3>
                                                <span className={`text-sm font-bold ${concept.mastery_percent > 80 ? 'text-green-400' : concept.mastery_percent > 50 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                    {concept.mastery_percent}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-2 rounded-full ${concept.mastery_percent > 80 ? 'bg-green-500' : concept.mastery_percent > 50 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                                    style={{ width: `${Math.max(concept.mastery_percent, 2)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!data?.mastery_levels || data.mastery_levels.length === 0) && (
                                        <div className="text-gray-500 p-4 text-center border border-dashed border-gray-800 rounded-xl">
                                            No concepts tracked yet.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Timeline History */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-200">History</h2>
                                <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-800">
                                    <button
                                        onClick={() => setHistoryTab('adaptive')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${historyTab === 'adaptive' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                                    >
                                        <BookOpen className="w-4 h-4" /> Practice
                                    </button>
                                    <button
                                        onClick={() => setHistoryTab('assessment')}
                                        className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2 ${historyTab === 'assessment' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}
                                    >
                                        <GraduationCap className="w-4 h-4" /> Assessments
                                    </button>
                                </div>
                            </div>

                            <Card className="bg-gray-900/40 border-gray-800 p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-700 before:to-transparent">

                                    {historyTab === 'adaptive' && data?.recent_history?.map((hist: any, i: number) => (
                                        <div key={`adaptive-${i}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 ${hist.is_correct ? 'border-green-500 bg-black' : 'border-red-500 bg-black'} text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 mx-auto`} />
                                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-black/50 p-3 rounded-lg border border-gray-800">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className={`font-bold text-sm ${hist.is_correct ? 'text-green-500' : 'text-red-500'}`}>{hist.is_correct ? 'Correct' : 'Incorrect'}</div>
                                                    <div className="text-xs text-slate-500">{new Date(hist.timestamp).toLocaleDateString()} {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                </div>
                                                <div className="text-slate-400 text-sm">{hist.title}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {historyTab === 'assessment' && data?.assessment_history?.map((hist: any, i: number) => (
                                        <div key={`assess-${i}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-purple-500 bg-black text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 mx-auto" />
                                            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-black/50 p-3 rounded-lg border border-gray-800">
                                                <div className="flex items-center justify-between space-x-2 mb-1">
                                                    <div className="font-bold text-sm text-purple-400">Score: {hist.score}%</div>
                                                    <div className="text-xs text-slate-500">{new Date(hist.timestamp).toLocaleDateString()}</div>
                                                </div>
                                                <div className="text-slate-400 text-sm line-clamp-2">{hist.title}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {historyTab === 'adaptive' && (!data?.recent_history || data.recent_history.length === 0) && (
                                        <div className="text-gray-500 text-center text-sm relative z-10 w-full py-8">
                                            No practice history found. Head to the Adaptive Practice section to get started!
                                        </div>
                                    )}

                                    {historyTab === 'assessment' && (!data?.assessment_history || data.assessment_history.length === 0) && (
                                        <div className="text-gray-500 text-center text-sm relative z-10 w-full py-8">
                                            No assessment history found. Take an assessment to see your scores here.
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
