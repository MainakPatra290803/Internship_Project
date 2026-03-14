"use client";
/**
 * ProctorEngine — Real CV-based proctoring using backend OpenCV via WebSockets.
 * Detects:
 *   1. No face visible (face hidden / looking away)
 *   2. Multiple faces in frame
 *   3. Mobile phone in frame (Object detection)
 * Issues a warning for each violation. At MAX_WARNINGS → auto-submits exam.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Video, Loader2 } from 'lucide-react';

export interface ProctorEvent {
    type: 'no_face' | 'multiple_faces' | 'phone_detected' | 'tab_switch';
    timestamp: string;
    message: string;
}

interface ProctorEngineProps {
    onWarning: (event: ProctorEvent) => void;
    onAutoSubmit: () => void;
    maxWarnings?: number;
    sessionId?: number | null;
}

// Grace period between warnings (ms) — avoids repeated rapid-fire warnings
const WARNING_COOLDOWN_MS = 8000;
// How often to analyze a frame (ms)
const ANALYSIS_INTERVAL_MS = 2500;

export default function ProctorEngine({
    onWarning,
    onAutoSubmit,
    maxWarnings = 3,
    sessionId,
}: ProctorEngineProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const warningCountRef = useRef(0);
    const lastWarningTimeRef = useRef<Record<string, number>>({});
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [loadingStep, setLoadingStep] = useState('Initializing camera & connection...');
    const [warnings, setWarnings] = useState(0);
    const [lastEvent, setLastEvent] = useState<string | null>(null);
    const [faceOk, setFaceOk] = useState<boolean | null>(null);
    const [backendConnected, setBackendConnected] = useState(false);

    const issueWarning = useCallback((event: ProctorEvent) => {
        const now = Date.now();
        const last = lastWarningTimeRef.current[event.type] || 0;
        if (now - last < WARNING_COOLDOWN_MS) return; // still in cooldown

        lastWarningTimeRef.current[event.type] = now;
        warningCountRef.current += 1;
        setWarnings(warningCountRef.current);
        setLastEvent(event.message);
        onWarning(event);

        // Post to backend telemetry
        if (sessionId) {
            fetch('/api/v1/assessment/proctor/telemetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, event: event.type, timestamp: event.timestamp }),
            }).catch(() => { });
        }

        if (warningCountRef.current >= maxWarnings) {
            setTimeout(() => onAutoSubmit(), 2000);
        }
    }, [onWarning, onAutoSubmit, maxWarnings, sessionId]);

    const analyzeFrame = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
        if (wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const video = videoRef.current;
        if (video.readyState < 2) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Get base64 frame (jpeg for compression)
        const frameData = canvasRef.current.toDataURL('image/jpeg', 0.8);
        
        // Send to backend via WebSocket
        wsRef.current.send(frameData);
    }, []);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Camera
                setLoadingStep('Requesting camera access...');
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                if (!mounted) return;
                
                // WebSocket connection
                setLoadingStep('Connecting to AI Proctor backend...');
                const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                // Try connecting to the API via current origin, or localhost fallback for dev
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const wsUrl = backendUrl.replace('http', 'ws') + `/api/v1/assessment/proctor/stream/${sessionId || 0}`;
                
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (!mounted) return;
                    setBackendConnected(true);
                    setStatus('ready');
                    setLoadingStep('');
                    // Start analysis loop
                    intervalRef.current = setInterval(analyzeFrame, ANALYSIS_INTERVAL_MS);
                };

                ws.onmessage = (event) => {
                    if (!mounted) return;
                    try {
                        const data = JSON.parse(event.data);
                        const now = new Date().toISOString();
                        
                        if (data.error) {
                            console.error("Backend proctor error:", data.error);
                            return;
                        }

                        // Face Status
                        if (data.faces_detected === 0) {
                            setFaceOk(false);
                            issueWarning({ type: 'no_face', timestamp: now, message: '⚠️ No face detected — keep your face visible!' });
                        } else if (data.faces_detected > 1) {
                            setFaceOk(false);
                            issueWarning({ type: 'multiple_faces', timestamp: now, message: `⚠️ ${data.faces_detected} faces detected — only 1 person allowed!` });
                        } else {
                            setFaceOk(true);
                        }

                        // Phone Detection
                        if (data.phone_detected) {
                            issueWarning({ type: 'phone_detected', timestamp: now, message: '⚠️ Mobile phone detected in frame!' });
                        }
                    } catch (err) {
                        console.error("Failed to parse websocket message:", err);
                    }
                };

                ws.onerror = (error) => {
                    console.error("WebSocket error:", error);
                    if (mounted && status !== 'ready') {
                        setStatus('error');
                        setLoadingStep('Could not connect to Proctor server. Need a configured NEXT_PUBLIC_API_URL or local server on port 8000.');
                    }
                };
                
                ws.onclose = () => {
                    if (mounted) {
                        setBackendConnected(false);
                        if (intervalRef.current) clearInterval(intervalRef.current);
                    }
                };

            } catch (e: any) {
                if (mounted) {
                    setStatus('error');
                    setLoadingStep(e?.message || 'Camera error');
                }
            }
        };

        if (sessionId !== null) {
            init();
        }

        // Tab switch detection
        const onVisibilityChange = () => {
            if (document.hidden) {
                issueWarning({
                    type: 'tab_switch',
                    timestamp: new Date().toISOString(),
                    message: '⚠️ Tab switched — stay on the exam page!',
                });
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            mounted = false;
            if (intervalRef.current) clearInterval(intervalRef.current);
            streamRef.current?.getTracks().forEach(t => t.stop());
            if (wsRef.current) {
                wsRef.current.close();
            }
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [sessionId, analyzeFrame, issueWarning]);

    const trustScore = Math.max(0, 100 - warningCountRef.current * 30);

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a]">
            {/* Camera feed */}
            <div className="p-3 border-b border-[#3e3e3e]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-[#eff1f6bf] flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Camera
                    </span>
                    <span className="flex items-center gap-1.5 text-xs">
                        {status === 'ready'
                            ? <><span className="w-1.5 h-1.5 rounded-full bg-[#ef4743] animate-pulse" /><span className="text-[#ef4743]">LIVE</span></>
                            : status === 'loading'
                                ? <><Loader2 className="w-3 h-3 animate-spin text-[#ffa116]" /><span className="text-[#ffa116]">Loading</span></>
                                : <><AlertTriangle className="w-3 h-3 text-[#ef4743]" /><span className="text-[#ef4743]">Error</span></>
                        }
                    </span>
                </div>

                {/* Video + overlay */}
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video border border-[#3e3e3e]">
                    <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover -scale-x-100" />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Face status overlay */}
                    {status === 'ready' && (
                        <div className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1
                            ${faceOk === true ? 'bg-[#2cbb5d22] text-[#2cbb5d] border border-[#2cbb5d44]'
                                : faceOk === false ? 'bg-[#ef474322] text-[#ef4743] border border-[#ef474344]'
                                    : 'bg-[#2d2d2d] text-[#6c757d]'}`}>
                            {faceOk === true ? <><CheckCircle className="w-2.5 h-2.5" /> Face OK</>
                                : faceOk === false ? <><AlertTriangle className="w-2.5 h-2.5" /> Face hidden</>
                                    : '⏳ Scanning'}
                        </div>
                    )}

                    {/* Loading overlay */}
                    {status === 'loading' && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-center p-2">
                            <Loader2 className="w-5 h-5 text-[#ffa116] animate-spin mb-2" />
                            <p className="text-[10px] text-[#eff1f6bf]">{loadingStep}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Trust Score */}
            <div className="p-3 flex-1">
                <p className="text-xs font-medium text-[#eff1f6bf] flex items-center gap-1.5 mb-3">
                    <ShieldAlert className="w-3.5 h-3.5" /> Trust Score
                </p>

                {/* Score bar */}
                <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#6c757d]">Score</span>
                        <span className={trustScore > 60 ? 'text-[#2cbb5d]' : trustScore > 30 ? 'text-[#ffa116]' : 'text-[#ef4743]'}>{trustScore}%</span>
                    </div>
                    <div className="h-1.5 bg-[#2d2d2d] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${trustScore > 60 ? 'bg-[#2cbb5d]' : trustScore > 30 ? 'bg-[#ffa116]' : 'bg-[#ef4743]'}`}
                            style={{ width: `${trustScore}%` }} />
                    </div>
                </div>

                {/* Warning indicators */}
                <div className="flex gap-1.5 mb-3">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-300
                            ${i < warnings ? (warnings >= maxWarnings ? 'bg-[#ef4743] animate-pulse' : 'bg-[#ffa116]') : 'bg-[#2d2d2d]'}`} />
                    ))}
                </div>
                <p className="text-[10px] text-[#6c757d] mb-3">
                    {warnings === 0 ? 'No violations' : `${warnings}/${maxWarnings} warning${warnings > 1 ? 's' : ''} — ${maxWarnings - warnings} remaining`}
                </p>

                {/* Detection status grid */}
                <div className="space-y-2 text-xs mb-3">
                    {[
                        { label: 'Backend Server', ok: backendConnected },
                        { label: 'Face visible', ok: faceOk === null ? null : faceOk === true },
                        { label: 'Single person', ok: faceOk === null ? null : faceOk !== false },
                        { label: 'No phone', ok: !lastEvent?.includes('phone') },
                        { label: 'On exam tab', ok: !lastEvent?.includes('Tab') },
                    ].map(({ label, ok }) => (
                        <div key={label} className="flex justify-between">
                            <span className="text-[#6c757d]">{label}</span>
                            <span className={ok === true ? 'text-[#2cbb5d]' : ok === false ? 'text-[#ef4743]' : 'text-[#ffa116]'}>
                                {ok === true ? '✓' : ok === false ? '✗' : '⏳'}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Last event */}
                {lastEvent && (
                    <div className="bg-[#ef474312] border border-[#ef474330] rounded-lg p-2 text-[10px] text-[#ef4743]">
                        {lastEvent}
                    </div>
                )}

                {/* Auto-submit banner */}
                {warnings >= maxWarnings && (
                    <div className="mt-3 bg-[#ef474320] border border-[#ef4743] rounded-lg p-2 text-xs text-[#ef4743] font-bold text-center animate-pulse">
                        🚫 Max warnings reached!<br />
                        <span className="font-normal text-[10px]">Auto-submitting exam...</span>
                    </div>
                )}

                {/* CV model info */}
                {status === 'ready' && (
                    <div className="mt-3 pt-3 border-t border-[#3e3e3e]">
                        <p className="text-[9px] text-[#3e3e3e] uppercase tracking-wider font-semibold mb-1">AI Models Active</p>
                        <p className="text-[9px] text-[#555]">Backend OpenCV · YOLOv3 · Tab Monitor</p>
                    </div>
                )}
            </div>
        </div>
    );
}
