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
    const scaleY = (val: number) => Math.min(190, Math.max(10, (val - 500) * 2.5));

    const lakeHeight = scaleY(elevation);
    const powerPoolHeight = scaleY(powerPool);

    // Tailwater normalization (Base ~362)
    const tailHeight = Math.min(80, Math.max(10, (tailwater - 355) * 3));

    // Flow intensity
    const isFlowing = cfs > 0;
    const flowSpeed = Math.max(0.5, 2 - (cfs / 10000)); // Animation duration

    // Wave Generation for River
    // Base amplitude on CFS: 0 -> 0, 10000 -> 8
    const waveAmp = cfs > 0 ? Math.min(8, Math.max(1, cfs / 800)) : 0;

    // Construct a long repeating sine wave path
    // We'll translate this horizontally
    // Width needs to cover ~200px + buffer. Let's do 400px.
    // Segment width: 20px
    let d = `M 0 0`;
    for (let i = 0; i < 30; i++) {
        const x = (i + 1) * 20;
        // Alternating up/down for Sine approximation using Quadratic Beziers
        // Q controlPointX controlPointY endX endY
        // For simple smooth wave: T is shortcut for symmetric quadratic
        // First curve: Q 10 -amp 20 0
        if (i === 0) d += ` Q 10 ${-waveAmp} 20 0`;
        else d += ` T ${x} 0`;
    }
    // Close the shape to fill it
    d += ` V ${tailHeight} H 0 Z`;


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

                {/* River Water (Tailwater) - Using SVG Wave Path */}
                <g transform={`translate(240, ${200 - tailHeight})`}>
                    <defs>
                        <clipPath id="riverClip">
                            <rect x="0" y="-20" width="160" height={tailHeight + 20} />
                        </clipPath>
                    </defs>

                    {/* We render the wave path twice and animate x to create loop */}
                    {/* Actually, framer motion x animation on the path itself */}
                    <motion.path
                        d={d}
                        fill="url(#riverGradient)"
                        animate={{ x: [-40, 0] }} // Cycle through 2 wave periods (20px * 2)
                        transition={{ repeat: Infinity, ease: "linear", duration: flowSpeed }}
                        clipPath="url(#riverClip)"
                    />
                </g>

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
