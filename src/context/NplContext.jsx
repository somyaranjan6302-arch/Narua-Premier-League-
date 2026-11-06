import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  initialTournamentInfo,
  initialChampions,
  initialSeasons,
  initialTeams,
  initialSessionTeams,
  initialMatches,
  initialPointsTable,
  initialSeasonStandings,
  initialTopPerformers,
  initialRecords,
  initialGallery,
  initialHighlights,
  initialNews,
  initialAuctionRegistrations,
  initialAuctionLiveState,
  DEFAULT_AUCTION_PURSE_CAP,
  localizeOfflineMedia
} from '../data/nplData';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import {
  auctionDemoLiveState,
  auctionDemoPlayers,
  auctionDemoSeason,
  auctionDemoTeams
} from '../data/auctionDemoData';

const NplContext = createContext();
const isAuctionDemo = import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('demoAuction') === '1';

const attachDefaultSeason = (items, defaultSeason) => (
  Array.isArray(items)
    ? items.map((item) => item.season || item.session ? item : { ...item, season: defaultSeason })
    : items
);

const savePublicSiteData = (saveQueue, data) => {
  if (isAuctionDemo || !import.meta.env.PROD) return Promise.resolve();

  saveQueue.current = saveQueue.current
    .catch(() => {})
    .then(async () => {
      const response = await fetch('/api/admin/site-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Could not save shared NPL content.');
      }
    });
  return saveQueue.current;
};

