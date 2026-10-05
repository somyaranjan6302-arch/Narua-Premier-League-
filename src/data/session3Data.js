import source from './session3-source.json' with { type: 'json' };

const teamIds = {
  'Commando 11': 'commando-11-s3',
  'No Compromise': 'no-compromise-s3',
  'BNM Royals': 'bnm-royals-s3',
  'Flame Phoenix': 'flame-phoenix-s3',
  'Karachi King': 'karachi-king-s3',
  'Haider 11 Haripur': 'haider-11-haripur-s3'
};

const teamStyle = {
  'Commando 11': ['#e11d48', '#4c0519', 'Kamar'],
  'No Compromise': ['#2563eb', '#172554', 'Mojahid Ali Khan'],
  'BNM Royals': ['#f59e0b', '#78350f', 'Prasan Jit'],
  'Flame Phoenix': ['#f97316', '#7c2d12', 'Subham Kumar Das'],
  'Karachi King': ['#06b6d4', '#083344', 'Omm'],
  'Haider 11 Haripur': ['#22c55e', '#14532d', 'Rahul Haripur']
};

const toName = (key) => key.split(' ').map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
const toOvers = (overs) => String(overs).includes('.') ? String(overs) : `${overs}.0`;
const rosterFor = (teamName) => Object.entries(source.rosters[teamName] || {}).map(([key, member], index) => {
  const batting = source.batting[key] || {};
  const bowling = source.bowling[key] || {};
  const overs = bowling.ballsBowled ? `${Math.floor(bowling.ballsBowled / 6)}.${bowling.ballsBowled % 6}` : '';
  return {
    id: `${teamIds[teamName]}-p${index + 1}`,
    name: member.name,
    role: member.wicketkeeper ? 'Wicketkeeper' : 'Player',
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

export const session3Teams = Object.entries(source.rosters).filter(([name]) => name in teamIds).map(([name]) => {
  const [primaryColor, secondaryColor, captain] = teamStyle[name];
  const standing = source.standings[name];
  return {
    id: teamIds[name], name, shortName: name, captain, owner: '', home: 'Jajpur',
    primaryColor, secondaryColor, sessions: ['Season 3'], slogan: 'Season 3 • 2025',
    matches: standing.p, wins: standing.w, losses: standing.l,
    winPercentage: standing.p ? Math.round((standing.w / standing.p) * 1000) / 10 : 0,
    banner: '/assets/stadium.jpg', squad: rosterFor(name)
  };
});

export const session3Matches = source.matches.map((match) => ({
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

export const session3Standings = Object.entries(source.standings)
  .map(([name, row]) => ({
    pos: 0, teamId: teamIds[name], team: name, short: name, p: row.p, w: row.w, l: row.l,
    nr: 0, nrr: row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3),
    pts: row.pts, form: row.form, qualified: false, color: teamStyle[name][0]
  }))
  .sort((left, right) => right.pts - left.pts || right.w - left.w || Number(right.nrr) - Number(left.nrr))
  .map((row, index) => ({ ...row, pos: index + 1 }));

const battingLeaders = Object.entries(source.batting);
const bowlingLeaders = Object.entries(source.bowling);
const topBatter = [...battingLeaders].sort((a, b) => b[1].runs - a[1].runs)[0];
const mostSixes = [...battingLeaders].sort((a, b) => b[1].sixes - a[1].sixes)[0];
const highestScore = [...battingLeaders].sort((a, b) => b[1].highestScore - a[1].highestScore)[0];
const mostWickets = [...bowlingLeaders].sort((a, b) => b[1].wickets - a[1].wickets)[0];
const bestFigures = [...bowlingLeaders].sort((a, b) => (b[1].bestBowling?.wickets || 0) - (a[1].bestBowling?.wickets || 0) || (a[1].bestBowling?.runs ?? Infinity) - (b[1].bestBowling?.runs ?? Infinity))[0];
const bestEconomy = [...bowlingLeaders].filter(([, player]) => player.ballsBowled >= 6)
  .sort((a, b) => a[1].runsConceded / a[1].ballsBowled - b[1].runsConceded / b[1].ballsBowled)[0];
const playerTeam = (playerName) => session3Teams.find((team) => team.squad.some((player) => player.name.toLowerCase() === playerName.toLowerCase()))?.name || 'NPL';
const capPhoto = '/assets/bajrangi11_team.png';
const performer = (category, playerKey, stat, details, badgeColor) => ({
  category, player: toName(playerKey), team: playerTeam(toName(playerKey)), teamShort: playerTeam(toName(playerKey)),
  stat, details, photo: capPhoto, badgeColor
});

export const session3Performers = {
  orangeCap: performer('Orange Cap (Most Runs)', topBatter[0], `${topBatter[1].runs} Runs`, `${topBatter[1].innings} innings • ${topBatter[1].fours} fours • ${topBatter[1].sixes} sixes`, 'from-amber-500 to-orange-600'),
  purpleCap: performer('Purple Cap (Most Wickets)', mostWickets[0], `${mostWickets[1].wickets} Wickets`, `${mostWickets[1].innings} bowling innings • best ${mostWickets[1].bestBowling.figures}`, 'from-purple-600 to-indigo-800'),
  mostSixes: performer('Maximum Sixes Award', mostSixes[0], `${mostSixes[1].sixes} Sixes`, `${mostSixes[1].runs} runs • ${mostSixes[1].fours} fours`, 'from-red-500 to-rose-700'),
  bestEconomy: performer('Best Bowling Economy', bestEconomy[0], `${(bestEconomy[1].runsConceded / (bestEconomy[1].ballsBowled / 6)).toFixed(2)} Econ`, `${bestEconomy[1].innings} bowling innings • ${bestEconomy[1].wickets} wickets`, 'from-emerald-600 to-teal-800'),
  highestScore: performer('Highest Individual Score', highestScore[0], `${highestScore[1].highestScore} (${highestScore[1].bestScoreBalls})`, `${highestScore[1].runs} tournament runs • ${highestScore[1].sixes} sixes`, 'from-cyan-600 to-blue-800'),
  bestBowling: performer('Best Bowling Figures', bestFigures[0], bestFigures[1].bestBowling.figures, 'Best innings bowling figures in the provided Session 3 scorecards', 'from-violet-600 to-fuchsia-800')
};

export const session3Records = [
  { season: 'Season 3', title: 'Highest Team Total', holder: 'Haider 11 Haripur', value: '134/4', details: '8.0 overs vs Karachi King (League)' },
  { season: 'Season 3', title: 'Lowest Total', holder: 'Karachi King', value: '59/7', details: '8.0 overs vs Haider 11 Haripur (League)' },
  { season: 'Season 3', title: 'Highest Individual Score', holder: 'Miju Haripur', value: '51 (21)', details: 'Haider 11 Haripur vs Karachi King' },
  { season: 'Season 3', title: 'Best Bowling Figures', holder: 'Kalia', value: '3/7', details: 'Karachi King vs Flame Phoenix' }
];

export const session3Season = {
  season: '2025', year: '2025', edition: 'Season 3', status: 'COMPLETED', teamsCount: 6, matchesCount: 7,
  champion: 'No Compromise', runnerUp: 'Commando 11',
  topScorer: `${toName(topBatter[0])} (${topBatter[1].runs} runs in the provided scorecards)`,
  topWicketTaker: `${toName(mostWickets[0])} (${mostWickets[1].wickets} wickets in the provided scorecards)`,
  playerOfTournament: 'Not listed in the provided PDF',
  description: 'The supplied Session 3 PDF documents six league matches and the final. Standings and player totals reflect those scorecards.'
};

export const session3Champion = {
  season: '2025', edition: 'Season 3', championTeam: 'No Compromise', championShort: 'No Compromise', captain: 'Mojahid Ali Khan',
  runnerUp: 'Commando 11', runnerUpShort: 'Commando 11', winningMargin: 'Won by 5 wickets',
  finalScores: 'Commando 11 64/9 (7.0) | No Compromise 66/5 (4.0)',
  venue: 'Narua Playground, Jajpur', playerOfFinal: 'Not listed in the scorecard',
  teamPhoto: '/assets/stadium.jpg', trophyPhoto: '/assets/trophy.jpg',
  description: 'No Compromise chased Commando 11’s 64/9 to win the documented final by five wickets.', featured: true
};

export const mergeOfficialSession3Content = (data) => {
  if (!data || typeof data !== 'object') return data;
  const replaceSeason = (items, officialItems) => [
    ...(Array.isArray(items) ? items.filter((item) => item?.edition !== 'Season 3') : []),
    ...officialItems
  ];
  const existingStandings = data.seasonStandings && typeof data.seasonStandings === 'object' ? data.seasonStandings : {};
  return {
    ...data,
    seasons: replaceSeason(data.seasons, [session3Season]),
    champions: replaceSeason(data.champions, [session3Champion]),
    teams: [
      ...(Array.isArray(data.teams) ? data.teams.filter((team) => {
        const editions = team.sessions || team.seasons || (team.session ? [team.session] : []);
        return !Array.isArray(editions) || !editions.includes('Season 3');
      }) : []),
      ...session3Teams
    ],
    matches: [
      ...(Array.isArray(data.matches) ? data.matches.filter((match) => (match.season || match.session) !== 'Season 3') : []),
      ...session3Matches
    ],
    seasonStandings: { ...existingStandings, 'Season 3': session3Standings },
    records: [
      ...(Array.isArray(data.records) ? data.records.filter((record) => record.season !== 'Season 3') : []),
      ...session3Records
    ]
  };
};
