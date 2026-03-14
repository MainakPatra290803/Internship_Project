"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Upload, Clock, ChevronDown, CheckCircle, XCircle, AlertTriangle, Loader2, Video, ShieldAlert, MonitorPlay, Plus, ChevronLeft, ChevronRight, AlertOctagon, Send } from 'lucide-react';
import ProctorEngine, { ProctorEvent } from '../ProctorEngine';
import { AssessmentReport } from '../../../components/assessment/AssessmentReport';

// ─── Types ─────────────────────────────────────────────────────────────────
interface TestCase { input: string; output: string; explanation?: string; }
interface CodingQ {
    id: number; title: string; difficulty: string; statement: string;
    input_format: string; output_format: string;
    sample_test_cases: TestCase[]; hidden_test_cases: TestCase[];
    templates: Record<string, string>;
    constraints?: string[];
}
interface MCQQ { id: number; question: string; options: string[]; correct: string; explanation: string; topic: string; }
interface SQLQ { id: number; title: string; difficulty: string; statement: string; schema: string; task: string; sample_test_cases: { description: string; result: string }[]; example_block?: string; }
interface TestResult { input: string; expected: string; actual: string; passed: boolean; explanation: string; }
type Section = 'A' | 'B' | 'C';

// ─── Helpers ───────────────────────────────────────────────────────────────
function Timer({ secs, label, onTimeUp }: { secs: number; label: string; onTimeUp: () => void }) {
    const [t, setT] = useState(secs);
    const cb = useRef(onTimeUp);
    cb.current = onTimeUp;

    useEffect(() => {
        setT(secs);
    }, [secs, label]);

    useEffect(() => {
        if (secs <= 0) return;
        const i = setInterval(() => {
            setT(p => {
                if (p <= 1) {
                    clearInterval(i);
                    cb.current();
                    return 0;
                }
                return p - 1;
            });
        }, 1000);
        return () => clearInterval(i);
    }, [secs, label]);

    const m = String(Math.floor(t / 60)).padStart(2, '0'), s = String(t % 60).padStart(2, '0');
    return <span className={`font-mono text-sm font-bold ${t < 300 ? 'text-red-400 animate-pulse' : 'text-[#eff1f6bf]'}`}>{m}:{s}</span>;
}

const LANGS = ['Python3', 'Java', 'C++', 'JavaScript', 'TypeScript', 'C#', 'C', 'Go', 'Kotlin', 'Rust', 'Swift'];

