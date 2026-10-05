// Narua Premier League (NPL) - Official Tournament Data Store
// Established Since 2024 | All data is dynamically editable via Admin Dashboard
import { session3Champion, session3Matches, session3Records, session3Season, session3Standings, session3Teams } from './session3Data';
import { session4Champion, session4Matches, session4Records, session4Standings, session4Teams } from './session4Data';

export const initialTournamentInfo = {
  name: "Narua Premier League",
  shortName: "NPL",
  established: 2024,
  currentSeason: "Season 5 (2026)",
  tagline: "Where Local Cricket Becomes History.",
  storyHeading: "Our Story",
  storyText: "Narua Premier League is a competitive cricket tournament built to bring players, teams and cricket lovers together through the spirit of competition, teamwork and entertainment. From humble grassroots origins on village pitches to a grand floodlit spectacle with digital broadcasting and professional franchise auctions, NPL has transformed regional sports culture into a celebrated carnival.",
  venue: "Narua Playground, Jajpur",
  totalTeams: 6,
  totalSeasons: 5,
  totalMatches: 16,
  totalRuns: 0,
  totalWickets: 0,
  totalSixes: 0,
  auctionDate: "TO BE INFORMED SOON",
  auctionTime: "TO BE INFORMED SOON",
  auctionVenue: "TO BE INFORMED SOON",
  registrationDeadline: "TO BE INFORMED SOON",
  auctionPursePerTeam: "TO BE INFORMED SOON",
  contactEmail: "contact@nplcricket.in",
  contactPhone: "+91 98321 44550",
};

export const initialChampions = [
  {
    season: "2026",
    edition: "Season 5",
    championTeam: "GCC Fighter Binjharpur",
    championShort: "GCC Fighter",
    captain: "Farhan Khan",
    runnerUp: "HP No Compromise",
    runnerUpShort: "HP No Compromise",
    winningMargin: "Won By 7 Wickets",
    finalScores: "HP No Compromise 48/8 (8) | GCC Fighter 49/3 (4)",
    venue: "Narua Playground, Jajpur",
    playerOfFinal: "Amirul (23* off 11)",
    teamPhoto: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    trophyPhoto: "/assets/trophy.jpg",
    description: "GCC Fighter Binjharpur lifted the Session 5 trophy after a dramatic final where HP No Compromise were restricted to 48/8 before GCC chased the target in just four overs.",
    featured: true
  },
  session4Champion,
  session3Champion,
  {
    season: "2025",
    edition: "Season 2",
    championTeam: "No Compromise Kaina ",
    championShort: "No Compromise",
    captain: "Mojahid Khan",
    runnerUp: "BMN Royals Narua",
    runnerUpShort: "BMN Royals",
    winningMargin: "Won By 22 Runs",
    finalScores: "No Compromise Kaina  96/6 (8) |BMN Royals  74/8 (8)",
    venue: "Narua Bada Padia",
    playerOfFinal: "Sabir Khan (38 off 16 & 2/25)",
    teamPhoto: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80",
    trophyPhoto: "/assets/trophy.jpg",
    description: "One of the greatest  finals in local cricket history. In front of 1,000 roaring spectators, No Compromise Kaina snatched victory from the jaws of defeat in an edge-of-the-seat.",
    featured: true
  },
  {
    season: "2024",
    edition: "Season 1 (Inaugural)",
    championTeam: "Bajrangi 11",
    championShort: "Bajrangi 11",
    captain: "Omm Das",
    runnerUp: "Commando 11",
    runnerUpShort: "C11",
    winningMargin: "Won by 2 Wicket",
    finalScores: "Commando 11 104/5 (10) |Bajrangi 11  106/8 (10))",
    venue: "Narua Bada Padia ",
    playerOfFinal: "Rahul Das (78 off 42 & 2/22)",
    teamPhoto: "/assets/bajrangi11_champions.png",
    trophyPhoto: "/assets/trophy.jpg",
    description: "The historic inaugural championship saw Narua Super Kings dominate the tournament.",
    featured: false
  }
];

