// Narua Premier League (NPL) - Official Tournament Data Store
// Established Since 2024 | All data is dynamically editable via Admin Dashboard

export const initialTournamentInfo = {
  name: "Narua Premier League",
  shortName: "NPL",
  established: 2024,
  currentSeason: "Season 3 (2026)",
  tagline: "Where Local Cricket Becomes History.",
  storyHeading: "THE STORY OF NARUA PREMIER LEAGUE",
  storyText: "Narua Premier League is a competitive cricket tournament built to bring players, teams and cricket lovers together through the spirit of competition, teamwork and entertainment. From humble grassroots origins on village pitches to a grand floodlit spectacle with digital broadcasting and professional franchise auctions, NPL has transformed regional sports culture into a celebrated carnival.",
  venue: "Narua Central Sports Complex, Bengal",
  totalTeams: 8,
  totalSeasons: 3,
  totalMatches: 142,
  totalRuns: 48920,
  totalWickets: 1480,
  totalSixes: 1892,
  prizePurse: "₹5,00,000",
  auctionDate: "October 18, 2026",
  auctionTime: "10:00 AM IST",
  auctionVenue: "Narua Grand Convention Center & Live Stream",
  registrationDeadline: "October 10, 2026",
  auctionPursePerTeam: "₹50,00,000",
  contactEmail: "contact@nplcricket.in",
  contactPhone: "+91 98321 44550",
};

export const initialChampions = [
  {
    season: "2025",
    edition: "Season 2",
    championTeam: "Royal Challengers Narua",
    championShort: "RCN",
    captain: "Sourav Das",
    runnerUp: "Narua Warriors",
    runnerUpShort: "NW",
    winningMargin: "Won via Super Over (Tied 185/8)",
    finalScores: "NW 185/6 (20.0) | RCN 185/8 (20.0) • Super Over: NW 11/1, RCN 15/0",
    venue: "Narua Central Stadium",
    playerOfFinal: "Sourav Das (68 off 36 & Super Over Winning Six)",
    teamPhoto: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    trophyPhoto: "/assets/trophy.jpg",
    description: "One of the greatest T20 finals in local cricket history. In front of 14,000 roaring spectators, RCN snatched victory from the jaws of defeat in an edge-of-the-seat Super Over showdown.",
    featured: true
  },
  {
    season: "2024",
    edition: "Season 1 (Inaugural)",
    championTeam: "Narua Super Kings",
    championShort: "NSK",
    captain: "Rajesh Roy",
    runnerUp: "Bay Coastal Titans",
    runnerUpShort: "BCT",
    winningMargin: "Won by 18 runs",
    finalScores: "NSK 198/5 (20.0) | BCT 180/9 (20.0)",
    venue: "Narua Central Stadium",
    playerOfFinal: "Rajesh Roy (78 off 42 & 2/22)",
    teamPhoto: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1200&q=80",
    trophyPhoto: "/assets/trophy.jpg",
    description: "The historic inaugural championship saw Narua Super Kings dominate the tournament, defending 198 in an electric night final to etch their name as the first-ever NPL Champions.",
    featured: false
  }
];

export const initialSeasons = [
  {
    season: "2026",
    edition: "Season 3",
    status: "ONGOING / MEGA AUCTION AHEAD",
    teamsCount: 8,
    matchesCount: 28,
    champion: "TBD",
    runnerUp: "TBD",
    topScorer: "Sourav Das (468 runs)",
    topWicketTaker: "Koushik Sen (19 wickets)",
    playerOfTournament: "Contenders: Sourav Das, Amit Sen, Rajesh Roy",
    description: "The grandest edition yet with 8 full franchises, expanded prize pool, and digital DRS."
  },
  {
    season: "2025",
    edition: "Season 2",
    status: "COMPLETED",
    teamsCount: 8,
    matchesCount: 28,
    champion: "Royal Challengers Narua",
    runnerUp: "Narua Warriors",
    topScorer: "Pritam Mondal (492 runs, 2 100s)",
    topWicketTaker: "Bikram Dutta (21 wickets, Econ 6.1)",
    playerOfTournament: "Sourav Das (RCN - 440 runs & 12 wickets)",
    description: "Expanded from 6 to 8 franchises. Introduced the franchise player auction system."
  },
  {
    season: "2024",
    edition: "Season 1",
    status: "COMPLETED",
    teamsCount: 6,
    matchesCount: 16,
    champion: "Narua Super Kings",
    runnerUp: "Bay Coastal Titans",
    topScorer: "Rajesh Roy (385 runs)",
    topWicketTaker: "Subhajit Pal (18 wickets)",
    playerOfTournament: "Rajesh Roy (NSK - 385 runs & 9 wickets)",
    description: "The foundation year where grassroots cricketers from Narua and surrounding districts came together."
  }
];

