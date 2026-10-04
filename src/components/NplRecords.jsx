import React from 'react';
import { useNpl } from '../context/NplContext';
import { Trophy, Zap, Shield, Flame, Award, Target, Star } from 'lucide-react';

export const NplRecords = () => {
  const { records, selectedSeason } = useNpl();
  const visibleRecords = records.filter((record) => !record.season || record.season === selectedSeason);

  return (
    <section id="records" className="py-20 bg-[#060D1E] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-widest uppercase mb-3">
            <Star className="w-3.5 h-3.5" />
            <span>HISTORIC MILESTONES</span>
          </div>
          <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
            NPL <span className="text-gold-gradient">RECORDS</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            The extraordinary tournament benchmarks, records, and unbreakable performances in Narua cricket history.
          </p>
        </div>

        {/* Records Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {visibleRecords.map((rec, idx) => (
            <div
              key={idx}
              className="glass-panel-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1 relative group shadow-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                  RECORD #{idx + 1}
                </span>
                <Trophy className="w-4 h-4 text-amber-400/80 group-hover:scale-110 transition-transform" />
              </div>

              <h3 className="font-sports text-xl text-slate-200 tracking-wide line-clamp-1">
                {rec.title}
              </h3>

              <div className="font-sports text-3xl sm:text-4xl text-white tracking-wider my-1 text-gold-gradient">
                {rec.value}
              </div>

              <div className="font-heading font-bold text-slate-100 text-sm">
                {rec.holder}
              </div>

              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
                {rec.details}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