export const initialSeasons = [
  {
    season: "2026",
    year: "2026",
    edition: "Season 5",
    sampleData: true,
    status: "COMPLETED",
    teamsCount: 6,
    matchesCount: 16,
    champion: "GCC Fighter Binjharpur",
    runnerUp: "HP No Compromise",
    topScorer: "Amirul (56* in final and strong tournament totals)",
    topWicketTaker: "Banty (3/7 final + 4/8 vs Barpada XI)",
    playerOfTournament: "Amirul",
    description: "Session 5 featured six teams, a 12-match league phase, knockout clashes, and a final won by GCC Fighter Binjharpur over HP No Compromise."
  },
  {
    season: "2026",
    year: "2026",
    edition: "Season 4",
    sampleData: false,
    status: "COMPLETED",
    teamsCount: 6,
    matchesCount: 15,
    champion: "Titan Strikers",
    runnerUp: "HP Commando 11",
    topScorer: "Rohan Das (86 runs)",
    topWicketTaker: "Rohan Das (10 wickets)",
    playerOfTournament: "Rohan Das (86 runs)",
    description: "Six teams played a 12-match league, two semifinals, and a final at Narua Playground, Jajpur. Titan Strikers won the championship."
  },
  session3Season,
  {
    season: "2025",
    year: "2025",
    edition: "Season 2",
    sampleData: true,
    status: "COMPLETED",
    teamsCount: 6,
    matchesCount: 15,
    champion: "No Compromise Kaina",
    runnerUp: "BMN Royals Narua",
    topScorer: "Chiku Das (211 runs)",
    topWicketTaker: "Abhishek Das (16 wickets)",
    playerOfTournament: "Chiku Das (211 runs & 8 wickets)",
    description: "Placeholder archive summary. Replace these sample values with official 2023 records."
  },
  {
    season: "2024",
    year: "2024",
    edition: "Season 1",
    sampleData: true,
    status: "COMPLETED",
    teamsCount: 6,
    matchesCount: 15,
    champion: "Bajrangi 11",
    runnerUp: "Commando 11 Madhapur",
    topScorer: "Banty (118 runs)",
    topWicketTaker: "Kamar (14 wickets)",
    playerOfTournament: "Sabir  (107 runs & 7 wickets)",
    description: "Placeholder archive summary. Replace these sample values with official 2022 records."
  }
];

export const initialTeams = [
  {
    id: "BMN Royals",
    name: "BMN Royals Narua",
    shortName: "BMN Royals",
    primaryColor: "#F59E0B",
    secondaryColor: "#1E3A8A",
    captain: "Tushar Das",
    owner: "Tushar Das",
    home: " Narua Ground",
    titles: 0,
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
    id: "HP Commando 11",
    name: "HP Commando 11",
    shortName: "HP Commando 11",
    primaryColor: "#f31558",
    secondaryColor: "#f4f4f4",
    captain: "Kamar ",
    owner: "Kamar Ahmed",
    home: "Madhapur",
    titles: 0,
    matches: 24,
    wins: 20,
    losses: 4,
    winPercentage: 86.7,
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
    id: "Titan Strikers",
    name: "Titan Strikers",
    shortName: "Titan Strikers",
    primaryColor: "#03ec60",
    secondaryColor: "rgb(255, 255, 255)",
    captain: "Rahul Das",
    owner: "Rahul Das",
    home: "Ramchandrapur",
    titles: 1,
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
    id: "Bajrangi 11",
    name: "Bajrangi 11",
    shortName: "Bajrangi 11",
    primaryColor: "#e87b07",
    secondaryColor: "#000610",
    captain: "Omm Das",
    owner: "Omm Das",
    home: "Narua",
    titles: 1,
    matches: 6,
    wins: 4,
    losses: 2,
    winPercentage: 65.3,
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
    id: "No Compromise Kaina ",
    name: "No Compromise Kaina",
    shortName: "No Compromise Kaina",
    primaryColor: "#1656f9",
    secondaryColor: "#f1f0f0",
    captain: "Mojahid Khan",
    owner: "Mojahid Khan",
    home: "Kaina",
    titles: 2,
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
    id: "GCC Fighter Binjharpur",
    name: "GCC Fighter Binjharpur",
    shortName: "GCC Fighter Binjharpur",
    primaryColor: "#f28b0e",
    secondaryColor: "#010101",
    captain: "Amirul",
    owner: "Amirul",
    home: "Binjharpur",
    titles: 1,
    matches: 6,
    wins: 4,
    losses: 2,
    winPercentage: 75.4,
    banner: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80",
    slogan: "Purple Pride",
    squad: [
      { id: "p23", name: "Subhajit Pal", role: "Bowler", isCaptain: true, runs: 90, wickets: 37, age: 26, style: "Right-Arm Off Spin" },
      { id: "p24", name: "Chandan Chatterjee", role: "Batsman", runs: 530, wickets: 0, age: 24, style: "LHB / Top Order" },
      { id: "p25", name: "Pallab Naskar", role: "All-Rounder", runs: 310, wickets: 17, age: 25, style: "RHB / Medium Pacer" },
    ]
  },
  {
    id: "Fire 11",
    name: "Fire 11 Narua",
    shortName: "Fire 11 ",
    primaryColor: "#ece111",
    secondaryColor: "#e39014",
    captain: "Rahul Das",
    owner: "Fire Club Narua",
    home: "Narua",
    titles: 0,
    matches: 6,
    wins: 2,
    losses: 4,
    winPercentage: 35.0,
    banner: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1000&q=80",
    slogan: "Strike with Precision",
    squad: [
      { id: "p26", name: "Pritam Mondal", role: "Batsman", isCaptain: true, runs: 730, wickets: 0, age: 28, style: "RHB / Six Hitting Specialist" },
      { id: "p27", name: "Tarun Pramanik", role: "Bowler", runs: 35, wickets: 29, age: 23, style: "Left-Arm Fast Medium" },
      { id: "p28", name: "Niloy Barik", role: "All-Rounder", runs: 280, wickets: 15, age: 24, style: "RHB / Off Spin" },
    ]
  },
  {
    id: "Barpada Fighter",
    name: "Barpada Fighter",
    shortName: "Barpada Fighter",
    primaryColor: "#02bba6",
    secondaryColor: "#0F172A",
    captain: "Rahul Barman",
    owner: "Barman Tech & Solutions",
    home: "Barpada",
    titles: 0,
    matches: 6,
    wins: 2,
    losses: 4,
    winPercentage: 30.0,
    banner: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1000&q=80",
    slogan: "Silent, Swift, Supreme",
    squad: [
      { id: "p29", name: "Rahul Barman", role: "Batsman", isCaptain: true, runs: 660, wickets: 0, age: 25, style: "RHB / Opening Batter" },
      { id: "p30", name: "Santosh Malik", role: "Bowler", runs: 50, wickets: 26, age: 26, style: "Right-Arm Fast" },
      { id: "p31", name: "Kunal Ghosh", role: "Wicketkeeper", runs: 340, dismissals: 15, age: 23, style: "RHB / Keeper Batsman" },
    ]
  }
];

