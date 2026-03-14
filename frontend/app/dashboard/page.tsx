"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { ArrowRight, BookOpen, Users, BrainCircuit, Target, ShieldAlert } from 'lucide-react';
import { AuthNavbar } from '@/components/ui/AuthNavbar';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative">
            <AuthNavbar />
            <div className="p-6 flex flex-col items-center justify-center flex-grow">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16"
                    >
                        <h1 className="text-4xl font-bold mb-4">Choose Your Path</h1>
                        <p className="text-gray-400 max-w-xl mx-auto">
                            Whether you are a student looking to improve or an instructor managing a class, we have the tools for you.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* AI LAB CARD - NEW SECTION */}
                        <div className="md:col-span-2 lg:col-span-3 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 border border-white/10 rounded-3xl p-8 mb-4 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="bg-white/10 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    AI LEARNING ENGINE v2.0
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h2 className="text-3xl font-black italic tracking-tighter mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-500">
                                    AI TUTOR ENGINE
                                </h2>
                                <p className="text-gray-400 text-sm mb-8 font-medium">Real-time cognitive support and automated study material analysis.</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-blue-500/50 transition-all group/item">
                                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 group-hover/item:scale-110 transition-transform">
                                            <span className="text-lg">🎭</span>
                                        </div>
                                        <h3 className="font-bold text-sm text-white mb-1">Emotion AI</h3>
                                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">Adaptive Tutoring</p>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-purple-500/50 transition-all group/item">
                                        <div className="w-10 h-10 bg-purple-600/20 rounded-xl flex items-center justify-center mb-4 group-hover/item:scale-110 transition-transform">
                                            <span className="text-lg">🎙️</span>
                                        </div>
                                        <h3 className="font-bold text-sm text-white mb-1">Voice Tutor</h3>
                                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">Socratic Dialogue</p>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 p-5 rounded-2xl hover:border-emerald-500/50 transition-all group/item">
                                        <div className="w-10 h-10 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-4 group-hover/item:scale-110 transition-transform">
                                            <span className="text-lg">📑</span>
                                        </div>
                                        <h3 className="font-bold text-sm text-white mb-1">Note-to-Quiz</h3>
                                        <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold tracking-widest">OCR Extraction</p>
                                    </div>
                                </div>

                                <Link href="/chat" className="mt-8 inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-white/5 active:scale-95">
                                    Explore in AI Chat <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>

                            {/* Decorative background circle */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                        </div>

                        {/* 1. Adaptive Practice */}
                        <Link href="/adaptive/choose" className="block group">
                            <Card className="h-full bg-gradient-to-br from-teal-900/20 to-transparent border-teal-500/20 group-hover:border-teal-500/50 p-6 relative overflow-hidden transition-all duration-300">
                                <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                                    <BrainCircuit className="text-teal-400 w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold mb-2 group-hover:text-teal-300">Adaptive Practice</h2>
                                <p className="text-sm text-gray-400 mb-4">Select a CSE subject. Our AI selects your next question based on your mastery.</p>
                                <div className="flex items-center text-teal-400 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                                    Choose Subject <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </Card>
                        </Link>
                        {/* 1. AI Chat Tutor */}
                        <Link href="/chat" className="block group">
                            <Card className="h-full bg-gradient-to-br from-blue-900/20 to-transparent border-blue-500/20 group-hover:border-blue-500/50 p-6 relative overflow-hidden transition-all duration-300">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <span className="text-2xl">🤖</span>
                                </div>
                                <h2 className="text-xl font-bold mb-2 group-hover:text-blue-300">AI Chat Tutor</h2>
                                <p className="text-sm text-gray-400 mb-4">Socratic style mentorship. Learn concepts through guided conversation.</p>
                                <div className="flex items-center text-blue-400 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                                    Start Chat <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </Card>
                        </Link>

                        {/* 3. Proctored Assessment */}
                        <Link href="/assessment/1" className="block group">
                            <Card className="h-full bg-gradient-to-br from-red-900/20 to-transparent border-red-500/20 group-hover:border-red-500/50 p-6 relative overflow-hidden transition-all duration-300">
                                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                                    <ShieldAlert className="text-red-400 w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold mb-2 group-hover:text-red-300">Proctored Assessment</h2>
                                <p className="text-sm text-gray-400 mb-4">AI-monitored coding exam. Camera + tab-switch detection. Trust score tracking.</p>
                                <div className="flex items-center text-red-400 text-sm font-semibold group-hover:translate-x-2 transition-transform">
                                    Start Exam <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </Card>
                        </Link>



                        {/* 6. Student Progress Dashboard */}
                        <Link href="/progress" className="block group md:col-span-2 lg:col-span-3">
                            <Card className="h-full bg-gradient-to-br from-green-900/20 to-transparent border-green-500/20 group-hover:border-green-500/50 p-6 relative overflow-hidden transition-all duration-300 flex flex-col justify-center">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Target className="text-green-400 w-6 h-6" />
                                    </div>
                                    <h2 className="text-xl font-bold group-hover:text-green-300">My Progress Dashboard</h2>
                                </div>
                                <p className="text-sm text-gray-400 mb-4 ml-16">
                                    View your active streaks, BKT mastery metrics per concept, and recent interaction history.
                                </p>
                                <div className="flex items-center text-green-400 text-sm font-semibold group-hover:translate-x-2 transition-transform ml-16">
                                    View Progress <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