export const NplProvider = ({ children }) => {
  // Helper for localStorage
  const loadState = (key, fallback) => {
    if (isAuctionDemo) return fallback;
    try {
      const saved = localStorage.getItem(`npl_${key}`);
      return saved ? localizeOfflineMedia(JSON.parse(saved)) : fallback;
    } catch {
      return fallback;
    }
  };

  const initialSelectedSeason = isAuctionDemo
    ? auctionDemoSeason.edition
    : initialSeasons[0]?.edition || 'Season 5';

  const [tournamentInfo, setTournamentInfo] = useState(() => loadState('tournamentInfo', isAuctionDemo
    ? { ...initialTournamentInfo, currentSeason: 'Session 6 (2027)', totalTeams: auctionDemoTeams.length, totalSeasons: 6 }
    : initialTournamentInfo));
  const [champions, setChampions] = useState(() => {
    const savedChampions = loadState('champions', null);
    if (!Array.isArray(savedChampions)) return initialChampions;
    return savedChampions;
  });
  const [seasons, setSeasons] = useState(() => {
    if (isAuctionDemo) return [auctionDemoSeason, ...initialSeasons];
    const savedSeasons = loadState('seasons', initialSeasons);
    return Array.isArray(savedSeasons) ? savedSeasons : initialSeasons;
  });
  const [teams, setTeams] = useState(() => {
    if (isAuctionDemo) return auctionDemoTeams;
    const savedTeams = loadState('teams', null);
    const teamDataVersion = loadState('teamDataVersion', 0);
    const legacyTeamIds = new Set(initialTeams.map((team) => team.id));
    const isOldUnassignedSeed = Array.isArray(savedTeams) && savedTeams.length > 0 && savedTeams.every((team) => (
      legacyTeamIds.has(team.id) &&
      !Array.isArray(team.sessions) &&
      !Array.isArray(team.seasons) &&
      !team.session
    ));

    if (teamDataVersion < 3 && isOldUnassignedSeed) return initialSessionTeams;
    if (teamDataVersion >= 2 && Array.isArray(savedTeams)) return savedTeams;
    return initialSessionTeams;
  });
  const [matches, setMatches] = useState(() => isAuctionDemo
    ? []
    : attachDefaultSeason(loadState('matches', initialMatches), initialSelectedSeason));
  const [pointsTable, setPointsTable] = useState(() => loadState('pointsTable', initialPointsTable));
  const [seasonStandings, setSeasonStandings] = useState(() => {
    if (isAuctionDemo) return { [auctionDemoSeason.edition]: [] };
    const savedStandings = loadState('seasonStandings', initialSeasonStandings);
    const savedPointsTable = loadState('pointsTable', initialPointsTable);
    const standingsVersion = loadState('seasonStandingsVersion', 0);
    const latestEdition = initialSeasons[0]?.edition;
    const duplicateYearEdition = initialSeasons.find((season, index) => (
      index > 0 && season.season === initialSeasons[0]?.season
    ))?.edition;
    const latestSavedStandings = savedStandings[latestEdition] || savedStandings[initialSeasons[0]?.season] || savedPointsTable;
    const duplicateStandingsWereShared = standingsVersion < 2 &&
      duplicateYearEdition &&
      JSON.stringify(savedStandings[duplicateYearEdition]) === JSON.stringify(latestSavedStandings);

    return Object.fromEntries(initialSeasons.map((season) => [
      season.edition,
      season.edition === duplicateYearEdition && duplicateStandingsWereShared
        ? initialSeasonStandings[season.edition]
        : savedStandings[season.edition] || (season.edition === latestEdition
          ? savedStandings[season.season] || savedPointsTable
          : initialSeasonStandings[season.edition])
    ]));
  });
  const [selectedSeason, setSelectedSeason] = useState(() => initialSelectedSeason);
  const [topPerformers, setTopPerformers] = useState(() => loadState('topPerformers', initialTopPerformers));
  const [records, setRecords] = useState(() => loadState('records', initialRecords));
  const [gallery, setGallery] = useState(() => {
    const savedGallery = loadState('gallery', null);
    if (!Array.isArray(savedGallery)) return attachDefaultSeason(initialGallery, initialSelectedSeason);
    return attachDefaultSeason(savedGallery, initialSelectedSeason);
  });
  const [sectionPhotos, setSectionPhotos] = useState(() => {
    const savedSectionPhotos = loadState('sectionPhotos', []);
    return Array.isArray(savedSectionPhotos) ? savedSectionPhotos : [];
  });
  const [legacyPhotos, setLegacyPhotos] = useState(() => {
    const savedPhotos = loadState('legacyPhotos', []);
    return Array.isArray(savedPhotos) ? savedPhotos : [];
  });
  const [highlights, setHighlights] = useState(() => attachDefaultSeason(loadState('highlights', initialHighlights), initialSelectedSeason));
  const [news, setNews] = useState(() => {
    const savedNews = loadState('news', null);
    if (!Array.isArray(savedNews)) return attachDefaultSeason(initialNews, initialSelectedSeason);
    return attachDefaultSeason(savedNews, initialSelectedSeason);
  });
  const [auctionRegistrations, setAuctionRegistrations] = useState(() => isAuctionDemo
    ? auctionDemoPlayers
    : attachDefaultSeason(loadState('auctionRegistrations', initialAuctionRegistrations), initialSelectedSeason));
  const [auctionLiveStates, setAuctionLiveStates] = useState(() => {
    if (isAuctionDemo) return { [auctionDemoSeason.edition]: auctionDemoLiveState };
    const savedBySeason = loadState('auctionLiveStates', {});
    const legacyState = loadState('auctionLiveState', initialAuctionLiveState);
    return {
      ...Object.fromEntries(Object.entries(savedBySeason).map(([season, state]) => [
        season,
        state?.status ? state : initialAuctionLiveState
      ])),
      [initialSelectedSeason]: savedBySeason[initialSelectedSeason] || (
        legacyState.status ? legacyState : initialAuctionLiveState
      )
    };
  });
  const auctionLiveState = auctionLiveStates[selectedSeason] || initialAuctionLiveState;
  const [auctionSyncStatus, setAuctionSyncStatus] = useState(isAuctionDemo ? 'online' : 'connecting');
  const [siteMedia, setSiteMedia] = useState({});
  const [siteDataLoaded, setSiteDataLoaded] = useState(isAuctionDemo);
  const [registrationDataLoaded, setRegistrationDataLoaded] = useState(isAuctionDemo);
  const siteDataSaveQueue = useRef(Promise.resolve());
  const registrationSaveQueue = useRef(Promise.resolve());

  // Authentication is verified by the server; never trust persisted browser state.
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(!isAuctionDemo);
  const isAdminLoggedIn = Boolean(adminUser);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Universal Modal Controller
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.removeItem('npl_admin_auth');
    fetch('/api/admin/session')
      .then(async (response) => response.ok ? response.json() : null)
      .then((session) => setAdminUser(session?.user ?? null))
      .catch(() => setAdminUser(null))
      .finally(() => setIsAdminAuthLoading(false));
  }, []);

  useEffect(() => {
    fetch('/api/site-media')
      .then((response) => response.ok ? response.json() : {})
      .then((media) => setSiteMedia(localizeOfflineMedia(media)))
      .catch(() => setSiteMedia({}));
  }, []);

  useEffect(() => {
    if (isAuctionDemo) return;
    fetch('/api/site-data')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data || typeof data !== 'object') return;
        if (data.tournamentInfo) setTournamentInfo(data.tournamentInfo);
        if (Array.isArray(data.champions)) setChampions(data.champions);
        if (Array.isArray(data.seasons)) setSeasons(data.seasons);
        if (Array.isArray(data.teams)) setTeams(data.teams);
        if (Array.isArray(data.matches)) setMatches(data.matches);
        if (Array.isArray(data.pointsTable)) setPointsTable(data.pointsTable);
        if (data.seasonStandings) setSeasonStandings(data.seasonStandings);
        if (Array.isArray(data.topPerformers) || (data.topPerformers && typeof data.topPerformers === 'object')) {
          setTopPerformers(data.topPerformers);
        }
        if (Array.isArray(data.records)) setRecords(data.records);
        if (Array.isArray(data.gallery)) setGallery(data.gallery);
        if (Array.isArray(data.sectionPhotos)) setSectionPhotos(data.sectionPhotos);
        if (Array.isArray(data.legacyPhotos)) setLegacyPhotos(data.legacyPhotos);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (Array.isArray(data.news)) setNews(data.news);
      })
      .catch((error) => console.error('Could not load shared NPL content:', error))
      .finally(() => setSiteDataLoaded(true));
  }, []);

  useEffect(() => {
    if (isAuctionDemo) return;
    fetch('/api/matches')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.matches && data.matches.length > 0) {
          const backendMatches = data.matches.map((bm) => ({
            id: bm.id,
            season: bm.season,
            matchNumber: bm.matchNumber,
            tournamentPhase: bm.tournamentPhase,
            date: bm.matchDate,
            time: bm.matchTime,
            venue: bm.venue,
            status: bm.status,
            result: bm.result,
            winnerTeamId: bm.winnerTeamId,
            oversLimit: bm.oversLimit,
            team1: { id: bm.teamAId, name: bm.teamAName, shortName: bm.teamAShort, score: '0/0', overs: '0' },
            team2: { id: bm.teamBId, name: bm.teamBName, shortName: bm.teamBShort, score: '0/0', overs: '0' }
          }));

          setMatches((prev) => {
            const backendIds = new Set(backendMatches.map((m) => m.id));
            const existing = prev.filter((m) => !backendIds.has(m.id));
            return [...backendMatches, ...existing];
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuctionDemo) return;
    let active = true;
    let socket = null;
    let reconnectTimeout = null;
    let pollInterval = null;
    let reconnectDelay = 1000;

    const applyAuctionState = (state) => {
      const nextState = state || initialAuctionLiveState;
      setAuctionLiveStates((previous) => {
        const current = previous[selectedSeason];
        if (current && Number.isSafeInteger(current.version) && Number.isSafeInteger(nextState.version)) {
          if (current.version >= nextState.version) return previous;
        } else if (current?.updatedAt && nextState.updatedAt &&
          current.updatedAt >= nextState.updatedAt) {
          return previous;
        }
        return { ...previous, [selectedSeason]: nextState };
      });
    };

    const refreshAuction = async () => {
      try {
        const response = await fetch(`/api/auction/live?season=${encodeURIComponent(selectedSeason)}`, {
          cache: 'no-store'
        });
        if (!response.ok) throw new Error('Could not connect to live auction updates.');
        const result = await response.json();
        if (!active) return;
        applyAuctionState(result.state);
      } catch (error) {
        if (!active) return;
        console.error('Could not refresh live auction state:', error);
      }
    };

    const setPollingInterval = (delay) => {
      if (pollInterval) window.clearInterval(pollInterval);
      pollInterval = window.setInterval(refreshAuction, delay);
    };
    const connect = () => {
      if (!active) return;
      const socketUrl = new URL('/api/auction/live/ws', window.location.href);
      socketUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      socketUrl.searchParams.set('season', selectedSeason);
      socket = new WebSocket(socketUrl);
      socket.addEventListener('open', () => {
        if (!active) return;
        reconnectDelay = 1000;
        setAuctionSyncStatus('online');
        setPollingInterval(30000);
      });
      socket.addEventListener('message', (event) => {
        if (!active) return;
        try {
          const message = JSON.parse(event.data);
          if (message.type !== 'auction-state' || message.season !== selectedSeason) return;
          applyAuctionState(message.state);
          setAuctionSyncStatus('online');
        } catch (error) {
          console.error('Could not read live auction WebSocket update:', error);
        }
      });
      socket.addEventListener('error', () => {
        if (active) setAuctionSyncStatus('offline');
      });
      socket.addEventListener('close', () => {
        if (!active) return;
        setAuctionSyncStatus('offline');
        setPollingInterval(2000);
        reconnectTimeout = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      });
    };

    refreshAuction();
    setPollingInterval(2000);
    connect();
    return () => {
      active = false;
      if (pollInterval) window.clearInterval(pollInterval);
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
      socket?.close();
    };
  }, [selectedSeason]);

  useEffect(() => {
    if (isAuctionDemo) return;
    if (!adminUser) {
      setRegistrationDataLoaded(false);
      return;
    }

    let active = true;
    fetch('/api/admin/registrations')
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (active && Array.isArray(result?.registrations)) {
          setAuctionRegistrations(result.registrations);
        }
      })
      .catch((error) => console.error('Could not load private NPL registrations:', error))
      .finally(() => {
        if (active) setRegistrationDataLoaded(true);
      });

    return () => { active = false; };
  }, [adminUser]);

  // Sync to local storage
  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_tournamentInfo', JSON.stringify(tournamentInfo));
  }, [tournamentInfo]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_champions', JSON.stringify(champions));
  }, [champions]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_seasons', JSON.stringify(seasons));
  }, [seasons]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_teamDataVersion', '3');
  }, []);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_pointsTable', JSON.stringify(pointsTable));
  }, [pointsTable]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_seasonStandings', JSON.stringify(seasonStandings));
  }, [seasonStandings]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_seasonStandingsVersion', '2');
  }, []);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_topPerformers', JSON.stringify(topPerformers));
  }, [topPerformers]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_highlights', JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_auctionRegistrations', JSON.stringify(auctionRegistrations));
  }, [auctionRegistrations]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_auctionLiveStates', JSON.stringify(auctionLiveStates));
  }, [auctionLiveStates]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_sectionPhotos', JSON.stringify(sectionPhotos));
  }, [sectionPhotos]);

  useEffect(() => {
    if (isAuctionDemo) return;
    localStorage.setItem('npl_legacyPhotos', JSON.stringify(legacyPhotos));
  }, [legacyPhotos]);

  const publicSiteData = {
    tournamentInfo,
    champions,
    seasons,
    teams,
    matches,
    pointsTable,
    seasonStandings,
    topPerformers,
    records,
    gallery,
    sectionPhotos,
    legacyPhotos,
    highlights,
    news,
  };

  const persistPublicSiteData = (overrides = {}) => {
    return savePublicSiteData(siteDataSaveQueue, { ...publicSiteData, ...overrides });
  };

  useEffect(() => {
    if (isAuctionDemo || !import.meta.env.PROD || !adminUser || !siteDataLoaded) return;
    savePublicSiteData(siteDataSaveQueue, publicSiteData)
      .catch((error) => console.error(error));
  }, [adminUser, siteDataLoaded, tournamentInfo, champions, seasons, teams, matches, pointsTable,
    seasonStandings, topPerformers, records, gallery, sectionPhotos, legacyPhotos, highlights, news]);

  useEffect(() => {
    if (isAuctionDemo || !import.meta.env.PROD || !adminUser || !registrationDataLoaded) return;
    registrationSaveQueue.current = registrationSaveQueue.current
      .catch(() => {})
      .then(() => fetch('/api/admin/registrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrations: auctionRegistrations })
      }))
      .then((response) => {
        if (!response.ok) throw new Error('Could not save private player registrations.');
      })
      .catch((error) => console.error(error));
  }, [adminUser, registrationDataLoaded, auctionRegistrations]);

  // Toast notification
  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openModal = (type, data = null) => {
    setActiveModal({ type, data });
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveModal({ type: null, data: null });
    document.body.style.overflow = 'auto';
  };

  const syncScoredMatch = useCallback((scoredMatch, scorecard = null) => {
    if (!scoredMatch?.id) return;
    const innings = scorecard?.innings || [];
    const scoreForTeam = (teamId) => {
      const inningsScore = innings.find((entry) => entry.teamId === teamId);
      if (!inningsScore) return null;
      return {
        score: `${inningsScore.totalRuns || 0}/${inningsScore.wickets || 0}`,
        overs: inningsScore.overs || '0.0'
      };
    };

    setMatches((previousMatches) => {
      const previousMatch = previousMatches.find((match) => match.id === scoredMatch.id);
      const teamAId = scoredMatch.teamAId || scoredMatch.team1Id;
      const teamBId = scoredMatch.teamBId || scoredMatch.team2Id;
      const teamA = teams.find((team) => team.id === teamAId);
      const teamB = teams.find((team) => team.id === teamBId);
      const teamAScore = scoreForTeam(teamAId);
      const teamBScore = scoreForTeam(teamBId);
      const publicMatch = {
        ...previousMatch,
        id: scoredMatch.id,
        season: scoredMatch.season || scoredMatch.session || previousMatch?.season || selectedSeason,
        matchNumber: scoredMatch.matchNumber || previousMatch?.matchNumber || 'Match',
        tournamentPhase: scoredMatch.tournamentPhase || previousMatch?.tournamentPhase || 'LEAGUE MATCH',
        date: scoredMatch.matchDate || scoredMatch.date || previousMatch?.date || '',
        time: scoredMatch.matchTime || scoredMatch.time || previousMatch?.time || '',
        venue: scoredMatch.venue || scoredMatch.ground || previousMatch?.venue || '',
        status: scoredMatch.status === 'COMPLETED' ? 'COMPLETED'
          : scoredMatch.status === 'UPCOMING' ? 'UPCOMING' : 'LIVE',
        result: scoredMatch.result || previousMatch?.result || '',
        winnerTeamId: scoredMatch.winnerTeamId || previousMatch?.winnerTeamId || null,
        playerOfMatch: scoredMatch.playerOfMatch || previousMatch?.playerOfMatch || null,
        team1: {
          ...previousMatch?.team1,
          id: teamAId,
          name: scoredMatch.teamAName || teamA?.name || previousMatch?.team1?.name || 'Team A',
          shortName: scoredMatch.teamAShort || teamA?.shortName || previousMatch?.team1?.shortName || 'TMA',
          primaryColor: teamA?.primaryColor || previousMatch?.team1?.primaryColor,
          secondaryColor: teamA?.secondaryColor || previousMatch?.team1?.secondaryColor,
          ...(teamAScore || (!previousMatch ? { score: '0/0', overs: '0.0' } : {}))
        },
        team2: {
          ...previousMatch?.team2,
          id: teamBId,
          name: scoredMatch.teamBName || teamB?.name || previousMatch?.team2?.name || 'Team B',
          shortName: scoredMatch.teamBShort || teamB?.shortName || previousMatch?.team2?.shortName || 'TMB',
          primaryColor: teamB?.primaryColor || previousMatch?.team2?.primaryColor,
          secondaryColor: teamB?.secondaryColor || previousMatch?.team2?.secondaryColor,
          ...(teamBScore || (!previousMatch ? { score: '0/0', overs: '0.0' } : {}))
        }
      };

      if (previousMatch && Object.keys(publicMatch).every((key) => (
        JSON.stringify(previousMatch[key]) === JSON.stringify(publicMatch[key])
      ))) return previousMatches;

      return previousMatch
        ? previousMatches.map((match) => match.id === scoredMatch.id ? publicMatch : match)
        : [publicMatch, ...previousMatches];
    });
  }, [selectedSeason, teams]);

  const refreshSiteMedia = async () => {
    const response = await fetch('/api/site-media');
    if (!response.ok) throw new Error('Could not refresh site images.');
    setSiteMedia(localizeOfflineMedia(await response.json()));
  };

  // Auction Registration submission
  const registerPlayerForAuction = (formData) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const regId = `NPL26-${randomNum}`;
    const newPlayer = {
      id: `reg-${Date.now()}`,
      registrationId: regId,
      ...formData,
      basePrice: formData.basePrice || '₹100',
      season: selectedSeason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      photo: formData.photo || ''
    };

    setAuctionRegistrations(prev => [newPlayer, ...prev]);
    if (import.meta.env.PROD && !isAuctionDemo) {
      fetch('/api/auction-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayer)
      }).then((response) => {
        if (!response.ok) throw new Error('Could not securely save your registration. Please contact the NPL team.');
      }).catch((error) => showToast(error.message, 'error'));
    }
    showToast(`Registration Successful! Assigned ID: ${regId}`, 'success');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    sound.playCheer();
    return newPlayer;
  };

  const addDemoAuctionPlayers = (season = selectedSeason) => {
    if (!import.meta.env.DEV || isAuctionDemo || !adminUser) {
      throw new Error('Demo auction players can only be added by an administrator in local development.');
    }

    const seasonCode = season.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    const demoPlayers = [
      { suffix: '001', fullName: 'Demo Player One', role: 'Batsman', age: 22, basePrice: '₹100' },
      { suffix: '002', fullName: 'Demo Player Two', role: 'Bowler', age: 24, basePrice: '₹100' },
      { suffix: '003', fullName: 'Demo Player Three', role: 'All-Rounder', age: 23, basePrice: '₹100' }
    ].map(({ suffix, ...player }) => ({
      ...player,
      id: `demo-auction-${seasonCode}-${suffix}`,
      registrationId: `DEMO-${seasonCode}-${suffix}`,
      name: player.fullName,
      location: 'NPL Demo',
      season,
      status: 'VERIFIED',
      isDemo: true
    }));
    const existingIds = new Set(auctionRegistrations.map((player) => player.id));
    const newPlayers = demoPlayers.filter((player) => !existingIds.has(player.id));

    if (newPlayers.length === 0) {
      showToast(`Demo players already exist for ${season}.`);
      return;
    }

    setAuctionRegistrations((previous) => [
      ...newPlayers.filter((player) => !previous.some((existing) => existing.id === player.id)),
      ...previous
    ]);
    showToast(`Added ${newPlayers.length} fictional demo players to ${season}.`);
  };

  // Update Registration Status
  const updateRegistrationStatus = (id, newStatus, extra = {}) => {
    setAuctionRegistrations(prev =>
      prev.map(item => item.id === id ? { ...item, status: newStatus, ...extra } : item)
    );
    showToast(`Player status updated to ${newStatus}`);
  };

  const updateAuctionPlayerBasePrice = (id, basePrice) => {
    if (!Number.isSafeInteger(basePrice) || basePrice <= 0) {
      throw new Error('Player base price must be a whole number greater than zero.');
    }

    setAuctionRegistrations((previous) => previous.map((player) => (
      player.id === id
        ? { ...player, basePrice: `₹${basePrice.toLocaleString('en-IN')}` }
        : player
    )));
    showToast('Player base price updated.');
  };

  const updateAuctionLiveState = async (season, updater) => {
    if (isAuctionDemo) throw new Error('The Session 6 demo is read-only and cannot update the real auction.');
    if (!adminUser) throw new Error('Sign in as an administrator to control the live auction.');
    const previousState = auctionLiveStates[season] || initialAuctionLiveState;
    const nextState = typeof updater === 'function' ? updater(previousState) : updater;
    const response = await fetch('/api/admin/auction/live', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        season,
        state: nextState,
        expectedUpdatedAt: previousState.updatedAt || null
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok && result.state) {
      setAuctionLiveStates((previous) => ({ ...previous, [season]: result.state }));
    }
    if (!response.ok) throw new Error(result.error || 'Could not update the live auction.');
    setAuctionLiveStates((previous) => ({ ...previous, [season]: result.state }));
    return result.state;
  };

  const callLiveAuctionPlayer = async (player, season = selectedSeason) => {
    if (!player || player.season !== season || ['AUCTIONED', 'REJECTED'].includes(player.status)) {
      throw new Error('Choose an eligible player from this auction session.');
    }
    const basePrice = Number(String(player.basePrice || '').replace(/[^\d]/g, '')) || 100;
    const publicPlayer = Object.fromEntries(
      ['id', 'registrationId', 'fullName', 'name', 'role', 'photo', 'basePrice']
        .filter((key) => typeof player[key] === 'string')
        .map((key) => [key, player[key]])
    );
    publicPlayer.basePrice = `₹${basePrice.toLocaleString('en-IN')}`;
    const seasonTeams = teams.filter((team) => {
      const sessions = Array.isArray(team.sessions) ? team.sessions
        : Array.isArray(team.seasons) ? team.seasons
          : team.session ? [team.session] : [season];
      return sessions.includes(season);
    });
    return updateAuctionLiveState(season, (previous) => ({
      ...previous,
      currentPlayer: publicPlayer,
      currentBid: basePrice,
      currentBiddingTeam: null,
      bidHistory: [],
      teamPurses: {
        ...Object.fromEntries(seasonTeams.map((team) => [team.id, previous.purseCap ?? DEFAULT_AUCTION_PURSE_CAP])),
        ...previous.teamPurses
      }
    }));
  };

  const setLiveAuctionPurseCap = async (purseCap, season = selectedSeason) => {
    if (!Number.isSafeInteger(purseCap) || purseCap <= 0) {
      throw new Error('Enter a purse cap greater than zero rupees.');
    }

    return updateAuctionLiveState(season, (previous) => {
      const currentCap = previous.purseCap ?? DEFAULT_AUCTION_PURSE_CAP;
      const seasonTeams = teams.filter((team) => {
        const sessions = Array.isArray(team.sessions) ? team.sessions
          : Array.isArray(team.seasons) ? team.seasons
            : team.session ? [team.session] : [season];
        return sessions.includes(season);
      });
      const teamPurses = Object.fromEntries(seasonTeams.map((team) => {
        const remaining = previous.teamPurses?.[team.id] ?? currentCap;
        const spent = Math.max(0, currentCap - remaining);
        if (spent > purseCap) {
          throw new Error(`${team.name} has already spent more than the new purse cap.`);
        }
        return [team.id, purseCap - spent];
      }));

      if (previous.currentPlayer && purseCap < previous.currentBid) {
        throw new Error('The new cap cannot be lower than the current player’s bid.');
      }
      if (previous.currentBiddingTeam && previous.currentPlayer &&
        teamPurses[previous.currentBiddingTeam] < previous.currentBid) {
        throw new Error('The new cap cannot be lower than a franchise’s spending plus its current bid.');
      }

      return { ...previous, purseCap, teamPurses };
    });
  };

  const setLiveAuctionStatus = async (status, season = selectedSeason) => {
    if (!['live', 'paused', 'completed', 'waiting'].includes(status)) {
      throw new Error('Choose a valid auction status.');
    }
    return updateAuctionLiveState(season, (previous) => {
      if (status === 'live' && !previous.currentPlayer) {
        throw new Error('Call a player to the auction stage before going live.');
      }
      return { ...previous, status };
    });
  };

  const placeLiveBid = async (teamId, amount, season = selectedSeason) => {
    const team = teams.find((candidate) => candidate.id === teamId);
    if (!team) throw new Error('Choose a valid franchise.');
    const teamSessions = Array.isArray(team.sessions) ? team.sessions
      : Array.isArray(team.seasons) ? team.seasons
        : team.session ? [team.session] : [season];
    if (!teamSessions.includes(season)) throw new Error('Choose a franchise assigned to this auction season.');
    await updateAuctionLiveState(season, (previous) => {
      if (previous.status !== 'live' || !previous.currentPlayer) throw new Error('The auction is not accepting bids right now.');
      const purse = previous.teamPurses?.[teamId] ?? previous.purseCap ?? DEFAULT_AUCTION_PURSE_CAP;
      if (!Number.isSafeInteger(amount) || amount <= previous.currentBid) throw new Error('Each bid must be higher than the current bid.');
      if (amount > purse) throw new Error(`${team.name} does not have enough purse remaining.`);
      return {
        ...previous,
        currentBid: amount,
        currentBiddingTeam: teamId,
        bidHistory: [
          { team: team.name, amount, time: new Date().toLocaleTimeString() },
          ...(previous.bidHistory || []).slice(0, 19)
        ]
      };
    });
    sound.playBidBeep();
  };

  const sellLivePlayer = async (player, winningTeamId, finalAmount, season = selectedSeason) => {
    const winningTeam = teams.find((candidate) => candidate.id === winningTeamId);
    if (!winningTeam) throw new Error('The winning franchise could not be found.');
    const teamSessions = Array.isArray(winningTeam.sessions) ? winningTeam.sessions
      : Array.isArray(winningTeam.seasons) ? winningTeam.seasons
        : winningTeam.session ? [winningTeam.session] : [season];
    if (!teamSessions.includes(season)) throw new Error('The winning franchise is not assigned to this auction season.');
    await updateAuctionLiveState(season, (previous) => {
      if (previous.status !== 'live' || previous.currentPlayer?.id !== player?.id ||
        previous.currentBiddingTeam !== winningTeamId || previous.currentBid !== finalAmount) {
        throw new Error('The live bid has changed. Refresh the auction before selling this player.');
      }
      const currentPurse = previous.teamPurses?.[winningTeamId] ?? previous.purseCap ?? DEFAULT_AUCTION_PURSE_CAP;
      if (finalAmount > currentPurse) throw new Error('The winning franchise does not have enough purse remaining.');
      const formattedPrice = `₹${finalAmount.toLocaleString('en-IN')}`;
      return {
        ...previous,
        currentPlayer: null,
        currentBid: 0,
        currentBiddingTeam: null,
        bidHistory: [],
        soldPlayers: [{
          playerId: player.id,
          playerName: player.fullName || player.name,
          role: player.role || 'Player',
          basePrice: player.basePrice || '₹100',
          soldPrice: formattedPrice,
          team: winningTeam.name,
          teamShort: winningTeam.shortName,
          teamColor: winningTeam.primaryColor
        }, ...(previous.soldPlayers || [])],
        teamPurses: {
          ...previous.teamPurses,
          [winningTeamId]: currentPurse - finalAmount
        }
      };
    });

    updateRegistrationStatus(player.id, 'AUCTIONED', {
      soldTo: winningTeam.name,
      soldToTeamId: winningTeam.id,
      soldPrice: `₹${finalAmount.toLocaleString('en-IN')}`
    });
    setTeams((previousTeams) => previousTeams.map((team) => {
      if (team.id !== winningTeam.id) return team;
      const squad = Array.isArray(team.squad) ? team.squad : [];
      if (squad.some((member) => member.id === player.id)) return team;
      return {
        ...team,
        squad: [...squad, {
          id: player.id,
          registrationId: player.registrationId,
          name: player.fullName || player.name,
          role: player.role || 'Player',
          photo: player.photo || '',
          battingStyle: player.battingStyle || '',
          bowlingStyle: player.bowlingStyle || '',
          soldPrice: `₹${finalAmount.toLocaleString('en-IN')}`,
          season,
          isPlayingXi: true,
          runs: 0,
          wickets: 0
        }]
      };
    }));
    sound.playGavel();
    sound.playCheer();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    showToast(`SOLD! ${player.fullName || player.name} to ${winningTeam.name} for ₹${finalAmount.toLocaleString('en-IN')}`);
  };

  const markLivePlayerUnsold = async (player, season = selectedSeason) => {
    if (!player?.id) throw new Error('Call a player to the auction stage first.');
    await updateAuctionLiveState(season, (previous) => {
      if (previous.currentPlayer?.id !== player.id) throw new Error('The current auction player has changed.');
      return {
        ...previous,
        currentPlayer: null,
        currentBid: 0,
        currentBiddingTeam: null,
        bidHistory: [],
        unsoldPlayers: [{
          playerId: player.id,
          playerName: player.fullName || player.name,
          role: player.role || 'Player'
        }, ...(previous.unsoldPlayers || [])]
      };
    });
    updateRegistrationStatus(player.id, 'SHORTLISTED', { unsold: true });
    showToast(`${player.fullName || player.name} marked unsold.`);
  };

  // Match live score simulation / update
  const updateMatchLiveScore = (matchId, updates, season = selectedSeason) => {
    setMatches(prev =>
      prev.map(m => m.id === matchId && (m.season || m.session) === season ? { ...m, ...updates } : m)
    );
    showToast("Match score updated successfully!");
  };

  const loginAdmin = async (adminId, password) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      setAdminUser(result.user);
      showToast(`Welcome, ${result.user.adminId}.`, 'success');
      return { success: true };
    } catch (error) {
      showToast(error.message || 'Unable to sign in.', 'error');
      return { success: false, error: error.message || 'Unable to sign in.' };
    }
  };

  const logoutAdmin = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAdminUser(null);
    showToast('Signed out of Admin Portal.');
  };

  // Reset demo data
  const resetToFactoryDefaults = () => {
    localStorage.clear();
    setTournamentInfo(initialTournamentInfo);
    setChampions(initialChampions);
    setSeasons(initialSeasons);
    setTeams(initialSessionTeams);
    setMatches(initialMatches);
    setPointsTable(initialPointsTable);
    setSeasonStandings(initialSeasonStandings);
    setSelectedSeason(initialSeasons[0]?.edition || 'Season 5');
    setTopPerformers(initialTopPerformers);
    setRecords(initialRecords);
    setGallery(initialGallery);
    setSectionPhotos([]);
    setLegacyPhotos([]);
    setHighlights(initialHighlights);
    setNews(initialNews);
    setAuctionRegistrations(initialAuctionRegistrations);
    setAuctionLiveStates({ [initialSeasons[0]?.edition || 'Season 5']: initialAuctionLiveState });
    showToast("Factory data reset complete!");
  };

  return (
    <NplContext.Provider
      value={{
        tournamentInfo,
        setTournamentInfo,
        champions,
        setChampions,
        seasons,
        setSeasons,
        teams,
        setTeams,
        matches,
        setMatches,
        syncScoredMatch,
        updateMatchLiveScore,
        pointsTable,
        setPointsTable,
        seasonStandings,
        setSeasonStandings,
        selectedSeason,
        setSelectedSeason,
        topPerformers,
        setTopPerformers,
        records,
        setRecords,
        gallery,
        setGallery,
        sectionPhotos,
        setSectionPhotos,
        legacyPhotos,
        setLegacyPhotos,
        highlights,
        setHighlights,
        news,
        setNews,
        auctionRegistrations,
        registerPlayerForAuction,
        addDemoAuctionPlayers,
        updateRegistrationStatus,
        updateAuctionPlayerBasePrice,
        auctionLiveState,
        auctionSyncStatus,
        callLiveAuctionPlayer,
        setLiveAuctionPurseCap,
        setLiveAuctionStatus,
        placeLiveBid,
        sellLivePlayer,
        markLivePlayerUnsold,
        persistPublicSiteData,
        siteMedia,
        refreshSiteMedia,
        isAdminLoggedIn,
        isAuctionDemo,
        adminUser,
        isAdminAuthLoading,
        loginAdmin,
        logoutAdmin,
        isAdminModalOpen,
        setIsAdminModalOpen,
        activeTab,
        setActiveTab,
        activeModal,
        openModal,
        closeModal,
        toastMessage,
        showToast,
        resetToFactoryDefaults
      }}
    >
      {children}
    </NplContext.Provider>
  );
};

export const useNpl = () => {
  const context = useContext(NplContext);
  if (!context) {
    throw new Error('useNpl must be used within an NplProvider');
  }
  return context;
};