export const initialTeams = [
  {
    id: "nsk",
    name: "Narua Super Kings",
    shortName: "NSK",
    primaryColor: "#F59E0B",
    secondaryColor: "#1E3A8A",
    captain: "Rajesh Roy",
    owner: "Narua Steel & Infrastructure",
    home: "Central Narua Ground",
    titles: 1,
    matches: 24,
    wins: 17,
    losses: 7,
    winPercentage: 70.8,
    banner: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80",
    slogan: "Roar of Narua",
    squad: [
      { id: "p1", name: "Rajesh Roy", role: "All-Rounder", isCaptain: true, runs: 820, wickets: 28, age: 26, style: "RHB / Right-Arm Medium" },
      { id: "p2", name: "Arindam Ghosh", role: "Batsman", runs: 640, wickets: 0, age: 24, style: "LHB / Top Order" },
      { id: "p3", name: "Koushik Sen", role: "Bowler", runs: 85, wickets: 42, age: 27, style: "Right-Arm Fast" },
      { id: "p4", name: "Tanmoy Sarkar", role: "Wicketkeeper", runs: 410, dismissals: 19, age: 25, style: "RHB / Wicketkeeper" },
      { id: "p5", name: "Debabrata Majumdar", role: "Bowler", runs: 45, wickets: 34, age: 23, style: "Right-Arm Leg Spin" },
      { id: "p6", name: "Suvendu Paul", role: "All-Rounder", runs: 390, wickets: 16, age: 28, style: "RHB / Off Break" },
    ]
  },
  {
    id: "rcn",
    name: "Royal Challengers Narua",
    shortName: "RCN",
    primaryColor: "#EF4444",
    secondaryColor: "#D97706",
    captain: "Sourav Das",
    owner: "Narua Heritage Estates",
    home: "North Narua Stadium",
    titles: 1,
    matches: 24,
    wins: 16,
    losses: 8,
    winPercentage: 66.7,
    banner: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1000&q=80",
    slogan: "Play Bold, Dream Royal",
    squad: [
      { id: "p7", name: "Sourav Das", role: "Batsman", isCaptain: true, runs: 940, wickets: 14, age: 27, style: "RHB / Opening Batter" },
      { id: "p8", name: "Abhishek Mukherjee", role: "Bowler", runs: 60, wickets: 38, age: 25, style: "Left-Arm Fast" },
      { id: "p9", name: "Sayantan Roy", role: "All-Rounder", runs: 480, wickets: 24, age: 26, style: "RHB / Right-Arm Spin" },
      { id: "p10", name: "Dipayan Mitra", role: "Wicketkeeper", runs: 320, dismissals: 16, age: 24, style: "RHB / Wicketkeeper" },
      { id: "p11", name: "Rohit Samanta", role: "Batsman", runs: 510, wickets: 2, age: 23, style: "LHB / Middle Order" },
    ]
  },
  {
    id: "nw",
    name: "Narua Warriors",
    shortName: "NW",
    primaryColor: "#2563EB",
    secondaryColor: "#93C5FD",
    captain: "Amit Sen",
    owner: "Bengal Apex Logistics",
    home: "Narua Township Arena",
    titles: 0,
    matches: 24,
    wins: 15,
    losses: 9,
    winPercentage: 62.5,
    banner: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80",
    slogan: "Defend and Conquer",
    squad: [
      { id: "p12", name: "Amit Sen", role: "All-Rounder", isCaptain: true, runs: 710, wickets: 32, age: 29, style: "RHB / Right-Arm Medium Fast" },
      { id: "p13", name: "Surajit Bhowmik", role: "Batsman", runs: 620, wickets: 0, age: 26, style: "RHB / Anchor" },
      { id: "p14", name: "Prasenjit Das", role: "Bowler", runs: 30, wickets: 39, age: 24, style: "Right-Arm Off Spin" },
      { id: "p15", name: "Indrajit Roy", role: "Wicketkeeper", runs: 380, dismissals: 21, age: 25, style: "RHB / Finisher" },
    ]
  },
  {
    id: "bct",
    name: "Bay Coastal Titans",
    shortName: "BCT",
    primaryColor: "#06B6D4",
    secondaryColor: "#1E293B",
    captain: "Bikram Dutta",
    owner: "Coastal Marine Infra",
    home: "South Bay Grounds",
    titles: 0,
    matches: 24,
    wins: 14,
    losses: 10,
    winPercentage: 58.3,
    banner: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80",
    slogan: "Tides of Power",
    squad: [
      { id: "p16", name: "Bikram Dutta", role: "Bowler", isCaptain: true, runs: 120, wickets: 44, age: 28, style: "Right-Arm Fast" },
      { id: "p17", name: "Monojit Saha", role: "Batsman", runs: 580, wickets: 0, age: 25, style: "RHB / Power Hitter" },
      { id: "p18", name: "Ranjan Banerjee", role: "All-Rounder", runs: 420, wickets: 19, age: 26, style: "LHB / Left-Arm Ortho" },
      { id: "p19", name: "Sanjoy Das", role: "Wicketkeeper", runs: 290, dismissals: 14, age: 24, style: "RHB / Keeper" },
    ]
  },
  {
    id: "nt",
    name: "Narua Tigers",
    shortName: "NT",
    primaryColor: "#F97316",
    secondaryColor: "#171717",
    captain: "Anirban Bose",
    owner: "Tiger Developers & Realty",
    home: "Narua East Field",
    titles: 0,
    matches: 22,
    wins: 11,
    losses: 11,
    winPercentage: 50.0,
    banner: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1000&q=80",
    slogan: "Fearless and Fierce",
    squad: [
      { id: "p20", name: "Anirban Bose", role: "Batsman", isCaptain: true, runs: 690, wickets: 4, age: 27, style: "RHB / Explosive Opener" },
      { id: "p21", name: "Suman Halder", role: "Bowler", runs: 40, wickets: 31, age: 24, style: "Right-Arm Medium" },
      { id: "p22", name: "Ayan Bhattacharya", role: "All-Rounder", runs: 370, wickets: 22, age: 25, style: "RHB / Leg Spin" },
    ]
  },
  {
    id: "nkr",
    name: "Narua Knight Riders",
    shortName: "NKR",
    primaryColor: "#9333EA",
    secondaryColor: "#FBBF24",
    captain: "Subhajit Pal",
    owner: "Pal Star Cinema & Media",
    home: "Narua Green Park",
    titles: 0,
    matches: 22,
    wins: 10,
    losses: 12,
    winPercentage: 45.4,
    banner: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80",
    slogan: "Purple Pride",
    squad: [
      { id: "p23", name: "Subhajit Pal", role: "Bowler", isCaptain: true, runs: 90, wickets: 37, age: 26, style: "Right-Arm Off Spin" },
      { id: "p24", name: "Chandan Chatterjee", role: "Batsman", runs: 530, wickets: 0, age: 24, style: "LHB / Top Order" },
      { id: "p25", name: "Pallab Naskar", role: "All-Rounder", runs: 310, wickets: 17, age: 25, style: "RHB / Medium Pacer" },
    ]
  },
  {
    id: "ds",
    name: "Delta Strikers",
    shortName: "DS",
    primaryColor: "#10B981",
    secondaryColor: "#E2E8F0",
    captain: "Pritam Mondal",
    owner: "Delta Agro Industries",
    home: "Narua Delta Ground",
    titles: 0,
    matches: 20,
    wins: 9,
    losses: 11,
    winPercentage: 45.0,
    banner: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1000&q=80",
    slogan: "Strike with Precision",
    squad: [
      { id: "p26", name: "Pritam Mondal", role: "Batsman", isCaptain: true, runs: 730, wickets: 0, age: 28, style: "RHB / Six Hitting Specialist" },
      { id: "p27", name: "Tarun Pramanik", role: "Bowler", runs: 35, wickets: 29, age: 23, style: "Left-Arm Fast Medium" },
      { id: "p28", name: "Niloy Barik", role: "All-Rounder", runs: 280, wickets: 15, age: 24, style: "RHB / Off Spin" },
    ]
  },
  {
    id: "np",
    name: "Narua Panthers",
    shortName: "NP",
    primaryColor: "#14B8A6",
    secondaryColor: "#0F172A",
    captain: "Rahul Barman",
    owner: "Barman Tech & Solutions",
    home: "Narua West Stadium",
    titles: 0,
    matches: 20,
    wins: 8,
    losses: 12,
    winPercentage: 40.0,
    banner: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80",
    slogan: "Silent, Swift, Supreme",
    squad: [
      { id: "p29", name: "Rahul Barman", role: "Batsman", isCaptain: true, runs: 660, wickets: 0, age: 25, style: "RHB / Opening Batter" },
      { id: "p30", name: "Santosh Malik", role: "Bowler", runs: 50, wickets: 26, age: 26, style: "Right-Arm Fast" },
      { id: "p31", name: "Kunal Ghosh", role: "Wicketkeeper", runs: 340, dismissals: 15, age: 23, style: "RHB / Keeper Batsman" },
    ]
  }
];

