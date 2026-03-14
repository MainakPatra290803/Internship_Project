"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { processVoice } from '../lib/api';
import { Mic, MicOff, Play, Pause, Loader2 } from 'lucide-react';

interface AIVoiceButtonProps {
    onTranscript?: (text: string) => void;
}

export default function AIVoiceButton({ onTranscript }: AIVoiceButtonProps) {
    const router = useRouter();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await handleVoiceProcess(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(t => t.stop());
            };

            recorder.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing mic:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleVoiceProcess = async (blob: Blob) => {
        setIsProcessing(true);
        try {
            const result = await processVoice(blob);
            if (result.response) {
                // Speak the response
                speak(result.response);
                if (onTranscript) onTranscript(result.response);
            }
        } catch (err: any) {
            console.error("Voice processing failed:", err);
            if (err.message === 'Unauthorized' || err.message.includes('401')) {
                localStorage.removeItem('token');
                router.push('/login');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.05; // Slightly faster for natural feel
            utterance.pitch = 1.0;

            // Try to find a nice female/neural-like voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || voices[0];
            if (preferredVoice) utterance.voice = preferredVoice;

            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`relative p-4 rounded-full transition-all duration-300 shadow-lg ${isRecording
                ? 'bg-rose-500 hover:bg-rose-600 scale-110'
                : 'bg-indigo-600 hover:bg-indigo-700'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isRecording ? "Stop Recording" : "Talk to AI Tutor"}
        >
            {isProcessing ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
            ) : isRecording ? (
                <MicOff className="w-6 h-6 text-white" />
            ) : (
                <Mic className="w-6 h-6 text-white" />
            )}

            {isRecording && (
                <span className="absolute -inset-1 rounded-full bg-rose-500 animate-ping opacity-25" />
            )}
        </button>
    );
}
