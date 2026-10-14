import React from 'react';
import { useNpl } from '../context/NplContext';
import { getSiteMedia } from '../utils/siteMedia';
import { SessionSelector } from './SessionSelector';
import { Users, Trophy, ArrowUpRight } from 'lucide-react';

const getShortLabel = (team) => team.shortName || team.short || team.name?.split(/\s+/).map((word) => word[0]).join('') || 'NPL';

export const TeamsSection = () => {
  const { teams, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const filteredTeams = teams.filter((team) => {
    const teamSessions = Array.isArray(team.sessions)
      ? team.sessions
      : Array.isArray(team.seasons)
        ? team.seasons
        : team.session
          ? [team.session]
          : seasons.map((season) => season.edition);

    return teamSessions.includes(selectedSeason);
  });

  return (
    <section id="teams" className="border-t border-slate-800 bg-[#05052f] pb-16">
      <div className="relative mb-10 overflow-hidden border-b border-sky-500/30 bg-[#103b83] px-5 py-10 sm:px-8 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_60%,rgba(0,183,255,0.8)_0_5%,transparent_5.2%),repeating-conic-gradient(from_250deg_at_72%_60%,rgba(0,183,255,0.65)_0deg_5deg,transparent_5deg_12deg)] opacity-70" />
        <div className="absolute inset-y-0 left-0 w-20 bg-[#1a3672]/80" />
        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-200">
              <Users className="h-4 w-4" />
              {filteredTeams.length} competing franchises
            </div>
            <h2 className="font-heading text-4xl font-black tracking-tight text-white sm:text-5xl">Teams</h2>
            <p className="mt-2 max-w-xl text-sm text-blue-100">
              Discover the squads competing for the Narua Premier League crown in {selectedSeason}.
            </p>
          </div>
          <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTeams.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No teams are registered for {selectedSeason} yet.
            </div>
          ) : (
            filteredTeams.map((team) => {
              const logo = getSiteMedia(siteMedia, `team-logo:${team.id}`, selectedSeason, team.logo);
              const primaryColor = team.primaryColor || '#1d4ed8';
              const secondaryColor = team.secondaryColor || '#071535';

              return (
                <a
                  key={team.id}
                  href={`/?team=${encodeURIComponent(team.id)}&season=${encodeURIComponent(selectedSeason)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    event.preventDefault();
                    const profileWindow = window.open(event.currentTarget.href, '_blank');
                    if (profileWindow) {
                      profileWindow.opener = null;
                    } else {
                      window.location.assign(event.currentTarget.href);
                    }
                  }}
                  className="group overflow-hidden rounded-xl text-left shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                  aria-label={`Open ${team.name} team profile in a new tab`}
                >
                  <span
                    className="relative flex aspect-[1.62/1] items-center justify-center overflow-hidden"
                    style={{
                      background: `radial-gradient(circle at 50% 52%, ${primaryColor} 0%, ${primaryColor} 20%, transparent 20.5%), repeating-conic-gradient(from 12deg at 50% 52%, ${primaryColor} 0deg 8deg, ${secondaryColor} 8deg 17deg)`
                    }}
                  >
                    <span className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/15" />
                    <span className="absolute -left-10 top-0 h-full w-16 -rotate-[22deg] bg-white/10" />
                    <span className="absolute -right-10 top-0 h-full w-16 rotate-[22deg] bg-white/10" />
                    <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/15 to-transparent" />
                    {logo ? (
                      <img
                        src={logo}
                        alt={`${team.name} logo`}
                        className="relative z-10 h-28 w-28 object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:scale-110 sm:h-32 sm:w-32"
                        loading="lazy"
                      />
                    ) : (
                      <span className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-2 border-white/70 bg-black/20 text-2xl font-black text-white shadow-xl">
                        {getShortLabel(team)}
                      </span>
                    )}
                    {team.titles > 0 && (
                      <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-extrabold text-amber-200 backdrop-blur">
                        <Trophy className="h-3.5 w-3.5" />
                        {team.titles}
                      </span>
                    )}
                  </span>
                  <span
                    className="flex min-h-[68px] items-center justify-between gap-3 px-4 py-4"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span className="line-clamp-2 font-heading text-base font-extrabold leading-tight text-white drop-shadow-sm sm:text-lg">
                      {team.name}
                    </span>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-white/80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </a>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
