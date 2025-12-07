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
        <div className="bg-zinc-900 rounded-xl border border-white/10 p-8 h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                <div className="text-zinc-500 text-sm animate-pulse">Loading Live Data...</div>
            </div>
        </div>
    );

    if (error) return <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-xl">Error: {error}</div>;
    if (!data || data.hourly.length === 0) return <div className="p-4 text-zinc-400">No data available.</div>;

    const current = data.hourly[0];
    const powerPool = data.meta.currentPowerPool || 553.75;
    const floodPool = data.meta.topFloodPool || 580.0;

    // Calculate trend
    const sixHoursAgo = data.hourly[Math.min(6, data.hourly.length - 1)];
    const trend = current.elevation - sixHoursAgo.elevation;
    const trendLabel = trend > 0.01 ? 'Rising' : trend < -0.01 ? 'Falling' : 'Steady';
    const trendColor = trend > 0.01 ? 'text-blue-400' : trend < -0.01 ? 'text-amber-400' : 'text-zinc-400';

    // River Condition
    const cfs = current.totalReleaseCfs ?? current.generationCfs ?? 0;
    let riverCondition = 'Low / Wadeable';
    let riverStyles = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

    if (cfs > 500 && cfs < 3000) {
        riverCondition = 'Moderate Flow';
        riverStyles = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    } else if (cfs >= 3000) {
        riverCondition = 'High / Boating Only';
        riverStyles = 'text-red-400 bg-red-400/10 border-red-400/20';
    }

    // Prepare Chart Data (Reverse to show chronological left-to-right)
    const chartData = [...data.hourly].reverse().map(h => ({
        time: format(new Date(h.timestamp), 'h a'),
        fullDate: h.timestamp,
        elevation: h.elevation,
        tailwater: h.tailwater
    }));

    // Calculate domain for chart to zoom in on the specific range
    const minElev = Math.min(...chartData.map(d => d.elevation), powerPool) - 0.5;
    const maxElev = Math.max(...chartData.map(d => d.elevation), powerPool) + 0.5;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
        >
            <div className="p-5 md:p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <motion.span
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-1.5 h-6 bg-blue-500 rounded-full mr-3 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        />
                        Current Conditions
                    </h2>
                    <div className="text-right">
                        <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Last Updated</div>
                        <div className="text-xs text-zinc-300 font-mono">{format(new Date(data.hourly[0].timestamp), 'M/d h:mm a')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-8">
                    {/* Top Stats Row */}
                    <div className="space-y-6">
                        {/* Visual Lake Level Indicator */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Lake Level</div>
                                <div className="flex items-baseline space-x-3">
                                    <motion.span
                                        key={current.elevation}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-5xl font-mono font-bold text-white tracking-tighter"
                                    >
                                        {current.elevation.toFixed(2)}
                                    </motion.span>
                                    <span className="text-sm text-zinc-500">ft msl</span>
                                </div>
                            </div>

                            {/* Trend Arrow */}
                            <div className={`text-center ${trendColor}`}>
                                <motion.div
                                    animate={{
                                        y: trendLabel === 'Rising' ? [0, -5, 0] : trendLabel === 'Falling' ? [0, 5, 0] : 0,
                                        rotate: trendLabel === 'Rising' ? 0 : trendLabel === 'Falling' ? 180 : 90
                                    }}
                                    transition={{
                                        y: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                                        rotate: { duration: 0.5 }
                                    }}
                                    className="text-3xl font-bold mb-1"
                                >
                                    ↑
                                </motion.div>
                                <div className="text-[10px] font-bold uppercase tracking-wider">{trendLabel}</div>
                            </div>
                        </div>

                        <div className="relative pt-6">
                            <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
                                <span>Power Pool: {powerPool} ft</span>
                                <span>Flood Pool: {floodPool} ft</span>
                            </div>
                            {/* Multi-colored progress bar logic could go here, but stick to simple for now */}
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, Math.max(0, ((current.elevation - powerPool) / (floodPool - powerPool)) * 100))}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 relative"
                                >
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>
                                </motion.div>
                            </div>
                            <div className="mt-2 text-[10px] text-zinc-600 text-center">
                                {current.elevation > powerPool
                                    ? `${(current.elevation - powerPool).toFixed(2)}ft above power pool`
                                    : `${(powerPool - current.elevation).toFixed(2)}ft below power pool`
                                }
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Tailwater Release</div>

                        <div className={`p-5 rounded-xl border ${riverStyles} relative overflow-hidden`}>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <div className="text-3xl font-mono font-bold tracking-tighter mb-1">
                                        {cfs.toLocaleString()} <span className="text-sm font-sans font-normal opacity-70">cfs</span>
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-80">{riverCondition}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-mono font-bold tracking-tighter">
                                        {current.tailwater?.toFixed(2) || '-'} <span className="text-sm font-sans font-normal opacity-70">ft</span>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Depth</div>
                                </div>
                            </div>

                            {/* Animated background pulse for flow */}
                            {cfs > 100 && (
                                <motion.div
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                    className="absolute inset-0 bg-current opacity-10"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="h-[250px] w-full mt-8">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Last 48 Hours</h3>
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
                                tick={{ fontSize: 10 }}
                                tickMargin={10}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={30}
                            />
                            <YAxis
                                domain={[minElev, maxElev]}
                                stroke="#71717a"
                                tick={{ fontSize: 10 }}
                                axisLine={false}
                                tickFormatter={(value) => value.toFixed(1)}
                                width={30}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', fontSize: '12px' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(val: number) => [val.toFixed(2) + ' ft', 'Elevation']}
                                labelStyle={{ color: '#a1a1aa', marginBottom: '4px' }}
                            />
                            <ReferenceLine y={powerPool} stroke="#bbf7d0" strokeDasharray="3 3" label={{ position: 'right', value: 'Power Pool', fill: '#86efac', fontSize: 10 }} />
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
