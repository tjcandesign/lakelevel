
import React from 'react';
import LakeLevelsPanel from '@/components/LakeLevelsPanel';
import GenerationSchedulePanel from '@/components/GenerationSchedulePanel';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-12">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            Norfork Lake Dashboard
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl">
            Real-time water levels and projected power generation schedules for fishermen and boaters.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 max-w-6xl -mt-4">
        {/* Lake Levels Section (Wide) */}
        <section className="mb-0">
          <div className="relative z-10">
            <LakeLevelsPanel />
          </div>
        </section>

        {/* Schedule & Info Grid */}
        <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GenerationSchedulePanel />
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* About / Context Panel */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">About Norfork Dam</h3>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Norfork Dam has two hydroelectric generators. "Full generation" typically means around 80-92 MW of power, releasing approximately 6,000-7,200 CFS (cubic feet per second) of water.
              </p>
              <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-3 rounded">
                <li><strong>0 MW:</strong> No generation. Good for wading (check tailwater level).</li>
                <li><strong>40-50 MW:</strong> One unit or partial load. Caution advised.</li>
                <li><strong>80+ MW:</strong> Heavy flow. Boating only. Dangerous for wading.</li>
              </ul>
            </div>

            {/* Disclaimer Mini-Panel */}
            <div className="bg-amber-50 rounded-lg border border-amber-100 p-5">
              <h4 className="text-amber-800 font-bold mb-2 text-sm uppercase tracking-wide">⚠️ Disclaimer</h4>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                This unofficial tool aggregates public data from the US Army Corps of Engineers and Southwestern Power Administration.
                <strong> Schedules are projections and can change without notice.</strong> Real-time demands may cause unscheduled releases.
                Always verify conditions and wear a life jacket.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-16 py-8 text-center text-slate-500 text-sm border-t border-slate-200">
        <p>
          Data sources: <a href="https://www.swl-wc.usace.army.mil/pages/data/tabular/htm/norfork.htm" target="_blank" className="underline hover:text-blue-600">USACE</a> &bull; <a href="https://www.energy.gov/swpa" target="_blank" className="underline hover:text-blue-600">SWPA</a>
        </p>
        <p className="mt-2 text-xs">
          Not affiliated with any government agency. Use at your own risk.
        </p>
      </footer>
    </div>
  );
}
