"use client";

import React, { useRef, useEffect, useState } from 'react';
import { detectEmotion } from '../lib/api';

interface AICameraProps {
    onEmotionDetect?: (emotion: string, confidence: number) => void;
    isActive: boolean;
}

export default function AICamera({ onEmotionDetect, isActive }: AICameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [lastEmotion, setLastEmotion] = useState<string>('Normal');

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isActive) {
            startCamera();
            interval = setInterval(captureAndAnalyze, 5000); // Analyze every 5 seconds
        } else {
            stopCamera();
        }

        return () => {
            if (interval) clearInterval(interval);
            stopCamera();
        };
    }, [isActive]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing webcam:", err);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const captureAndAnalyze = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;

        // Draw video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

        // Get base64 image
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.5);

        try {
            const result = await detectEmotion(imageData);
            if (result.emotion) {
                setLastEmotion(result.emotion);
                if (onEmotionDetect) {
                    onEmotionDetect(result.emotion, result.confidence || 1.0);
                }
            }
        } catch (err) {
            console.error("Emotion analysis failed:", err);
        }
    };

    return (
        <div className="relative w-48 h-36 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.2)] border border-emerald-500/30 group bg-black/40 backdrop-blur-md">
            <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning lines animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-[2px] bg-emerald-500/50 absolute top-0 animate-[scan_3s_linear_infinite]" />
            </div>

            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[9px] text-white font-bold opacity-0 group-hover:opacity-100 transition-all transform -translate-y-2 group-hover:translate-y-0">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                AI ADAPTIVE ENGINE
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] text-emerald-400/70 font-bold uppercase tracking-widest">Cognitive State</span>
                    <div className="flex items-center justify-between">
                        <span className="text-[12px] text-white font-bold uppercase tracking-tight">
                            {lastEmotion}
                        </span>
                        <div className="flex gap-0.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-1 h-3 rounded-full ${i <= 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
        </div>
    );
}