export const initialMatches = [
  {
    id: "m-live-1",
    status: "LIVE",
    matchNumber: "Match 14",
    tournamentPhase: "League Stage",
    venue: "Narua Central Stadium",
    date: "Today",
    time: "LIVE NOW",
    team1: {
      id: "nsk",
      name: "Narua Super Kings",
      shortName: "NSK",
      color: "#F59E0B",
      score: "186/4",
      overs: "18.3",
      target: 192,
    },
    team2: {
      id: "nw",
      name: "Narua Warriors",
      shortName: "NW",
      color: "#2563EB",
      score: "191/6",
      overs: "20.0",
    },
    equation: "NSK need 6 runs in 9 balls to win",
    currentBatsmen: [
      { name: "Rajesh Roy", score: "68*(39)", isStriker: true },
      { name: "Arindam Ghosh", score: "24*(13)", isStriker: false }
    ],
    currentBowler: { name: "Prasenjit Das", figures: "1/36 (3.3 ov)" },
    recentBalls: ["1", "4", "6", "1", "W", "2", "4"],
    featured: true
  },
  {
    id: "m-up-1",
    status: "UPCOMING",
    matchNumber: "Match 15",
    tournamentPhase: "League Stage",
    venue: "Narua Central Stadium",
    date: "Tomorrow, Oct 1",
    time: "07:00 PM IST",
    countdownTarget: new Date(Date.now() + 28 * 3600 * 1000).toISOString(),
    team1: {
      id: "rcn",
      name: "Royal Challengers Narua",
      shortName: "RCN",
      color: "#EF4444"
    },
    team2: {
      id: "bct",
      name: "Bay Coastal Titans",
      shortName: "BCT",
      color: "#06B6D4"
    },
    preview: "High stakes derby! Champion RCN look to seal the top spot against a red-hot Titans pace battery.",
    pitchReport: "Batting paradise with evening dew. Teams chasing have won 65% games."
  },
  {
    id: "m-up-2",
    status: "UPCOMING",
    matchNumber: "Match 16",
    tournamentPhase: "League Stage",
    venue: "North Narua Stadium",
    date: "Thursday, Oct 2",
    time: "07:30 PM IST",
    countdownTarget: new Date(Date.now() + 52 * 3600 * 1000).toISOString(),
    team1: {
      id: "nt",
      name: "Narua Tigers",
      shortName: "NT",
      color: "#F97316"
    },
    team2: {
      id: "nkr",
      name: "Narua Knight Riders",
      shortName: "NKR",
      color: "#9333EA"
    },
    preview: "Must-win playoff eliminator encounter. Tiger power hitters against Knight spinners.",
    pitchReport: "Spin-friendly surface with grip and turn under floodlights."
  },
  {
    id: "m-up-3",
    status: "UPCOMING",
    matchNumber: "Match 17",
    tournamentPhase: "League Stage",
    venue: "Narua Central Stadium",
    date: "Saturday, Oct 4",
    time: "03:30 PM IST",
    countdownTarget: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
    team1: {
      id: "ds",
      name: "Delta Strikers",
      shortName: "DS",
      color: "#10B981"
    },
    team2: {
      id: "np",
      name: "Narua Panthers",
      shortName: "NP",
      color: "#14B8A6"
    },
    preview: "Day match showdown with dry pitch conditions expected.",
    pitchReport: "Dry deck, toss winner will look to put runs on board."
  },
  {
    id: "m-comp-1",
    status: "COMPLETED",
    matchNumber: "Match 13",
    tournamentPhase: "League Stage",
    venue: "Narua Central Stadium",
    date: "Sep 28, 2026",
    time: "Completed",
    team1: {
      id: "rcn",
      name: "Royal Challengers Narua",
      shortName: "RCN",
      color: "#EF4444",
      score: "204/5",
      overs: "20.0"
    },
    team2: {
      id: "nt",
      name: "Narua Tigers",
      shortName: "NT",
      color: "#F97316",
      score: "179/8",
      overs: "20.0"
    },
    result: "Royal Challengers Narua won by 25 runs",
    playerOfMatch: {
      name: "Sourav Das (RCN)",
      performance: "82 off 41 balls (7x4, 5x6)",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
    }
  },
  {
    id: "m-comp-2",
    status: "COMPLETED",
    matchNumber: "Match 12",
    tournamentPhase: "League Stage",
    venue: "Narua Township Arena",
    date: "Sep 26, 2026",
    time: "Completed",
    team1: {
      id: "bct",
      name: "Bay Coastal Titans",
      shortName: "BCT",
      color: "#06B6D4",
      score: "168/7",
      overs: "20.0"
    },
    team2: {
      id: "nw",
      name: "Narua Warriors",
      shortName: "NW",
      color: "#2563EB",
      score: "172/3",
      overs: "18.1"
    },
    result: "Narua Warriors won by 7 wickets",
    playerOfMatch: {
      name: "Amit Sen (NW)",
      performance: "56* (29) & 3/21 in 4 overs",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
    }
  },
  {
    id: "m-comp-3",
    status: "COMPLETED",
    matchNumber: "Match 11",
    tournamentPhase: "League Stage",
    venue: "North Narua Stadium",
    date: "Sep 24, 2026",
    time: "Completed",
    team1: {
      id: "nkr",
      name: "Narua Knight Riders",
      shortName: "NKR",
      color: "#9333EA",
      score: "155/9",
      overs: "20.0"
    },
    team2: {
      id: "nsk",
      name: "Narua Super Kings",
      shortName: "NSK",
      color: "#F59E0B",
      score: "159/2",
      overs: "16.4"
    },
    result: "Narua Super Kings won by 8 wickets",
    playerOfMatch: {
      name: "Koushik Sen (NSK)",
      performance: "4/18 in 4 overs (including a Maiden)",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
    }
  }
];

