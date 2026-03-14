"use client";

import { useRef, useState } from 'react';
import { Download, CheckCircle, XCircle, ShieldAlert, FileText, Target, Code, Database, Clock, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

export interface AssessmentReportProps {
    mcqData: { questions: any[]; answers: Record<number, string> };
    codingData: { questions: any[]; submissions: Record<number, any> };
    sqlData: { questions: any[]; submissions: Record<number, any> };
    trustScore: number;
    timeTaken: string;
    onClose: () => void;
}

export function AssessmentReport({ mcqData, codingData, sqlData, trustScore, timeTaken, onClose }: AssessmentReportProps) {
    const reportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate Scores
    const mcqCorrect = mcqData.questions.filter(q => mcqData.answers[q.id] === q.correct).length;
    const mcqTotal = mcqData.questions.length || 1;
    const mcqPercentage = Math.round((mcqCorrect / mcqTotal) * 100);

    let codingTotalScore = 0;
    codingData.questions.forEach(q => {
        const score = codingData.submissions[q.id]?.results?.score || 0;
        codingTotalScore += score;
    });
    const codingPercentage = codingData.questions.length ? Math.round(codingTotalScore / codingData.questions.length) : 0;

    const sectionsCount = (mcqData.questions.length ? 1 : 0) + (codingData.questions.length ? 1 : 0);
    const finalScore = sectionsCount ? Math.round((mcqPercentage + codingPercentage) / sectionsCount) : 0;

    const handleDownloadPDF = async () => {
        if (!reportRef.current) return;
        setIsExporting(true);
        // Guarantee the UI paints "Generating PDF..." before html2canvas locks the thread
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Safely dynamically import html2pdf
            const html2pdfModule = await import('html2pdf.js');
            const html2pdf = html2pdfModule.default || html2pdfModule;

            const opt = {
                margin: [10, 10, 10, 10] as [number, number, number, number],
                filename: 'AI_Tutor_Assessment_Report.pdf',
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a0a0a' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };

            // Add a temporary class to fix printing scrolling issues
            const el = reportRef.current;
            const originalHeight = el.style.height;
            const originalOverflow = el.style.overflow;
            el.style.height = 'max-content';
            el.style.overflow = 'visible';

            await html2pdf().set(opt).from(el).save();

            el.style.height = originalHeight;
            el.style.overflow = originalOverflow;

        } catch (err: any) {
            console.error("PDF Export failed", err);
            alert("Sorry! PDF Export failed: " + (err.message || String(err)));
        }
        setIsExporting(false);
    };

    return (
        <div className="flex flex-col h-full bg-[#000000] text-[#ffffff] w-full overflow-hidden">
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161616] shrink-0 z-10 sticky top-0">
                <button onClick={onClose} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {isExporting ? 'Generating PDF...' : 'Download Full Report'}
                    </button>
                </div>
            </div>

            {/* Scrollable Report Content */}
            <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar bg-[#0a0a0a]" ref={reportRef}>
                <div className="max-w-4xl mx-auto p-8 space-y-12">

                    {/* Header Banner */}
                    <div className="relative rounded-3xl overflow-hidden p-10 border border-[#333] bg-[#0d0d0d] shadow-2xl">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1a2333] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#2a1b3d] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <h1 className="text-4xl font-extrabold mb-2 text-[#ffffff]">
                                    Official Assessment Report
                                </h1>
                                <p className="text-[#9ca3af] flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Generated by AI Tutor
                                </p>
                            </div>

                            <div className="flex gap-4 text-center">
                                <div className="bg-[#000000] border border-[#333333] rounded-2xl p-4 min-w-[120px]">
                                    <p className="text-xs text-[#888888] uppercase tracking-wider font-bold mb-1">Final Score</p>
                                    <p className={`text-4xl font-black ${finalScore >= 80 ? 'text-[#4ade80]' : finalScore >= 50 ? 'text-[#facc15]' : 'text-[#f87171]'}`}>
                                        {finalScore}%
                                    </p>
                                </div>
                                <div className="bg-[#000000] border border-[#333333] rounded-2xl p-4 min-w-[120px]">
                                    <p className="text-xs text-[#888888] uppercase tracking-wider font-bold mb-1">Trust Score</p>
                                    <p className={`text-4xl font-black flex items-center justify-center gap-2 ${trustScore >= 80 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
                                        <ShieldAlert className="w-5 h-5" /> {Math.round(trustScore)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 mt-8 grid grid-cols-3 gap-4 border-t border-[#333333] pt-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#1e3a8a] text-[#60a5fa] flex items-center justify-center"><Target className="w-5 h-5" /></div>
                                <div><p className="text-[10px] text-[#6b7280] uppercase font-bold">Concept MCQ</p><p className="font-semibold">{mcqPercentage}%</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#4c1d95] text-[#c084fc] flex items-center justify-center"><Code className="w-5 h-5" /></div>
                                <div><p className="text-[10px] text-[#6b7280] uppercase font-bold">Coding Score</p><p className="font-semibold">{codingPercentage}%</p></div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#374151] text-[#9ca3af] flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                                <div><p className="text-[10px] text-[#6b7280] uppercase font-bold">Time Taken</p><p className="font-semibold">{timeTaken}</p></div>
                            </div>
                        </div>
                    </div>

                    {/* Section A: MCQ Details */}
                    {mcqData.questions.length > 0 && (
                        <div className="space-y-6 pt-4 page-break-before" style={{ pageBreakBefore: 'always' }}>
                            <div className="flex items-center gap-3 border-b border-[#333333] pb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#1e3a8a] text-[#60a5fa] flex items-center justify-center"><Target className="w-4 h-4" /></div>
                                <h2 className="text-2xl font-bold text-[#ffffff]">Section A: Multiple Choice</h2>
                            </div>

                            <div className="space-y-6">
                                {mcqData.questions.map((q, idx) => {
                                    const userAnswer = mcqData.answers[q.id];
                                    const isCorrect = userAnswer === q.correct;
                                    const isUnanswered = !userAnswer;

                                    return (
                                        <div key={q.id} className="bg-[#111111] border border-[#333333] rounded-2xl p-6 shadow-lg">
                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-[#222222] flex items-center justify-center font-bold text-[#aaaaaa] shrink-0">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-lg text-[#ffffff] mb-2 leading-relaxed">{q.question}</p>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] px-2 py-1 bg-[#222222] text-[#9ca3af] rounded uppercase font-bold tracking-wider">{q.topic}</span>
                                                    </div>
                                                </div>
                                                {isCorrect ? <CheckCircle className="w-8 h-8 text-[#22c55e] shrink-0" /> : <XCircle className="w-8 h-8 text-[#ef4444] shrink-0" />}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pl-12">
                                                {q.options.map((opt: string) => {
                                                    const isSelected = userAnswer === opt;
                                                    const isActuallyCorrect = q.correct === opt;

                                                    let bgStyle = "bg-[#1a1a1a] border-[#333333] text-[#aaaaaa]";
                                                    if (isActuallyCorrect) bgStyle = "bg-[#064e3b] border-[#047857] text-[#34d399]";
                                                    else if (isSelected && !isActuallyCorrect) bgStyle = "bg-[#7f1d1d] border-[#b91c1c] text-[#f87171]";

                                                    return (
                                                        <div key={opt} className={`p-3 rounded-xl border flex items-center gap-3 ${bgStyle}`}>
                                                            {isActuallyCorrect && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                                                            {isSelected && !isActuallyCorrect && <XCircle className="w-4 h-4 shrink-0" />}
                                                            {!isSelected && !isActuallyCorrect && <div className="w-4 h-4 border border-[#4b5563] rounded-full shrink-0" />}
                                                            <span className="text-sm font-medium">{opt}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="ml-12 p-4 rounded-xl bg-[#161616] border border-[#333333] text-sm text-[#d1d5db]">
                                                <span className="text-[#60a5fa] font-bold mr-2">Explanation:</span>
                                                {q.explanation}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Section B: Coding Details */}
                    {codingData.questions.length > 0 && (
                        <div className="space-y-6 pt-12" style={{ pageBreakBefore: 'always' }}>
                            <div className="flex items-center gap-3 border-b border-[#333333] pb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#4c1d95] text-[#c084fc] flex items-center justify-center"><Code className="w-4 h-4" /></div>
                                <h2 className="text-2xl font-bold text-[#ffffff]">Section B: Coding Environments</h2>
                            </div>

                            <div className="space-y-8">
                                {codingData.questions.map((q, idx) => {
                                    const submission = codingData.submissions[q.id];
                                    const code = submission?.code || "No code submitted.";
                                    const results = submission?.results;
                                    const score = results?.score || 0;

                                    return (
                                        <div key={q.id} className="bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-6 border-b border-[#333333]">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-[#ffffff] mb-2">{idx + 1}. {q.title}</h3>
                                                        <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold tracking-wider ${q.difficulty === 'Easy' ? 'bg-[#064e3b] text-[#4ade80]' : q.difficulty === 'Hard' ? 'bg-[#7f1d1d] text-[#f87171]' : 'bg-[#713f12] text-[#facc15]'}`}>
                                                            {q.difficulty}
                                                        </span>
                                                    </div>
                                                    <div className={`text-2xl font-black ${score === 100 ? 'text-[#4ade80]' : score > 0 ? 'text-[#facc15]' : 'text-[#f87171]'}`}>
                                                        {score}/100
                                                    </div>
                                                </div>
                                                <p className="text-sm text-[#aaaaaa] leading-relaxed mb-4">{q.statement}</p>
                                            </div>

                                            <div className="bg-[#0d0d0d] p-0 font-mono text-xs border-b border-[#333333]">
                                                <div className="px-4 py-2 bg-[#161616] border-b border-[#222222] text-[#6c757d] flex justify-between">
                                                    <span>User Submission (Python3)</span>
                                                </div>
                                                <pre className="p-4 text-[#d8b4fe] overflow-x-auto whitespace-pre-wrap">{code}</pre>
                                            </div>

                                            {results && (
                                                <div className="p-6 bg-[#111111]">
                                                    <p className="text-xs text-[#888888] uppercase font-bold mb-3 tracking-wider">Test Case Results</p>
                                                    <div className="space-y-2">
                                                        <div className="text-sm text-[#bbbbbb] mb-2">Verdict: <span className={score === 100 ? 'text-[#4ade80] font-bold' : 'text-[#f87171] font-bold'}>{results.verdict}</span></div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {results.sample?.map((tc: any, i: number) => (
                                                                <div key={i} className={`p-3 rounded-lg border text-xs flex justify-between ${tc.passed ? 'bg-[#064e3b] border-[#047857]' : 'bg-[#7f1d1d] border-[#b91c1c]'}`}>
                                                                    <span className={tc.passed ? 'text-[#4ade80]' : 'text-[#f87171]'}>
                                                                        Test Case {i + 1}: {tc.passed ? 'PASSED' : 'FAILED'}
                                                                    </span>
                                                                    {!tc.passed && (
                                                                        <span className="text-[#888888] text-[10px]">Got: {tc.actual || 'null'} | Expected: {tc.expected}</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="mt-2 text-xs text-[#888888]">Hidden Test Cases Passed: {results.hidden?.passed}/{results.hidden?.total}</div>
                                                    </div>
                                                </div>
                                            )}
                                            {q.solution_code && (
                                                <div className="bg-[#064e3b11] p-0 font-mono text-xs border-t border-[#04785744]">
                                                    <div className="px-4 py-2 bg-[#064e3b22] border-b border-[#04785744] text-[#34d399] flex justify-between font-bold">
                                                        <span>Optimal Solution (Python3)</span>
                                                    </div>
                                                    <pre className="p-4 text-[#a7f3d0] overflow-x-auto whitespace-pre-wrap">{q.solution_code}</pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Add SQL section similarly if needed... omitted for brevity to focus on MCQ & Coding */}
                    {sqlData.questions.length > 0 && (
                        <div className="space-y-6 pt-12" style={{ pageBreakBefore: 'always' }}>
                            <div className="flex items-center gap-3 border-b border-[#333333] pb-4">
                                <div className="w-8 h-8 rounded-lg bg-[#854d0e] text-[#facc15] flex items-center justify-center"><Database className="w-4 h-4" /></div>
                                <h2 className="text-2xl font-bold text-[#ffffff]">Section C: SQL Queries</h2>
                            </div>

                            <div className="space-y-8">
                                {sqlData.questions.map((q, idx) => {
                                    const submission = sqlData.submissions[q.id];
                                    const query = submission?.query || "No query submitted.";

                                    return (
                                        <div key={q.id} className="bg-[#111111] border border-[#333333] rounded-2xl overflow-hidden shadow-lg">
                                            <div className="p-6 border-b border-[#333333]">
                                                <h3 className="text-xl font-bold text-[#ffffff] mb-2">{idx + 1}. {q.title}</h3>
                                                <p className="text-sm text-[#aaaaaa] leading-relaxed">{q.task}</p>
                                            </div>
                                            <div className="bg-[#0d0d0d] p-0 font-mono text-xs border-b border-[#333333]">
                                                <div className="px-4 py-2 bg-[#161616] border-b border-[#222222] text-[#6c757d]">User Submission (MySQL)</div>
                                                <pre className="p-4 text-[#93c5fd] overflow-x-auto whitespace-pre-wrap">{query}</pre>
                                            </div>
                                            {q.solution_query && (
                                                <div className="bg-[#064e3b11] p-0 font-mono text-xs">
                                                    <div className="px-4 py-2 bg-[#064e3b22] border-b border-[#04785744] text-[#34d399] flex justify-between font-bold">
                                                        <span>Optimal Solution (MySQL)</span>
                                                    </div>
                                                    <pre className="p-4 text-[#a7f3d0] overflow-x-auto whitespace-pre-wrap">{q.solution_query}</pre>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