// ─── Section A — MCQ ──────────────────────────────────────────────────────
function SectionA({ questions, examNumber, answers, onAnswer }: { questions: MCQQ[]; examNumber: number; answers: Record<number, string>; onAnswer: (id: number, opt: string) => void }) {
    const [qIdx, setQIdx] = useState(0);
    const q = questions[qIdx];
    if (!q) return null;
    const answered = Object.keys(answers).length;
    const select = (opt: string) => {
        onAnswer(q.id, opt);
    };
    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-[#3e3e3e] bg-[#161616] overflow-y-auto shrink-0">
                <div className="px-4 py-3 border-b border-[#3e3e3e]">
                    <p className="text-xs font-semibold text-[#eff1f6bf]">Section A — MCQ</p>
                    <p className="text-xs text-[#6c757d] mt-0.5">Exam #{examNumber + 1} · {answered}/{questions.length} answered</p>
                </div>
                <div className="p-2 grid grid-cols-5 gap-1">
                    {questions.map((q2, i) => (
                        <button key={q2.id} onClick={() => setQIdx(i)}
                            className={`w-9 h-9 rounded text-xs font-semibold transition-all
                            ${i === qIdx ? 'bg-[#ffa116] text-black' :
                                    answers[q2.id] ? 'bg-[#2cbb5d22] text-[#2cbb5d] border border-[#2cbb5d44]'
                                        : 'bg-[#2d2d2d] text-[#6c757d] hover:bg-[#3e3e3e]'}`}>
                            {i + 1}
                        </button>
                    ))}
                </div>
            </div>
            {/* Question */}
            <div className="flex-1 overflow-y-auto bg-[#1a1a1a] p-6">
                <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <span className="text-xs bg-[#2d2d2d] text-[#eff1f6bf] px-2 py-1 rounded font-mono">Q{qIdx + 1} / {questions.length}</span>
                        <span className="text-xs bg-[#ffa11622] text-[#ffa116] px-2 py-1 rounded">{q.topic}</span>
                    </div>
                    <p className="text-[#eff1f6] text-base leading-relaxed mb-6">{q.question}</p>
                    <div className="space-y-2.5">
                        {q.options.map((opt: string) => {
                            const isChosen = opt === answers[q.id];
                            let cls = 'border-[#3e3e3e] bg-[#282828] hover:border-[#555] hover:bg-[#313131] cursor-pointer';
                            if (isChosen) cls = 'border-[#ffa116] bg-[#ffa11612] text-[#ffa116] ring-1 ring-[#ffa116]';

                            return (
                                <button key={opt} onClick={() => select(opt)}
                                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center gap-2 ${cls}`}>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setQIdx(p => Math.max(0, p - 1))} disabled={qIdx === 0}
                            className="flex items-center gap-1 text-xs px-3 py-2 bg-[#2d2d2d] text-[#eff1f6bf] rounded disabled:opacity-30 hover:bg-[#3e3e3e]">
                            <ChevronLeft className="w-3.5 h-3.5" /> Prev
                        </button>
                        <button onClick={() => setQIdx(p => Math.min(questions.length - 1, p + 1))} disabled={qIdx === questions.length - 1}
                            className="flex items-center gap-1 text-xs px-3 py-2 bg-[#2d2d2d] text-[#eff1f6bf] rounded disabled:opacity-30 hover:bg-[#3e3e3e]">
                            Next <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Section B — Coding ────────────────────────────────────────────────────
function SectionB({ questions, examNumber, submissions, onSubmission }: { questions: CodingQ[]; examNumber: number; submissions: Record<number, any>; onSubmission: (id: number, code: string, results: any) => void }) {
    const [qIdx, setQIdx] = useState(0);
    const q = questions[qIdx];
    const [lang, setLang] = useState('Python3');
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [code, setCode] = useState('');
    const [testTab, setTestTab] = useState<'testcase' | 'result'>('testcase');
    const [caseIdx, setCaseIdx] = useState(0);
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<{ sample: TestResult[]; hidden: { passed: number; total: number }; score: number; verdict: string } | null>(null);

    // Update code template when question or language changes
    useEffect(() => {
        if (q?.templates?.[lang]) setCode(q.templates[lang]);
        else if (q?.templates?.['Python3']) setCode(q.templates['Python3']);
    }, [q, lang]);

    const run = async (submit = false) => {
        if (!q) return;
        setRunning(true); setTestTab('result'); setResults(null);
        try {
            const res = await fetch('/api/v1/assessment/bank/run-testcases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language: lang, question_id: q.id, stdin: q.sample_test_cases[0]?.input || '' })
            });
            const data = await res.json();
            setResults(data);
            if (submit) onSubmission(q.id, code, data);
        } catch (e) {
            const errData = { sample: [], hidden: { passed: 0, total: 0 }, score: 0, verdict: String(e) };
            setResults(errData);
            if (submit) onSubmission(q.id, code, errData);
        }
        setRunning(false);
    };

    if (!q) return <div className="flex items-center justify-center h-full text-[#6c757d]">No questions found</div>;

    const sampleCase = q.sample_test_cases[caseIdx];
    const lines = code.split('\n').map((_, i) => i + 1);

    return (
        <div className="flex h-full">
            {/* Problem List Sidebar */}
            <div className="w-14 border-r border-[#3e3e3e] bg-[#161616] flex flex-col items-center pt-2 gap-1 shrink-0">
                {questions.map((q2, i) => (
                    <button key={q2.id} onClick={() => setQIdx(i)}
                        className={`w-9 h-9 rounded text-xs font-semibold ${i === qIdx ? 'bg-[#ffa116] text-black' : 'bg-[#2d2d2d] text-[#6c757d] hover:bg-[#3e3e3e]'}`}>
                        {i + 1}
                    </button>
                ))}
            </div>

            {/* Left: Problem Description */}
            <div className="w-[45%] border-r border-[#3e3e3e] flex flex-col overflow-hidden bg-[#1a1a1a]">
                <div className="flex border-b border-[#3e3e3e] px-4 shrink-0">
                    <button className="px-4 py-3 text-xs font-medium border-b-2 border-[#ffa116] text-[#ffa116]">📋 Description</button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 text-sm">
                    <h1 className="text-xl font-bold text-[#eff1f6] mb-2" style={{ fontFamily: 'system-ui' }}>{q.title}</h1>
                    <div className="flex gap-2 mb-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${q.difficulty === 'Easy' ? 'bg-[#2cbb5d22] text-[#2cbb5d]' : q.difficulty === 'Hard' ? 'bg-[#ef474322] text-[#ef4743]' : 'bg-[#ffa11622] text-[#ffa116]'}`}>{q.difficulty}</span>
                        <span className="text-xs bg-[#2d2d2d] text-[#8b949e] px-2.5 py-1 rounded-full">Topics</span>
                    </div>
                    <p className="text-[#eff1f6bf] leading-7 mb-5" style={{ fontFamily: 'system-ui', fontSize: '13.5px' }}>{q.statement}</p>

                    {/* Sample test cases */}
                    {q.sample_test_cases.map((tc, i) => (
                        <div key={i} className="mb-4">
                            <p className="text-sm font-bold text-[#eff1f6] mb-2" style={{ fontFamily: 'system-ui' }}>Example {i + 1}:</p>
                            <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-4 font-mono text-xs space-y-1.5">
                                <div><span className="text-[#8b949e] font-bold font-sans">Input: </span><span className="text-[#eff1f6] whitespace-pre">{tc.input}</span></div>
                                <div><span className="text-[#8b949e] font-bold font-sans">Output: </span><span className="text-[#2cbb5d]">{tc.output}</span></div>
                                {tc.explanation && <div><span className="text-[#8b949e] font-bold font-sans">Explanation: </span><span className="text-[#8b949e]">{tc.explanation}</span></div>}
                            </div>
                        </div>
                    ))}

                    {/* I/O format */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-3">
                            <p className="text-[10px] text-[#6c757d] uppercase font-semibold mb-1">Input Format</p>
                            <p className="text-xs text-[#eff1f6bf]">{q.input_format}</p>
                        </div>
                        <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-3">
                            <p className="text-[10px] text-[#6c757d] uppercase font-semibold mb-1">Output Format</p>
                            <p className="text-xs text-[#eff1f6bf]">{q.output_format}</p>
                        </div>
                    </div>

                    {/* Hidden test cases count */}
                    <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-3 mb-4">
                        <p className="text-[10px] text-[#6c757d] uppercase font-semibold mb-1">Test Cases</p>
                        <p className="text-xs text-[#eff1f6bf]">{q.sample_test_cases.length} visible + {q.hidden_test_cases.length} hidden test cases</p>
                    </div>
                </div>
            </div>

            {/* Right: Editor */}
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#3e3e3e] bg-[#1a1a1a] shrink-0">
                    <div className="relative">
                        <button onClick={() => setShowLangMenu(p => !p)}
                            className="flex items-center gap-1.5 text-xs text-[#eff1f6bf] bg-[#2d2d2d] hover:bg-[#3e3e3e] px-3 py-1.5 rounded">
                            {lang} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showLangMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded-lg shadow-2xl z-50 grid grid-cols-3 w-56 py-1">
                                {LANGS.map(l => (
                                    <button key={l} onClick={() => { setLang(l); setShowLangMenu(false); }}
                                        className={`text-left px-3 py-2 text-xs hover:bg-[#3e3e3e] ${l === lang ? 'text-[#2cbb5d]' : 'text-[#eff1f6bf]'}`}>
                                        {l === lang && '✓ '}{l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-[#6c757d]">Exam #{examNumber + 1}</span>
                </div>

                {/* Code area */}
                <div className="flex flex-1 overflow-hidden font-mono">
                    <div className="w-10 bg-[#1e1e1e] py-3 text-right pr-2 select-none shrink-0 overflow-hidden">
                        {lines.map(n => <div key={n} className="text-[#3e3e3e] text-xs leading-5">{n}</div>)}
                    </div>
                    <textarea value={code} onChange={e => setCode(e.target.value)}
                        className="flex-1 bg-[#1e1e1e] text-[#abb2bf] text-xs py-3 pl-2 pr-4 resize-none outline-none leading-5"
                        spellCheck={false} style={{ fontFamily: 'Menlo,Monaco,Consolas,monospace' }} />
                </div>

                <div className="flex items-center justify-between px-4 py-1.5 border-t border-b border-[#3e3e3e] bg-[#1a1a1a] text-xs text-[#6c757d] shrink-0">
                    <span>Saved</span><span>Ln 1, Col 1</span>
                </div>

                {/* Testcase panel */}
                <div className="h-48 flex flex-col border-t border-[#3e3e3e] bg-[#1a1a1a] shrink-0">
                    <div className="flex items-center border-b border-[#3e3e3e] px-4">
                        {(['testcase', 'result'] as const).map(t => (
                            <button key={t} onClick={() => setTestTab(t)}
                                className={`px-3 py-2.5 text-xs font-medium border-b-2 mr-2 ${testTab === t ? 'border-[#2cbb5d] text-[#2cbb5d]' : 'border-transparent text-[#6c757d] hover:text-[#eff1f6bf]'}`}>
                                {t === 'testcase' ? '☑ Testcase' : '>_ Test Result'}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto p-3">
                        {testTab === 'testcase' ? (
                            <div>
                                <div className="flex gap-2 mb-3">
                                    {q.sample_test_cases.map((_, i) => (
                                        <button key={i} onClick={() => setCaseIdx(i)}
                                            className={`text-xs px-3 py-1 rounded font-medium ${i === caseIdx ? 'bg-[#3e3e3e] text-[#eff1f6]' : 'text-[#6c757d] hover:text-[#eff1f6bf]'}`}>
                                            Case {i + 1}
                                        </button>
                                    ))}
                                </div>
                                {sampleCase && (
                                    <div className="space-y-2">
                                        <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-2">
                                            <p className="text-[10px] text-[#6c757d] mb-1">stdin =</p>
                                            <pre className="text-xs text-[#eff1f6] font-mono">{sampleCase.input}</pre>
                                        </div>
                                        <div className="bg-[#282828] rounded-lg border border-[#3e3e3e] p-2">
                                            <p className="text-[10px] text-[#6c757d] mb-1">expected output =</p>
                                            <pre className="text-xs text-[#2cbb5d] font-mono">{sampleCase.output}</pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="font-mono text-xs">
                                {running ? (
                                    <div className="flex items-center gap-2 text-[#6c757d]"><Loader2 className="w-4 h-4 animate-spin" /> Running test cases...</div>
                                ) : results ? (
                                    <div className="space-y-2">
                                        <div className={`flex items-center gap-2 font-semibold ${results.score === 100 ? 'text-[#2cbb5d]' : 'text-[#ef4743]'}`}>
                                            {results.score === 100 ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                            {results.verdict} — {results.score}%
                                        </div>
                                        <div className="text-[#6c757d]">Sample: {(results.sample || []).filter((r: any) => r.passed).length}/{(results.sample || []).length} passed · Hidden: {results.hidden?.passed || 0}/{results.hidden?.total || 0} passed</div>
                                        {(results.sample || []).map((r: any, i: number) => (
                                            <div key={i} className={`p-2 rounded border text-[10px] flex flex-col gap-1 ${r.passed ? 'border-[#2cbb5d44] bg-[#2cbb5d11]' : r.error ? 'border-[#ef474388] bg-[#201111]' : 'border-[#ef474344] bg-[#ef474311]'}`}>
                                                <span className={r.passed ? 'text-[#2cbb5d] font-bold' : 'text-[#ef4743] font-bold'}>Case {i + 1}: {r.passed ? '✓ Passed' : '✗ Failed'} {r.error && '(Execution Error)'}</span>
                                                {!r.passed && !r.error && <div className="text-[#6c757d]">Got: <span className="text-[#eff1f6]">{r.actual || 'no output'}</span> | Expected: <span className="text-[#2cbb5d]">{r.expected}</span></div>}
                                                {r.error && <pre className="text-[#ef4743] mt-1 bg-[#2d1b1b] p-2 rounded border border-[#ef474344] whitespace-pre-wrap font-mono overflow-auto max-h-32 leading-tight">{r.actual || r.error_message || 'Unknown Error'}</pre>}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-[#6c757d]">Click Run to execute your code.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action bar */}
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#3e3e3e] bg-[#1a1a1a] shrink-0">
                    <button onClick={() => run(false)} disabled={running}
                        className="flex items-center gap-1.5 text-xs text-[#eff1f6bf] bg-[#2d2d2d] hover:bg-[#3e3e3e] border border-[#3e3e3e] px-4 py-1.5 rounded font-medium disabled:opacity-50">
                        <Play className="w-3.5 h-3.5" /> Run
                    </button>
                    <button onClick={() => run(true)} disabled={running}
                        className={`flex items-center gap-1.5 text-xs text-white px-4 py-1.5 rounded font-medium disabled:opacity-50 transition-colors ${submissions[q.id] ? 'bg-[#2cbb5d] hover:bg-[#24a952]' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        {submissions[q.id] ? <CheckCircle className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                        {submissions[q.id] ? 'Re-Submit' : 'Submit'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Section C — SQL ──────────────────────────────────────────────────────
function SectionC({ questions, examNumber, submissions, onSubmission }: { questions: SQLQ[]; examNumber: number; submissions: Record<number, any>; onSubmission: (id: number, query: string, results?: any) => void }) {
    const [qIdx, setQIdx] = useState(0);
    const q = questions[qIdx];
    const [query, setQuery] = useState('-- Write your SQL query here\n\nSELECT \n\nFROM \n\nWHERE ;');
    const [testTab, setTestTab] = useState<'schema' | 'result'>('schema');
    const SQL_LANGS = ["MySQL", "PostgreSQL", "Oracle", "MS SQL Server", "SQLite"];
    const [lang, setLang] = useState(SQL_LANGS[0]);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const lines = query.split('\n').map((_, i) => i + 1);
    if (!q) return null;
    return (
        <div className="flex h-full">
            <div className="w-14 border-r border-[#3e3e3e] bg-[#161616] flex flex-col items-center pt-2 gap-1 shrink-0">
                {questions.map((q2, i) => (
                    <button key={q2.id} onClick={() => { setQIdx(i); }}
                        className={`w-9 h-9 rounded text-xs font-semibold ${i === qIdx ? 'bg-[#ffa116] text-black' : 'bg-[#2d2d2d] text-[#6c757d] hover:bg-[#3e3e3e]'}`}>{i + 1}</button>
                ))}
            </div>
            <div className="w-[45%] border-r border-[#3e3e3e] overflow-y-auto bg-[#1a1a1a] p-5 text-sm">
                <h1 className="text-xl font-bold text-[#eff1f6] mb-2" style={{ fontFamily: 'system-ui' }}>{q.title}</h1>
                <div className="flex gap-2 mb-4">
                    <span className="text-xs bg-[#ffa11622] text-[#ffa116] px-2.5 py-1 rounded-full">{q.difficulty}</span>
                </div>
                <p className="text-[#eff1f6bf] leading-7 mb-5 text-[13.5px]" style={{ fontFamily: 'system-ui' }}>{q.statement}</p>
                {q.example_block && (
                    <div className="mb-5">
                        <p className="text-sm font-bold text-[#eff1f6] mb-2" style={{ fontFamily: 'system-ui' }}>Example 1:</p>
                        <div className="bg-[#282828] border-l-4 border-[#3e3e3e] p-4 text-xs font-mono whitespace-pre-wrap text-[#c9d1d9] leading-5 w-fit">
                            {q.example_block}
                        </div>
                    </div>
                )}
                {!q.example_block && (
                    <>
                        <div className="mb-5">
                            <p className="text-sm font-bold text-[#eff1f6] mb-2" style={{ fontFamily: 'system-ui' }}>Database Schema:</p>
                            <div className="bg-[#0d1117] border border-[#3e3e3e] rounded-lg overflow-hidden">
                                <div className="flex items-center px-3 py-1.5 border-b border-[#3e3e3e] bg-[#161616]">
                                    <span className="text-[10px] text-[#6c757d] font-mono">schema.sql</span>
                                </div>
                                <pre className="p-4 text-xs text-[#7ec8e3] overflow-x-auto whitespace-pre-wrap leading-5">{q.schema}</pre>
                            </div>
                        </div>
                        {q.sample_test_cases.map((tc, i) => (
                            <div key={i} className="mb-3 bg-[#282828] border border-[#3e3e3e] rounded-lg p-3">
                                <p className="text-[10px] text-[#6c757d] uppercase font-semibold mb-2">Expected Output</p>
                                <pre className="text-xs text-[#2cbb5d] font-mono">{tc.result}</pre>
                            </div>
                        ))}
                    </>
                )}
            </div>
            <div className="flex-1 flex flex-col bg-[#1e1e1e]">
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#3e3e3e] bg-[#1a1a1a] shrink-0">
                    <div className="relative">
                        <button onClick={() => setShowLangMenu(p => !p)}
                            className="flex items-center gap-1.5 text-xs text-[#eff1f6bf] bg-[#2d2d2d] hover:bg-[#3e3e3e] px-3 py-1.5 rounded">
                            {lang} <ChevronDown className="w-3 h-3" />
                        </button>
                        {showLangMenu && (
                            <div className="absolute top-full left-0 mt-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded-lg shadow-2xl z-50 flex flex-col w-40 py-1 max-h-48 overflow-auto custom-scrollbar">
                                {SQL_LANGS.map(l => (
                                    <button key={l} onClick={() => { setLang(l); setShowLangMenu(false); }}
                                        className={`text-left px-3 py-2 text-xs hover:bg-[#3e3e3e] ${l === lang ? 'text-[#2cbb5d]' : 'text-[#eff1f6bf]'}`}>
                                        {l === lang && '✓ '}{l}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-[#6c757d]">Exam #{examNumber + 1}</span>
                </div>
                <div className="flex flex-1 overflow-hidden font-mono">
                    <div className="w-10 bg-[#1e1e1e] py-3 text-right pr-2 select-none shrink-0">
                        {lines.map(n => <div key={n} className="text-[#3e3e3e] text-xs leading-5">{n}</div>)}
                    </div>
                    <textarea value={query} onChange={e => setQuery(e.target.value)}
                        className="flex-1 bg-[#1e1e1e] text-[#c678dd] text-xs py-3 pl-2 pr-4 resize-none outline-none leading-5"
                        spellCheck={false} style={{ fontFamily: 'Menlo,Monaco,Consolas,monospace' }} />
                </div>
                <div className="flex items-center justify-between px-4 py-1.5 border-t border-b border-[#3e3e3e] bg-[#1a1a1a] text-xs text-[#6c757d] shrink-0">
                    <span>Saved</span><span>Ln 1, Col 1</span>
                </div>
                <div className="h-32 border-t border-[#3e3e3e] bg-[#1a1a1a] p-3 overflow-auto">
                    {submissions[q.id] ? (
                        <div className="text-xs font-mono">
                            <div className="text-[#2cbb5d] flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4" /> Query submitted</div>
                            <p className="text-[#6c757d]">Expected: {q.sample_test_cases[0]?.result}</p>
                        </div>
                    ) : <p className="text-xs text-[#6c757d] font-mono">Click Run or Submit to test your query.</p>}
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-[#3e3e3e] bg-[#1a1a1a] shrink-0">
                    <button onClick={() => onSubmission(q.id, query)} className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-4 py-1.5 rounded font-medium"><Upload className="w-3.5 h-3.5" /> Submit</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function ProctorAssessmentPage() {
    const [section, setSection] = useState<Section>('A');
    const [examNumber, setExamNumber] = useState(0);
    const [examReady, setExamReady] = useState(false);

    // Elevated State
    const [mcqAnswers, setMcqAnswers] = useState<Record<number, string>>({});
    const [codingSubmissions, setCodingSubmissions] = useState<Record<number, any>>({});
    const [sqlSubmissions, setSqlSubmissions] = useState<Record<number, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const startTimeRef = useRef<number>(0);
    const [timeTakenLabel, setTimeTakenLabel] = useState("");

    // Read examNumber from localStorage after mount to avoid SSR hydration mismatch
    useEffect(() => {
        startTimeRef.current = Date.now();
        const n = parseInt(localStorage.getItem('examNumber') || '0');
        localStorage.setItem('examNumber', String(n + 1));
        setExamNumber(n);
        setExamReady(true);
    }, []);

    const [coding, setCoding] = useState<CodingQ[]>([]);
    const [mcq, setMCQ] = useState<MCQQ[]>([]);
    const [sql, setSQL] = useState<SQLQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [proctorId, setProctorId] = useState<number | null>(null);
    const [showProctor, setShowProctor] = useState(true);
    const [activeWarning, setActiveWarning] = useState<ProctorEvent | null>(null);
    const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);

    useEffect(() => {
        if (!examReady) return; // wait until localStorage exam number is loaded
        Promise.all([
            fetch(`/api/v1/assessment/bank/coding?exam_number=${examNumber}`).then(r => r.json()),
            fetch(`/api/v1/assessment/bank/mcq?exam_number=${examNumber}`).then(r => r.json()),
            fetch(`/api/v1/assessment/bank/sql?exam_number=${examNumber}`).then(r => r.json()),
        ]).then(([c, m, s]) => {
            setCoding(c.questions || []);
            setMCQ(m.questions || []);
            setSQL(s.questions || []);
            setLoading(false);
        }).catch(e => { setError(String(e)); setLoading(false); });
    }, [examReady, examNumber]);

    useEffect(() => {
        fetch('/api/v1/assessment/proctor/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assessment_id: 1 }) })
            .then(r => r.json()).then(d => setProctorId(d.session_id)).catch(() => { });
    }, []);

    const handleProctorWarning = (event: ProctorEvent) => {
        setActiveWarning(event);
        setTimeout(() => setActiveWarning(null), 5000); // Hide toast after 5s
    };

    const submitExam = () => {
        const timeDiff = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const mins = Math.floor(timeDiff / 60);
        const secs = timeDiff % 60;
        setTimeTakenLabel(`${mins}m ${secs}s`);
        setIsSubmitted(true);
    };

    const handleAutoSubmit = () => {
        setIsAutoSubmitted(true);
        submitExam();
    };

    const SECTION_TIMES = {
        A: 20 * 60,
        B: 60 * 60,
        C: 40 * 60,
    };

    const handleTimeUp = () => {
        if (section === 'A') setSection('B');
        else if (section === 'B') setSection('C');
        else submitExam();
    };

    const nextSection = () => {
        if (section === 'A') setSection('B');
        else if (section === 'B') setSection('C');
        else submitExam();
    };


    const sections = [{ id: 'A' as Section, label: 'MCQ', icon: '📋' }, { id: 'B' as Section, label: 'Coding', icon: '</>' }, { id: 'C' as Section, label: 'SQL', icon: '🗃' }];

    if (isSubmitted && !loading && !error) {
        return (
            <AssessmentReport
                mcqData={{ questions: mcq, answers: mcqAnswers }}
                codingData={{ questions: coding, submissions: codingSubmissions }}
                sqlData={{ questions: sql, submissions: sqlSubmissions }}
                trustScore={95}
                timeTaken={timeTakenLabel}
                onClose={() => window.location.href = '/dashboard'}
            />
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#131313] text-white overflow-hidden" style={{ fontFamily: 'system-ui,sans-serif' }}>
            {/* Top bar */}
            <div className="flex items-center h-11 px-4 border-b border-[#3e3e3e] bg-[#1a1a1a] shrink-0 z-30">
                {sections.map(s => (
                    <div key={s.id}
                        className={`flex items-center gap-2 px-4 h-full text-xs font-medium border-b-2 transition-colors ${section === s.id ? 'border-[#ffa116] text-[#ffa116]' : 'border-transparent text-[#6c757d]'}`}>
                        <span>{s.icon}</span> Section {s.id} — {s.label}
                    </div>
                ))}
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs text-[#eff1f6bf]"><Clock className="w-3.5 h-3.5 text-[#6c757d]" /><Timer secs={SECTION_TIMES[section]} label={section} onTimeUp={handleTimeUp} /></div>
                    <button onClick={() => setShowProctor(p => !p)} className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 ${showProctor ? 'bg-[#ef474320] text-[#ef4743]' : 'bg-[#2d2d2d] text-[#6c757d]'}`}><MonitorPlay className="w-3.5 h-3.5" /> Proctor</button>
                    <button onClick={nextSection} className="flex items-center gap-1 5 text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded font-medium shadow-lg">
                        {section === 'C' ? <><Send className="w-3.5 h-3.5" /> Submit Exam</> : <>Next Section <ChevronRight className="w-3.5 h-3.5" /></>}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-[#6c757d]">
                            <div className="w-12 h-12 rounded-full border-t-2 border-[#ffa116] animate-spin" />
                            <p className="text-[#eff1f6bf] font-semibold">Loading question bank...</p>
                            <p className="text-sm">Exam #{examNumber + 1} · Questions from bank</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-[#ef474312] border border-[#ef474344] rounded-xl p-8 max-w-md text-center">
                                <AlertTriangle className="w-10 h-10 text-[#ef4743] mx-auto mb-3" />
                                <p className="text-[#ef4743] text-sm">{error}</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={section} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} className="h-full">
                                {section === 'A' && <SectionA questions={mcq} examNumber={examNumber} answers={mcqAnswers} onAnswer={(id, ans) => setMcqAnswers(p => ({ ...p, [id]: ans }))} />}
                                {section === 'B' && <SectionB questions={coding} examNumber={examNumber} submissions={codingSubmissions} onSubmission={(id, code, results) => setCodingSubmissions(p => ({ ...p, [id]: { code, results } }))} />}
                                {section === 'C' && <SectionC questions={sql} examNumber={examNumber} submissions={sqlSubmissions} onSubmission={(id, query, results) => setSqlSubmissions(p => ({ ...p, [id]: { query, results } }))} />}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {showProctor && (
                    <div className="w-64 border-l border-[#3e3e3e] bg-[#1a1a1a] flex flex-col shrink-0">
                        <ProctorEngine
                            sessionId={proctorId}
                            onWarning={handleProctorWarning}
                            onAutoSubmit={handleAutoSubmit}
                            maxWarnings={3}
                        />
                        <div className="p-3 border-t border-[#3e3e3e]">
                            <p className="text-[10px] text-[#6c757d] uppercase font-semibold mb-2">Exam #{examNumber + 1}</p>
                            {sections.map(s => (
                                <div key={s.id} className={`w-full text-left text-xs py-1.5 px-2 rounded mb-1 ${section === s.id ? 'bg-[#ffa11618] text-[#ffa116]' : 'text-[#6c757d]'} flex items-center gap-2`}>
                                    {s.icon} {s.id}{section === s.id && ' ▶'}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Warning Overlay Toast */}
            <AnimatePresence>
                {activeWarning && !isAutoSubmitted && (
                    <motion.div initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#ef4743] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-lg w-full border border-[#ff6b6b]">
                        <AlertOctagon className="w-8 h-8 shrink-0" />
                        <div>
                            <p className="font-bold text-base bg-white/20 px-2 py-0.5 rounded inline-block mb-1 tracking-wider uppercase">Proctor Warning</p>
                            <p className="text-sm font-medium">{activeWarning?.message}</p>
                            <p className="text-xs text-white/70 mt-1">Rule violation detected by AI monitoring system.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Auto-Submit Lock Screen */}
            <AnimatePresence>
                {isAutoSubmitted && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                        <div className="bg-[#1a1a1a] border border-[#ef4743] rounded-2xl max-w-md w-full p-8 text-center shadow-[0_0_50px_rgba(239,71,67,0.2)]">
                            <ShieldAlert className="w-16 h-16 text-[#ef4743] mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">Exam Terminated</h2>
                            <p className="text-[#eff1f6bf] mb-6">
                                Your exam has been automatically submitted because the maximum number of proctoring warnings (3) was exceeded.
                            </p>
                            <button onClick={() => window.location.href = '/dashboard'} className="bg-[#ef4743] hover:bg-[#d63d3a] text-white font-medium py-2.5 px-6 rounded-lg transition-colors w-full">
                                Return to Dashboard
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