export const initialPointsTable = [
  { pos: 1, teamId: "rcn", team: "Royal Challengers Narua", short: "RCN", p: 7, w: 5, l: 2, nr: 0, nrr: "+1.240", pts: 10, form: ["W","W","L","W","W"], qualified: true, color: "#EF4444" },
  { pos: 2, teamId: "nsk", team: "Narua Super Kings", short: "NSK", p: 6, w: 4, l: 2, nr: 0, nrr: "+0.890", pts: 8, form: ["W","W","W","L","W"], qualified: true, color: "#F59E0B" },
  { pos: 3, teamId: "nw", team: "Narua Warriors", short: "NW", p: 6, w: 4, l: 2, nr: 0, nrr: "+0.510", pts: 8, form: ["W","L","W","W","L"], qualified: true, color: "#2563EB" },
  { pos: 4, teamId: "bct", team: "Bay Coastal Titans", short: "BCT", p: 7, w: 4, l: 3, nr: 0, nrr: "+0.220", pts: 8, form: ["L","W","L","W","W"], qualified: true, color: "#06B6D4" },
  { pos: 5, teamId: "nt", team: "Narua Tigers", short: "NT", p: 7, w: 3, l: 4, nr: 0, nrr: "-0.180", pts: 6, form: ["L","L","W","L","W"], qualified: false, color: "#F97316" },
  { pos: 6, teamId: "nkr", team: "Narua Knight Riders", short: "NKR", p: 6, w: 2, l: 4, nr: 0, nrr: "-0.640", pts: 4, form: ["L","W","L","L","L"], qualified: false, color: "#9333EA" },
  { pos: 7, teamId: "ds", team: "Delta Strikers", short: "DS", p: 6, w: 2, l: 4, nr: 0, nrr: "-0.810", pts: 4, form: ["W","L","L","L","W"], qualified: false, color: "#10B981" },
  { pos: 8, teamId: "np", team: "Narua Panthers", short: "NP", p: 7, w: 1, l: 6, nr: 0, nrr: "-1.210", pts: 2, form: ["L","L","L","W","L"], qualified: false, color: "#14B8A6" },
];

