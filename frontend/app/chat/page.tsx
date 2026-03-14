"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Send, Bot, User, MessageSquare, Plus, Menu, X, History, Clock, Paperclip } from 'lucide-react';

import { AuthNavbar } from '@/components/ui/AuthNavbar';
import { fetchChatHistory, fetchChatSessions } from '@/app/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AICamera from '@/app/components/AICamera';
import AIVoiceButton from '@/app/components/AIVoiceButton';
import AIStudyNotes from '@/app/components/AIStudyNotes';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hello! I am your AI Tutor. What topic are you studying today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [showStudyNotes, setShowStudyNotes] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setIsMounted(true);
        loadSessions();
    }, []);

    const loadSessions = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        try {
            const data = await fetchChatSessions();
            setSessions(data);
        } catch (error: any) {
            console.error('Failed to load sessions:', error);
            if (error.message === 'Unauthorized' || error.message.includes('401')) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        }
    };

    const startNewChat = () => {
        setSessionId(null);
        setMessages([
            { role: 'assistant', content: 'Hello! I am your AI Tutor. What topic are you studying today?' }
        ]);
    };

    const loadPastSession = async (sid: number) => {
        setLoading(true);
        try {
            const data = await fetchChatHistory(sid);
            setSessionId(sid);
            setMessages(data.messages);
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
        } catch (error) {
            console.error('Failed to load session history:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsgContent = input;
        const newMsg: Message = { role: 'user', content: userMsgContent };
        setMessages(prev => [...prev, newMsg]);
        setInput('');
        setLoading(true);

        try {
            // Add initial empty assistant message to stream into
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/learning/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    content: userMsgContent,
                    session_id: sessionId,
                    topic_context: messages.length === 1 ? userMsgContent : undefined
                })
            });

            if (!res.ok) throw new Error('Failed to fetch');

            // Get Session ID from header
            const newSessionId = res.headers.get("X-Session-ID");
            if (newSessionId && !sessionId) {
                setSessionId(parseInt(newSessionId));
                loadSessions(); // Refresh list after starting new session
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });

                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    // Verify it's the assistant message we just added
                    if (lastMsg.role === 'assistant') {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...lastMsg,
                            content: lastMsg.content + chunkValue
                        };
                        return updated;
                    }
                    return prev;
                });
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last.role === 'assistant' && last.content === '') {
                    // Remove empty if failed immediately or replace content
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'assistant', content: "I'm having trouble connecting. Please try again." };
                    return updated;
                }
                return [...prev, { role: 'assistant', content: "I'm having trouble connecting. Please try again." }];
            });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        // Clear input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';

        const formData = new FormData();
        formData.append('file', file);
        if (sessionId) {
            formData.append('session_id', sessionId.toString());
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/learning/chat/upload', {
                method: 'POST',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Upload failed');

            // Successfully parsed text
            const sysMsg = `I have uploaded a document named "${data.filename}". Please use the following content as context for my upcoming questions. Do not answer questions yet, just acknowledge that you received it and are ready to help:\n\n${data.extracted_text}`;

            // Add a user message to show in the UI visually, but we actually send the system-styled message to the LLM to prime its context
            setMessages(prev => [...prev, { role: 'user', content: `[Uploaded File: ${data.filename}]` }]);

            // We use the same stream endpoint structure to send the extracted text invisibly to the backend for context
            setLoading(true);
            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            const streamRes = await fetch('/api/v1/learning/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    content: sysMsg,
                    session_id: sessionId,
                    topic_context: messages.length === 1 ? data.filename : undefined
                })
            });

            if (!streamRes.ok) throw new Error('Failed to fetch acknowledging context');

            const newSessionId = streamRes.headers.get("X-Session-ID");
            if (newSessionId && !sessionId) {
                setSessionId(parseInt(newSessionId));
                loadSessions();
            }

            if (!streamRes.body) throw new Error("No response body");

            const reader = streamRes.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });

                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg.role === 'assistant') {
                        const updated = [...prev];
                        updated[updated.length - 1] = {
                            ...lastMsg,
                            content: lastMsg.content + chunkValue
                        };
                        return updated;
                    }
                    return prev;
                });
            }

        } catch (error: any) {
            console.error('File upload err:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I failed to process that file: ${error.message}` }]);
        } finally {
            setIsUploading(false);
            setLoading(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    return (
        <div className="fixed inset-0 bg-black text-white flex flex-col font-sans overflow-hidden">
            <AuthNavbar />

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Toggle (Mobile) */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="fixed bottom-24 left-6 z-50 p-3 bg-blue-600 rounded-full shadow-lg lg:hidden"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <History className="w-6 h-6" />}
                </button>

                {/* AI Study Notes Overlay */}
                <AnimatePresence>
                    {showStudyNotes && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        >
                            <div className="relative w-full max-w-2xl">
                                <button
                                    onClick={() => setShowStudyNotes(false)}
                                    className="absolute -top-12 right-0 text-white/60 hover:text-white flex items-center gap-1 text-sm font-medium"
                                >
                                    <X className="w-5 h-5" /> Close Notes
                                </button>
                                <AIStudyNotes />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sidebar - History Section */}
                <AnimatePresence>
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -300, opacity: 0 }}
                            className="absolute lg:relative z-40 w-72 h-full bg-[#0a0a0b] border-r border-white/5 flex flex-col backdrop-blur-3xl shadow-2xl"
                        >
                            <div className="p-4 border-b border-white/5">
                                <Button
                                    onClick={startNewChat}
                                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl py-6 group transition-all"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    <span>New Tuition Session</span>
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                <div className="px-3 mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span>Recent Sessions</span>
                                </div>
                                {sessions.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => loadPastSession(s.id)}
                                        className={`w-full p-4 rounded-xl text-left transition-all border group ${sessionId === s.id
                                            ? 'bg-blue-600/10 border-blue-500/50 text-blue-400'
                                            : 'bg-transparent border-transparent hover:bg-white/5 text-gray-400'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${sessionId === s.id ? 'bg-blue-600/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 truncate">
                                                <div className="font-bold text-sm truncate uppercase tracking-tight">
                                                    {s.topic_context || `Session #${s.id}`}
                                                </div>
                                                <div className="text-[10px] text-gray-500 mt-0.5">
                                                    {new Date(s.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="p-8 text-center text-gray-600">
                                        <Bot className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-xs italic">No history yet.</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-[#050505] relative min-w-0 min-h-0">
                    {/* Header */}
                    <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#0a0a0b]/50 backdrop-blur-md flex-shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hidden lg:block"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-base tracking-tight">AI Tutor</h2>
                                    <p className="text-[10px] text-green-500 flex items-center gap-1 font-bold">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> SYSTEM ONLINE
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowStudyNotes(true)}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 text-[11px] font-bold uppercase transition-all"
                            >
                                Analyze Study Materials
                            </button>
                            <button
                                onClick={() => setIsCameraActive(!isCameraActive)}
                                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition-all ${isCameraActive
                                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-400'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {isCameraActive ? 'Disable Monitoring' : 'Enable Focus Monitoring'}
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar scroll-smooth min-h-0">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={idx}
                                    className={`flex gap-4 md:gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user'
                                        ? 'bg-gradient-to-br from-purple-600 to-indigo-600'
                                        : 'bg-gradient-to-br from-blue-600 to-cyan-600'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                    </div>
                                    <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-5 rounded-2xl leading-relaxed text-[15px] border ${msg.role === 'user'
                                            ? 'bg-[#1a1a1c] border-purple-500/20 text-white rounded-tr-none'
                                            : 'bg-[#111112] border-blue-500/20 text-gray-100 rounded-tl-none'
                                            }`}>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0 text-[14px] leading-relaxed text-gray-100">{children}</p>,
                                                    strong: ({ children }) => <strong className="font-bold text-white">{children}</strong>,
                                                    em: ({ children }) => <em className="italic text-gray-200">{children}</em>,
                                                    h1: ({ children }) => <h1 className="text-lg font-bold text-white mb-2 mt-3 first:mt-0">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-base font-bold text-white mb-2 mt-3 first:mt-0">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-sm font-bold text-blue-300 mb-1 mt-2 first:mt-0">{children}</h3>,
                                                    ul: ({ children }) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1">{children}</ol>,
                                                    li: ({ children }) => <li className="text-[14px] text-gray-200 leading-relaxed">{children}</li>,
                                                    code: ({ children, className }) => {
                                                        const isBlock = className?.includes('language-');
                                                        return isBlock
                                                            ? <pre className="bg-black/50 border border-white/10 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono text-green-300"><code>{children}</code></pre>
                                                            : <code className="bg-black/40 text-blue-300 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                                                    },
                                                    blockquote: ({ children }) => <blockquote className="border-l-2 border-blue-500 pl-3 my-2 text-gray-400 italic">{children}</blockquote>,
                                                    hr: () => <hr className="border-white/10 my-3" />,
                                                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">{children}</a>,
                                                    table: ({ children }) => <div className="overflow-x-auto my-2"><table className="border-collapse text-xs w-full">{children}</table></div>,
                                                    th: ({ children }) => <th className="border border-white/10 px-3 py-1.5 bg-white/5 text-left font-bold text-gray-200">{children}</th>,
                                                    td: ({ children }) => <td className="border border-white/10 px-3 py-1.5 text-gray-300">{children}</td>,
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                        <span className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-widest px-2">
                                            {msg.role === 'user' ? 'YOU' : 'AI TUTOR'} — {isMounted && new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-4 md:gap-6">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0 animate-pulse border border-blue-500/30">
                                        <Bot className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="flex gap-1 items-center py-4">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Floating AI Camera */}
                        {isCameraActive && (
                            <div className="absolute top-20 right-8 z-30 animate-in fade-in zoom-in duration-300">
                                <AICamera
                                    isActive={isCameraActive}
                                    onEmotionDetect={(emo, conf) => {
                                        if (emo === 'confused' || emo === 'frustrated') {
                                            console.log(`[AI TUTOR] Detected student is ${emo}. Adjusting hint strategy...`);
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 md:p-5 bg-[#0a0a0b]/80 backdrop-blur-xl border-t border-white/5 flex-shrink-0">
                        <div className="max-w-4xl mx-auto relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-focus-within:opacity-60" />
                            <div className="relative flex items-center gap-3">
                                <input
                                    className="flex-1 bg-[#1a1a1c] border border-white/10 rounded-2xl px-8 py-5 focus:outline-none focus:border-blue-500/50 transition-all placeholder:text-gray-600 text-[15px] shadow-2xl"
                                    placeholder="Type your academic query (Math, SQL, Physics)..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                                    disabled={loading}
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.docx,.txt,.csv,image/*"
                                    onChange={handleFileUpload}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-2 rounded-xl transition-all ${isUploading ? 'text-blue-400 bg-blue-500/10 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                    disabled={loading || isUploading}
                                    title="Upload Study Material"
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <AIVoiceButton onTranscript={(txt) => {
                                    setMessages(prev => [...prev, { role: 'assistant', content: txt }]);
                                }} />
                                <Button
                                    onClick={sendMessage}
                                    disabled={loading || !input.trim() || isUploading}
                                    className="rounded-2xl px-8 bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                >
                                    <span className="hidden md:inline font-bold uppercase tracking-tighter text-xs">Send Query</span>
                                    <Send className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
