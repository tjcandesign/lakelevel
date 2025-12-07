
'use client';

import React, { useEffect, useState } from 'react';
import { SwpaSchedule } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

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

    const formatHour = (h: number) => {
        const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;
        return `${displayH}:00 ${ampm}`;
    };

    const getStatusColor = (mw: number) => {
        if (mw === 0) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
        if (mw < 40) return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
        if (mw < 85) return 'text-orange-400 bg-orange-400/10 border-orange-400/30';
        return 'text-red-400 bg-red-400/10 border-red-400/30';
    };

    const getForecastSummary = (schedule: typeof data.schedule) => {
        if (!schedule || schedule.length === 0) return "No data available.";

        const generations = schedule.filter(s => s.nfdMw > 0);
        if (generations.length === 0) return "No generation projected. Excellent availability for wading.";
        if (generations.length === 24) return "Continuous generation projected. Water will likely be high all day.";

        const firstGen = generations[0].hour;
        const lastGen = generations[generations.length - 1].hour;

        return `Generation projected from ${formatHour(firstGen)} to ${formatHour(lastGen)}. Be careful of rising water around ${formatHour(firstGen)}.`;
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        show: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col h-full"
        >
            <div className="p-5 md:p-6 border-b border-white/5">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <motion.span
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: 0.4 }}
                        className="w-1.5 h-6 bg-amber-500 rounded-full mr-3 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    />
                    Generation Forecast
                </h2>

                {/* Day Picker */}
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                    {DAYS.map((day) => (
                        <button
                            key={day.key}
                            onClick={() => setSelectedDay(day.key)}
                            className={`
                px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border
                ${selectedDay === day.key
                                    ? 'bg-white text-black border-white shadow-lg scale-105'
                                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}
                `}
                        >
                            {day.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 relative min-h-[300px] bg-black/20">
                <AnimatePresence mode="wait">
                    {loading && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center backdrop-blur-sm z-10"
                        >
                            <div className="text-blue-500 font-medium animate-pulse">Checking Forecast...</div>
                        </motion.div>
                    )}

                    {error && !loading && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-8 text-center h-full flex flex-col items-center justify-center"
                        >
                            <div className="text-zinc-700 mb-4 text-5xl opacity-50">📅</div>
                            <div className="text-zinc-400 font-medium">Schedule Not Yet Published</div>
                            <div className="text-xs text-zinc-600 mt-2 max-w-xs mx-auto">
                                The SWPA usually publishes the report for {selectedDay} later in the day.
                            </div>
                        </motion.div>
                    )}

                    {!error && data && !loading && (
                        <div key="content">
                            {/* Forecast Summary Box */}
                            <div className="bg-indigo-500/10 p-5 border-b border-indigo-500/10">
                                <h3 className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-2">Outlook</h3>
                                <p className="text-indigo-200 text-sm leading-relaxed border-l-2 border-indigo-500 pl-3">
                                    {getForecastSummary(data.schedule)}
                                </p>
                            </div>

                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="show"
                                className="divide-y divide-white/5"
                            >
                                {data.schedule.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">No data found in report.</div>
                                ) : (
                                    data.schedule.map((row) => (
                                        <motion.div
                                            variants={itemVariants}
                                            key={row.hour}
                                            className="flex items-center justify-between px-6 py-3.5 hover:bg-white/5 transition-colors group"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="w-16 text-xs font-bold text-zinc-500 font-mono">
                                                    {formatHour(row.hour)}
                                                </div>
                                                {/* Timeline dot */}
                                                <div className={`
                                            w-2 h-2 rounded-full shadow-[0_0_8px_bg-current] transition-all duration-500
                                            ${row.nfdMw > 0 ? 'bg-red-500 shadow-red-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}
                                        `}></div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <div className={`
                                            px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest border
                                            ${getStatusColor(row.nfdMw)}
                                        `}>
                                                    {row.nfdMw === 0 ? 'Wadeable' : `${row.nfdMw} MW`}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
