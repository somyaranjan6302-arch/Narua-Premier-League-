const performer = (category, player, team, teamShort, stat, badgeColor) => ({
  category,
  player,
  team,
  teamShort,
  stat,
  details: 'Session 1 final result',
  photo: '',
  badgeColor
});

export const session1Performers = {
  orangeCap: performer('Orange Cap (Most Runs)', 'Rahul Das', 'Bajrangi 11 Narua', 'B11', '144 Runs', 'from-amber-500 to-orange-600'),
  purpleCap: performer('Purple Cap (Most Wickets)', 'Banty', 'Commando 11 Madhapur', 'C11', '11 Wickets', 'from-purple-600 to-indigo-800'),
  mostSixes: performer('Maximum Sixes Award', 'Kamar', 'Commando 11 Madhapur', 'C11', '11 Sixes', 'from-red-500 to-rose-700'),
  bestEconomy: performer('Best Bowling Economy', 'Banty', 'Commando 11 Madhapur', 'C11', '5.4 Econ', 'from-emerald-600 to-teal-800'),
  highestScore: performer('Highest Individual Score', 'Rahul Das', 'Bajrangi 11 Narua', 'B11', '76 Runs', 'from-cyan-600 to-blue-800'),
  bestBowling: performer('Best Bowling Figures', 'Mr Soumya', 'BMN Royals', 'BMN', '4/45', 'from-violet-600 to-fuchsia-800')
};

export const session1Season = {
  season: '2024',
  year: '2024',
  edition: 'Season 1',
  sampleData: false,
  status: 'COMPLETED',
  teamsCount: 4,
  matchesCount: 7,
  playersCount: 58,
  playersCountApproximate: true,
  champion: 'Bajrangi 11 Narua',
  runnerUp: 'Commando 11 Madhapur',
  topScorer: 'Rahul Das (144 runs)',
  topWicketTaker: 'Banty (11 wickets)',
  playerOfTournament: 'Rahul Das',
  description: 'The final came down to 24 runs needed off the last over, with Rahul Das hitting the winning runs in five balls.'
};

export const session1Champion = {
  season: '2024',
  edition: 'Season 1 (Inaugural)',
  championTeam: 'Bajrangi 11 Narua',
  championShort: 'Bajrangi 11',
  captain: 'Omm Das',
  runnerUp: 'Commando 11 Madhapur',
  runnerUpShort: 'C11',
  winningMargin: 'Won in the final over',
  finalScores: '',
  venue: 'Not provided',
  playerOfFinal: 'Rahul Das',
  teamPhoto: '/assets/bajrangi11_champions.png',
  trophyPhoto: '/assets/trophy.jpg',
  description: 'The final came down to 24 runs needed off the last over, with Rahul Das hitting the winning runs in five balls.',
  featured: false
};

export const mergeOfficialSession1Content = (data) => {
  if (!data || typeof data !== 'object') return data;
  const replaceSeason = (items, officialItems) => [
    ...(Array.isArray(items) ? items.filter((item) => !['Season 1', 'Season 1 (Inaugural)'].includes(item?.edition)) : []),
    ...officialItems
  ];
  return {
    ...data,
    seasons: replaceSeason(data.seasons, [session1Season]),
    champions: replaceSeason(data.champions, [session1Champion])
  };
};