const createInitialSessionTeam = (team) => ({
  primaryColor: '#F59E0B',
  secondaryColor: '#0F172A',
  slogan: 'Built for glory',
  titles: 0,
  matches: 0,
  wins: 0,
  losses: 0,
  winPercentage: 0,
  banner: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80',
  squad: [],
  ...team
});

export const initialSessionTeams = [
  ...session3Teams,
  ...session4Teams,
  createInitialSessionTeam({
    id: 'gcc-fighter-binjharpur-season-5',
    name: 'GCC Fighter Binjharpur',
    shortName: 'GCC Fighter',
    captain: 'Farhan Khan',
    owner: 'Amirul',
    home: 'Binjharpur',
    primaryColor: '#0a39f5',
    sessions: ['Season 5'],
    slogan: 'Fighter Spirit',
    squad: [
      { id: 'gcc-1', name: 'Amirul', role: 'Batsman', isCaptain: true, runs: 310, wickets: 0, age: 27, style: 'RHB / Opener' },
      { id: 'gcc-2', name: 'Banty', role: 'All-Rounder', runs: 240, wickets: 21, age: 26, style: 'RHB / Medium Pace' },
      { id: 'gcc-3', name: 'Chotu', role: 'Batsman', runs: 180, wickets: 0, age: 25, style: 'RHB / Top Order' },
      { id: 'gcc-4', name: 'Gopal', role: 'Bowler', runs: 30, wickets: 18, age: 24, style: 'Right-Arm Medium' },
      { id: 'gcc-5', name: 'Litu Jr', role: 'Batsman', runs: 120, wickets: 0, age: 23, style: 'RHB / Finisher' },
      { id: 'gcc-6', name: 'Mohammed Sahawaz Hussain', role: 'Bowler', runs: 10, wickets: 12, age: 27, style: 'Right-Arm Fast' },
      { id: 'gcc-7', name: 'Muna', role: 'Wicketkeeper', runs: 145, dismissals: 10, age: 26, style: 'RHB / Keeper' },
      { id: 'gcc-8', name: 'Awes', role: 'All-Rounder', runs: 110, wickets: 10, age: 29, style: 'RHB / Medium Pace' },
      { id: 'gcc-9', name: 'Awes Khan', role: 'Bowler', runs: 25, wickets: 11, age: 25, style: 'Right-Arm Fast' },
      { id: 'gcc-10', name: 'Mojahid', role: 'Batsman', runs: 130, wickets: 0, age: 28, style: 'RHB / Power Hitter' },
      { id: 'gcc-11', name: 'Aman Khan', role: 'Bowler', runs: 20, wickets: 9, age: 24, style: 'Left-Arm Orthodox' },
      { id: 'gcc-12', name: 'Shahnawaz', role: 'All-Rounder', runs: 95, wickets: 8, age: 25, style: 'RHB / Medium Pacer' },
      { id: 'gcc-13', name: 'Asish', role: 'Batsman', runs: 80, wickets: 0, age: 23, style: 'LHB / Middle Order' },
      { id: 'gcc-14', name: 'Ganesh', role: 'Bowler', runs: 18, wickets: 7, age: 24, style: 'Right-Arm Medium' },
      { id: 'gcc-15', name: 'Eehan', role: 'Batsman', runs: 55, wickets: 0, age: 22, style: 'RHB / Middle Order' }
    ]
  }),
  createInitialSessionTeam({
    id: 'hp-no-compromise-season-5',
    name: 'HP No Compromise',
    shortName: 'HP No Compromise',
    captain: 'Abhishek Das',
    owner: 'Maheswar',
    home: 'Madhapur',
    primaryColor: '#f31558',
    sessions: ['Season 5'],
    slogan: 'No Excuses',
    squad: [
      { id: 'hp-1', name: 'Akash', role: 'Batsman', runs: 160, wickets: 0, age: 24, style: 'RHB / Opener' },
      { id: 'hp-2', name: 'Bhola', role: 'Bowler', runs: 18, wickets: 10, age: 25, style: 'Right-Arm Medium' },
      { id: 'hp-3', name: 'Chandan Das', role: 'Batsman', runs: 240, wickets: 0, age: 27, style: 'RHB / Aggressive Batter' },
      { id: 'hp-4', name: 'Kamar Ahmad', role: 'All-Rounder', runs: 180, wickets: 14, age: 28, style: 'RHB / Hard-Hitter' },
      { id: 'hp-5', name: 'Maheswar', role: 'Batsman', runs: 95, wickets: 0, age: 26, style: 'RHB / Middle Order' },
      { id: 'hp-6', name: 'Pinu Das', role: 'Batsman', runs: 140, wickets: 0, age: 24, style: 'RHB / Explosive Batter' },
      { id: 'hp-7', name: 'Pratish Jr', role: 'Bowler', runs: 12, wickets: 8, age: 23, style: 'Right-Arm Spin' },
      { id: 'hp-8', name: 'Kanha Sahoo', role: 'Batsman', runs: 90, wickets: 0, age: 23, style: 'RHB / Finisher' },
      { id: 'hp-9', name: 'Indramani Mallik', role: 'Bowler', runs: 15, wickets: 9, age: 25, style: 'Right-Arm Medium' },
      { id: 'hp-10', name: 'Nafish Khan', role: 'All-Rounder', runs: 80, wickets: 7, age: 24, style: 'RHB / Spin' },
      { id: 'hp-11', name: 'Shan', role: 'Bowler', runs: 18, wickets: 11, age: 26, style: 'Right-Arm Fast' },
      { id: 'hp-12', name: 'Subham Sahoo', role: 'Bowler', runs: 14, wickets: 9, age: 25, style: 'Left-Arm Spin' }
    ]
  }),
  createInitialSessionTeam({
    id: 'titan-strikers-season-5',
    name: 'Titan Strikers',
    shortName: 'Titan Strikers',
    captain: 'Rahul Haripur',
    owner: 'Rahul Haripur',
    home: 'Haripur',
    primaryColor: '#11ff00',
    sessions: ['Season 5'],
    slogan: 'Power Through Pressure',
    squad: [
      { id: 'ts-1', name: 'Babu Gandakul', role: 'Batsman', runs: 170, wickets: 0, age: 27, style: 'RHB / Top Order' },
      { id: 'ts-2', name: 'Nigam Sahoo', role: 'Batsman', runs: 220, wickets: 0, age: 27, style: 'RHB / Power Hitter' },
      { id: 'ts-3', name: 'Official Abhijit', role: 'Bowler', runs: 12, wickets: 9, age: 26, style: 'Right-Arm Fast' },
      { id: 'ts-4', name: 'Omm Cse Synergy', role: 'All-Rounder', runs: 105, wickets: 8, age: 25, style: 'RHB / Medium Pace' },
      { id: 'ts-5', name: 'Rohan Das', role: 'All-Rounder', runs: 180, wickets: 11, age: 28, style: 'RHB / Spin' },
      { id: 'ts-6', name: 'Rubul', role: 'Batsman', runs: 120, wickets: 0, age: 25, style: 'RHB / Middle Order' },
      { id: 'ts-7', name: 'Shubham Prakash Das', role: 'Bowler', runs: 14, wickets: 10, age: 24, style: 'Right-Arm Medium' },
      { id: 'ts-8', name: 'Rohit Bidapada', role: 'Batsman', runs: 112, wickets: 0, age: 26, style: 'RHB / Finisher' },
      { id: 'ts-9', name: 'Sachin', role: 'Bowler', runs: 20, wickets: 8, age: 23, style: 'Right-Arm Fast' },
      { id: 'ts-10', name: 'Dhirsudharma', role: 'Batsman', runs: 90, wickets: 0, age: 22, style: 'LHB / Middle Order' },
      { id: 'ts-11', name: 'Tahur', role: 'Batsman', runs: 80, wickets: 0, age: 24, style: 'RHB / Finisher' },
      { id: 'ts-12', name: 'Jada Malik', role: 'All-Rounder', runs: 95, wickets: 6, age: 23, style: 'RHB / Medium Pace' }
    ]
  }),
  createInitialSessionTeam({
    id: 'young-star-narua-season-5',
    name: 'Young Star Narua',
    shortName: 'Young Star Narua',
    captain: 'Chikuuuuu',
    owner: 'Chikuuuuu',
    home: 'Narua',
    primaryColor: '#ffaf0f',
    sessions: ['Season 5'],
    slogan: 'Rise with the Stars',
    squad: [
      { id: 'ys-1', name: 'Gourab Das', role: 'Batsman', runs: 180, wickets: 0, age: 26, style: 'RHB / Opening Bat' },
      { id: 'ys-2', name: 'Khitish Sahoo', role: 'Batsman', runs: 190, wickets: 0, age: 25, style: 'RHB / Aggressive Batter' },
      { id: 'ys-3', name: 'Krishna Rout', role: 'Bowler', runs: 30, wickets: 12, age: 27, style: 'Right-Arm Spin' },
      { id: 'ys-4', name: 'Mr Soumya', role: 'Batsman', runs: 90, wickets: 0, age: 26, style: 'RHB / Top Order' },
      { id: 'ys-5', name: 'Muna', role: 'Wicketkeeper', runs: 65, dismissals: 8, age: 24, style: 'RHB / Keeper' },
      { id: 'ys-6', name: 'Prasan Jit', role: 'Bowler', runs: 18, wickets: 9, age: 23, style: 'Right-Arm Medium' },
      { id: 'ys-7', name: 'Rahul Das', role: 'All-Rounder', runs: 170, wickets: 7, age: 27, style: 'RHB / Middle Order' },
      { id: 'ys-8', name: 'Pupun', role: 'Batsman', runs: 110, wickets: 0, age: 24, style: 'RHB / Power Hitter' },
      { id: 'ys-9', name: 'Babul Narua', role: 'Bowler', runs: 14, wickets: 8, age: 25, style: 'Left-Arm Spin' },
      { id: 'ys-10', name: 'Badal Sethy', role: 'Batsman', runs: 75, wickets: 0, age: 23, style: 'RHB / Lower Order' },
      { id: 'ys-11', name: 'Jagana', role: 'All-Rounder', runs: 95, wickets: 6, age: 24, style: 'RHB / Medium Pace' },
      { id: 'ys-12', name: 'Lipu', role: 'Bowler', runs: 10, wickets: 7, age: 25, style: 'Right-Arm Spin' },
      { id: 'ys-13', name: 'Ranga', role: 'Batsman', runs: 80, wickets: 0, age: 22, style: 'RHB / Batting Utility' }
    ]
  }),
  createInitialSessionTeam({
    id: 'barpada-xi-season-5',
    name: 'Barpada XI',
    shortName: 'Barpada XI',
    captain: 'Akhil Barik',
    owner: 'Akhil Barik',
    home: 'Barpada',
    primaryColor: '#02bba6',
    sessions: ['Season 5'],
    slogan: 'Barpada Fire',
    squad: [
      { id: 'bx-1', name: 'Barpada Anshuman', role: 'Batsman', runs: 110, wickets: 0, age: 25, style: 'RHB / Opener' },
      { id: 'bx-2', name: 'Barpada Tanu', role: 'Batsman', runs: 90, wickets: 0, age: 23, style: 'RHB / Middle Order' },
      { id: 'bx-3', name: 'Kohli Barpada', role: 'Bowler', runs: 12, wickets: 8, age: 24, style: 'Right-Arm Medium' },
      { id: 'bx-4', name: 'Liku', role: 'All-Rounder', runs: 140, wickets: 11, age: 27, style: 'RHB / pace all-rounder' },
      { id: 'bx-5', name: 'Raja', role: 'Batsman', runs: 80, wickets: 0, age: 22, style: 'RHB / Finisher' },
      { id: 'bx-6', name: 'Raja', role: 'Bowler', runs: 10, wickets: 7, age: 24, style: 'Right-Arm Medium' },
      { id: 'bx-7', name: 'Rajan', role: 'Bowler', runs: 15, wickets: 9, age: 26, style: 'Right-Arm Spin' },
      { id: 'bx-8', name: 'Saswat', role: 'Batsman', runs: 70, wickets: 0, age: 25, style: 'RHB / Lower Order' },
      { id: 'bx-9', name: 'Tulu', role: 'Batsman', runs: 95, wickets: 0, age: 24, style: 'RHB / Top Order' },
      { id: 'bx-10', name: 'Satya', role: 'All-Rounder', runs: 85, wickets: 6, age: 23, style: 'RHB / Spin' },
      { id: 'bx-11', name: 'Sodhu', role: 'Wicketkeeper', runs: 70, dismissals: 6, age: 25, style: 'RHB / Keeper' },
      { id: 'bx-12', name: 'Somanath Mallick', role: 'Bowler', runs: 8, wickets: 6, age: 24, style: 'Right-Arm Medium' },
      { id: 'bx-13', name: 'Subham', role: 'Batsman', runs: 60, wickets: 0, age: 23, style: 'RHB / Utility Bat' }
    ]
  }),
  createInitialSessionTeam({
    id: 'no-compromise-kaina-season-5',
    name: 'No Compromise Kaina',
    shortName: 'No Compromise Kaina',
    captain: 'Mojahid Ali Khan',
    owner: 'Mojahid Ali Khan',
    home: 'Kaina',
    primaryColor: '#1656f9',
    sessions: ['Season 5'],
    slogan: 'Fearless and Fierce',
    squad: [
      { id: 'k-1', name: 'Aditya Behera', role: 'Batsman', runs: 80, wickets: 0, age: 24, style: 'RHB / Opener' },
      { id: 'k-2', name: 'Amanulla Khan', role: 'Bowler', runs: 20, wickets: 8, age: 24, style: 'Right-Arm Medium' },
      { id: 'k-3', name: 'Amit Kumar Dhal', role: 'Bowler', runs: 10, wickets: 9, age: 25, style: 'Right-Arm Fast' },
      { id: 'k-4', name: 'Ashif Khan', role: 'All-Rounder', runs: 135, wickets: 11, age: 27, style: 'RHB / Spin' },
      { id: 'k-5', name: 'Barik Bankipal', role: 'Batsman', runs: 90, wickets: 0, age: 23, style: 'RHB / Top Order' },
      { id: 'k-6', name: 'Sajan Khan', role: 'Batsman', runs: 70, wickets: 0, age: 24, style: 'RHB / Lower Order' },
      { id: 'k-7', name: 'Sk Modasir', role: 'Batsman', runs: 120, wickets: 0, age: 26, style: 'RHB / Explosive Batter' },
      { id: 'k-8', name: 'Sk Sabir', role: 'All-Rounder', runs: 100, wickets: 7, age: 25, style: 'RHB / Medium Pace' },
      { id: 'k-9', name: 'Wasim', role: 'Bowler', runs: 18, wickets: 8, age: 23, style: 'Right-Arm Medium' },
      { id: 'k-10', name: 'Krishna Jena', role: 'Batsman', runs: 85, wickets: 0, age: 25, style: 'RHB / Utility Bat' },
      { id: 'k-11', name: 'Sk Safin', role: 'Bowler', runs: 12, wickets: 9, age: 24, style: 'Right-Arm Fast' },
      { id: 'k-12', name: 'Sk Ansarul Aziz', role: 'Bowler', runs: 8, wickets: 6, age: 25, style: 'Left-Arm Spin' }
    ]
  })
];

