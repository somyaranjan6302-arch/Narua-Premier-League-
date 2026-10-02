import React from 'react';

export const SessionSelector = ({ seasons, selectedSeason, setSelectedSeason }) => (
  <label className="relative z-10 flex flex-col gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
    Session
    <select
      value={selectedSeason || ''}
      onChange={(event) => setSelectedSeason(event.target.value)}
      className="relative z-20 min-w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold normal-case text-white focus:border-amber-500 focus:outline-none"
    >
      {seasons.map((season) => (
        <option key={season.edition} value={season.edition}>{season.edition} ({season.year || season.season})</option>
      ))}
    </select>
  </label>
);