export const initialTopPerformers = {
  orangeCap: {
    category: "Orange Cap (Most Runs)",
    player: "Sourav Das",
    team: "Royal Challengers Narua",
    teamShort: "RCN",
    stat: "468 Runs",
    details: "7 Innings • Avg 66.8 • SR 168.4 • 4 Fifties • 28 Fours • 22 Sixes",
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-amber-500 to-orange-600"
  },
  purpleCap: {
    category: "Purple Cap (Most Wickets)",
    player: "Koushik Sen",
    team: "Narua Super Kings",
    teamShort: "NSK",
    stat: "19 Wickets",
    details: "6 Matches • Avg 11.2 • Econ 6.12 • BBI 4/18 • 1 Four-Wkt Haul",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-purple-600 to-indigo-800"
  },
  mostSixes: {
    category: "Maximum Sixes Award",
    player: "Pritam Mondal",
    team: "Delta Strikers",
    teamShort: "DS",
    stat: "26 Sixes",
    details: "6 Matches • Longest Six: 104m at Narua Central Stadium",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-red-500 to-rose-700"
  },
  bestEconomy: {
    category: "Best Bowling Economy",
    player: "Bikram Dutta",
    team: "Bay Coastal Titans",
    teamShort: "BCT",
    stat: "5.45 Econ",
    details: "26 Overs Bowled • 16 Wickets • 2 Maidens • Dot Ball % 58%",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-emerald-600 to-teal-800"
  },
  highestScore: {
    category: "Highest Individual Score",
    player: "Rahul Barman",
    team: "Narua Panthers",
    teamShort: "NP",
    stat: "114* (58)",
    details: "vs Delta Strikers • 10 Fours • 8 Huge Sixes • Century in 49 balls",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-cyan-600 to-blue-800"
  },
  bestBowling: {
    category: "Best Bowling Figures",
    player: "Abhishek Mukherjee",
    team: "Royal Challengers Narua",
    teamShort: "RCN",
    stat: "5/14 (4.0 ov)",
    details: "vs Narua Tigers • Triple wicket maiden in the 17th over",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80",
    badgeColor: "from-violet-600 to-fuchsia-800"
  }
};

