"use client";

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, AlertTriangle, Fingerprint, Eye, Activity, Lock, Check } from 'lucide-react';

export function BiometricScanner({ onCapture }: { onCapture: (img: string) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [scanStep, setScanStep] = useState(0); // 0: Init, 1: Geometry, 2: Retina, 3: Complete
    const [error, setError] = useState<string | null>(null);

    const steps = [
        { text: "INITIALIZING BIOMETRIC SENSORS", sub: "Align face within the frame", icon: Scan },
        { text: "MAPPING FACIAL GEOMETRY", sub: "Calculating 468 landmark points", icon: Fingerprint },
        { text: "RETINAL PATTERN ANALYSIS", sub: "Hold still for micro-saccade detection", icon: Eye },
        { text: "SYNCHRONIZATION COMPLETE", sub: "Neural link established", icon: Lock }
    ];

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Sequence Logic
            let currentStep = 0;
            const interval = setInterval(() => {
                currentStep++;
                if (currentStep >= steps.length) {
                    clearInterval(interval);
                    setTimeout(capture, 1000);
                } else {
                    setScanStep(currentStep);
                }
            }, 2500); // 2.5s per step

        } catch (err) {
            setError("Secure camera link blocked. Switching to simulation protocol.");
            setTimeout(() => onCapture("sim"), 2000);
        }
    };

    useEffect(() => {
        // Face Mesh Animation Loop
        if (!canvasRef.current || scanStep === 3) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        let frame = 0;
        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, 800, 600);

            if (scanStep === 1) { // Geometry Phase
                ctx.strokeStyle = `rgba(14, 165, 233, 0.4)`;
                ctx.lineWidth = 1;
                // Draw grid
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    ctx.moveTo(100 + i * 60, 100);
                    ctx.lineTo(100 + i * 60 + Math.sin(frame * 0.05 + i) * 20, 500);
                    ctx.stroke();
                }
            }

            if (scanStep === 2) { // Retina Phase
                // Draw circles aiming at eyes
                const x1 = 300 + Math.sin(frame * 0.1) * 10;
                const y1 = 300 + Math.cos(frame * 0.1) * 10;

                ctx.strokeStyle = '#ef4444'; // Red for retina
                ctx.beginPath();
                ctx.arc(x1, y1, 30 + Math.sin(frame * 0.2) * 5, 0, Math.PI * 2);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x1 - 50, y1);
                ctx.lineTo(x1 + 50, y1);
                ctx.moveTo(x1, y1 - 50);
                ctx.lineTo(x1, y1 + 50);
                ctx.stroke();
            }

            requestAnimationFrame(animate);
        };
        const anim = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(anim);
    }, [scanStep]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const capture = () => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        stopCamera();
    };

    const CurrentIcon = steps[scanStep]?.icon || Check;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-sky-500/30 group">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10 opactiy-50" />

            {error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500 font-mono">
                    <AlertTriangle className="w-12 h-12 mb-4 animate-pulse" />
                    <p className="tracking-widest uppercase text-sm">{error}</p>
                </div>
            ) : (
                <>
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60 filter contrast-125 saturate-0" />

                    {/* Mesh Overlay */}
                    <canvas ref={canvasRef} width={800} height={600} className="absolute inset-0 w-full h-full z-20" />

                    {/* HUD Elements */}
                    <div className="absolute inset-0 z-30 pointer-events-none p-6 flex flex-col justify-between">

                        {/* Top Bar */}
                        <div className="flex justify-between items-start">
                            <div className="flex gap-2">
                                <div className="h-2 w-8 bg-sky-500 animate-pulse" />
                                <div className="h-2 w-2 bg-sky-500/50" />
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-sky-500">SECURE_LINK: <span className="text-emerald-500">ENCRYPTED</span></div>
                                <div className="text-[10px] font-mono text-sky-500/50">LATENCY: 12ms</div>
                            </div>
                        </div>

                        {/* Center Reticle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-sky-500/30 rounded-full flex items-center justify-center">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-3 bg-sky-500" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-3 bg-sky-500" />
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-1 bg-sky-500" />
                            <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-3 h-1 bg-sky-500" />

                            {/* Dynamic Radius Scanner */}
                            <motion.div
                                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="w-full h-full border-t border-sky-500/50 rounded-full"
                            />
                        </div>

                        {/* Bottom Status Panel */}
                        <div className="bg-black/80 backdrop-blur-md border-l-4 border-sky-500 p-4 max-w-sm rounded-r-lg">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-sky-500/20 rounded-lg">
                                    <CurrentIcon className="w-6 h-6 text-sky-400 animate-pulse" />
                                </div>
                                <div>
                                    <div className="text-sky-400 font-bold font-mono tracking-wider text-sm">
                                        {steps[scanStep]?.text || "PROCESSING"}
                                    </div>
                                    <div className="text-sky-500/60 text-[10px] uppercase tracking-widest font-mono mt-1">
                                        {steps[scanStep]?.sub}
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-1 bg-gray-800 mt-3 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-sky-500 shadow-[0_0_10px_#0ea5e9]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${((scanStep + 1) / steps.length) * 100}%` }}
                                />
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}
