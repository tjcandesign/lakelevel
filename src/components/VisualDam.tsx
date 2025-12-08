'use client';

import { motion } from 'framer-motion';

interface VisualDamProps {
    elevation: number;
    powerPool: number;
    floodPool: number;
    cfs: number;
    tailwater: number;
}

export default function VisualDam({ elevation, powerPool, floodPool, cfs, tailwater }: VisualDamProps) {
    // Normalization logic for the illustration
    // The SVG viewbox will be 0 0 300 200
    // Dam wall height: 200 units.
    // Base 510 -> 0 units (bottom)
    // Flood 580 -> 180 units (near top)

    // Scale factor: (val - 500) * 2.5 approximately
    const scaleY = (val: number) => Math.min(190, Math.max(10, (val - 500) * 2.5));

    const lakeHeight = scaleY(elevation);
    const powerPoolHeight = scaleY(powerPool);

    // Tailwater normalization (Base ~362)
    // 362 -> 10 units high
    // 375 -> 50 units high
    const tailHeight = Math.min(80, Math.max(10, (tailwater - 355) * 3));

    // Flow intensity (for animation)
    const isFlowing = cfs > 0;
    const flowSpeed = Math.max(0.2, 2 - (cfs / 5000)); // faster = lower duration

    return (
        <div className="relative w-full h-[220px] bg-zinc-900/50 rounded-xl border border-white/5 overflow-hidden flex flex-col items-center justify-center p-4">
            <div className="absolute top-2 left-4 text-[10px] text-blue-400 font-bold uppercase tracking-wider">Lake Side</div>
            <div className="absolute top-2 right-4 text-[10px] text-emerald-400 font-bold uppercase tracking-wider">River Side</div>

            <svg viewBox="0 0 400 200" className="w-full h-full max-w-[500px]">
                <defs>
                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="riverGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                    </linearGradient>
                    <pattern id="flowPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.3)" />
                    </pattern>
                </defs>

                {/* Lake Water */}
                <motion.rect
                    initial={{ height: 0, y: 200 }}
                    animate={{ height: lakeHeight, y: 200 - lakeHeight }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    x="0"
                    width="190"
                    fill="url(#waterGradient)"
                />

                {/* Depth Indicator (Inside Water) - Only show if enough depth */}
                {lakeHeight > 40 && (
                    <motion.g
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        {/* Vertical Arrow Line */}
                        <line
                            x1="95"
                            y1={200 - lakeHeight + 10}
                            x2="95"
                            y2={190}
                            stroke="white"
                            strokeWidth="1"
                            opacity="0.5"
                            strokeDasharray="2 2"
                        />
                        {/* Top Arrowhead */}
                        <path d="M 95,190 L 92,185 M 95,190 L 98,185" stroke="white" strokeWidth="1" opacity="0.5" fill="none" transform={`translate(0, -${lakeHeight - 20})`} />

                        {/* Bottom Arrowhead */}
                        <path d="M 95,190 L 92,185 M 95,190 L 98,185" stroke="white" strokeWidth="1" opacity="0.5" fill="none" />

                        {/* Label */}
                        <rect x="65" y={200 - lakeHeight / 2 - 8} width="60" height="16" rx="4" fill="rgba(0,0,0,0.3)" />
                        <text
                            x="95"
                            y={200 - lakeHeight / 2 + 4}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                            className="font-mono"
                        >
                            {elevation.toFixed(2)}'
                        </text>
                    </motion.g>
                )}

                {/* Power Pool Line Marker */}
                <line
                    x1="0" y1={200 - powerPoolHeight}
                    x2="190" y2={200 - powerPoolHeight}
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                    opacity="0.5"
                />
                <text x="10" y={200 - powerPoolHeight - 5} fill="white" fontSize="8" opacity="0.7">NORMAL POOL</text>

                {/* The Dam Structure (Trapezoid) */}
                <path d="M 190 200 L 190 10 L 210 10 L 240 200 Z" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />

                {/* River Water (Tailwater) */}
                <motion.rect
                    initial={{ height: 10, y: 190 }}
                    animate={{ height: tailHeight, y: 200 - tailHeight }}
                    transition={{ duration: 1 }}
                    x="240"
                    y={200 - tailHeight}
                    width="160"
                    height={tailHeight}
                    fill="url(#riverGradient)"
                />

                {/* Flow Animation (if generating) */}
                {isFlowing && (
                    <>
                        {/* Turbulent water exit */}
                        <motion.circle
                            cx="240"
                            cy={200 - tailHeight / 2}
                            r={tailHeight / 2}
                            fill="white"
                            opacity="0.2"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                        />

                        {/* Moving particles in river */}
                        <motion.rect
                            x="240"
                            y={200 - tailHeight}
                            width="160"
                            height={tailHeight}
                            fill="url(#flowPattern)"
                            animate={{ x: [-20, 0] }}
                            transition={{ repeat: Infinity, duration: flowSpeed, ease: "linear" }}
                        />
                    </>
                )}

                {/* Ground Line */}
                <line x1="0" y1="200" x2="400" y2="200" stroke="#71717a" strokeWidth="2" />

            </svg>

            {/* Legend/Info Overlay */}
            <div className="absolute bottom-2 left-0 w-full flex justify-between px-6 text-[9px] text-zinc-500 font-mono">
                <span>Elev: {elevation.toFixed(2)}</span>
                <span>Tail: {tailwater.toFixed(2)}</span>
            </div>
        </div>
    );
}