export const initialMatches = [...session3Matches, ...session4Matches];

export const initialPointsTable = [
  { pos: 1, teamId: "rcn", team: "Royal Challengers Narua", short: "RCN", p: 7, w: 5, l: 2, nr: 0, nrr: "+1.240", pts: 10, form: ["W", "W", "L", "W", "W"], qualified: true, color: "#EF4444" },
  { pos: 2, teamId: "nsk", team: "Narua Super Kings", short: "NSK", p: 6, w: 4, l: 2, nr: 0, nrr: "+0.890", pts: 8, form: ["W", "W", "W", "L", "W"], qualified: true, color: "#F59E0B" },
  { pos: 3, teamId: "nw", team: "Narua Warriors", short: "NW", p: 6, w: 4, l: 2, nr: 0, nrr: "+0.510", pts: 8, form: ["W", "L", "W", "W", "L"], qualified: true, color: "#2563EB" },
  { pos: 4, teamId: "bct", team: "Bay Coastal Titans", short: "BCT", p: 7, w: 4, l: 3, nr: 0, nrr: "+0.220", pts: 8, form: ["L", "W", "L", "W", "W"], qualified: true, color: "#06B6D4" },
  { pos: 5, teamId: "nt", team: "Narua Tigers", short: "NT", p: 7, w: 3, l: 4, nr: 0, nrr: "-0.180", pts: 6, form: ["L", "L", "W", "L", "W"], qualified: false, color: "#F97316" },
  { pos: 6, teamId: "nkr", team: "Narua Knight Riders", short: "NKR", p: 6, w: 2, l: 4, nr: 0, nrr: "-0.640", pts: 4, form: ["L", "W", "L", "L", "L"], qualified: false, color: "#9333EA" },
  { pos: 7, teamId: "ds", team: "Delta Strikers", short: "DS", p: 6, w: 2, l: 4, nr: 0, nrr: "-0.810", pts: 4, form: ["W", "L", "L", "L", "W"], qualified: false, color: "#10B981" },
  { pos: 8, teamId: "np", team: "Narua Panthers", short: "NP", p: 7, w: 1, l: 6, nr: 0, nrr: "-1.210", pts: 2, form: ["L", "L", "L", "W", "L"], qualified: false, color: "#14B8A6" },
];

