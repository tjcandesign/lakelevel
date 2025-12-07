
'use client';

import React, { useEffect, useState } from 'react';
import { UsaceData } from '@/lib/types';
import { format } from 'date-fns';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ClientOnly from './ClientOnly';

export default function LakeLevelsPanel() {
    const [data, setData] = useState<UsaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        fetch('/api/norfork/lake')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load');
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="bg-zinc-900 rounded-xl border border-blue-500/10 p-8 h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <div className="text-blue-400 text-sm animate-pulse font-medium">Loading Live Data...</div>
            </div>
        </div>
    );

    if (error) return <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-xl">Error: {error}</div>;
    if (!data || data.hourly.length === 0) return <div className="p-4 text-zinc-400">No data available.</div>;

    const current = data.hourly[0];
    const powerPool = data.meta.currentPowerPool || 553.75; // "Normal" top
    const floodPool = data.meta.topFloodPool || 580.0;     // "Full" top
    const bottomPool = 510.0; // Approx bottom of conservation pool for visualization context

    // Calculate Variance
    const variance = current.elevation - powerPool;
    const varianceLabel = variance > 0 ? 'Above Normal' : 'Below Normal';
    const varianceColor = variance > 0 ? 'text-amber-400' : 'text-blue-400';

    // Percentages for the bar
    const totalRange = floodPool - bottomPool;
    const currentPos = ((current.elevation - bottomPool) / totalRange) * 100;
    const normalPos = ((powerPool - bottomPool) / totalRange) * 100;

    // Trend Logic
    const sixHoursAgo = data.hourly[Math.min(6, data.hourly.length - 1)];
    const trend = current.elevation - sixHoursAgo.elevation;
    const trendLabel = trend > 0.01 ? 'Rising' : trend < -0.01 ? 'Falling' : 'Steady';

    // River Condition
    const cfs = current.totalReleaseCfs ?? current.generationCfs ?? 0;
    let riverCondition = 'Low / Wadeable';
    let riverStyles = 'text-blue-200 bg-blue-500/10 border-blue-500/20'; // Default Blue theme

    if (cfs > 500 && cfs < 3000) {
        riverCondition = 'Moderate Flow';
    } else if (cfs >= 3000) {
        riverCondition = 'High / Boating Only';
    }

    // Prepare Chart Data
    const chartData = [...data.hourly].reverse().map(h => ({
        time: format(new Date(h.timestamp), 'h a'),
        fullDate: h.timestamp,
        elevation: h.elevation,
        tailwater: h.tailwater
    }));

    const minElev = Math.min(...chartData.map(d => d.elevation), powerPool) - 0.5;
    const maxElev = Math.max(...chartData.map(d => d.elevation), powerPool) + 0.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-blue-500/10 rounded-xl overflow-hidden shadow-2xl relative"
        >
            {/* Glow effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 opacity-50"></div>

            <div className="p-5 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
                        Norfork Lake Level
                    </h2>
                    <div className="text-right">
                        <div className="text-[10px] text-blue-400/60 font-bold uppercase tracking-widest">Last Updated</div>
                        <div className="text-xs text-blue-200 font-mono">{format(new Date(data.hourly[0].timestamp), 'M/d h:mm a')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-10">
                    {/* Primary Stat: Elevation with Context */}
                    <div className="space-y-6">
                        <div>
                            <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">Current Elevation <span className="text-zinc-500 font-medium normal-case tracking-normal ml-1">(at Norfork Dam)</span></div>
                            <div className="flex items-baseline space-x-3">
                                <motion.span
                                    key={current.elevation}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-6xl font-sans font-bold text-white tracking-tighter"
                                >
                                    {current.elevation.toFixed(2)}
                                </motion.span>
                                <span className="text-sm text-zinc-400 font-medium">ft above sea level</span>
                            </div>
                        </div>

                        {/* Variance Context Box */}
                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-zinc-500 uppercase tracking-wide">Status</div>
                                <div className={`text-lg font-bold ${varianceColor}`}>
                                    {Math.abs(variance).toFixed(2)} ft <span className="text-sm font-normal text-zinc-400">{varianceLabel}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-zinc-500 uppercase tracking-wide">Trend (6h)</div>
                                <div className="text-lg font-bold text-white flex items-center justify-end gap-1">
                                    {trendLabel}
                                    <span className={trend > 0 ? "text-blue-400" : "text-amber-400"}>
                                        {trendLabel === 'Rising' ? '↑' : trendLabel === 'Falling' ? '↓' : '→'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Visual Meter */}
                        <div className="space-y-2 pt-2">
                            <div className="relative h-4 bg-zinc-800 rounded-full w-full overflow-hidden">
                                {/* Normal Line Marker */}
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20" style={{ left: `${normalPos}%` }}></div>

                                {/* Current Level Fill */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.max(0, currentPos))}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full relative z-10 ${variance > 0 ? 'bg-amber-500' : 'bg-blue-600'}`}
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                                </motion.div>

                                {/* Range Backgrounds (Optional, keep subtle) */}
                                <div className="absolute inset-0 flex">
                                    <div className="h-full bg-blue-900/20" style={{ width: `${normalPos}%` }}></div>
                                    <div className="h-full bg-amber-900/20" style={{ flex: 1 }}></div>
                                </div>
                            </div>

                            <div className="flex justify-between text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                <span>Low ({bottomPool})</span>
                                <span className="text-white transform -translate-x-1/2" style={{ marginLeft: `${normalPos}%` }}>Normal ({powerPool})</span>
                                <span>Flood ({floodPool})</span>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Stat: River Release */}
                    <div className="space-y-6">
                        <div className="mb-2">
                            <div className="text-xs text-blue-400 font-bold uppercase tracking-widest">River Conditions (Tailwater)</div>
                            {/* Animated Wave Graphic */}
                            <div className="h-4 w-full overflow-hidden relative opacity-50 mt-1">
                                <motion.div
                                    animate={{ x: ["0%", "-50%"] }}
                                    transition={{ repeat: Infinity, ease: "linear", duration: 4 }}
                                    className="absolute top-0 left-0 h-full w-[200%] flex items-center"
                                >
                                    <svg className="w-full h-full text-blue-500" viewBox="0 0 1200 20" preserveAspectRatio="none">
                                        <path
                                            d="M0 10 Q 30 20 60 10 T 120 10 T 180 10 T 240 10 T 300 10 T 360 10 T 420 10 T 480 10 T 540 10 T 600 10 T 660 10 T 720 10 T 780 10 T 840 10 T 900 10 T 960 10 T 1020 10 T 1080 10 T 1140 10 T 1200 10"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </motion.div>
                            </div>
                        </div>

                        <div className={`p-6 rounded-xl border ${riverStyles} relative overflow-hidden flex flex-col justify-between h-full`}>
                            <div className="relative z-10 grid grid-cols-2 gap-6">
                                <div>
                                    <div className="text-xs text-blue-300 font-bold uppercase tracking-wider opacity-80 mb-1">Release Rate</div>
                                    <div className="text-3xl font-sans font-bold text-white tracking-tighter">
                                        {cfs.toLocaleString()} <span className="text-sm font-normal opacity-70">cfs</span>
                                    </div>
                                    <div className="mt-2 p-2 bg-black/20 rounded border border-blue-500/10 backdrop-blur-sm">
                                        <div className="text-[10px] text-blue-200/70 leading-relaxed">
                                            <span className="font-bold text-blue-200">Context:</span> 1 CFS ≈ 1 basketball full of water passing per second.
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-blue-300 font-bold uppercase tracking-wider opacity-80 mb-1">River Depth</div>
                                    <div className="text-3xl font-sans font-bold text-white tracking-tighter">
                                        {current.tailwater?.toFixed(2) || '-'} <span className="text-sm font-normal opacity-70">ft</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 mt-6 pt-6 border-t border-blue-500/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Current Status</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border bg-black/40 ${cfs < 500 ? 'text-emerald-400 border-emerald-500/30' :
                                        cfs < 3000 ? 'text-amber-400 border-amber-500/30' :
                                            'text-red-400 border-red-500/30'
                                        }`}>
                                        {riverCondition}
                                    </span>
                                </div>
                            </div>

                            {/* Animated background pulse for flow */}
                            {cfs > 100 && (
                                <motion.div
                                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-blue-500 opacity-5"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="h-[250px] w-full mt-8 pt-8 border-t border-white/5">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">48-Hour Level History</h3>
                    <ClientOnly>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis
                                    dataKey="time"
                                    stroke="#71717a"
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                    tickMargin={10}
                                    axisLine={false}
                                    interval="preserveStartEnd"
                                    minTickGap={30}
                                />
                                <YAxis
                                    domain={[minElev, maxElev]}
                                    stroke="#71717a"
                                    tick={{ fontSize: 10, fill: '#71717a' }}
                                    axisLine={false}
                                    tickFormatter={(value) => value.toFixed(1)}
                                    width={30}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                    formatter={(val: number) => [val.toFixed(2) + ' ft', 'Elevation']}
                                    cursor={{ stroke: '#3b82f6', strokeWidth: 1 }}
                                    labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                                />
                                <ReferenceLine y={powerPool} stroke="#60a5fa" strokeDasharray="4 4" label={{ position: 'insideTopRight', value: 'Normal Pool', fill: '#60a5fa', fontSize: 10 }} />
                                <Area
                                    type="monotone"
                                    dataKey="elevation"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorElev)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ClientOnly>
                </div>
            </div>

            {/* History Toggle */}
            <div className="border-t border-white/5 bg-white/[0.02]">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full py-3 text-xs uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    {showDetails ? 'Hide Past Data' : 'View Data Table'}
                    <span className="text-[10px]">{showDetails ? '−' : '+'}</span>
                </button>

                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="overflow-x-auto border-t border-white/5">
                                <table className="w-full text-sm text-left text-zinc-400">
                                    <thead className="text-[10px] text-zinc-500 uppercase bg-black/20 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Time (CT)</th>
                                            <th className="px-6 py-3 font-medium">Elev (ft)</th>
                                            <th className="px-6 py-3 font-medium text-right">Flow (CFS)</th>
                                            <th className="px-6 py-3 font-medium text-right">Tailwater (ft)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {data.hourly.slice(0, 12).map((row) => (
                                            <tr key={row.timestamp} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-3 font-mono text-zinc-300 whitespace-nowrap">
                                                    {format(row.timestamp, 'HH:mm')}
                                                </td>
                                                <td className="px-6 py-3 text-zinc-400">{row.elevation.toFixed(2)}</td>
                                                <td className="px-6 py-3 text-right font-mono text-blue-400">
                                                    {row.totalReleaseCfs ?? row.generationCfs ?? 0}
                                                </td>
                                                <td className="px-6 py-3 text-right font-mono text-zinc-300">
                                                    {row.tailwater?.toFixed(2) ?? '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
