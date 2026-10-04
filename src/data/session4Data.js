import source from './session4-source.json' with { type: 'json' };

const teamIds = {
  'Fire 11 Narua': 'fire-11-narua-s4',
  'Local 11 Sayedpur': 'local-11-sayedpur-s4',
  'Titan Strikers': 'titan-strikers-s4',
  'BMN Royals': 'bmn-royals-s4',
  'HP Commando 11': 'hp-commando-11-s4',
  'No Compromise Kaina': 'no-compromise-kaina-s4'
};

const teamStyle = {
  'Fire 11 Narua': ['#f97316', '#7c2d12', 'Rahul Das'],
  'Local 11 Sayedpur': ['#0ea5e9', '#082f49', 'Krishna Rout'],
  'Titan Strikers': ['#22c55e', '#14532d', 'Abhishek Das'],
  'BMN Royals': ['#f59e0b', '#78350f', 'Prasan Jit'],
  'HP Commando 11': ['#f31558', '#4c0519', 'Muna'],
  'No Compromise Kaina': ['#1656f9', '#172554', 'Mojahid Ali Khan']
};

const toName = (key) => key.split(' ').map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
const toOvers = (overs) => String(overs).includes('.') ? String(overs) : `${overs}.0`;
const rosterFor = (teamName) => {
  const roster = source.rosters[teamName] || {};
  const normalizedRoster = { ...roster };
  if (teamName === 'Fire 11 Narua') delete normalizedRoster['omm sai prakash mishra'];
  if (teamName === 'BMN Royals') {
    normalizedRoster['sai prakash mishra'] = { name: 'Sai Prakash Mishra', captain: false, wicketkeeper: false };
  }
  if (teamName === 'HP Commando 11') delete normalizedRoster['omm sai prakash mishra'];

  return Object.entries(normalizedRoster).map(([key, member], index) => {
    const batting = source.batting[key] || {};
    const bowling = source.bowling[key] || {};
    const overs = bowling.ballsBowled ? `${Math.floor(bowling.ballsBowled / 6)}.${bowling.ballsBowled % 6}` : '';
    return {
      id: `${teamIds[teamName]}-p${index + 1}`,
      name: member.name,
      role: 'Player',
      isCaptain: Boolean(member.captain),
      runs: batting.runs || 0,
      wickets: bowling.wickets || 0,
      fours: batting.fours || 0,
      sixes: batting.sixes || 0,
      innings: batting.innings || 0,
      ballsFaced: batting.balls || 0,
      strikeRate: batting.balls ? ((batting.runs / batting.balls) * 100).toFixed(2) : '—',
      bestScore: batting.innings ? `${batting.highestScore}${batting.bestScoreBalls ? ` (${batting.bestScoreBalls})` : ''}` : '—',
      economy: bowling.ballsBowled ? (bowling.runsConceded / (bowling.ballsBowled / 6)).toFixed(2) : '—',
      overs,
      bestBowling: bowling.bestBowling?.figures || '—'
    };
  });
};

export const session4Teams = Object.entries(source.rosters).filter(([name]) => name in teamIds).map(([name]) => {
  const [primaryColor, secondaryColor, captain] = teamStyle[name];
  return {
    id: teamIds[name],
    name,
    shortName: name,
    captain,
    owner: '',
    home: 'Jajpur',
    primaryColor,
    secondaryColor,
    sessions: ['Season 4'],
    slogan: 'Session 4 • 2026',
    matches: source.standings[name].p,
    wins: source.standings[name].w,
    losses: source.standings[name].l,
    winPercentage: Math.round((source.standings[name].w / source.standings[name].p) * 1000) / 10,
    banner: '/assets/stadium.jpg',
    squad: rosterFor(name)
  };
});

export const session4Matches = source.matches.map((match) => ({
  ...match,
  team1: { ...match.team1, shortName: match.team1.name, primaryColor: teamStyle[match.team1.name]?.[0] },
  team2: { ...match.team2, shortName: match.team2.name, primaryColor: teamStyle[match.team2.name]?.[0] },
  innings: match.innings.map((innings) => ({
    ...innings,
    overs: toOvers(innings.overs),
    batting: innings.batting.map((player) => ({ ...player, sr: player.strikeRate })),
    bowling: innings.bowling.map((player) => ({ ...player, overs: toOvers(player.overs), econ: player.economy }))
  }))
}));

export const session4Standings = Object.entries(source.standings)
  .map(([name, row]) => ({
    pos: 0,
    teamId: teamIds[name],
    team: name,
    short: name,
    p: row.p,
    w: row.w,
    l: row.l,
    nr: 0,
    nrr: row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3),
    pts: row.pts,
    form: row.form,
    qualified: false,
    color: teamStyle[name][0]
  }))
  .sort((left, right) => right.pts - left.pts || right.w - left.w || Number(right.nrr) - Number(left.nrr))
  .map((row, index) => ({ ...row, pos: index + 1, qualified: index < 4 }));

const battingLeaders = Object.entries(source.batting);
const bowlingLeaders = Object.entries(source.bowling);
const topBatter = [...battingLeaders].sort((a, b) => b[1].runs - a[1].runs)[0];
const mostSixes = [...battingLeaders].sort((a, b) => b[1].sixes - a[1].sixes)[0];
const highestScore = [...battingLeaders].sort((a, b) => b[1].highestScore - a[1].highestScore)[0];
const mostWickets = [...bowlingLeaders].sort((a, b) => b[1].wickets - a[1].wickets)[0];
const bestFigures = [...bowlingLeaders].sort((a, b) => (b[1].bestBowling?.wickets || 0) - (a[1].bestBowling?.wickets || 0) || (a[1].bestBowling?.runs || Infinity) - (b[1].bestBowling?.runs || Infinity))[0];
const playerTeam = (playerName) => session4Teams.find((team) => team.squad.some((player) => player.name.toLowerCase() === playerName.toLowerCase()))?.name || 'NPL';
const capPhoto = '/assets/bajrangi11_team.png';
const performer = (key, category, playerKey, stat, details, badgeColor) => ({
  category,
  player: toName(playerKey),
  team: playerTeam(toName(playerKey)),
  teamShort: playerTeam(toName(playerKey)),
  stat,
  details,
  photo: capPhoto,
  badgeColor
});