const buildSampleStandings = (season, teamCount) => {
  const seed = Number(season);
  const rows = initialPointsTable.slice(0, teamCount).map((team, index) => {
    const played = 5 + ((index * 2 + seed) % 4);
    const noResults = (index + seed) % 7 === 0 ? 1 : 0;
    const winOptions = Math.max(1, played - noResults);
    const wins = 1 + ((index * 3 + seed) % winOptions);
    const losses = played - wins - noResults;
    const points = wins * 2 + noResults;
    const netRunRate = ((teamCount - index) * 0.137 - (seed % 5) * 0.041).toFixed(3);
    const form = Array.from({ length: 5 }, (_, formIndex) =>
      (index + formIndex + seed) % 3 === 0 ? 'L' : 'W'
    );

    return {
      ...team,
      p: played,
      w: wins,
      l: losses,
      nr: noResults,
      nrr: Number(netRunRate) >= 0 ? `+${netRunRate}` : netRunRate,
      pts: points,
      form
    };
  });

  return rows
    .sort((left, right) => right.pts - left.pts || right.w - left.w || Number(right.nrr) - Number(left.nrr))
    .map((row, index) => ({ ...row, pos: index + 1 }));
};

export const initialSeasonStandings = Object.fromEntries(
  initialSeasons.map((season) => [
    season.edition,
    season.edition === initialSeasons[0].edition
      ? initialPointsTable
      : season.edition === 'Season 3' ? session3Standings
        : season.edition === 'Season 4' ? session4Standings : buildSampleStandings(season.season, season.teamsCount)
  ])
);

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
  { title: "Highest Team Total", holder: "Commando 11", value: "158/3", details: "10.0 Overs vs BMN Royals (Season 2)" },
  { title: "Fastest Fifty", holder: "Chiku Das (BMN Royals)", value: "14 Balls", details: "7 Sixes, 2 Fours vs Star Xi Sayedpur (2025)" },
  { title: "Highest Partnership", holder: "Kamar & Banty", value: "104 Runs", details: "1st Wicket for Commando 11 vs BMN Royals (2025)" },
  { title: "Most Sixes in an Inning", holder: "Chiku Das", value: "14 Sixes", details: "88 runs off 32 balls (Season 2)" },
  { title: "Best Bowling in NPL History", holder: "Abhishek Das", value: "5/14", details: "Ramchandrapur Fighter (Season 3)" },
  { title: "Most Tournament Titles", holder: "No Compromise Kaina", value: "2 Title ", details: "Session 2 and Session 3" },
  { title: "Most Catches by a Fielder", holder: "Rahul Das", value: "28 Catches", details: "Bajrangi 11 Narua (Across 2 seasons)" },
  ...session3Records,
  ...session4Records
];