export const initialRecords = [
  { title: "Highest Team Total", holder: "Narua Super Kings", value: "228/3", details: "20.0 Overs vs Narua Tigers (Season 2)" },
  { title: "Lowest Total Defended", holder: "Narua Warriors", value: "119 all out", details: "Defended vs BCT (Season 1)" },
  { title: "Fastest Fifty", holder: "Rajesh Roy (NSK)", value: "15 Balls", details: "7 Sixes, 2 Fours vs Narua Knight Riders (2025)" },
  { title: "Highest Partnership", holder: "Sourav Das & S. Samanta", value: "164 Runs", details: "1st Wicket for RCN vs Delta Strikers (2025)" },
  { title: "Most Sixes in an Inning", holder: "Pritam Mondal", value: "10 Sixes", details: "88 runs off 32 balls (Season 2)" },
  { title: "Best Bowling in NPL History", holder: "Abhishek Mukherjee", value: "5/14", details: "Royal Challengers Narua (Season 3)" },
  { title: "Most Tournament Titles", holder: "NSK & RCN (Tied)", value: "1 Title Each", details: "2024: NSK | 2025: RCN" },
  { title: "Most Catches by a Fielder", holder: "Surajit Bhowmik", value: "18 Catches", details: "Narua Warriors (Across 2 seasons)" }
];

export const initialGallery = [
  {
    id: "g1",
    category: "CHAMPIONS",
    title: "RCN Lifting the NPL 2025 Trophy",
    caption: "Captain Sourav Das and team in euphoric celebrations after the Super Over triumph.",
    image: "/assets/trophy.jpg",
    date: "Season 2 Final"
  },
  {
    id: "g2",
    category: "MATCH DAY",
    title: "Night Floodlit Spectacle at Narua Central",
    caption: "Packed stands under stadium beams during the high-voltage Friday night derby.",
    image: "/assets/stadium.jpg",
    date: "Season 3 League"
  },
  {
    id: "g3",
    category: "FINALS",
    title: "The Super Over Thriller Moment",
    caption: "Batsmen running the winning bye as fireworks erupt over the stadium.",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80",
    date: "2025 Final"
  },
  {
    id: "g4",
    category: "AUCTION",
    title: "NPL Mega Auction Bidding War",
    caption: "Franchise owners raising paddles in fierce competition for the marquee all-rounder.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
    date: "2025 Auction"
  },
  {
    id: "g5",
    category: "CELEBRATIONS",
    title: "Golden Confetti Shower",
    caption: "Trophy handover ceremony with league officials and guest dignitaries.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
    date: "2024 Inaugural"
  },
  {
    id: "g6",
    category: "TEAMS",
    title: "Narua Super Kings Squad Huddle",
    caption: "Pre-match strategic talk before heading onto the pitch.",
    image: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1000&q=80",
    date: "Match Day 8"
  },
  {
    id: "g7",
    category: "PLAYERS",
    title: "The Winning Six Follow-through",
    caption: "Unstoppable hitting into the VIP pavilion stands.",
    image: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1000&q=80",
    date: "Season 3"
  },
  {
    id: "g8",
    category: "BEHIND THE SCENES",
    title: "Official Match Ball & Pitch Inspection",
    caption: "Lead umpires and pitch curators checking pitch moisture before toss.",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80",
    date: "Pre-match Inspection"
  }
];

