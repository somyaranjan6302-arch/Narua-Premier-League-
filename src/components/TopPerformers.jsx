import React from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Award, Zap, Flame, Shield, Target, Sparkles } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';
import { session3Performers } from '../data/session3Data';
import { session4Performers } from '../data/session4Data';
import { session5Performers } from '../data/session5Data';
import { session2Performers } from '../data/session2Data';

const getMetric = (text) => {
  const trimmed = text.trim();
  const leadingValue = trimmed.match(/^([\d][\d.,/*%*]*(?:\s*\([^)]*\))?)\s+(.+)$/);
  if (leadingValue) return { value: leadingValue[1], label: leadingValue[2] };

  const trailingValue = trimmed.match(/^(.+?)\s+([\d][\d.,/*%*]*(?:\s*\([^)]*\))?)$/);
  if (trailingValue) return { value: trailingValue[2], label: trailingValue[1] };

  return { value: trimmed, label: '' };
};

export const TopPerformers = () => {
  const { topPerformers, teams, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();

  const performerList = [
    { key: 'orangeCap', data: topPerformers.orangeCap, icon: Award, label: 'Orange Cap' },
    { key: 'purpleCap', data: topPerformers.purpleCap, icon: Shield, label: 'Purple Cap' },
    { key: 'mostSixes', data: topPerformers.mostSixes, icon: Flame, label: 'Maximum Sixes' },
    { key: 'bestEconomy', data: topPerformers.bestEconomy, icon: Target, label: 'Best Economy' },
    { key: 'highestScore', data: topPerformers.highestScore, icon: Zap, label: 'Highest Scorer' },
    { key: 'bestBowling', data: topPerformers.bestBowling, icon: Sparkles, label: 'Best Bowling Figures' }
  ];
  const activePerformers = selectedSeason === 'Season 5'
    ? session5Performers
    : selectedSeason === 'Season 2' ? session2Performers
      : selectedSeason === 'Season 3' ? session3Performers
        : selectedSeason === 'Season 4' ? session4Performers : topPerformers;
  const sessionPerformers = ['Season 2', 'Season 3', 'Season 4', 'Season 5'].includes(selectedSeason)
    ? performerList.map((item) => ({ ...item, data: activePerformers[item.key] }))
    : performerList;

  return (
    <section id="performers" className="border-t border-slate-800 bg-[#05052f] py-12 sm:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400">
              <Award className="h-4 w-4" />
              {selectedSeason} awards
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Season&apos;s Top Performers
            </h2>
          </div>
          <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-6">
          {sessionPerformers.map(({ key, data, icon: Icon, label }) => {
            if (!data) return null;
            const rosterTeam = teams.find((team) => (
              (team.name === data.team || team.shortName === data.teamShort) &&
              (team.sessions || team.seasons || [team.session]).includes(selectedSeason)
            ));
            const photo = getSiteMedia(siteMedia, `performer:${key}`, selectedSeason, data.photo);
            const teamLogo = rosterTeam
              ? getSiteMedia(siteMedia, `team-logo:${rosterTeam.id}`, selectedSeason, rosterTeam.logo)
              : '';
            const nameParts = (data.player || data.team || 'NPL').trim().split(/\s+/);
            const familyName = nameParts.pop();
            const givenName = nameParts.join(' ');
            const teamInitials = (data.teamShort || data.team || 'NPL')
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => part[0])
              .join('')
              .slice(0, 3);
            const metrics = [data.stat, ...(data.details || '').split('•')]
              .filter(Boolean)
              .map(getMetric)
              .slice(0, 3);

            return (
              <div key={key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => openModal('player-profile', {
                    name: data.player,
                    team: data.team,
                    teamName: data.team,
                    teamShort: data.teamShort || rosterTeam?.shortName,
                    teamColor: rosterTeam?.primaryColor,
                    teamLogo,
                    season: selectedSeason,
                    role: data.category,
                    runs: data.stat,
                    photo,
                    details: data.details
                  })}
                  className="group relative block aspect-[9/17] w-full overflow-hidden rounded-xl bg-[#0b1c47] text-left shadow-lg outline-none ring-offset-2 ring-offset-[#05052f] transition hover:-translate-y-1 hover:shadow-2xl focus-visible:ring-2 focus-visible:ring-sky-400"
                  aria-label={`${label}: ${data.player || data.team}, ${data.stat}`}
                >
                  {photo && (
                    <img
                      src={photo}
                      alt={data.player || data.team}
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  )}
                  {!photo && <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-[#071535]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#031437]/50 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-[43%] bg-gradient-to-t from-[#06245b] via-[#06245b]/95 to-transparent" />

                  <div className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-slate-950/80 p-1 shadow-lg sm:right-3 sm:top-3 sm:h-11 sm:w-11">
                    {teamLogo ? (
                      <img src={teamLogo} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-center text-[10px] font-black uppercase leading-tight text-white">{teamInitials}</span>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3">
                    {givenName && (
                      <p className="truncate text-center text-xs font-bold leading-tight text-white drop-shadow-md sm:text-sm">
                        {givenName}
                      </p>
                    )}
                    <p className="line-clamp-2 text-center font-heading text-lg font-black uppercase leading-[1.05] text-white drop-shadow-md sm:text-xl">
                      {familyName}
                    </p>

                    <div className="mt-3 grid grid-cols-3 divide-x divide-white/15 border-t border-white/20 pt-2 text-center">
                      {metrics.map((metric, index) => (
                        <span key={`${metric.value}-${index}`} className="min-w-0 px-0.5">
                          <span className="block truncate text-[8px] font-bold uppercase leading-tight text-sky-100 sm:text-[9px]">
                            {metric.label || (index === 0 ? 'Stat' : 'Record')}
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-black leading-tight text-white sm:text-base">
                            {metric.value}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
                <p className="mt-2.5 min-h-5 text-sm font-extrabold leading-tight text-white sm:text-base">{label}</p>
              </div>
            );
          })}
          {sessionPerformers.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No performer records are available for {selectedSeason} yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
