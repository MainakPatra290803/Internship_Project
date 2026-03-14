"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateQuizFromNotes } from '../lib/api';
import { FileUp, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

export default function AIStudyNotes() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setIsSuccess(false);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        try {
            const result = await generateQuizFromNotes(file);
            if (result.error) {
                setError(result.error);
                return;
            }
            if (result.questions) {
                setQuestions(result.questions);
                setIsSuccess(true);
            }
        } catch (err: any) {
            console.error("Failed to generate quiz:", err);
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                localStorage.removeItem('token');
                router.push('/login');
                return;
            }
            setError(err.message || "Failed to process notes. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Smart Study Notes</h2>
                    <p className="text-emerald-400/60 text-sm">Upload notes to generate custom AI quizzes</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="relative group">
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="border-2 border-dashed border-white/10 group-hover:border-emerald-500/50 rounded-2xl p-10 transition-all duration-300 bg-white/5 flex flex-col items-center gap-4">
                        <div className="p-4 bg-white/5 rounded-full group-hover:scale-110 transition-transform">
                            <FileUp className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">
                                {file ? file.name : "Click or drag your notes here"}
                            </p>
                            <p className="text-white/40 text-sm mt-1">Supports PNG, JPG, and PDF</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm animate-pulse">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!file || isProcessing}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${file && !isProcessing
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02]'
                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                        }`}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            AI is reading your notes...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            Generate Quiz
                        </>
                    )}
                </button>

                {isSuccess && (
                    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 text-emerald-400 mb-6 bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                            <div className="p-2 bg-emerald-500 rounded-lg">
                                <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-white">Quiz Generated Successfully!</p>
                                <p className="text-[11px] text-emerald-400/80">Saved to Assessments History</p>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-52 overflow-y-auto pr-2 custom-scrollbar p-1">
                            {questions.map((q: any, idx: number) => (
                                <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 transition-all group">
                                    <div className="flex gap-3">
                                        <span className="text-emerald-400 font-bold text-xs mt-0.5">Q{idx + 1}</span>
                                        <p className="text-white/80 text-xs leading-relaxed group-hover:text-white transition-colors">{q.question}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <a
                            href="/assessment"
                            className="w-full mt-8 py-4 bg-white text-black hover:bg-emerald-50 rounded-2xl transition-all font-bold text-center block shadow-xl hover:scale-[1.02] active:scale-95"
                        >
                            Go to Assessments Dashboard
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