export const initialHighlights = [
  {
    id: "v1",
    title: "NPL 2025 Grand Final: RCN vs NW Epic Super Over Finish",
    duration: "14:20",
    season: "Season 2",
    views: "24.8K views",
    thumbnail: "/assets/stadium.jpg",
    featured: true,
    description: "Relive every heart-stopping moment from the tie in 40 overs to Sourav Das hitting the winning boundary in the Super Over."
  },
  {
    id: "v2",
    title: "Top 10 Longest Sixes of NPL Season 2 (Out of Stadium!)",
    duration: "08:45",
    season: "Season 2",
    views: "18.2K views",
    thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80",
    featured: false,
    description: "Monster sixes from Pritam Mondal, Rajesh Roy, and Anirban Bose that landed on the highway."
  },
  {
    id: "v3",
    title: "Koushik Sen Lethal 4-Wicket Spell vs Knight Riders",
    duration: "06:12",
    season: "Season 3",
    views: "12.4K views",
    thumbnail: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=800&q=80",
    featured: false,
    description: "Fiery swing bowling under floodlights uprooting middle stumps."
  },
  {
    id: "v4",
    title: "Best Acrobatic Catches & Direct Hit Run Outs",
    duration: "09:30",
    season: "Season 2",
    views: "15.1K views",
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
    featured: false,
    description: "Gravity-defying boundary relay catches that stunned the crowd."
  },
  {
    id: "v5",
    title: "Inside the NPL Player Auction: Record Bid Drama",
    duration: "11:05",
    season: "Season 2",
    views: "21.6K views",
    thumbnail: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    featured: false,
    description: "How franchises planned their ₹50 Lakh budgets and the paddle war for Rajesh Roy."
  }
];

export const initialNews = [
  {
    id: "n1",
    category: "ANNOUNCEMENT",
    headline: "NPL Season 3 Mega Auction Date Announced: Record Registrations Expected",
    date: "Sep 25, 2026",
    readTime: "3 min read",
    image: "/assets/stadium.jpg",
    featured: true,
    snippet: "The Governing Council of Narua Premier League confirms October 18, 2026 as the date for the Season 3 Player Auction.",
    fullContent: `The Governing Council of Narua Premier League (NPL) has officially announced that the much-anticipated Player Auction for Season 3 will take place on October 18, 2026 at the Narua Grand Convention Center.\n\nWith player registration portal now open to local cricketers across Narua, Howrah, Hooghly, and neighboring districts, over 250 cricketers are projected to register for the 120 available auction slots across the 8 competing franchise teams.\n\n"This year we are introducing a minimum base price slab and transparent purse caps of ₹50 Lakhs per team to ensure balanced, thrilling competition," stated the NPL League Commissioner during the press briefing.`
  },
  {
    id: "n2",
    category: "MATCH REPORT",
    headline: "Sourav Das' Masterclass Propels RCN to the Top of the Table",
    date: "Sep 28, 2026",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    featured: false,
    snippet: "A blistering 82 off 41 deliveries secured a 25-run win over Narua Tigers in a high-scoring thriller.",
    fullContent: `Royal Challengers Narua continued their dominance in NPL Season 3 with an emphatic 25-run win against Narua Tigers. Captain Sourav Das led from the front with a stroke-filled 82 that featured 7 boundaries and 5 towering sixes.`
  },
  {
    id: "n3",
    category: "TEAM NEWS",
    headline: "Bay Coastal Titans Sign Pace Prodigy Ahead of Decisive Playoff Push",
    date: "Sep 27, 2026",
    readTime: "2 min read",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    featured: false,
    snippet: "Titans bolster their death overs arsenal with 21-year-old speedster ahead of tomorrow's clash.",
    fullContent: `Bay Coastal Titans have reinforced their squad depth with the addition of local pace sensation who clocked over 135 km/h in trial nets. Captain Bikram Dutta expressed confidence that this signing will turn their fortunes in the remaining league fixtures.`
  },
  {
    id: "n4",
    category: "AUCTION",
    headline: "How the NPL Player Registration & Grading System Works This Year",
    date: "Sep 23, 2026",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    featured: false,
    snippet: "A complete guide for aspiring cricketers on base prices, role categories, and digital pass verification.",
    fullContent: `Every registered cricketer will undergo verification by the NPL Technical Committee. Players will be assigned to Grade A, Grade B, or Grade C based on district tournaments, previous NPL stats, and trial performance.`
  }
];

