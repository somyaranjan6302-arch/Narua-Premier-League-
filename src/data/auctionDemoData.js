import { DEFAULT_AUCTION_PURSE_CAP } from './nplData';

export const auctionDemoSeason = {
  season: '2027',
  year: '2027',
  edition: 'Session 6',
  sampleData: true,
  status: 'AUCTION LIVE',
  teamsCount: 4,
  matchesCount: 0,
  champion: '',
  runnerUp: '',
  topScorer: '',
  topWicketTaker: '',
  playerOfTournament: '',
  description: 'A local-only sample session for previewing team creation and the player auction.'
};

export const auctionDemoTeams = [
  {
    id: 's6-coastal-comets',
    name: 'Coastal Comets',
    shortName: 'COM',
    primaryColor: '#0ea5e9',
    secondaryColor: '#082f49',
    captain: 'Demo Captain',
    owner: 'Demo Owner',
    home: 'Narua Ground',
    titles: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    slogan: 'Rise with the tide',
    sessions: ['Session 6'],
    squad: [
      { id: 's6-p-101', name: 'Aarav Sen', role: 'Batsman', runs: 0, wickets: 0, age: 24, style: 'Right-hand bat' }
    ]
  },
  {
    id: 's6-narua-nightriders',
    name: 'Narua Night Riders',
    shortName: 'NNR',
    primaryColor: '#a855f7',
    secondaryColor: '#2e1065',
    captain: 'Demo Captain',
    owner: 'Demo Owner',
    home: 'Narua Ground',
    titles: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    slogan: 'Own the night',
    sessions: ['Session 6'],
    squad: [
      { id: 's6-p-103', name: 'Ritwik Das', role: 'Bowler', runs: 0, wickets: 0, age: 25, style: 'Right-arm fast' }
    ]
  },
  {
    id: 's6-jajpur-jaguars',
    name: 'Jajpur Jaguars',
    shortName: 'JJ',
    primaryColor: '#f97316',
    secondaryColor: '#431407',
    captain: 'Demo Captain',
    owner: 'Demo Owner',
    home: 'Jajpur Ground',
    titles: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    slogan: 'Strike with pride',
    sessions: ['Session 6'],
    squad: [
      { id: 's6-p-104', name: 'Neel Mukherjee', role: 'Wicketkeeper', runs: 0, wickets: 0, age: 23, style: 'Right-hand bat / Wicketkeeper' }
    ]
  },
  {
    id: 's6-baitarani-blazers',
    name: 'Baitarani Blazers',
    shortName: 'BB',
    primaryColor: '#22c55e',
    secondaryColor: '#052e16',
    captain: 'Demo Captain',
    owner: 'Demo Owner',
    home: 'Baitarani Ground',
    titles: 0,
    matches: 0,
    wins: 0,
    losses: 0,
    winPercentage: 0,
    slogan: 'Light up the league',
    sessions: ['Session 6'],
    squad: [
      { id: 's6-p-105', name: 'Kabir Pradhan', role: 'All-Rounder', runs: 0, wickets: 0, age: 26, style: 'Left-hand bat / Left-arm spin' }
    ]
  }
];

export const auctionDemoPlayers = [
  {
    id: 's6-reg-101',
    registrationId: 'NPL-S6-101',
    fullName: 'Aarav Sen',
    name: 'Aarav Sen',
    role: 'Batsman',
    age: 24,
    location: 'Narua',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'AUCTIONED',
    teamId: 's6-coastal-comets'
  },
  {
    id: 's6-reg-102',
    registrationId: 'NPL-S6-102',
    fullName: 'Ritwik Das',
    name: 'Ritwik Das',
    role: 'Bowler',
    age: 25,
    location: 'Jajpur',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'AUCTIONED',
    teamId: 's6-narua-nightriders'
  },
  {
    id: 's6-reg-103',
    registrationId: 'NPL-S6-103',
    fullName: 'Neel Mukherjee',
    name: 'Neel Mukherjee',
    role: 'Wicketkeeper',
    age: 23,
    location: 'Narua',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'AUCTIONED',
    teamId: 's6-jajpur-jaguars'
  },
  {
    id: 's6-reg-104',
    registrationId: 'NPL-S6-104',
    fullName: 'Kabir Pradhan',
    name: 'Kabir Pradhan',
    role: 'All-Rounder',
    age: 26,
    location: 'Baitarani',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'AUCTIONED',
    teamId: 's6-baitarani-blazers'
  },
  {
    id: 's6-reg-105',
    registrationId: 'NPL-S6-105',
    fullName: 'Ishan Roy',
    name: 'Ishan Roy',
    role: 'All-Rounder',
    battingStyle: 'Right Hand Bat',
    bowlingStyle: 'Right Arm Medium',
    age: 22,
    location: 'Narua',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'VERIFIED'
  },
  {
    id: 's6-reg-106',
    registrationId: 'NPL-S6-106',
    fullName: 'Dev Mallick',
    name: 'Dev Mallick',
    role: 'Batsman',
    age: 21,
    location: 'Jajpur',
    basePrice: '₹100',
    season: 'Session 6',
    status: 'VERIFIED'
  }
];

export const auctionDemoLiveState = {
  status: 'live',
  purseCap: DEFAULT_AUCTION_PURSE_CAP,
  currentPlayer: auctionDemoPlayers[4],
  currentBid: 125000,
  currentBiddingTeam: 's6-coastal-comets',
  bidHistory: [
    { team: 'Narua Night Riders', amount: 30000, time: '10:42 AM' },
    { team: 'Coastal Comets', amount: 50000, time: '10:43 AM' },
    { team: 'Jajpur Jaguars', amount: 75000, time: '10:43 AM' },
    { team: 'Coastal Comets', amount: 100000, time: '10:44 AM' },
    { team: 'Coastal Comets', amount: 125000, time: '10:44 AM' }
  ],
  soldPlayers: [
    { playerName: 'Aarav Sen', role: 'Batsman', basePrice: '₹100', soldPrice: '₹1,10,000', team: 'Coastal Comets', teamShort: 'COM' },
    { playerName: 'Ritwik Das', role: 'Bowler', basePrice: '₹100', soldPrice: '₹85,000', team: 'Narua Night Riders', teamShort: 'NNR' },
    { playerName: 'Neel Mukherjee', role: 'Wicketkeeper', basePrice: '₹100', soldPrice: '₹65,000', team: 'Jajpur Jaguars', teamShort: 'JJ' },
    { playerName: 'Kabir Pradhan', role: 'All-Rounder', basePrice: '₹100', soldPrice: '₹1,40,000', team: 'Baitarani Blazers', teamShort: 'BB' }
  ],
  unsoldPlayers: [
    { playerName: 'Sayan Patra', role: 'Bowler', basePrice: '₹100' }
  ],
  teamPurses: {
    's6-coastal-comets': 4890000,
    's6-narua-nightriders': 4915000,
    's6-jajpur-jaguars': 4935000,
    's6-baitarani-blazers': 4860000
  },
  updatedAt: 'demo-session-6'
};
