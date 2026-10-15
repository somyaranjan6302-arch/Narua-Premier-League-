import React, { useMemo, useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { getSiteMedia } from '../../utils/siteMedia';
import { X, Trophy, UserCheck, Shield, MapPin, Users, CalendarDays, Newspaper, Play, Globe2 } from 'lucide-react';

const profileTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'squad', label: 'Squad', icon: Users },
  { id: 'matches', label: 'Matches', icon: CalendarDays },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'videos', label: 'Videos', icon: Play }
];

const teamHasMatch = (match, team) => [match.team1, match.team2].some((side) => (
  Boolean(team && side && (
    (team.id && side.id === team.id) ||
    (team.name && side.name === team.name) ||
    (team.shortName && side.shortName === team.shortName) ||
    (team.shortName && side.name === team.shortName)
  ))
));

const teamIsMentioned = (item, team) => {
  if (!team) return false;
  const content = `${item.headline || item.title || ''} ${item.snippet || ''} ${item.description || ''} ${item.fullContent || ''}`.toLowerCase();
  return content.includes((team.name || '').toLowerCase()) ||
    (team.shortName && content.includes(team.shortName.toLowerCase()));
};

const InfoCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-xl border border-white/10 bg-[#081943] p-4">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
      {Icon && <Icon className="h-4 w-4 text-sky-300" />}
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-bold text-white sm:text-base">{value || 'Not listed'}</p>
  </div>
);

