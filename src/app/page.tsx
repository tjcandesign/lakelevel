
import React from 'react';
import LakeLevelsPanel from '@/components/LakeLevelsPanel';
import GenerationSchedulePanel from '@/components/GenerationSchedulePanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-black font-sans text-zinc-100 pb-12 selection:bg-blue-500/30">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black pointer-events-none"></div>

      <header className="relative z-10 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-mono font-black uppercase tracking-tighter text-white mb-2">
                Norfork Lake <span className="text-zinc-600 block md:inline md:ml-4">Dashboard</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase">
                  Live Conditions & Forecast
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Unofficial Tool
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 max-w-5xl py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Lake & River Levels (Wider) */}
          <div className="lg:col-span-12">
            <LakeLevelsPanel />
          </div>

          {/* Right Column: Schedule & Info */}
          <div className="lg:col-span-8">
            <GenerationSchedulePanel />
          </div>

          <div className="lg:col-span-4 space-y-6">
            {/* Quick Reference Card */}
            <div className="bg-zinc-900 rounded-xl shadow-lg border border-white/10 p-6">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-zinc-500"></span>
                Guidance
              </h3>

              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">Wadeable (0 MW)</div>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                      Safe for wading. Ideally tailwater &lt; 362.5ft.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200 group-hover:text-amber-400 transition-colors">Caution (1-40 MW)</div>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                      Modest current. Experienced waders only.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4 group">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                  <div>
                    <div className="text-sm font-bold text-zinc-200 group-hover:text-red-400 transition-colors">Dangerous (80+ MW)</div>
                    <p className="text-xs text-zinc-500 leading-relaxed mt-1">
                      High water. Boating only. Do not wade.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Source Footer */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 text-center">About The Data Sources</h3>
              <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                {/* SWPA Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">Southwestern Power Admin (SWPA)</h4>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-wider">Generation</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    One of four Power Marketing Administrations in the U.S., SWPA markets cost-based, wholesale power generated from 24 Federal hydropower projects owned by the U.S. Army Corps of Engineers.
                  </p>
                  <div className="text-[10px] text-zinc-500 mb-4">
                    <strong className="text-zinc-400">Territory:</strong> AR, KS, LA, MO, OK, TX.
                  </div>
                  <a
                    href="https://www.energy.gov/swpa/southwestern-power-administration"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors group"
                  >
                    Visit SWPA Website
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>

                {/* USACE Card */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-white">US Army Corps of Engineers</h4>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20 uppercase tracking-wider">Lake Levels</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    The Little Rock District Water Control manages the reservoir levels and releases. Data covers elevation, tailwater depth, and total release cubic feet per second (CFS).
                  </p>
                  <a
                    href="https://www.swl-wc.usace.army.mil/pages/data/tabular/htm/norfork.htm"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group"
                  >
                    View Raw USACE Data
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-zinc-600 text-center px-4 leading-relaxed font-medium uppercase tracking-wide mt-12 mb-4">
              ⚠️ Verify official reports. Wear a life jacket.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
