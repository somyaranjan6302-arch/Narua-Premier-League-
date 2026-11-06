import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowLeft, CalendarDays, Check, ChevronRight, CircleHelp, LogOut, Plus, Shield, Trophy, Users } from 'lucide-react';
import { useNpl } from '../context/NplContext';
import { LiveScorerModal } from './modals/LiveScorerModal';

const fieldClass = 'w-full rounded-xl border border-white/15 bg-[#07083f] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#ffdb19]';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-blue-100/70';
const panelClass = 'rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-5';

const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || 'The scoring request could not be completed.');
  return result;
};

const teamRoster = (team) => (Array.isArray(team?.squad) ? team.squad : []).map((person) => ({
  id: String(person.id || `player-${crypto.randomUUID()}`),
  name: person.name,
  role: person.role || '',
  isPlayingXi: person.isPlayingXi !== false,
  isCaptain: Boolean(person.isCaptain),
  isWicketkeeper: Boolean(person.isWicketkeeper)
}));

const rosterDefaults = (team) => {
  const roster = teamRoster(team);
  const startingXi = roster.slice(0, 11);
  const captain = startingXi.find((person) => person.isCaptain || person.name === team?.captain);
  const keeper = startingXi.find((person) => person.isWicketkeeper || /wicketkeeper|keeper/i.test(person.role));
  return roster.map((person) => ({
    ...person,
    isPlayingXi: startingXi.some((starter) => starter.id === person.id) && person.isPlayingXi !== false,
    isCaptain: captain ? person.id === captain.id : person.id === startingXi[0]?.id,
    isWicketkeeper: keeper ? person.id === keeper.id : person.id === startingXi[0]?.id
  }));
};

const buildDraft = (season) => ({
  season,
  matchNumber: 'Match 1',
  tournamentPhase: 'LEAGUE MATCH',
  teamAId: '',
  teamBId: '',
  oversLimit: 20,
  oversPerBowler: 4,
  ballType: 'Tennis',
  pitchType: 'Matting',
  ground: 'Narua Cricket Ground',
  city: 'Jajpur',
  matchDate: new Date().toISOString().slice(0, 10),
  matchTime: '10:00 AM',
  assignedScorerId: '',
  umpires: [{ name: '', phone: '' }],
  secondaryScorers: [{ name: '', phone: '' }]
});

const setupOfficials = (items, onChange, title) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <button
        type="button"
        onClick={() => onChange([...items, { name: '', phone: '' }])}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[#ffdb19] hover:bg-white/10"
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    </div>
    {items.map((official, index) => (
      <div key={`${title}-${index}`} className="grid gap-2 sm:grid-cols-2">
        <input
          className={fieldClass}
          aria-label={`${title} ${index + 1} name`}
          placeholder="Name"
          value={official.name}
          onChange={(event) => onChange(items.map((item, itemIndex) => itemIndex === index
            ? { ...item, name: event.target.value }
            : item))}
        />
        <input
          className={fieldClass}
          aria-label={`${title} ${index + 1} phone`}
          placeholder="Registered phone number"
          inputMode="tel"
          value={official.phone}
          onChange={(event) => onChange(items.map((item, itemIndex) => itemIndex === index
            ? { ...item, phone: event.target.value }
            : item))}
        />
      </div>
    ))}
  </div>
);

