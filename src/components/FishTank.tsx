'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type FishType = 'trout' | 'bass' | 'walleye' | 'striper';

interface Fish {
    id: number;
    type: FishType;
    x: number;
    y: number;
    vx: number; // Velocity X
    vy: number; // Velocity Y
    scale: number;
    flip: boolean;
    rotation: number; // Pitch angle
    wigglePhase: number; // For tail anim
}

const FISH_TYPES: FishType[] = ['trout', 'bass'];

export default function FishTank() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [fishes, setFishes] = useState<Fish[]>([]);
    const mouseRef = useRef<{ x: number, y: number } | null>(null);
    const requestRef = useRef<number>(0);
    const timeRef = useRef<number>(0);

    // Initial Spawn - Exact count 2
    useEffect(() => {
        const initialFishes: Fish[] = Array.from({ length: 2 }).map((_, i) => ({
            id: i,
            type: FISH_TYPES[i % 2], // 1 Trout, 1 Bass
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.05,
            scale: 0.6 + Math.random() * 0.4, // size 0.6 - 1.0
            flip: false,
            rotation: 0,
            wigglePhase: Math.random() * Math.PI * 2
        }));
        setFishes(initialFishes);
    }, []);

    // Animation Loop
    useEffect(() => {
        const update = () => {
            timeRef.current += 1;

            setFishes(prevFishes => prevFishes.map(fish => {
                let { x, y, vx, vy, rotation, wigglePhase } = fish;

                // 1. Target Attraction (Gentle)
                if (mouseRef.current) {
                    const dx = mouseRef.current.x - x;
                    const dy = mouseRef.current.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Only react if relatively close
                    if (dist < 50) {
                        const pull = 0.005; // Very gentle pull
                        vx += (dx / dist) * pull;
                        vy += (dy / dist) * pull;
                    }
                }

                // 2. Natural Wandering (Perlin-noise-ish random walk)
                // We change acceleration slowly to make curves smooth
                vx += (Math.random() - 0.5) * 0.005;
                vy += (Math.random() - 0.5) * 0.005;

                // 3. Friction/Speed Limit
                const speed = Math.sqrt(vx * vx + vy * vy);
                // fish swim faster when chasing (max 0.3) vs cruising (0.15)
                const maxSpeed = mouseRef.current ? 0.3 : 0.15;
                if (speed > maxSpeed) {
                    vx = (vx / speed) * maxSpeed;
                    vy = (vy / speed) * maxSpeed;
                }

                // 4. Update Position
                x += vx;
                y += vy;

                // 5. Soft Boundaries (Steer back rather than bounce)
                const margin = 10;
                if (x < margin) vx += 0.005;
                if (x > 100 - margin) vx -= 0.005;
                if (y < margin) vy += 0.005;
                if (y > 100 - margin) vy -= 0.005;

                // Hard clamps to prevent escape
                if (x < -20) x = 120;
                if (x > 120) x = -20;
                if (y < -10) y = 110;
                if (y > 110) y = -10;

                // 6. Realistic Orientation
                // Determine direction: Left or Right
                const isMovingLeft = vx < 0;

                // Calculate Pitch (Tilt up/down)
                // Identify the angle of movement vector relative to horizontal
                // If moving left, we invert X to treat it as "forward" for atan2
                const forwardX = isMovingLeft ? -vx : vx;
                const targetRotation = Math.atan2(vy, forwardX) * (180 / Math.PI);

                // Smoothly interpolate rotation (dampening)
                // Lerp factor 0.1
                rotation = rotation + (targetRotation - rotation) * 0.1;

                // 7. Wiggle (Swimming Motion)
                // Frequency increases with speed
                const wiggleSpeed = 0.2 + (speed * 4);
                wigglePhase += wiggleSpeed;
                // Amplitude is roughly 5 degrees
                const wiggle = Math.sin(wigglePhase) * 5;

                // Apply wiggle to rotation for visual "effort"
                const displayRotation = rotation + wiggle;

                return {
                    ...fish,
                    x, y, vx, vy,
                    flip: isMovingLeft, // Flip sprite horizontally if swimming left
                    rotation: displayRotation, // Actual tilt + wiggle
                    wigglePhase
                };
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
            className="absolute inset-0 z-0 overflow-hidden pointer-events-auto"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {fishes.map(fish => (
                <div
                    key={fish.id}
                    className="absolute w-20 h-10 will-change-transform" // Increased base size for realism
                    style={{
                        left: `${fish.x}%`,
                        top: `${fish.y}%`,
                        // Use translate(-50%, -50%) to center the pivot point
                        // Scale X flips for direction
                        // Rotate handles pitch
                        transform: `translate(-50%, -50%) scale(${fish.scale}) scaleX(${fish.flip ? -1 : 1}) rotate(${fish.rotation}deg)`,
                        opacity: 0.6,
                        transition: 'opacity 0.5s'
                    }}
                >
                    <FishSVG type={fish.type} />
                </div>
            ))}
        </div>
    );
}

function FishSVG({ type }: { type: FishType }) {
    // Detailed silhouettes
    return (
        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-md filter" style={{ color: type === 'trout' ? '#a3e635' : '#22c55e' }}>
            {type === 'trout' && (
                <g>
                    {/* Streamlined Body */}
                    <path d="M10,25 Q25,10 60,12 Q90,12 98,25 Q90,38 60,38 Q25,40 10,25 Z" fill="currentColor" opacity="0.9" />
                    {/* Tail */}
                    <path d="M90,25 L100,10 L100,40 Z" fill="currentColor" opacity="0.8" />
                    {/* Fins */}
                    <path d="M40,12 L35,5 L50,12 Z" fill="currentColor" opacity="0.6" />
                    <path d="M40,38 L35,45 L50,38 Z" fill="currentColor" opacity="0.6" />
                </g>
            )}
            {(type === 'bass' || type === 'striper') && (
                <g>
                    {/* Thicker Body */}
                    <path d="M5,30 Q20,5 55,10 Q85,15 95,25 Q85,45 55,45 Q20,50 5,30 Z" fill="currentColor" opacity="0.9" />
                    {/* Broad Tail */}
                    <path d="M88,25 L100,10 L100,40 L88,25 Z" fill="currentColor" opacity="0.8" />
                    {/* Spiny Dorsal */}
                    <path d="M30,10 L25,0 L60,8 Z" fill="currentColor" opacity="0.6" />
                </g>
            )}
        </svg>
    );
}
