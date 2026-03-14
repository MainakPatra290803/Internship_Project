"use client";

import { useEffect, useRef } from 'react';

export function RealTimeGraph({ color = '#0ea5e9', label }: { color?: string, label: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Config
        const points: number[] = [];
        const maxPoints = 50;

        // Animation Loop
        let frame = 0;
        const animate = () => {
            frame++;
            // Simulate data (Sin wave + noise)
            const val = 50 + Math.sin(frame * 0.1) * 30 + (Math.random() - 0.5) * 10;
            points.push(val);
            if (points.length > maxPoints) points.shift();

            // Draw
            ctx.clearRect(0, 0, 300, 100);

            // Grid
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, 50);
            ctx.lineTo(300, 50);
            ctx.stroke();

            // Line
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            points.forEach((p, i) => {
                const x = (i / maxPoints) * 300;
                const y = 100 - p;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            // Dot
            if (points.length > 0) {
                const lastX = 300;
                const lastY = 100 - points[points.length - 1];
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
                ctx.fill();

                // Glow
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
            } else {
                ctx.shadowBlur = 0;
            }

            requestAnimationFrame(animate);
        };
        const anim = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(anim);
    }, [color]);

    return (
        <div className="bg-black/50 border border-white/10 p-4 rounded-lg backdrop-blur-sm">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2 flex justify-between">
                {label}
                <span className="text-white animate-pulse">LIVE</span>
            </div>
            <canvas ref={canvasRef} width={300} height={100} className="w-full h-16" />
        </div>
    );
}