const SetupRoster = ({ team, roster, onChange }) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const playingCount = roster.filter((player) => player.isPlayingXi).length;
  const updatePlayer = (playerId, updates) => onChange(roster.map((player) => (
    player.id === playerId ? { ...player, ...updates } : player
  )));

  const addPlayer = () => {
    const name = newPlayerName.trim();
    if (!name || roster.length >= 30) return;
    onChange([...roster, {
      id: `player-${crypto.randomUUID()}`,
      name,
      isPlayingXi: playingCount < 11,
      isCaptain: false,
      isWicketkeeper: false
    }]);
    setNewPlayerName('');
  };

  return (
    <section className={panelClass}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sports text-lg font-bold text-white">{team?.shortName || team?.name || 'Select a team'}</h3>
          <p className="mt-1 text-xs text-blue-100/60">{playingCount}/11 in Playing XI · {roster.length} squad members</p>
        </div>
        <Users className="h-5 w-5 shrink-0 text-[#ff8a00]" />
      </div>
      {team && roster.length > 0 ? (
        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {roster.map((player) => (
            <div key={player.id} className="rounded-xl border border-white/10 bg-[#090a43]/80 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Select ${player.name} for Playing XI`}
                  checked={player.isPlayingXi}
                  disabled={!player.isPlayingXi && playingCount >= 11}
                  onChange={(event) => updatePlayer(player.id, { isPlayingXi: event.target.checked })}
                  className="h-4 w-4 accent-[#ffdb19]"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">{player.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-blue-100/50">XI</span>
              </div>
              <div className="mt-2 flex gap-4 pl-7 text-xs text-blue-100/75">
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name={`${team.id}-captain`}
                    checked={player.isCaptain}
                    onChange={() => onChange(roster.map((person) => ({ ...person, isCaptain: person.id === player.id })))}
                    className="accent-[#ffdb19]"
                  />
                  Captain
                </label>
                <label className="inline-flex items-center gap-1.5">
                  <input
                    type="radio"
                    name={`${team.id}-keeper`}
                    checked={player.isWicketkeeper}
                    onChange={() => onChange(roster.map((person) => ({ ...person, isWicketkeeper: person.id === player.id })))}
                    className="accent-[#ffdb19]"
                  />
                  Wicketkeeper
                </label>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-blue-100/60">
          Choose a team to load its roster. You can add match players below.
        </p>
      )}
      {team && (
        <div className="mt-3 flex gap-2">
          <input
            value={newPlayerName}
            onChange={(event) => setNewPlayerName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addPlayer(); } }}
            placeholder="Add player to this match"
            className={fieldClass}
          />
          <button type="button" onClick={addPlayer} className="rounded-xl bg-white/10 px-3 text-white hover:bg-white/15" aria-label="Add player">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}
    </section>
  );
};

export default function ScorerPortal() {
  const {
    adminUser,
    loginAdmin,
    logoutAdmin,
    teams,
    seasons,
    selectedSeason,
    activeModal,
    openModal,
    closeModal,
    showToast,
    syncScoredMatch
  } = useNpl();
  const [login, setLogin] = useState({ adminId: '', password: '' });
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => buildDraft(selectedSeason));
  const [rosters, setRosters] = useState({ teamA: [], teamB: [] });
  const [customTeams, setCustomTeams] = useState({});
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState(selectedSeason);
  const seasonEditions = useMemo(() => seasons.map((season) => season.edition || season.season), [seasons]);
  const seasonTeams = useMemo(() => teams.filter((team) => {
    const editions = Array.isArray(team.sessions) ? team.sessions
      : Array.isArray(team.seasons) ? team.seasons
        : team.session ? [team.session] : seasonEditions;
    return editions.includes(selectedSeasonFilter);
  }), [teams, seasonEditions, selectedSeasonFilter]);
  const isAdministrator = adminUser?.role === 'owner' || adminUser?.role === 'admin';

  useEffect(() => {
    if (!adminUser) return undefined;
    let active = true;
    const loadMatches = async () => {
      try {
        const result = await apiRequest(`/api/matches?season=${encodeURIComponent(selectedSeasonFilter)}`);
        if (active) {
          setError('');
          setMatches(Array.isArray(result?.matches) ? result.matches : []);
        }
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void loadMatches();
    return () => { active = false; };
  }, [adminUser, selectedSeasonFilter]);

  const selectTeam = (key, teamId) => {
    if (teamId === '__create__') {
      const newTeam = {
        id: `match-team-${crypto.randomUUID()}`,
        name: '',
        shortName: '',
        sessions: [selectedSeasonFilter],
        squad: []
      };
      setCustomTeams((current) => ({ ...current, [newTeam.id]: newTeam }));
      setDraft((current) => ({ ...current, [key]: newTeam.id }));
      setRosters((current) => ({ ...current, [key === 'teamAId' ? 'teamA' : 'teamB']: [] }));
      return;
    }
    const team = seasonTeams.find((item) => item.id === teamId);
    const selectedTeam = team || customTeams[teamId];
    setDraft((current) => ({ ...current, [key]: teamId }));
    setRosters((current) => ({ ...current, [key === 'teamAId' ? 'teamA' : 'teamB']: rosterDefaults(selectedTeam) }));
  };

  const setDraftField = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const saveMatch = async (event) => {
    event.preventDefault();
    setError('');
    if (!draft.teamAId || !draft.teamBId || draft.teamAId === draft.teamBId) {
      setError('Choose two different teams before saving the match.');
      return;
    }
    const oversLimit = Number(draft.oversLimit);
    const oversPerBowler = Number(draft.oversPerBowler);
    if (!Number.isInteger(oversLimit) || oversLimit < 1 || oversLimit > 50 ||
      !Number.isInteger(oversPerBowler) || oversPerBowler < 1 ||
      oversPerBowler > oversLimit) {
      setError('Enter a valid match length and a bowler quota no greater than the match rules allow.');
      return;
    }
    for (const [label, key] of [['Team A', 'teamA'], ['Team B', 'teamB']]) {
      const roster = rosters[key];
      if (roster.filter((player) => player.isPlayingXi).length < 2) {
        setError(`${label} needs at least two players in the Playing XI to start scoring.`);
        return;
      }
      if (!roster.some((player) => player.isCaptain && player.isPlayingXi)) {
        setError(`Choose a Playing XI captain for ${label}.`);
        return;
      }
      if (!roster.some((player) => player.isWicketkeeper && player.isPlayingXi)) {
        setError(`Choose a Playing XI wicketkeeper for ${label}.`);
        return;
      }
    }
    setIsSaving(true);
    let createdMatch = null;
    try {
      const teamA = seasonTeams.find((team) => team.id === draft.teamAId) || customTeams[draft.teamAId];
      const teamB = seasonTeams.find((team) => team.id === draft.teamBId) || customTeams[draft.teamBId];
      if (!teamA?.name.trim() || !teamB?.name.trim()) {
        setError('Enter a name for each new match team.');
        return;
      }
      const result = await apiRequest('/api/matches', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          oversLimit,
          oversPerBowler,
          teamAName: teamA.name.trim(),
          teamAShort: teamA.shortName || teamA.name.trim(),
          teamBName: teamB.name.trim(),
          teamBShort: teamB.shortName || teamB.name.trim(),
          assignedScorerId: draft.assignedScorerId.trim(),
          venue: draft.ground,
          umpires: draft.umpires.filter((person) => person.name.trim() || person.phone.trim()),
          secondaryScorers: draft.secondaryScorers.filter((person) => person.name.trim() || person.phone.trim())
        })
      });
      createdMatch = result.match;
      await apiRequest(`/api/matches/${encodeURIComponent(createdMatch.id)}/squad`, {
        method: 'POST',
        body: JSON.stringify({
          squads: {
            teamA: rosters.teamA,
            teamB: rosters.teamB
          }
        })
      });
      syncScoredMatch(createdMatch);
      setMatches((current) => [createdMatch, ...current]);
      setIsCreating(false);
      showToast('Match setup saved. Continue to the toss and scoring console.', 'success');
      openModal('scorer-console', createdMatch);
    } catch (requestError) {
      if (createdMatch) {
        setMatches((current) => [createdMatch, ...current]);
        setError(`The match was created, but its squads could not be saved: ${requestError.message}`);
      } else {
        setError(requestError.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const availableMatches = matches.filter((match) => (
    (match.season || match.session) === selectedSeasonFilter &&
    (isAdministrator || match.assignedScorerId === adminUser?.adminId)
  ));

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#15145c_0%,_#070831_50%,_#04051d_100%)] text-white">
      <header className="border-b border-white/10 bg-[#07083f]/85 shadow-xl shadow-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <a href="/" className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a00] to-[#ffdb19] text-[#070831]">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="font-sports truncate text-lg font-bold tracking-wide text-white">NPL ONLINE SCORING</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ffdb19]">Match day control</p>
            </div>
          </a>
          {adminUser && (
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-blue-100/70 sm:block">{adminUser.adminId} · {adminUser.role}</span>
              <button
                type="button"
                onClick={async () => { await logoutAdmin(); setMatches([]); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-2 text-xs font-bold text-blue-100 hover:bg-white/10"
              >
                <LogOut className="h-3.5 w-3.5" /><span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
        {!adminUser ? (
          <section className="mx-auto max-w-md rounded-3xl border border-white/10 bg-[#0b0d49]/90 p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffdb19]/10 text-[#ffdb19]">
              <Shield className="h-6 w-6" />
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a00]">Scorer access</p>
            <h1 className="font-sports text-2xl font-bold text-white">Sign in to your match desk</h1>
            <p className="mt-2 text-sm leading-6 text-blue-100/65">Use your NPL scorer or administrator account. Scorers will see only matches assigned to their account.</p>
            <form
              className="mt-6 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError('');
                const result = await loginAdmin(login.adminId, login.password);
                if (!result.success) setError(result.error);
              }}
            >
              <label className="block">
                <span className={labelClass}>Scorer / admin ID</span>
                <input className={fieldClass} autoComplete="username" value={login.adminId} onChange={(event) => setLogin((current) => ({ ...current, adminId: event.target.value }))} required />
              </label>
              <label className="block">
                <span className={labelClass}>Password</span>
                <input className={fieldClass} type="password" autoComplete="current-password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} required />
              </label>
              {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}
              <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#ffdb19] px-4 py-3 font-bold text-[#090a35] transition hover:brightness-110">
                Open scoring desk
              </button>
            </form>
            <a href="/" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-100/60 hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to NPL home
            </a>
          </section>
        ) : (
          <>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#ff8a00]">
                  <Activity className="h-4 w-4" /> Scoring workspace
                </p>
                <h1 className="font-sports text-3xl font-bold text-white sm:text-4xl">Your match desk</h1>
                <p className="mt-2 max-w-xl text-sm text-blue-100/60">Set up teams and lineups, then move straight into the toss and live ball-by-ball console.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="min-w-44">
                  <span className="sr-only">Season</span>
                  <select className={fieldClass} value={selectedSeasonFilter} onChange={(event) => { setIsLoading(true); setSelectedSeasonFilter(event.target.value); }}>
                    {seasonEditions.map((season) => <option key={season} value={season}>{season}</option>)}
                  </select>
                </label>
                {isAdministrator && (
                  <button
                    type="button"
                      onClick={() => { setDraft(buildDraft(selectedSeasonFilter)); setRosters({ teamA: [], teamB: [] }); setCustomTeams({}); setError(''); setIsCreating(true); }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#ffdb19] px-4 py-2.5 text-sm font-extrabold text-[#090a35] shadow-lg shadow-orange-500/10 hover:brightness-110"
                  >
                    <Plus className="h-4 w-4" /> Set up a match
                  </button>
                )}
              </div>
            </div>

            {error && !isCreating && <p role="alert" className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

            {isCreating ? (
              <form onSubmit={saveMatch} className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => { setIsCreating(false); setError(''); }} className="rounded-lg border border-white/15 p-2 text-blue-100 hover:bg-white/10" aria-label="Back to match list">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                      <h2 className="font-sports text-xl font-bold">Match setup</h2>
                      <p className="text-xs text-blue-100/55">Configure the match and playing squads before the toss.</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#ffdb19]/20 bg-[#ffdb19]/10 px-3 py-1.5 text-xs font-bold text-[#ffdb19]">
                    <Check className="h-3.5 w-3.5" /> Setup → Toss → Live scoring
                  </div>
                </div>

                <section className={panelClass}>
                  <h3 className="mb-4 font-bold text-[#ffdb19]">Match details</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label>
                      <span className={labelClass}>Team A</span>
                      <select className={fieldClass} value={draft.teamAId} onChange={(event) => selectTeam('teamAId', event.target.value)} required>
                        <option value="">Choose team</option>
                        {Object.values(customTeams).map((team) => <option key={team.id} value={team.id}>{team.name || 'New match team'}</option>)}
                        {seasonTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                        <option value="__create__">Create a new match team…</option>
                      </select>
                      {customTeams[draft.teamAId] && <input className={`${fieldClass} mt-2`} aria-label="New Team A name" placeholder="New team name" value={customTeams[draft.teamAId].name} onChange={(event) => setCustomTeams((current) => ({ ...current, [draft.teamAId]: { ...current[draft.teamAId], name: event.target.value, shortName: event.target.value } }))} required />}
                    </label>
                    <label>
                      <span className={labelClass}>Team B</span>
                      <select className={fieldClass} value={draft.teamBId} onChange={(event) => selectTeam('teamBId', event.target.value)} required>
                        <option value="">Choose team</option>
                        {Object.values(customTeams).map((team) => <option key={team.id} value={team.id}>{team.name || 'New match team'}</option>)}
                        {seasonTeams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                        <option value="__create__">Create a new match team…</option>
                      </select>
                      {customTeams[draft.teamBId] && <input className={`${fieldClass} mt-2`} aria-label="New Team B name" placeholder="New team name" value={customTeams[draft.teamBId].name} onChange={(event) => setCustomTeams((current) => ({ ...current, [draft.teamBId]: { ...current[draft.teamBId], name: event.target.value, shortName: event.target.value } }))} required />}
                    </label>
                    <label><span className={labelClass}>Match / round</span><input className={fieldClass} value={draft.matchNumber} onChange={(event) => setDraftField('matchNumber', event.target.value)} required /></label>
                    <label><span className={labelClass}>Overs</span><input className={fieldClass} type="number" min="1" max="50" value={draft.oversLimit} onChange={(event) => { const overs = Number(event.target.value); setDraft((current) => ({ ...current, oversLimit: event.target.value, oversPerBowler: Math.min(Number(current.oversPerBowler), Math.ceil(overs / 5)) })); }} required /></label>
                    <label><span className={labelClass}>Bowler quota</span><input className={fieldClass} type="number" min="1" max={Number(draft.oversLimit)} value={draft.oversPerBowler} onChange={(event) => setDraftField('oversPerBowler', event.target.value)} required /></label>
                    <label><span className={labelClass}>Ball</span><select className={fieldClass} value={draft.ballType} onChange={(event) => setDraftField('ballType', event.target.value)}><option>Tennis</option><option>Leather</option></select></label>
                    <label><span className={labelClass}>Pitch surface</span><select className={fieldClass} value={draft.pitchType} onChange={(event) => setDraftField('pitchType', event.target.value)}><option>Matting</option><option>Turf</option><option>Cement</option><option>Artificial</option><option>Other</option></select></label>
                    <label><span className={labelClass}>Ground</span><input className={fieldClass} value={draft.ground} onChange={(event) => setDraftField('ground', event.target.value)} /></label>
                    <label><span className={labelClass}>City</span><input className={fieldClass} value={draft.city} onChange={(event) => setDraftField('city', event.target.value)} /></label>
                    <label><span className={labelClass}>Date</span><input className={fieldClass} type="date" value={draft.matchDate} onChange={(event) => setDraftField('matchDate', event.target.value)} /></label>
                    <label><span className={labelClass}>Start time</span><input className={fieldClass} value={draft.matchTime} onChange={(event) => setDraftField('matchTime', event.target.value)} /></label>
                    <label><span className={labelClass}>Assigned scorer ID</span><input className={fieldClass} value={draft.assignedScorerId} onChange={(event) => setDraftField('assignedScorerId', event.target.value)} placeholder="Optional" /></label>
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <SetupRoster team={seasonTeams.find((team) => team.id === draft.teamAId) || customTeams[draft.teamAId]} roster={rosters.teamA} onChange={(roster) => setRosters((current) => ({ ...current, teamA: roster }))} />
                  <SetupRoster team={seasonTeams.find((team) => team.id === draft.teamBId) || customTeams[draft.teamBId]} roster={rosters.teamB} onChange={(roster) => setRosters((current) => ({ ...current, teamB: roster }))} />
                </div>

                <section className={panelClass}>
                  <h3 className="mb-4 font-bold text-[#ffdb19]">Match officials</h3>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {setupOfficials(draft.umpires, (items) => setDraftField('umpires', items), 'Umpires')}
                    {setupOfficials(draft.secondaryScorers, (items) => setDraftField('secondaryScorers', items), 'Additional scorers')}
                  </div>
                </section>

                {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}
                <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
                  <button type="button" onClick={() => { setIsCreating(false); setError(''); }} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-blue-100 hover:bg-white/10">Cancel</button>
                  <button type="submit" disabled={isSaving || draft.teamAId === draft.teamBId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff8a00] to-[#ffdb19] px-5 py-3 text-sm font-extrabold text-[#090a35] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
                    {isSaving ? 'Saving match…' : 'Save setup & go to toss'} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <section>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-sports text-xl font-bold">Matches · {selectedSeasonFilter}</h2>
                  <span className="text-xs text-blue-100/50">{availableMatches.length} matches</span>
                </div>
                {isLoading ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-blue-100/60">Loading match desk…</div>
                ) : availableMatches.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {availableMatches.map((match) => (
                      <article key={match.id} className="group rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-[#ffdb19]/35 hover:bg-white/[0.07]">
                        <div className="mb-4 flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-100/70"><CalendarDays className="h-3 w-3" />{match.matchNumber || 'Match'}</span>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase ${match.status === 'LIVE' ? 'bg-rose-500/15 text-rose-300' : 'bg-[#ffdb19]/10 text-[#ffdb19]'}`}>{match.status || 'UPCOMING'}</span>
                        </div>
                        <h3 className="font-sports text-lg font-bold">{match.teamAShort || match.teamAName} <span className="text-[#ff8a00]">vs</span> {match.teamBShort || match.teamBName}</h3>
                        <p className="mt-1 text-xs text-blue-100/55">{match.oversLimit || 20} overs · {match.ballType || 'Tennis'} ball · {match.ground || match.venue}</p>
                        <button type="button" onClick={() => openModal('scorer-console', match)} className="mt-5 flex w-full items-center justify-between rounded-xl border border-white/10 px-3 py-2.5 text-sm font-bold text-white transition group-hover:border-[#ffdb19]/30 group-hover:text-[#ffdb19]">
                          {match.status === 'LIVE' ? 'Resume scoring' : 'Open match'} <ChevronRight className="h-4 w-4" />
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] px-5 py-12 text-center">
                    <CircleHelp className="mx-auto h-8 w-8 text-[#ff8a00]" />
                    <h3 className="mt-3 font-bold">No matches assigned here yet</h3>
                    <p className="mx-auto mt-1 max-w-md text-sm text-blue-100/55">{isAdministrator ? 'Create a match setup to select teams, lineups, officials, ball, and pitch.' : 'Ask an NPL administrator to assign a match to your scorer ID.'}</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
      {activeModal.type === 'scorer-console' && (
        <LiveScorerModal match={activeModal.data} onClose={closeModal} />
      )}
    </main>
  );
}
