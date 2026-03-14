"use client";

import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';

export function VoiceAnalytics({ onData }: { onData: (data: number) => void }) {
    const [listening, setListening] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    useEffect(() => {
        startListening();
        return () => stopListening();
    }, []);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContext();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            setListening(true);
            requestAnimationFrame(tick);
        } catch (err) {
            console.error("Mic Error:", err);
        }
    };

    const stopListening = () => {
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };

    const tick = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        // @ts-ignore
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate Average Volume
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
            sum += dataArrayRef.current[i];
        }
        const avg = sum / dataArrayRef.current.length;

        onData(avg);
        requestAnimationFrame(tick);
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1 bg-sky-900/10 border border-sky-500/20 rounded-full">
            <Mic className={`w-3 h-3 ${listening ? 'text-red-500 animate-pulse' : 'text-gray-500'}`} />
            <div className="text-[10px] font-mono text-sky-500">
                AUDIO_SENSOR: {listening ? "CAPTURING" : "SILENT"}
            </div>
        </div>
    );
}
