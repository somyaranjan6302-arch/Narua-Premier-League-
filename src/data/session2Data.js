import source from './session2-source.json' with { type: 'json' };

const teamIds = {
  '11 Star Sayedpur': '11-star-sayedpur-s2',
  'Ramachandrapur Fighter': 'ramachandrapur-fighter-s2',
  'Kaina Tiger': 'kaina-tiger-s2',
  'Bajarangi 11': 'bajarangi-11-s2',
  'BNM Royals Narua': 'bnm-royals-narua-s2',
  'Mahaveer Warriors': 'mahaveer-warriors-s2'
};

const teamStyle = {
  '11 Star Sayedpur': ['#0ea5e9', '#082f49', 'Sunil Malik & Ashis Kumar'],
  'Ramachandrapur Fighter': ['#22c55e', '#14532d', 'Rahul Haripur'],
  'Kaina Tiger': ['#f59e0b', '#78350f', 'Mojahid Ali Khan'],
  'Bajarangi 11': ['#f97316', '#7c2d12', 'Omm'],
  'BNM Royals Narua': ['#7c3aed', '#2e1065', 'Gourab Das'],
  'Mahaveer Warriors': ['#ef4444', '#7f1d1d', 'Ananta Sayedpur']
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

export const session2Teams = Object.entries(source.rosters).filter(([name]) => name in teamIds).map(([name]) => {
  const [primaryColor, secondaryColor, captain] = teamStyle[name];
  const row = source.standings[name];
  return {
    id: teamIds[name], name, shortName: name, captain, owner: '', home: 'Jajpur',
    primaryColor, secondaryColor, sessions: ['Season 2'], slogan: 'Season 2 • 2024',
    matches: row.p, wins: row.w, losses: row.l,
    winPercentage: row.p ? Math.round((row.w / row.p) * 1000) / 10 : 0,
    banner: '/assets/stadium.jpg', squad: rosterFor(name)
  };
});

export const session2Matches = source.matches.map((match) => ({
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

export const session2Standings = Object.entries(source.standings)
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
const mostWickets = [...bowlingLeaders].sort((a, b) => b[1].wickets - a[1].wickets || (a[1].bestBowling?.runs ?? Infinity) - (b[1].bestBowling?.runs ?? Infinity))[0];
const bestFigures = [...bowlingLeaders].sort((a, b) => (b[1].bestBowling?.wickets || 0) - (a[1].bestBowling?.wickets || 0) || (a[1].bestBowling?.runs ?? Infinity) - (b[1].bestBowling?.runs ?? Infinity))[0];
const bestEconomy = [...bowlingLeaders].filter(([, player]) => player.ballsBowled >= 6)
  .sort((a, b) => a[1].runsConceded / a[1].ballsBowled - b[1].runsConceded / b[1].ballsBowled)[0];
const playerTeam = (playerName) => session2Teams.find((team) => team.squad.some((player) => player.name.toLowerCase() === playerName.toLowerCase()))?.name || 'NPL';
const capPhoto = '/assets/bajrangi11_team.png';
const performer = (category, playerKey, stat, details, badgeColor) => ({
  category, player: toName(playerKey), team: playerTeam(toName(playerKey)), teamShort: playerTeam(toName(playerKey)),
  stat, details, photo: capPhoto, badgeColor
});

export const session2Performers = {
  orangeCap: performer('Orange Cap (Most Runs)', topBatter[0], `${topBatter[1].runs} Runs`, `${topBatter[1].innings} innings • ${topBatter[1].fours} fours • ${topBatter[1].sixes} sixes in the supplied scorecards`, 'from-amber-500 to-orange-600'),
  purpleCap: performer('Purple Cap (Most Wickets)', mostWickets[0], `${mostWickets[1].wickets} Wickets`, `Joint or sole leader in the supplied scorecards • best ${mostWickets[1].bestBowling.figures}`, 'from-purple-600 to-indigo-800'),
  mostSixes: performer('Maximum Sixes Award', mostSixes[0], `${mostSixes[1].sixes} Sixes`, `${mostSixes[1].runs} runs • ${mostSixes[1].fours} fours in the supplied scorecards`, 'from-red-500 to-rose-700'),
  bestEconomy: performer('Best Bowling Economy', bestEconomy[0], `${(bestEconomy[1].runsConceded / (bestEconomy[1].ballsBowled / 6)).toFixed(2)} Econ`, `${bestEconomy[1].innings} bowling innings • ${bestEconomy[1].wickets} wickets in the supplied scorecards`, 'from-emerald-600 to-teal-800'),
  highestScore: performer('Highest Individual Score', highestScore[0], `${highestScore[1].highestScore} (${highestScore[1].bestScoreBalls})`, `${highestScore[1].runs} total runs • ${highestScore[1].sixes} sixes in the supplied scorecards`, 'from-cyan-600 to-blue-800'),
  bestBowling: performer('Best Bowling Figures', bestFigures[0], bestFigures[1].bestBowling.figures, 'Best innings bowling figures in the supplied Session 2 scorecards', 'from-violet-600 to-fuchsia-800')
};

export const session2Records = [
  { season: 'Season 2', title: 'Highest Team Total', holder: 'Kaina Tiger', value: '76/9', details: '8.0 overs vs Bajarangi 11 (Quarter Final)' },
  { season: 'Season 2', title: 'Lowest Total', holder: '11 Star Sayedpur', value: '58/8', details: '8.0 overs vs Ramachandrapur Fighter (Quarter Final)' },
  { season: 'Season 2', title: 'Highest Individual Score', holder: 'Chikuuuuu', value: '48 (14)', details: 'BNM Royals Narua vs 11 Star Sayedpur' },
  { season: 'Season 2', title: 'Best Bowling Figures', holder: 'Krishna Rout', value: '4/9', details: 'Bajarangi 11 vs Kaina Tiger (Quarter Final)' }
];

export const session2Season = {
  season: '2024', year: '2024', edition: 'Season 2', status: 'PARTIAL', teamsCount: 6, matchesCount: 4,
  champion: 'Not included in the supplied PDF', runnerUp: 'Not included in the supplied PDF',
  topScorer: `${toName(topBatter[0])} (${topBatter[1].runs} runs in the supplied scorecards)`,
  topWicketTaker: `${toName(mostWickets[0])} (${mostWickets[1].wickets} wickets in the supplied scorecards)`,
  playerOfTournament: 'Not listed in the supplied PDF',
  description: 'The PDF contains one league match and three quarter-finals. Semifinal and final results are not included; standings and player totals show only the four supplied scorecards.'
};

export const mergeOfficialSession2Content = (data) => {
  if (!data || typeof data !== 'object') return data;
  const replaceSeason = (items, officialItems) => [
    ...(Array.isArray(items) ? items.filter((item) => item?.edition !== 'Season 2') : []),
    ...officialItems
  ];
  const existingStandings = data.seasonStandings && typeof data.seasonStandings === 'object' ? data.seasonStandings : {};
  return {
    ...data,
    seasons: replaceSeason(data.seasons, [session2Season]),
    champions: replaceSeason(data.champions, []),
    teams: [
      ...(Array.isArray(data.teams) ? data.teams.filter((team) => {
        const editions = team.sessions || team.seasons || (team.session ? [team.session] : []);
        return !Array.isArray(editions) || !editions.includes('Season 2');
      }) : []),
      ...session2Teams
    ],
    matches: [
      ...(Array.isArray(data.matches) ? data.matches.filter((match) => (match.season || match.session) !== 'Season 2') : []),
      ...session2Matches
    ],
    seasonStandings: { ...existingStandings, 'Season 2': session2Standings },
    records: [
      ...(Array.isArray(data.records) ? data.records.filter((record) => record.season !== 'Season 2') : []),
      ...session2Records
    ]
  };
};