export const initialGallery = [
  {
    id: "g1",
    category: "CHAMPIONS",
    title: "GCC Fighter Lifting the NPL Session 5 Trophy",
    caption: "Captain Amirull and team in euphoric celebrations after the Onesided Match.",
    image: "/assets/trophy.jpg",
    date: "Season 5 Final",
    season: "Season 5"
  },
  {
    id: "g2",
    category: "MATCH DAY",
    title: "Night Floodlit Spectacle at Narua Central",
    caption: "Packed stands under stadium beams during the high-voltage Friday night derby.",
    image: "/assets/stadium.jpg",
    date: "Season 3 League",
    season: "Season 3"
  },
  {
    id: "g3",
    category: "FINALS",
    title: "The Super Over Thriller Moment",
    caption: "Batsmen running the winning bye as fireworks erupt over the stadium.",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1000&q=80",
    date: "2025 Final",
    season: "Season 3"
  },
  {
    id: "g4",
    category: "AUCTION",
    title: "NPL Mega Auction Bidding War",
    caption: "Franchise owners raising paddles in fierce competition for the marquee all-rounder.",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80",
    date: "2025 Auction",
    season: "Season 3"
  },
  {
    id: "g5",
    category: "CELEBRATIONS",
    title: "Golden Confetti Shower",
    caption: "Trophy handover ceremony with league officials and guest dignitaries.",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80",
    date: "2024 Inaugural",
    season: "Season 1"
  },
  {
    id: "g6",
    category: "TEAMS",
    title: "Narua Super Kings Squad Huddle",
    caption: "Pre-match strategic talk before heading onto the pitch.",
    image: "https://images.unsplash.com/photo-1512719994953-eabf50895df7?auto=format&fit=crop&w=1000&q=80",
    date: "Match Day 8",
    season: "Season 2"
  },
  {
    id: "g7",
    category: "PLAYERS",
    title: "The Winning Six Follow-through",
    caption: "Unstoppable hitting into the VIP pavilion stands.",
    image: "https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=1000&q=80",
    date: "Season 3",
    season: "Season 3"
  },
  {
    id: "g8",
    category: "BEHIND THE SCENES",
    title: "Official Match Ball & Pitch Inspection",
    caption: "Lead umpires and pitch curators checking pitch moisture before toss.",
    image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=1000&q=80",
    date: "Pre-match Inspection",
    season: "Season 5"
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
    headline: "NPL Season 6 Mega Auction Date Announced: Record Registrations Expected",
    date: "Sep 25, 2026",
    season: "Season 5",
    readTime: "3 min read",
    image: "/assets/stadium.jpg",
    featured: true,
    snippet: "The Governing Council of Narua Premier League confirms October 18, 2026 as the date for the Season 3 Player Auction.",
    fullContent: `The Governing Council of Narua Premier League (NPL) has officially announced that the much-anticipated Player Auction for Season 3 will take place on October 18, 2026 at the Narua Grand Convention Center.\n\nWith player registration portal now open to local cricketers across Narua, Howrah, Hooghly, and neighboring districts, over 250 cricketers are projected to register for the 120 available auction slots across the 8 competing franchise teams.\n\n"This year we are introducing a minimum base price slab and transparent purse caps of ₹50 Lakhs per team to ensure balanced, thrilling competition," stated the NPL League Commissioner during the press briefing.`
  },
  {
    id: "n2",
    category: "MATCH REPORT",
    headline: "Soumya Das' Masterclass Propels BMN Royals to the Top of the Table",
    date: "jan 8, 2025",
    season: "Season 3",
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
    season: "Season 5",
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
    season: "Season 5",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80",
    featured: false,
    snippet: "A complete guide for aspiring cricketers on base prices, role categories, and digital pass verification.",
    fullContent: `Every registered cricketer will undergo verification by the NPL Technical Committee. Players will be assigned to Grade A, Grade B, or Grade C based on district tournaments, previous NPL stats, and trial performance.`
  }
];

export const initialAuctionRegistrations = [

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

export const localizeOfflineMedia = (value, key = '') => {
  if (Array.isArray(value)) {
    value.forEach((item) => localizeOfflineMedia(item, key));
    return value;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => {
      value[childKey] = localizeOfflineMedia(childValue, childKey);
    });
    return value;
  }

  if (typeof value !== 'string' || !value.startsWith('https://images.unsplash.com/')) return value;

  if (key === 'photo') return '/assets/bajrangi11_team.png';
  if (key === 'teamPhoto') return '/assets/bajrangi11_champions.png';
  return '/assets/stadium.jpg';
};

[
  initialChampions,
  initialTeams,
  initialSessionTeams,
  initialTopPerformers,
  initialGallery,
  initialHighlights,
  initialNews
].forEach((data) => localizeOfflineMedia(data));
