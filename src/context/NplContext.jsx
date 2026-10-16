import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  localizeOfflineMedia
} from '../data/nplData';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

const NplContext = createContext();

const attachDefaultSeason = (items, defaultSeason) => (
  Array.isArray(items)
    ? items.map((item) => item.season || item.session ? item : { ...item, season: defaultSeason })
    : items
);

const savePublicSiteData = (saveQueue, data) => {
  if (!import.meta.env.PROD) return Promise.resolve();

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
    try {
      const saved = localStorage.getItem(`npl_${key}`);
      return saved ? localizeOfflineMedia(JSON.parse(saved)) : fallback;
    } catch {
      return fallback;
    }
  };

  const initialSelectedSeason = initialSeasons[0]?.edition || 'Season 5';

  const [tournamentInfo, setTournamentInfo] = useState(() => loadState('tournamentInfo', initialTournamentInfo));
  const [champions, setChampions] = useState(() => {
    const savedChampions = loadState('champions', null);
    if (!Array.isArray(savedChampions)) return initialChampions;
    return savedChampions;
  });
  const [seasons, setSeasons] = useState(() => {
    const savedSeasons = loadState('seasons', initialSeasons);
    return Array.isArray(savedSeasons) ? savedSeasons : initialSeasons;
  });
  const [teams, setTeams] = useState(() => {
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
  const [matches, setMatches] = useState(() => attachDefaultSeason(loadState('matches', initialMatches), initialSelectedSeason));
  const [pointsTable, setPointsTable] = useState(() => loadState('pointsTable', initialPointsTable));
  const [seasonStandings, setSeasonStandings] = useState(() => {
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
  const [auctionRegistrations, setAuctionRegistrations] = useState(() => attachDefaultSeason(loadState('auctionRegistrations', initialAuctionRegistrations), initialSelectedSeason));
  const [auctionLiveStates, setAuctionLiveStates] = useState(() => {
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
  const [auctionSyncStatus, setAuctionSyncStatus] = useState('connecting');
  const auctionStateEtags = useRef({});
  const [siteMedia, setSiteMedia] = useState({});
  const [siteDataLoaded, setSiteDataLoaded] = useState(false);
  const [registrationDataLoaded, setRegistrationDataLoaded] = useState(false);
  const siteDataSaveQueue = useRef(Promise.resolve());
  const registrationSaveQueue = useRef(Promise.resolve());

  // Authentication is verified by the server; never trust persisted browser state.
  const [adminUser, setAdminUser] = useState(null);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(true);
  const isAdminLoggedIn = Boolean(adminUser);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Universal Modal Controller
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
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
    let active = true;
    const refreshAuction = async () => {
      try {
        const headers = auctionStateEtags.current[selectedSeason]
          ? { 'If-None-Match': auctionStateEtags.current[selectedSeason] }
          : {};
        const response = await fetch(`/api/auction/live?season=${encodeURIComponent(selectedSeason)}`, {
          cache: 'no-store',
          headers
        });
        if (response.status === 304) {
          if (active) setAuctionSyncStatus('online');
          return;
        }
        if (!response.ok) throw new Error('Could not connect to live auction updates.');
        const result = await response.json();
        if (!active) return;
        const etag = response.headers.get('ETag');
        if (etag) auctionStateEtags.current[selectedSeason] = etag;
        if (result.state) {
          setAuctionLiveStates((previous) => {
            const current = previous[selectedSeason];
            if (current?.updatedAt === result.state.updatedAt) return previous;
            return { ...previous, [selectedSeason]: result.state };
          });
        } else {
          setAuctionLiveStates((previous) => {
            const current = previous[selectedSeason];
            if (current === initialAuctionLiveState) return previous;
            return { ...previous, [selectedSeason]: initialAuctionLiveState };
          });
        }
        setAuctionSyncStatus('online');
      } catch (error) {
        if (!active) return;
        setAuctionSyncStatus('offline');
        console.error('Could not refresh live auction state:', error);
      }
    };

    refreshAuction();
    const intervalId = window.setInterval(refreshAuction, 2000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [selectedSeason]);

  useEffect(() => {
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
    localStorage.setItem('npl_tournamentInfo', JSON.stringify(tournamentInfo));
  }, [tournamentInfo]);

  useEffect(() => {
    localStorage.setItem('npl_champions', JSON.stringify(champions));
  }, [champions]);

  useEffect(() => {
    localStorage.setItem('npl_seasons', JSON.stringify(seasons));
  }, [seasons]);

  useEffect(() => {
    localStorage.setItem('npl_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('npl_teamDataVersion', '3');
  }, []);

  useEffect(() => {
    localStorage.setItem('npl_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('npl_pointsTable', JSON.stringify(pointsTable));
  }, [pointsTable]);

  useEffect(() => {
    localStorage.setItem('npl_seasonStandings', JSON.stringify(seasonStandings));
  }, [seasonStandings]);

  useEffect(() => {
    localStorage.setItem('npl_seasonStandingsVersion', '2');
  }, []);

  useEffect(() => {
    localStorage.setItem('npl_topPerformers', JSON.stringify(topPerformers));
  }, [topPerformers]);

  useEffect(() => {
    localStorage.setItem('npl_highlights', JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem('npl_auctionRegistrations', JSON.stringify(auctionRegistrations));
  }, [auctionRegistrations]);

  useEffect(() => {
    localStorage.setItem('npl_auctionLiveStates', JSON.stringify(auctionLiveStates));
  }, [auctionLiveStates]);

  useEffect(() => {
    localStorage.setItem('npl_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('npl_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('npl_sectionPhotos', JSON.stringify(sectionPhotos));
  }, [sectionPhotos]);

  useEffect(() => {
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
    if (!import.meta.env.PROD || !adminUser || !siteDataLoaded) return;
    savePublicSiteData(siteDataSaveQueue, publicSiteData)
      .catch((error) => console.error(error));
  }, [adminUser, siteDataLoaded, tournamentInfo, champions, seasons, teams, matches, pointsTable,
    seasonStandings, topPerformers, records, gallery, sectionPhotos, legacyPhotos, highlights, news]);

  useEffect(() => {
    if (!import.meta.env.PROD || !adminUser || !registrationDataLoaded) return;
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
      season: selectedSeason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      photo: formData.photo || ''
    };

    setAuctionRegistrations(prev => [newPlayer, ...prev]);
    if (import.meta.env.PROD) {
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

  // Update Registration Status
  const updateRegistrationStatus = (id, newStatus, extra = {}) => {
    setAuctionRegistrations(prev =>
      prev.map(item => item.id === id ? { ...item, status: newStatus, ...extra } : item)
    );
    showToast(`Player status updated to ${newStatus}`);
  };

  const updateAuctionLiveState = async (season, updater) => {
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
    if (response.status === 409 && result.state) {
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
    const basePrice = Number(String(player.basePrice || '').replace(/[^\d]/g, '')) || 30000;
    const publicPlayer = Object.fromEntries(
      ['id', 'registrationId', 'fullName', 'name', 'role', 'photo', 'basePrice']
        .filter((key) => typeof player[key] === 'string')
        .map((key) => [key, player[key]])
    );
    return updateAuctionLiveState(season, (previous) => ({
      ...previous,
      currentPlayer: publicPlayer,
      currentBid: basePrice,
      currentBiddingTeam: null,
      bidHistory: [],
      teamPurses: {
        ...Object.fromEntries(teams.map((team) => [team.id, 5000000])),
        ...previous.teamPurses
      }
    }));
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
    await updateAuctionLiveState(season, (previous) => {
      if (previous.status !== 'live' || !previous.currentPlayer) throw new Error('The auction is not accepting bids right now.');
      const purse = previous.teamPurses?.[teamId] ?? 5000000;
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
    await updateAuctionLiveState(season, (previous) => {
      if (previous.status !== 'live' || previous.currentPlayer?.id !== player?.id ||
        previous.currentBiddingTeam !== winningTeamId || previous.currentBid !== finalAmount) {
        throw new Error('The live bid has changed. Refresh the auction before selling this player.');
      }
      const currentPurse = previous.teamPurses?.[winningTeamId] ?? 5000000;
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
          basePrice: player.basePrice || '₹30,000',
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
      soldPrice: `₹${finalAmount.toLocaleString('en-IN')}`
    });
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
        updateRegistrationStatus,
        auctionLiveState,
        auctionSyncStatus,
        callLiveAuctionPlayer,
        setLiveAuctionStatus,
        placeLiveBid,
        sellLivePlayer,
        markLivePlayerUnsold,
        persistPublicSiteData,
        siteMedia,
        refreshSiteMedia,
        isAdminLoggedIn,
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
