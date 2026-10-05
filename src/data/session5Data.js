import source from './session5-source.json' with { type: 'json' };

const teamIds = {
  'GCC Fighter Binjharpur': 'gcc-fighter-binjharpur-s5',
  'HP No Compromise': 'hp-no-compromise-s5',
  'No Compromise Kaina': 'no-compromise-kaina-s5',
  'Titan Strikers': 'titan-strikers-s5',
  'Young Star Narua': 'young-star-narua-s5',
  'Barpada XI': 'barpada-xi-s5'
};

const teamStyle = {
  'GCC Fighter Binjharpur': ['#0a39f5', '#172554', 'Farhan Khan'],
  'HP No Compromise': ['#f31558', '#4c0519', 'Abhishek Das'],
  'No Compromise Kaina': ['#2563eb', '#172554', 'Mojahid Ali Khan'],
  'Titan Strikers': ['#16a34a', '#14532d', 'Ananta Behera'],
  'Young Star Narua': ['#f59e0b', '#78350f', 'Chikuuuuu'],
  'Barpada XI': ['#02bba6', '#0f172a', 'Akhil Barik Friend Barpada']
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

export const session5Teams = Object.entries(source.rosters).filter(([name]) => name in teamIds).map(([name]) => {
  const [primaryColor, secondaryColor, captain] = teamStyle[name];
  const standing = source.standings[name];
  return {
    id: teamIds[name], name, shortName: name, captain, owner: '', home: 'Jajpur',
    primaryColor, secondaryColor, sessions: ['Season 5'], slogan: 'Session 5 • 2026',
    matches: standing.p, wins: standing.w, losses: standing.l,
    winPercentage: standing.p ? Math.round((standing.w / standing.p) * 1000) / 10 : 0,
    banner: '/assets/stadium.jpg', squad: rosterFor(name)
  };
});

export const session5Matches = source.matches.map((match) => ({
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

export const session5Standings = Object.entries(source.standings)
  .map(([name, row]) => ({
    pos: 0, teamId: teamIds[name], team: name, short: name, p: row.p, w: row.w, l: row.l,
    nr: 0, nrr: row.nrr >= 0 ? `+${row.nrr.toFixed(3)}` : row.nrr.toFixed(3),
    pts: row.pts, form: row.form, qualified: false, color: teamStyle[name][0]
  }))
  .sort((left, right) => right.pts - left.pts || right.w - left.w || Number(right.nrr) - Number(left.nrr))
  .map((row, index) => ({ ...row, pos: index + 1, qualified: index < 4 }));

const battingLeaders = Object.entries(source.batting);
const bowlingLeaders = Object.entries(source.bowling);
const topBatter = [...battingLeaders].sort((a, b) => b[1].runs - a[1].runs)[0];
const mostSixes = [...battingLeaders].sort((a, b) => b[1].sixes - a[1].sixes)[0];
const highestScore = [...battingLeaders].sort((a, b) => b[1].highestScore - a[1].highestScore)[0];
const mostWickets = [...bowlingLeaders].sort((a, b) => b[1].wickets - a[1].wickets)[0];
const bestFigures = [...bowlingLeaders].sort((a, b) => (b[1].bestBowling?.wickets || 0) - (a[1].bestBowling?.wickets || 0) || (a[1].bestBowling?.runs ?? Infinity) - (b[1].bestBowling?.runs ?? Infinity))[0];
const bestEconomy = [...bowlingLeaders].filter(([, player]) => player.ballsBowled >= 6)
  .sort((a, b) => a[1].runsConceded / a[1].ballsBowled - b[1].runsConceded / b[1].ballsBowled)[0];
const playerTeam = (playerName) => session5Teams.find((team) => team.squad.some((player) => player.name.toLowerCase() === playerName.toLowerCase()))?.name || 'NPL';
const capPhoto = '/assets/bajrangi11_team.png';
const performer = (category, playerKey, stat, details, badgeColor) => ({
  category, player: toName(playerKey), team: playerTeam(toName(playerKey)), teamShort: playerTeam(toName(playerKey)),
  stat, details, photo: capPhoto, badgeColor
});

export const session5Performers = {
  orangeCap: performer('Orange Cap (Most Runs)', topBatter[0], `${topBatter[1].runs} Runs`, `${topBatter[1].innings} innings • ${topBatter[1].fours} fours • ${topBatter[1].sixes} sixes`, 'from-amber-500 to-orange-600'),
  purpleCap: performer('Purple Cap (Most Wickets)', mostWickets[0], `${mostWickets[1].wickets} Wickets`, `${mostWickets[1].innings} bowling innings • best ${mostWickets[1].bestBowling.figures}`, 'from-purple-600 to-indigo-800'),
  mostSixes: performer('Maximum Sixes Award', mostSixes[0], `${mostSixes[1].sixes} Sixes`, `${mostSixes[1].runs} runs • ${mostSixes[1].fours} fours`, 'from-red-500 to-rose-700'),
  bestEconomy: performer('Best Bowling Economy', bestEconomy[0], `${(bestEconomy[1].runsConceded / (bestEconomy[1].ballsBowled / 6)).toFixed(2)} Econ`, `${bestEconomy[1].innings} bowling innings • ${bestEconomy[1].wickets} wickets`, 'from-emerald-600 to-teal-800'),
  highestScore: performer('Highest Individual Score', highestScore[0], `${highestScore[1].highestScore} (${highestScore[1].bestScoreBalls})`, `${highestScore[1].runs} tournament runs • ${highestScore[1].sixes} sixes`, 'from-cyan-600 to-blue-800'),
  bestBowling: performer('Best Bowling Figures', bestFigures[0], bestFigures[1].bestBowling.figures, 'Best innings bowling figures in the Session 5 scorecards', 'from-violet-600 to-fuchsia-800')
};

export const session5Records = [
  { season: 'Season 5', title: 'Highest Team Total', holder: 'HP No Compromise', value: '127/1', details: '6.3 overs vs GCC Fighter Binjharpur (League)' },
  { season: 'Season 5', title: 'Lowest Total', holder: 'Young Star Narua', value: '51 all out', details: '6.3 overs vs Titan Strikers (Super Knockout)' },
  { season: 'Season 5', title: 'Highest Individual Score', holder: 'Amirul', value: '56 (22)', details: 'GCC Fighter Binjharpur vs HP No Compromise' },
  { season: 'Season 5', title: 'Best Bowling Figures', holder: 'Abhishek Das', value: '6/14', details: 'HP No Compromise vs Titan Strikers' }
];

export const session5Season = {
  season: '2026', year: '2026', edition: 'Season 5', status: 'COMPLETED', teamsCount: 6, matchesCount: 16,
  champion: 'GCC Fighter Binjharpur', runnerUp: 'HP No Compromise',
  topScorer: `${toName(topBatter[0])} (${topBatter[1].runs} runs)`,
  topWicketTaker: `${toName(mostWickets[0])} (${mostWickets[1].wickets} wickets)`,
  playerOfTournament: 'Not listed in the provided PDF',
  description: 'Six teams played 12 league matches and four knockout matches. GCC Fighter Binjharpur won the final against HP No Compromise.'
};

export const session5Champion = {
  season: '2026', edition: 'Season 5', championTeam: 'GCC Fighter Binjharpur', championShort: 'GCC Fighter', captain: 'Farhan Khan',
  runnerUp: 'HP No Compromise', runnerUpShort: 'HP No Compromise', winningMargin: 'Won by 7 wickets',
  finalScores: 'HP No Compromise 48/8 (8.0) | GCC Fighter Binjharpur 49/3 (4.0)',
  venue: 'Narua Playground, Jajpur', playerOfFinal: 'Not listed in the scorecard',
  teamPhoto: '/assets/bajrangi11_champions.png', trophyPhoto: '/assets/trophy.jpg',
  description: 'GCC Fighter Binjharpur chased 49 to beat HP No Compromise by seven wickets in the Session 5 final.', featured: true
};

export const mergeOfficialSession5Content = (data) => {
  if (!data || typeof data !== 'object') return data;
  const replaceSeason = (items, officialItems) => [
    ...(Array.isArray(items) ? items.filter((item) => item?.edition !== 'Season 5') : []),
    ...officialItems
  ];
  const existingStandings = data.seasonStandings && typeof data.seasonStandings === 'object' ? data.seasonStandings : {};
  return {
    ...data,
    seasons: replaceSeason(data.seasons, [session5Season]),
    champions: replaceSeason(data.champions, [session5Champion]),
    teams: [
      ...(Array.isArray(data.teams) ? data.teams.filter((team) => {
        const editions = team.sessions || team.seasons || (team.session ? [team.session] : []);
        return !Array.isArray(editions) || !editions.includes('Season 5');
      }) : []),
      ...session5Teams
    ],
    matches: [
      ...(Array.isArray(data.matches) ? data.matches.filter((match) => (match.season || match.session) !== 'Season 5') : []),
      ...session5Matches
    ],
    seasonStandings: { ...existingStandings, 'Season 5': session5Standings },
    records: [
      ...(Array.isArray(data.records) ? data.records.filter((record) => record.season !== 'Season 5') : []),
      ...session5Records
    ]
  };
};