export const session4Performers = {
  orangeCap: performer('orangeCap', 'Orange Cap (Most Runs)', topBatter[0], `${topBatter[1].runs} Runs`, `${topBatter[1].innings} innings • ${topBatter[1].fours} fours • ${topBatter[1].sixes} sixes`, 'from-amber-500 to-orange-600'),
  purpleCap: performer('purpleCap', 'Purple Cap (Most Wickets)', mostWickets[0], `${mostWickets[1].wickets} Wickets`, `${mostWickets[1].innings} bowling innings • best ${mostWickets[1].bestBowling.figures}`, 'from-purple-600 to-indigo-800'),
  mostSixes: performer('mostSixes', 'Maximum Sixes Award', mostSixes[0], `${mostSixes[1].sixes} Sixes`, `${mostSixes[1].runs} runs • ${mostSixes[1].fours} fours`, 'from-red-500 to-rose-700'),
  highestScore: performer('highestScore', 'Highest Individual Score', highestScore[0], `${highestScore[1].highestScore} (${highestScore[1].bestScoreBalls})`, `${highestScore[1].runs} tournament runs • ${highestScore[1].sixes} sixes`, 'from-cyan-600 to-blue-800'),
  bestBowling: performer('bestBowling', 'Best Bowling Figures', bestFigures[0], bestFigures[1].bestBowling.figures, 'Best innings bowling figures in Session 4', 'from-violet-600 to-fuchsia-800')
};

export const session4Records = [
  { season: 'Season 4', title: 'Highest Team Total', holder: 'Titan Strikers', value: '149/6', details: '8.0 overs vs BMN Royals (League)' },
  { season: 'Season 4', title: 'Lowest Total', holder: 'HP Commando 11', value: '16 all out', details: '4.3 overs vs Titan Strikers (Final)' },
  { season: 'Season 4', title: 'Highest Individual Score', holder: 'Amanulla Khan', value: '55 (26)', details: 'No Compromise Kaina vs BMN Royals' },
  { season: 'Season 4', title: 'Best Bowling Figures', holder: 'Rohan Das', value: '6/3', details: 'Titan Strikers vs BMN Royals' }
];

export const session4Season = {
  season: '2026', year: '2026', edition: 'Season 4', status: 'COMPLETED', teamsCount: 6, matchesCount: 15,
  champion: 'Titan Strikers', runnerUp: 'HP Commando 11', topScorer: 'Rohan Das (86 runs)',
  topWicketTaker: `${toName(mostWickets[0])} (${mostWickets[1].wickets} wickets)`,
  playerOfTournament: 'Rohan Das (86 runs)',
  description: 'Six teams played a 12-match league, two semifinals, and a final at Narua Playground, Jajpur. Titan Strikers won the championship.'
};

export const session4Champion = {
  season: '2026', edition: 'Season 4', championTeam: 'Titan Strikers', championShort: 'Titan Strikers', captain: 'Abhishek Das',
  runnerUp: 'HP Commando 11', runnerUpShort: 'HP Commando 11', winningMargin: 'Won by 8 wickets',
  finalScores: 'HP Commando 11 16/10 (4.3) | Titan Strikers 20/2 (1.1)',
  venue: 'Narua Playground, Jajpur', playerOfFinal: 'Not listed in the scorecard',
  teamPhoto: '/assets/stadium.jpg', trophyPhoto: '/assets/trophy.jpg',
  description: 'Titan Strikers won the Season 4 final by eight wickets after dismissing HP Commando 11 for 16.', featured: true
};

export const mergeOfficialSession4Content = (data) => {
  if (!data || typeof data !== 'object') return data;
  const replaceSeason = (items, officialItems, key = 'edition') => {
    const existing = Array.isArray(items) ? items : [];
    const officialKey = key === 'edition' ? 'edition' : key;
    return [...existing.filter((item) => item?.[officialKey] !== 'Season 4'), ...officialItems];
  };
  const existingSeasonStandings = data.seasonStandings && typeof data.seasonStandings === 'object' ? data.seasonStandings : {};
  const officialTeams = session4Teams;
  const officialMatches = session4Matches;
  const officialSeasons = [session4Season];
  const officialChampions = [session4Champion];
  const officialRecords = session4Records;

  return {
    ...data,
    seasons: replaceSeason(data.seasons, officialSeasons),
    champions: replaceSeason(data.champions, officialChampions),
    teams: [...(Array.isArray(data.teams) ? data.teams.filter((team) => {
      const editions = team.sessions || team.seasons || (team.session ? [team.session] : []);
      return !Array.isArray(editions) || !editions.includes('Season 4');
    }) : []), ...officialTeams],
    matches: [...(Array.isArray(data.matches) ? data.matches.filter((match) => (match.season || match.session) !== 'Season 4') : []), ...officialMatches],
    seasonStandings: { ...existingSeasonStandings, 'Season 4': session4Standings },
    records: [...(Array.isArray(data.records) ? data.records.filter((record) => record.season !== 'Season 4' && !(record.title?.toLowerCase().includes('lowest total') && record.holder?.includes('HP Commando 11') && record.details?.includes('Season 4'))) : []), ...officialRecords]
  };
};
