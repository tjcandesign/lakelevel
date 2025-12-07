
'use client';

import React, { useEffect, useState } from 'react';
import { UsaceData } from '@/lib/types';
import { format } from 'date-fns';

export default function LakeLevelsPanel() {
    const [data, setData] = useState<UsaceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <div className="p-4 bg-white rounded shadow animate-pulse h-64">Loading Lake Levels...</div>;
    if (error) return <div className="p-4 bg-red-50 text-red-600 rounded">Error: {error}</div>;
    if (!data || data.hourly.length === 0) return <div className="p-4">No data available.</div>;

    const current = data.hourly[0];
    const floodPool = data.meta.topFloodPool || 580.00; // Known constant usually
    const powerPool = data.meta.currentPowerPool || 553.75; // Approx constant

    // Determine trend (simple check vs 24 hours ago or oldest available)
    const oldest = data.hourly[data.hourly.length - 1];
    const trend = current.elevation - oldest.elevation;
    const trendSymbol = trend > 0 ? '↑' : trend < 0 ? '↓' : '—';
    const trendColor = trend > 0 ? 'text-blue-600' : trend < 0 ? 'text-amber-600' : 'text-gray-600';

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-800">Lake Levels & Releases</h2>
                <span className="text-xs text-slate-500">USACE Data</span>
            </div>

            <div className="p-4 grid grid-cols-2 gap-4 md:grid-cols-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Elevation</div>
                    <div className="text-2xl font-bold text-slate-800">{current.elevation.toFixed(2)} <span className="text-sm font-normal text-slate-600">ft</span></div>
                    <div className={`text-xs ${trendColor} font-medium`}>{trendSymbol} {Math.abs(trend).toFixed(2)} ft (24h)</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Tailwater</div>
                    <div className="text-2xl font-bold text-slate-800">{current.tailwater?.toFixed(2) ?? '-'} <span className="text-sm font-normal text-slate-600">ft</span></div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Release</div>
                    <div className="text-2xl font-bold text-slate-800">{current.totalReleaseCfs ?? current.generationCfs ?? 0} <span className="text-sm font-normal text-slate-600">cfs</span></div>
                    <div className="text-xs text-slate-500">{current.generationMwh ?? 0} MWh</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Pool Target</div>
                    <div className="text-xl font-semibold text-slate-700">{powerPool} <span className="text-xs">ft</span></div>
                    <div className="text-xs text-slate-400">Flood: {floodPool} ft</div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                        <tr>
                            <th className="px-4 py-2">Time (Central)</th>
                            <th className="px-4 py-2">Elev (ft)</th>
                            <th className="px-4 py-2">Tailwater (ft)</th>
                            <th className="px-4 py-2 text-right">Gen (MWh)</th>
                            <th className="px-4 py-2 text-right">Release (CFS)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.hourly.slice(0, 12).map((row) => (
                            <tr key={row.timestamp} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-mono whitespace-nowrap">
                                    {format(row.timestamp, 'EEE HH:mm')}
                                </td>
                                <td className="px-4 py-2 font-medium text-slate-800">{row.elevation.toFixed(2)}</td>
                                <td className="px-4 py-2 text-slate-500">{row.tailwater?.toFixed(2) ?? '-'}</td>
                                <td className="px-4 py-2 text-right">{row.generationMwh}</td>
                                <td className="px-4 py-2 text-right font-medium text-blue-700">
                                    {row.totalReleaseCfs ?? row.generationCfs ?? 0}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-200">
                    Showing last 12 hours.
                </div>
            </div>
        </div>
    );
}
