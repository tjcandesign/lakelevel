
'use client';

import React, { useEffect, useState } from 'react';
import { UsaceData } from '@/lib/types';
import { format } from 'date-fns';

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

    if (loading) return <div className="p-4 bg-zinc-900 rounded-xl border border-white/10 animate-pulse h-48 text-zinc-500 flex items-center justify-center">Loading Conditions...</div>;
    if (error) return <div className="p-4 bg-red-900/20 text-red-400 border border-red-900/50 rounded-xl">Error: {error}</div>;
    if (!data || data.hourly.length === 0) return <div className="p-4 text-zinc-400">No data available.</div>;

    const current = data.hourly[0];

    // Trend Logic
    const sixHoursAgo = data.hourly[Math.min(6, data.hourly.length - 1)];
    const trend = current.elevation - sixHoursAgo.elevation;
    const trendLabel = trend > 0 ? 'Rising' : trend < 0 ? 'Falling' : 'Steady';
    // Use vibrant colors for dark mode
    const trendColor = trend > 0 ? 'text-blue-400' : trend < 0 ? 'text-amber-400' : 'text-zinc-400';
    const trendIcon = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

    // River Condition Logic
    const cfs = current.totalReleaseCfs ?? current.generationCfs ?? 0;
    let riverCondition = 'Low / Wadeable';
    // Dark mode status styles
    let riverStyles = 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';

    if (cfs > 500 && cfs < 3000) {
        riverCondition = 'Moderate Flow';
        riverStyles = 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    } else if (cfs >= 3000) {
        riverCondition = 'High / Boating Only';
        riverStyles = 'text-red-400 bg-red-400/10 border-red-400/20';
    }

    return (
        <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-5 md:p-8">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                    <span className="w-1.5 h-6 bg-blue-500 rounded-full mr-3 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                    Current Conditions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                    {/* River Section */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
                            River Below Dam
                        </h3>

                        <div className={`p-4 rounded-lg border ${riverStyles} flex items-center justify-between backdrop-blur-sm`}>
                            <div>
                                <div className="text-[10px] uppercase font-bold opacity-70 mb-1 tracking-wider">Status</div>
                                <div className="text-lg font-bold tracking-tight">{riverCondition}</div>
                            </div>
                            {/* Visual Pulse Indicator for active flow */}
                            {cfs > 100 && (
                                <div className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                                    {current.tailwater?.toFixed(2) ?? '-'} <span className="text-sm font-sans font-normal text-zinc-500">ft</span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wide">Tailwater Depth</div>
                            </div>
                            <div>
                                <div className="text-3xl font-mono font-bold text-white tracking-tighter">
                                    {cfs.toLocaleString()} <span className="text-sm font-sans font-normal text-zinc-500">cfs</span>
                                </div>
                                <div className="text-xs text-zinc-500 mt-1 font-medium uppercase tracking-wide">Release Speed</div>
                            </div>
                        </div>
                    </div>

                    {/* Lake Section */}
                    <div className="space-y-5">
                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5 pb-2">
                            Norfork Lake
                        </h3>
                        <div className="flex items-baseline space-x-3">
                            <span className="text-4xl font-mono font-bold text-white tracking-tighter">{current.elevation.toFixed(2)}</span>
                            <span className="text-sm text-zinc-500">ft elevation</span>
                        </div>

                        <div className={`flex items-center space-x-2 text-sm font-medium ${trendColor}`}>
                            <span className="text-lg">{trendIcon}</span>
                            <span>{trendLabel} <span className="text-zinc-600 ml-1">({Math.abs(trend).toFixed(2)}ft / 6h)</span></span>
                        </div>

                        <div className="text-xs text-zinc-600 mt-3 pt-3 border-t border-white/5">
                            Target Power Pool: <span className="text-zinc-400">{data.meta.currentPowerPool} ft</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Toggle */}
            <div className="border-t border-white/5 bg-white/[0.02]">
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="w-full py-3 text-xs uppercase tracking-widest text-zinc-500 hover:text-white hover:bg-white/5 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    {showDetails ? 'Hide History' : 'View Recent History'}
                    <span className="text-[10px]">{showDetails ? '−' : '+'}</span>
                </button>

                {showDetails && (
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
                )}
            </div>
        </div>
    );
}