export const initialAuctionRegistrations = [
  {
    id: "reg-1",
    registrationId: "NPL26-1049",
    fullName: "Subham Banerjee",
    dob: "1999-04-12",
    age: 27,
    phone: "+91 98311 02941",
    email: "subham.b@gmail.com",
    location: "Narua West, Bengal",
    role: "All-Rounder",
    battingStyle: "Right Hand",
    bowlingStyle: "Right Arm Medium Fast",
    basePrice: "₹50,000",
    status: "SHORTLISTED",
    matches: 18,
    runs: 420,
    wickets: 19,
    bestPerformance: "64* (28) & 3/18 in District Cup",
    previousExperience: "Yes - Played for NW in Season 1",
    bio: "Attacking lower-middle order batsman and death-overs bowler with pinpoint yorkers.",
    instagram: "@subham_cricket99",
    createdAt: "2026-09-24T10:15:00Z",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reg-2",
    registrationId: "NPL26-1052",
    fullName: "Rohan Karmakar",
    dob: "2002-08-19",
    age: 24,
    phone: "+91 98744 11204",
    email: "rohan.karmakar@yahoo.com",
    location: "Narua Bazar",
    role: "Bowler",
    battingStyle: "Right Hand",
    bowlingStyle: "Left Arm Spin",
    basePrice: "₹40,000",
    status: "VERIFIED",
    matches: 12,
    runs: 65,
    wickets: 24,
    bestPerformance: "5/21 in Division 1 league",
    previousExperience: "Debut season candidate",
    bio: "Crafty orthodox spinner with great flight, arm ball, and miserly economy rate.",
    instagram: "@rohan_spin_art",
    createdAt: "2026-09-24T14:40:00Z",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reg-3",
    registrationId: "NPL26-1058",
    fullName: "Aniket Ghosh",
    dob: "2000-11-05",
    age: 25,
    phone: "+91 94330 88219",
    email: "aniket.g@outlook.com",
    location: "South Narua Colony",
    role: "Wicketkeeper",
    battingStyle: "Right Hand",
    bowlingStyle: "Not Applicable",
    basePrice: "₹40,000",
    status: "SHORTLISTED",
    matches: 15,
    runs: 380,
    wickets: 0,
    bestPerformance: "72 off 38 balls in semifinal",
    previousExperience: "Yes - Reserve keeper in Season 2",
    bio: "Agile wicketkeeper with lightning stumpings and clean 360-degree ramp shot ability.",
    instagram: "@aniket_ghosh_wk",
    createdAt: "2026-09-25T09:20:00Z",
    photo: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reg-4",
    registrationId: "NPL26-1065",
    fullName: "Debjit Mukherjee",
    dob: "1998-03-22",
    age: 28,
    phone: "+91 97488 33902",
    email: "debjit.mukh@gmail.com",
    location: "Narua Riverside",
    role: "Batsman",
    battingStyle: "Left Hand",
    bowlingStyle: "Right Arm Spin",
    basePrice: "₹60,000",
    status: "AUCTIONED",
    soldPrice: "₹1,40,000",
    soldTo: "Narua Super Kings",
    matches: 22,
    runs: 690,
    wickets: 8,
    bestPerformance: "94* off 51 balls",
    previousExperience: "Former district under-23 captain",
    bio: "Fearless left-handed opener who destroys the powerplay with lofted cover drives.",
    instagram: "@debjit_cricketer",
    createdAt: "2026-09-25T11:00:00Z",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "reg-5",
    registrationId: "NPL26-1070",
    fullName: "Tanmay Bera",
    dob: "2003-01-14",
    age: 23,
    phone: "+91 98305 77119",
    email: "tanmaybera@rediffmail.com",
    location: "Narua East Gram",
    role: "Bowler",
    battingStyle: "Right Hand",
    bowlingStyle: "Right Arm Fast",
    basePrice: "₹30,000",
    status: "PENDING",
    matches: 8,
    runs: 20,
    wickets: 15,
    bestPerformance: "4/16 in Inter-Village Trophy",
    previousExperience: "Grassroots trialist",
    bio: "Raw express pace bowler consistently hitting genuine fast bowling speeds.",
    instagram: "@tanmay_pace",
    createdAt: "2026-09-25T16:30:00Z",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"
  }
];

export const initialAuctionLiveState = {
  activePlayerIndex: 0,
  currentBid: 50000,
  currentBiddingTeam: "nsk",
  bidHistory: [
    { team: "Narua Super Kings", amount: 50000, time: "Just now" }
  ],
  soldPlayers: [
    {
      playerId: "reg-4",
      playerName: "Debjit Mukherjee",
      role: "Batsman",
      basePrice: "₹60,000",
      soldPrice: "₹1,40,000",
      team: "Narua Super Kings",
      teamShort: "NSK",
      teamColor: "#F59E0B"
    }
  ],
  teamPurses: {
    nsk: 4860000,
    rcn: 5000000,
    nw: 5000000,
    bct: 5000000,
    nt: 5000000,
    nkr: 5000000,
    ds: 5000000,
    np: 5000000
  }
};
