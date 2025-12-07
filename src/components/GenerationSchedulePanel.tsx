
'use client';

import React, { useEffect, useState } from 'react';
import { SwpaSchedule } from '@/lib/types';

const DAYS = [
    { label: 'Today', key: 'today' },
    { label: 'Tomorrow', key: 'tomorrow' },
    { label: 'Sun', key: 'sun' },
    { label: 'Mon', key: 'mon' },
    { label: 'Tue', key: 'tue' },
    { label: 'Wed', key: 'wed' },
    { label: 'Thu', key: 'thu' },
    { label: 'Fri', key: 'fri' },
    { label: 'Sat', key: 'sat' },
];

export default function GenerationSchedulePanel() {
    const [selectedDay, setSelectedDay] = useState('today');
    const [data, setData] = useState<SwpaSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');

        // reset data while loading to show feedback
        // but maybe keep old data? nah, clean slate is less confusing if day changes
        setData(null);

        fetch(`/api/norfork/schedule/${selectedDay}`)
            .then((res) => {
                if (!res.ok) throw new Error('Schedule unavailable');
                return res.json();
            })
            .then(setData)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [selectedDay]);

    // Helper to format hour 1-24 to 12h AM/PM
    const formatHour = (h: number) => {
        const d = new Date();
        d.setHours(h, 0, 0, 0); // "Hour Ending" usually means 1 = 01:00 AM, 24 = Midnight
        // However, in generation schedules, '1' is hour ending at 0100.
        // '24' is hour ending at 2400 (Midnight).
        // Let's just format strictly.
        const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        // Special case: Hour 24 is Midnight (12 AM next day usually, or end of day)
        return `${displayH}:00 ${ampm}`;
    };

    const getStatusColor = (mw: number) => {
        if (mw === 0) return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Safe/Wading
        if (mw < 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Partial
        if (mw < 85) return 'bg-orange-100 text-orange-800 border-orange-200'; // High
        return 'bg-red-100 text-red-800 border-red-200'; // Full Power (roughly 92ish)
    };

    const getStatusLabel = (mw: number) => {
        if (mw === 0) return 'No Generation';
        if (mw < 40) return 'Low Generation';
        if (mw < 85) return 'Medium Generation';
        return 'Full/High Generation';
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 flex flex-col h-full">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-800">Generation Schedule (NFD)</h2>
                <span className="text-xs text-slate-500 block leading-tight mt-1">
                    Southwestern Power Administration (Projected)
                </span>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-slate-200 bg-white pb-px">
                {DAYS.map((day) => (
                    <button
                        key={day.key}
                        onClick={() => setSelectedDay(day.key)}
                        className={`
              flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${selectedDay === day.key
                                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
            `}
                    >
                        {day.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 p-0 relative min-h-[300px]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 transition-opacity">
                        <div className="text-blue-600 font-medium animate-pulse">Fetching Schedule...</div>
                    </div>
                )}

                {error && !loading && (
                    <div className="p-8 text-center">
                        <div className="text-red-500 mb-2">⚠️ Could not load schedule</div>
                        <div className="text-sm text-slate-500">{error}</div>
                        <div className="mt-4 text-xs text-slate-400">
                            This usually means the SWPA report for this day hasn't been published yet.
                        </div>
                    </div>
                )}

                {!error && data && (
                    <div>
                        <div className="px-4 py-3 bg-blue-50/30 text-center border-b border-slate-100">
                            <div className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                                {data.date || `Schedule for ${selectedDay}`}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                Times are "Hour Ending" (Central Time)
                            </div>
                        </div>

                        <div className="grid grid-cols-1 divide-y divide-slate-100">
                            {data.schedule.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">No data found in report.</div>
                            ) : (
                                data.schedule.map((row) => (
                                    <div key={row.hour} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="w-24 flex-shrink-0">
                                            <div className="font-mono font-medium text-slate-700">
                                                HR {row.hour}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {formatHour(row.hour)}
                                            </div>
                                        </div>

                                        <div className="flex-1 flex items-center justify-between">
                                            <div className="font-bold text-xl text-slate-800">
                                                {row.nfdMw} <span className="text-sm font-normal text-slate-500">MW</span>
                                            </div>

                                            <div className={`
                                        px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                                        ${getStatusColor(row.nfdMw)}
                                    `}>
                                                {getStatusLabel(row.nfdMw)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
