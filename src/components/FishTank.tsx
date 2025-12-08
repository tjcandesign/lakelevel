'use client';

import React, { useEffect, useRef, useState } from 'react';

type FishType = 'trout' | 'bass' | 'walleye' | 'striper';

interface Fish {
    id: number;
    type: FishType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    scale: number;
    flip: boolean;
}

const FISH_TYPES: FishType[] = ['trout', 'bass', 'walleye', 'striper'];

export default function FishTank() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [fishes, setFishes] = useState<Fish[]>([]);
    const mouseRef = useRef<{ x: number, y: number } | null>(null);
    const requestRef = useRef<number>(0);

    // Initial Spawn - Reduced to 4 as per previous state
    useEffect(() => {
        const initialFishes: Fish[] = Array.from({ length: 4 }).map((_, i) => ({
            id: i,
            type: FISH_TYPES[i % FISH_TYPES.length],
            x: Math.random() * 100,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.1, // Slower random movement
            vy: (Math.random() - 0.5) * 0.05,
            scale: 0.5 + Math.random() * 0.5,
            flip: Math.random() > 0.5
        }));
        setFishes(initialFishes);
    }, []);

    // Animation Loop
    useEffect(() => {
        const update = () => {
            setFishes(prevFishes => prevFishes.map(fish => {
                let { x, y, vx, vy, flip } = fish;

                // 1. Target Attraction (Bait)
                if (mouseRef.current) {
                    const dx = mouseRef.current.x - x;
                    const dy = mouseRef.current.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 40) { // Attraction range (percent)
                        vx += (dx / dist) * 0.02; // Reduced acceleration
                        vy += (dy / dist) * 0.02;
                    }
                }

                // 2. Random Wandering
                vx += (Math.random() - 0.5) * 0.01;
                vy += (Math.random() - 0.5) * 0.005;

                // 3. Friction/Speed Limit (HALVED)
                const speed = Math.sqrt(vx * vx + vy * vy);
                const maxSpeed = mouseRef.current ? 0.4 : 0.15;
                if (speed > maxSpeed) {
                    vx = (vx / speed) * maxSpeed;
                    vy = (vy / speed) * maxSpeed;
                }

                // 4. Update Position
                x += vx;
                y += vy;

                // 5. Boundary Wrap/Bounce
                if (x < -10) x = 110;
                if (x > 110) x = -10;
                if (y < 0) { y = 0; vy *= -1; }
                if (y > 100) { y = 100; vy *= -1; }

                // 6. Orientation
                if (vx > 0.05) flip = true;
                if (vx < -0.05) flip = false;

                return { ...fish, x, y, vx, vy, flip };
            }));
            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        mouseRef.current = { x, y };
    };

    const handleMouseLeave = () => {
        mouseRef.current = null;
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-0 overflow-hidden pointer-events-auto cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {fishes.map(fish => (
                <div
                    key={fish.id}
                    className="absolute w-12 h-6 transition-transform will-change-transform"
                    style={{
                        left: `${fish.x}%`,
                        top: `${fish.y}%`,
                        transform: `scale(${fish.scale}) scaleX(${fish.flip ? -1 : 1})`,
                        opacity: 0.3
                    }}
                >
                    <FishSVG type={fish.type} />
                </div>
            ))}
        </div>
    );
}

function FishSVG({ type }: { type: FishType }) {
    // Simple silhouettes from previous version
    const color = type === 'trout' ? '#a3e635' : type === 'bass' ? '#22c55e' : type === 'striper' ? '#e2e8f0' : '#f59e0b';

    return (
        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-lg filter" style={{ color }}>
            {type === 'trout' && (
                <path d="M5,25 Q20,10 50,15 Q80,10 95,25 Q80,40 50,35 Q20,40 5,25 Z M85,25 L95,15 L95,35 Z" fill="currentColor" />
            )}
            {type === 'bass' && (
                <path d="M5,30 Q20,5 50,10 Q80,15 95,25 Q80,45 50,45 Q20,50 5,30 Z M85,25 L98,15 L98,35 Z" fill="currentColor" />
            )}
            {type === 'walleye' && (
                <path d="M2,25 Q30,15 90,20 L98,10 L98,30 L90,25 Q50,45 2,25 Z" fill="currentColor" />
            )}
            {type === 'striper' && (
                <g fill="currentColor">
                    <path d="M5,25 Q25,10 60,15 Q85,15 95,25 Q85,35 60,35 Q25,40 5,25 Z M90,25 L100,10 L100,40 Z" />
                    <line x1="20" y1="22" x2="80" y2="22" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                    <line x1="20" y1="28" x2="80" y2="28" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
                </g>
            )}
        </svg>
    );
}