export const TeamDetailsModal = ({ team, onClose }) => {
  const { openModal, siteMedia, selectedSeason, teams, matches, news, highlights } = useNpl();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTeamId, setCurrentTeamId] = useState(team?.id);

  const currentTeam = teams.find((candidate) => candidate.id === currentTeamId) || team;
  const availableTeams = teams.filter((candidate) => {
    const sessions = Array.isArray(candidate.sessions)
      ? candidate.sessions
      : Array.isArray(candidate.seasons)
        ? candidate.seasons
        : candidate.session
          ? [candidate.session]
          : [selectedSeason];
    return sessions.includes(selectedSeason);
  });
  const primaryColor = currentTeam?.primaryColor || '#1d4ed8';
  const teamLogo = getSiteMedia(siteMedia, `team-logo:${currentTeam?.id}`, selectedSeason, currentTeam?.logo);
  const banner = getSiteMedia(siteMedia, `team:${currentTeam?.id}`, selectedSeason, currentTeam?.banner);
  const teamMatches = useMemo(
    () => matches.filter((match) => (match.season || match.session) === selectedSeason && teamHasMatch(match, currentTeam)),
    [matches, selectedSeason, currentTeam]
  );
  const teamNews = useMemo(
    () => news.filter((item) => (item.season || item.session) === selectedSeason && teamIsMentioned(item, currentTeam)),
    [news, selectedSeason, currentTeam]
  );
  const teamHighlights = useMemo(
    () => highlights.filter((item) => (item.season || item.session) === selectedSeason && teamIsMentioned(item, currentTeam)),
    [highlights, selectedSeason, currentTeam]
  );

  if (!team) return null;

  const openPlayerProfile = (player) => openModal('player-profile', {
    ...player,
    teamId: currentTeam.id,
    teamName: currentTeam.name,
    teamShort: currentTeam.shortName,
    teamColor: currentTeam.primaryColor,
    teamLogo,
    photo: getSiteMedia(siteMedia, `player-photo:${currentTeam.id}-${player.id}`, selectedSeason, player.photo),
    season: selectedSeason
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ backgroundColor: '#04102a' }}>
      <div className="min-h-full">
        <div className="sticky top-0 z-30 flex min-h-[68px] items-center justify-center border-b border-sky-400/15 px-14 shadow-lg backdrop-blur" style={{ backgroundColor: 'rgba(6, 37, 91, 0.98)' }}>
          <div className="flex max-w-full items-center gap-2 overflow-x-auto py-2 sm:gap-3">
            {availableTeams.map((candidate) => {
              const candidateLogo = getSiteMedia(siteMedia, `team-logo:${candidate.id}`, selectedSeason, candidate.logo);
              const isActive = candidate.id === currentTeam.id;
              return (
                <button
                  key={candidate.id}
                  type="button"
                  onClick={() => {
                    setCurrentTeamId(candidate.id);
                    setActiveTab('overview');
                  }}
                  aria-label={`View ${candidate.name}`}
                  aria-pressed={isActive}
                  title={candidate.name}
                  className={`group/team flex h-12 shrink-0 items-center gap-2 rounded-xl border px-2.5 shadow-sm transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06255b] ${
                    isActive
                      ? 'border-white/70 text-white shadow-lg shadow-black/25 ring-2 ring-amber-300/70'
                      : 'border-white/10 bg-slate-950/25 text-white/75 hover:border-white/35 hover:bg-white/10 hover:text-white'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${candidate.primaryColor || '#0ea5e9'}, ${candidate.secondaryColor || '#082f49'})`
                  } : undefined}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border p-1 ${
                    isActive ? 'border-white/50 bg-black/15' : 'border-white/15 bg-black/20'
                  }`}>
                    {candidateLogo ? (
                      <img src={candidateLogo} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-[10px] font-black text-white">{candidate.shortName || candidate.name?.slice(0, 3)}</span>
                    )}
                  </span>
                  <span className="max-w-32 truncate text-xs font-extrabold">{candidate.name}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close team profile"
            className="absolute right-4 top-3 rounded-xl border border-white/15 bg-black/25 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <section className="relative isolate min-h-[300px] overflow-hidden rounded-2xl bg-[#071535] sm:min-h-[360px]">
            {banner && <img src={banner} alt="" className="absolute inset-0 z-0 h-full w-full object-cover" />}
            <div
              className="absolute inset-0 z-0 opacity-60 mix-blend-screen"
              style={{
                background: `radial-gradient(circle at 75% 50%, ${primaryColor} 0%, ${primaryColor} 12%, transparent 12.5%), repeating-conic-gradient(from 12deg at 75% 50%, ${primaryColor} 0deg 7deg, transparent 7deg 16deg)`
              }}
            />
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black/75 via-black/25 to-black/10" />
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/40 to-transparent" />

            <div className="relative z-10 flex min-h-[300px] items-center justify-between gap-4 p-6 sm:min-h-[360px] sm:px-10 sm:py-8">
              <div className="max-w-[70%]">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/90 backdrop-blur">
                  {selectedSeason} • Official franchise
                </span>
                <h1 className="mt-4 max-w-3xl font-heading text-3xl font-black leading-tight text-white drop-shadow-lg sm:text-5xl lg:text-6xl">
                  {currentTeam.name}
                </h1>
                {currentTeam.slogan && <p className="mt-3 text-sm font-semibold text-white/85 sm:text-base">{currentTeam.slogan}</p>}
                {currentTeam.titles > 0 && (
                  <span className="mt-5 inline-flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-sm font-extrabold text-amber-200">
                    <Trophy className="h-4 w-4" />
                    {currentTeam.titles} {currentTeam.titles === 1 ? 'Championship' : 'Championships'}
                  </span>
                )}
              </div>
              <div className="flex h-24 w-24 shrink-0 items-center justify-center sm:h-40 sm:w-40">
                {teamLogo ? (
                  <img src={teamLogo} alt={`${currentTeam.name} logo`} className="h-full w-full object-contain drop-shadow-2xl" />
                ) : (
                  <span className="text-3xl font-black text-white drop-shadow-lg">{currentTeam.shortName || 'NPL'}</span>
                )}
              </div>
            </div>
          </section>

          <nav aria-label="Team profile sections" className="-mt-1 flex gap-1 overflow-x-auto border-b border-sky-400/15 bg-[#06255b]/80 px-2 sm:px-4">
            {profileTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={activeTab === id ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition sm:px-6 ${activeTab === id ? 'border-orange-500 text-white' : 'border-transparent text-blue-100/70 hover:text-white'}`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {label}
                {id === 'squad' && <span className="text-xs opacity-70">{currentTeam.squad?.length || 0}</span>}
              </button>
            ))}
          </nav>

          <main className="pt-7">
            {activeTab === 'overview' && (
              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  {[
                    ['Matches', currentTeam.matches ?? teamMatches.length, 'text-white'],
                    ['Wins', currentTeam.wins ?? 0, 'text-emerald-300'],
                    ['Losses', currentTeam.losses ?? 0, 'text-rose-300'],
                    ['Win rate', `${currentTeam.winPercentage ?? 0}%`, 'text-sky-200'],
                    ['Titles', currentTeam.titles ?? 0, 'text-amber-200']
                  ].map(([label, value, color]) => (
                    <div key={label} className="rounded-xl border border-white/10 bg-[#081943] p-4 text-center">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <span className={`mt-1 block font-heading text-2xl font-black ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label="Captain" value={currentTeam.captain} icon={UserCheck} />
                  <InfoCard label="Coach" value={currentTeam.coach} icon={Shield} />
                  <InfoCard label="Owner" value={currentTeam.owner} icon={Users} />
                  <InfoCard label="Venue" value={currentTeam.home} icon={MapPin} />
                </div>
                <div className="rounded-2xl border border-white/10 bg-[#081943] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest text-sky-300">Official squad</p>
                      <h2 className="mt-1 text-xl font-extrabold text-white">Meet the players</h2>
                    </div>
                    <button type="button" onClick={() => setActiveTab('squad')} className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20">
                      Full squad ({currentTeam.squad?.length || 0})
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(currentTeam.squad || []).slice(0, 8).map((player) => (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => openPlayerProfile(player)}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-slate-100 transition hover:border-sky-300/50 hover:bg-sky-950/60"
                      >
                        {player.name}{player.isCaptain ? ' • C' : ''}
                      </button>
                    ))}
                    {!currentTeam.squad?.length && <p className="text-sm text-slate-400">The squad roster has not been added for this team.</p>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'squad' && (
              <section>
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-sky-300">Official roster</p>
                    <h2 className="mt-1 text-2xl font-extrabold text-white">Squad</h2>
                  </div>
                  <span className="text-sm text-slate-400">{currentTeam.squad?.length || 0} players • Select a player to view profile</span>
                </div>
                {currentTeam.squad?.length ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {currentTeam.squad.map((player, index) => {
                      const playerPhoto = getSiteMedia(siteMedia, `player-photo:${currentTeam.id}-${player.id}`, selectedSeason, player.photo);
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => openPlayerProfile(player)}
                          className="group flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#081943] p-3 text-left transition hover:border-sky-300/50 hover:bg-[#0b2253]"
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900 text-sm font-black text-slate-400">
                            {playerPhoto ? <img src={playerPhoto} alt="" className="h-full w-full object-cover" /> : String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="truncate text-sm font-extrabold text-white group-hover:text-sky-200">{player.name}</span>
                              {player.isCaptain && <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-black text-amber-200">CAPTAIN</span>}
                            </span>
                            <span className="mt-1 block truncate text-xs text-slate-400">{player.role || 'Player'}{player.style ? ` • ${player.style}` : ''}</span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm font-black text-sky-200">{player.runs ? `${player.runs} R` : `${player.wickets || 0} W`}</span>
                            <span className="block text-[10px] text-slate-500">#{index + 1}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">The squad roster has not been added for this team.</p>
                )}
              </section>
            )}

            {activeTab === 'matches' && (
              <section>
                <p className="text-xs font-black uppercase tracking-widest text-sky-300">Season results</p>
                <h2 className="mb-5 mt-1 text-2xl font-extrabold text-white">{currentTeam.name} matches</h2>
                {teamMatches.length ? (
                  <div className="space-y-3">
                    {teamMatches.map((match) => (
                      <article key={match.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#081943] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-sky-300">{match.matchNumber || match.tournamentPhase || 'Match'}{match.date ? ` • ${match.date}` : ''}</p>
                          <p className="mt-1 font-bold text-white">{match.team1?.name || match.team1?.shortName} <span className="px-2 text-slate-500">vs</span> {match.team2?.name || match.team2?.shortName}</p>
                        </div>
                        <div className="text-sm font-extrabold text-slate-200">
                          {match.team1?.score || '—'} <span className="px-1 text-slate-500">/</span> {match.team2?.score || '—'}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No match records are available for this team in {selectedSeason}.</p>}
              </section>
            )}

            {activeTab === 'news' && (
              <section>
                <p className="text-xs font-black uppercase tracking-widest text-sky-300">Team updates</p>
                <h2 className="mb-5 mt-1 text-2xl font-extrabold text-white">{currentTeam.name} news</h2>
                {teamNews.length ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {teamNews.map((item) => (
                      <article key={item.id} className="rounded-xl border border-white/10 bg-[#081943] p-5">
                        <p className="text-xs font-bold text-sky-300">{item.date || selectedSeason} • {item.category || 'Team news'}</p>
                        <h3 className="mt-2 text-lg font-extrabold text-white">{item.headline}</h3>
                        {item.snippet && <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.snippet}</p>}
                      </article>
                    ))}
                  </div>
                ) : <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No news has been linked to {currentTeam.name} for {selectedSeason}.</p>}
              </section>
            )}

            {activeTab === 'videos' && (
              <section>
                <p className="text-xs font-black uppercase tracking-widest text-sky-300">Watch</p>
                <h2 className="mb-5 mt-1 text-2xl font-extrabold text-white">{currentTeam.name} videos</h2>
                {teamHighlights.length ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {teamHighlights.map((item) => (
                      <article key={item.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#081943]">
                        {item.thumbnail && <img src={getSiteMedia(siteMedia, `highlight:${item.id}`, selectedSeason, item.thumbnail)} alt="" className="aspect-video w-full object-cover" />}
                        <div className="p-4">
                          <h3 className="font-extrabold text-white">{item.title}</h3>
                          {item.description && <p className="mt-1 text-xs text-slate-400">{item.description}</p>}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">No videos have been linked to {currentTeam.name} for {selectedSeason}.</p>}
              </section>
            )}
          </main>

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-slate-400">
            <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-sky-300" /> Narua Premier League • {selectedSeason}</span>
            <span>{currentTeam.name}</span>
          </footer>
        </div>
      </div>
    </div>
  );
};
