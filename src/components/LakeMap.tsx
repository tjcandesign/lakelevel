'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LakeMap() {
    return (
        <div className="bg-zinc-900 border border-blue-500/10 rounded-xl overflow-hidden shadow-2xl relative h-[500px] w-full group">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 z-20 pointer-events-none">
                <h2 className="text-xl font-bold text-white flex items-center tracking-tight drop-shadow-md">
                    Watershed & Flow
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-1 drop-shadow-md">
                    Norfork Lake Basin
                </p>
            </div>

            {/* Background Map Container */}
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-black">
                <div className="relative w-full h-full max-w-md">
                    {/* The Map Image */}
                    {/* We use a filter to make it fit the dark theme better if it's white background */}
                    {/* Suggestion: invert if it's black-on-white, but it's green-on-white. 
                         Lets try grayscale+invert+tint or just render as is with multiply if we had a light bg.
                         For dark mode: mix-blend-mode: screen might work if we invert the image first.
                         Let's just show it normally first but stylized.
                     */}
                    <Image
                        src="/lake-map.png"
                        alt="Norfork Lake Map"
                        fill
                        className="object-contain opacity-80"
                        style={{ filter: 'hue-rotate(180deg) saturate(2) brightness(1.2)' }} // Make it bluish
                    />

                    {/* Overlay Layer for Flow Animation */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* 
                             Coordinate System: 0,0 top left. 
                             Dam: Approx 50, 90 (Bottom Center).
                             Arms: 
                               - North Fork: 45, 10
                               - Bennett's Bayou: 70, 30
                               - Big Creek: 20, 30
                         */}

                        {/* Flow Path 1: Main Channel North -> South */}
                        <FlowLine path="M 40,20 Q 50,40 50,60 T 45,85" delay={0} />

                        {/* Flow Path 2: Eastern Arm -> South */}
                        <FlowLine path="M 60,30 Q 55,50 50,60" delay={1} />

                        {/* Flow Path 3: Western Arm -> South */}
                        <FlowLine path="M 30,40 Q 40,50 50,60" delay={2} />

                        {/* Dam Location Marker */}
                        <g transform="translate(43, 80)">
                            <circle cx="0" cy="0" r="3" fill="#ef4444" className="animate-pulse" />
                            <circle cx="0" cy="0" r="8" stroke="#ef4444" strokeWidth="0.5" fill="none" opacity="0.5">
                                <animate attributeName="r" from="3" to="12" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>
                        </g>
                    </svg>

                    {/* Label for Dam - Positioned relatively absolute */}
                    <div className="absolute bottom-[10%] left-[50%] translate-x-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded border border-red-500/30 text-[10px] text-red-200 font-bold uppercase tracking-wider">
                        Norfork Dam
                        <div className="text-[8px] text-zinc-400 font-normal normal-case">Outflow Control</div>
                    </div>

                </div>
            </div>

            {/* Decorative Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none"></div>
        </div>
    );
}

function FlowLine({ path, delay }: { path: string, delay: number }) {
    return (
        <>
            {/* The Path Line (Faint) */}
            <path d={path} stroke="#3b82f6" strokeWidth="0.5" fill="none" opacity="0.2" strokeDasharray="2 2" />

            {/* The Moving Particle */}
            <motion.circle
                r="1"
                fill="white"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: delay
                }}
                style={{
                    offsetPath: `path('${path}')`,
                    opacity: 0.8
                }}
            />
            {/* Secondary Particle */}
            <motion.circle
                r="0.5"
                fill="#60a5fa"
                initial={{ offsetDistance: "0%" }}
                animate={{ offsetDistance: "100%" }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear",
                    delay: delay + 2
                }}
                style={{
                    offsetPath: `path('${path}')`,
                    opacity: 0.6
                }}
            />
        </>
    );
}
