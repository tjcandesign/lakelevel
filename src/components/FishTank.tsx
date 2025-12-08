'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    caught: boolean; // Is fish in net?
}

const FISH_TYPES: FishType[] = ['trout', 'bass', 'walleye', 'striper'];

interface FishTankProps {
    scoopTrigger?: number; // Increment to trigger scoop
}

export default function FishTank({ scoopTrigger = 0 }: FishTankProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [fishes, setFishes] = useState<Fish[]>([]);
    const mouseRef = useRef<{ x: number, y: number } | null>(null);
    const requestRef = useRef<number>(0);

    // Net Animation State
    const [netState, setNetState] = useState<'idle' | 'scooping' | 'dumping'>('idle');
    const netPos = useRef({ x: 120, y: 120, rotation: 0 }); // Off screen
    const [netVisible, setNetVisible] = useState(false);

    // Initial Spawn
    useEffect(() => {
        const initialFishes: Fish[] = Array.from({ length: 4 }).map((_, i) => ({
            id: i,
            type: FISH_TYPES[i % FISH_TYPES.length],
            x: Math.random() * 100,
            y: Math.random() * 100,
            vx: (Math.random() - 0.5) * 0.1,
            vy: (Math.random() - 0.5) * 0.05,
            scale: 0.5 + Math.random() * 0.5,
            flip: Math.random() > 0.5,
            caught: false
        }));
        setFishes(initialFishes);
    }, []);

    // Handle Scoop Trigger
    useEffect(() => {
        if (scoopTrigger > 0 && netState === 'idle') {
            triggerScoopSequence();
        }
    }, [scoopTrigger]);

    const triggerScoopSequence = async () => {
        setNetState('scooping');
        setNetVisible(true);

        // Keyframe animation managed via JS loop refs or simplified timeouts for state phases
        // Phase 1: Enter and Scoop (0-1s)
        // Phase 2: Lift (1-2s)
        // Phase 3: Dump (2-2.5s)
        // Phase 4: Exit (3s)

        // We'll manage net position in the main loop for smooth fish syncing

        setTimeout(() => setNetState('dumping'), 2000);
        setTimeout(() => {
            setNetState('idle');
            setNetVisible(false);
        }, 3000);
    };

    // Animation Loop
    useEffect(() => {
        let startTime = Date.now();

        const update = () => {
            const now = Date.now();

            // --- Net Logic ---
            let targetNetX = 120;
            let targetNetY = 120;
            let targetNetRot = 0;

            if (netState === 'scooping') {
                // Sweep from bottom right to center then up
                // Simple: Center bottom -> Center mid
                targetNetX = 50;
                targetNetY = 60;
                targetNetRot = -45;

                // Animating netPos towards target manually for physics sync
                const speed = 1.5;
                netPos.current.x += (targetNetX - netPos.current.x) * 0.05 * speed;
                netPos.current.y += (targetNetY - netPos.current.y) * 0.05 * speed;
                netPos.current.rotation += (targetNetRot - netPos.current.rotation) * 0.1;

            } else if (netState === 'dumping') {
                // Lift high and tip
                targetNetX = 50;
                targetNetY = 10;
                targetNetRot = 160; // Dump

                // Faster lift
                netPos.current.x += (targetNetX - netPos.current.x) * 0.1;
                netPos.current.y += (targetNetY - netPos.current.y) * 0.1;
                netPos.current.rotation += (targetNetRot - netPos.current.rotation) * 0.1;
            } else {
                // Idle / Exit
                netPos.current.x += (120 - netPos.current.x) * 0.05;
                netPos.current.y += (120 - netPos.current.y) * 0.05;
                netPos.current.rotation = 0;
            }


            // --- Fish Logic ---
            setFishes(prevFishes => prevFishes.map(fish => {
                let { x, y, vx, vy, flip, caught } = fish;

                if (netState === 'scooping') {
                    // Check collision with net or just suck them in if close
                    const dx = netPos.current.x - x;
                    const dy = netPos.current.y - y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 30) { // Catch radius
                        caught = true;
                    }
                }

                if (netState === 'dumping' && caught) {
                    // If we are fully dumped (rotation > 100), release fish
                    if (netPos.current.rotation > 100) {
                        caught = false;
                        // Explode out
                        vx = (Math.random() - 0.5) * 1.5;
                        vy = Math.random() * 1.0; // Downward
                    }
                }

                if (caught) {
                    // Fish is stuck in net
                    // Target position inside net (with slight random jitter)
                    const targetX = netPos.current.x + (Math.random() - 0.5) * 5;
                    const targetY = netPos.current.y + (Math.random() - 0.5) * 5 + 5; // A bit lower in net bag

                    x += (targetX - x) * 0.2;
                    y += (targetY - y) * 0.2;

                    // Kill velocity
                    vx = 0; vy = 0;

                    // Rotate with net? Handled by flip logic later maybe?
                } else {
                    // Normal Swimming

                    // 1. Target Attraction (Bait) - Mouse only if not scooping
                    if (mouseRef.current && netState === 'idle') {
                        const dx = mouseRef.current.x - x;
                        const dy = mouseRef.current.y - y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 40) {
                            vx += (dx / dist) * 0.02;
                            vy += (dy / dist) * 0.02;
                        }
                    }

                    // 2. Random Wandering
                    vx += (Math.random() - 0.5) * 0.01;
                    vy += (Math.random() - 0.5) * 0.005;

                    // 3. Friction
                    const speed = Math.sqrt(vx * vx + vy * vy);
                    const maxSpeed = mouseRef.current ? 0.4 : 0.15;
                    if (speed > maxSpeed) {
                        vx = (vx / speed) * maxSpeed;
                        vy = (vy / speed) * maxSpeed;
                    }

                    // Gravity if falling from dump
                    if (netState === 'dumping' && !caught) {
                        vy += 0.05; // Gravity
                    }

                    // 4. Update Position
                    x += vx;
                    y += vy;

                    // 5. Bounds (Bounce)
                    if (x < -10) { x = -10; vx *= -0.8; }
                    if (x > 110) { x = 110; vx *= -0.8; }

                    if (netState === 'dumping' && !caught) {
                        // Allow falling through bottom if desired, or bounce floor
                        if (y > 90) { y = 90; vy *= -0.5; }
                    } else {
                        if (y < 0) { y = 0; vy *= -1; }
                        if (y > 100) { y = 100; vy *= -1; }
                    }
                }

                // 6. Orientation
                if (!caught) {
                    if (vx > 0.02) flip = true;
                    if (vx < -0.02) flip = false;
                }

                return { ...fish, x, y, vx, vy, flip, caught };
            }));

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current);
    }, [netState]); // Re-bind loop if netState changes (could optimize this out but safe for now)

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
            {/* The Net */}
            {netVisible && (
                <div
                    className="absolute w-24 h-24 pointer-events-none z-20"
                    style={{
                        left: `${netPos.current.x}%`,
                        top: `${netPos.current.y}%`,
                        transform: `translate(-50%, -50%) rotate(${netPos.current.rotation}deg)`,
                        transition: 'none' // Controlled by loop
                    }}
                >
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                        {/* Pole */}
                        <line x1="10" y1="100" x2="30" y2="60" stroke="#71717a" strokeWidth="4" />
                        {/* Rim */}
                        <ellipse cx="50" cy="50" rx="30" ry="20" stroke="#a1a1aa" strokeWidth="2" fill="none" />
                        {/* Net Mesh (Simple) */}
                        <path d="M20,50 Q50,90 80,50" fill="none" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="2 2" />
                        <path d="M30,50 L50,80 L70,50" fill="rgba(255,255,255,0.1)" stroke="none" />
                    </svg>
                </div>
            )}

            {fishes.map(fish => (
                <div
                    key={fish.id}
                    className="absolute w-12 h-6 transition-transform will-change-transform z-10"
                    style={{
                        left: `${fish.x}%`,
                        top: `${fish.y}%`,
                        transform: `scale(${fish.scale}) scaleX(${fish.flip ? -1 : 1}) rotate(${fish.caught ? 90 : 0}deg)`,
                        opacity: 0.8
                    }}
                >
                    <FishSVG type={fish.type} />
                </div>
            ))}
        </div>
    );
}

