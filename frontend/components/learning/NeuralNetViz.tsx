"use client";

import { useEffect, useRef } from 'react';

export function NeuralNetViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 400;
        canvas.height = 200;

        const layers = [4, 6, 6, 4];
        const neurons: { x: number, y: number, a: number }[] = [];

        // Init Neurons
        layers.forEach((count, layerIdx) => {
            const x = (layerIdx + 1) * (canvas.width / (layers.length + 1));
            for (let i = 0; i < count; i++) {
                const y = (i + 1) * (canvas.height / (count + 1));
                neurons.push({ x, y, a: 0 });
            }
        });

        let frame = 0;
        const animate = () => {
            frame++;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Connections
            ctx.strokeStyle = `rgba(14, 165, 233, 0.2)`;
            ctx.lineWidth = 1;

            // Simply draw random connections firing
            neurons.forEach((n1, i) => {
                neurons.forEach((n2, j) => {
                    if (Math.abs(n1.x - n2.x) < 100 && n2.x > n1.x) {
                        if (Math.random() > 0.98) {
                            ctx.beginPath();
                            ctx.moveTo(n1.x, n1.y);
                            ctx.lineTo(n2.x, n2.y);
                            ctx.strokeStyle = `rgba(14, 165, 233, ${Math.random()})`;
                            ctx.stroke();
                        }
                    }
                });
            });

            // Neurons
            neurons.forEach(n => {
                ctx.beginPath();
                ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(14, 165, 233, ${0.5 + Math.sin(frame * 0.1 + n.x) * 0.5})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };
        animate();

    }, []);

    return <canvas ref={canvasRef} className="w-full h-32 opacity-80" />;
}