function FishSVG({ type }: { type: FishType }) {
    const color = type === 'trout' ? '#a3e635' : type === 'bass' ? '#22c55e' : type === 'striper' ? '#e2e8f0' : '#f59e0b';
    return (
        <svg viewBox="0 0 100 50" className="w-full h-full drop-shadow-lg filter" style={{ color }}>
            {type === 'trout' && <path d="M5,25 Q20,10 50,15 Q80,10 95,25 Q80,40 50,35 Q20,40 5,25 Z M85,25 L95,15 L95,35 Z" fill="currentColor" />}
            {type === 'bass' && <path d="M5,30 Q20,5 50,10 Q80,15 95,25 Q80,45 50,45 Q20,50 5,30 Z M85,25 L98,15 L98,35 Z" fill="currentColor" />}
            {type === 'walleye' && <path d="M2,25 Q30,15 90,20 L98,10 L98,30 L90,25 Q50,45 2,25 Z" fill="currentColor" />}
            {type === 'striper' && <g fill="currentColor"><path d="M5,25 Q25,10 60,15 Q85,15 95,25 Q85,35 60,35 Q25,40 5,25 Z M90,25 L100,10 L100,40 Z" /><line x1="20" y1="22" x2="80" y2="22" stroke="rgba(0,0,0,0.2)" strokeWidth="2" /></g>}
        </svg>
    );
}
