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

  const initialSelectedSeason = loadState('selectedSeason', initialSeasons[0]?.edition || 'Season 5');

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
      ...savedBySeason,
      [initialSelectedSeason]: savedBySeason[initialSelectedSeason] || legacyState
    };
  });
  const auctionLiveState = auctionLiveStates[selectedSeason] || initialAuctionLiveState;
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
        if (data.selectedSeason) setSelectedSeason(data.selectedSeason);
        if (Array.isArray(data.topPerformers) || (data.topPerformers && typeof data.topPerformers === 'object')) {
          setTopPerformers(data.topPerformers);
        }
        if (Array.isArray(data.records)) setRecords(data.records);
        if (Array.isArray(data.gallery)) setGallery(data.gallery);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (Array.isArray(data.news)) setNews(data.news);
        if (data.auctionLiveStates) setAuctionLiveStates(data.auctionLiveStates);
      })
      .catch((error) => console.error('Could not load shared NPL content:', error))
      .finally(() => setSiteDataLoaded(true));
  }, []);

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
    localStorage.setItem('npl_selectedSeason', JSON.stringify(selectedSeason));
  }, [selectedSeason]);

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

  const publicSiteData = {
    tournamentInfo,
    champions,
    seasons,
    teams,
    matches,
    pointsTable,
    seasonStandings,
    selectedSeason,
    topPerformers,
    records,
    gallery,
    highlights,
    news,
    auctionLiveStates
  };

  useEffect(() => {
    if (!import.meta.env.PROD || !adminUser || !siteDataLoaded) return;
    siteDataSaveQueue.current = siteDataSaveQueue.current
      .catch(() => {})
      .then(() => fetch('/api/admin/site-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publicSiteData)
      }))
      .then((response) => {
        if (!response.ok) throw new Error('Could not save shared NPL content.');
      })
      .catch((error) => console.error(error));
  }, [adminUser, siteDataLoaded, tournamentInfo, champions, seasons, teams, matches, pointsTable,
    seasonStandings, selectedSeason, topPerformers, records, gallery, highlights, news, auctionLiveStates]);

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

  // Auction Arena: Place Bid
  const updateAuctionLiveState = (season, updater) => {
    setAuctionLiveStates((previousStates) => {
      const previousState = previousStates[season] || initialAuctionLiveState;
      const nextState = typeof updater === 'function' ? updater(previousState) : updater;
      return { ...previousStates, [season]: nextState };
    });
  };

  const placeLiveBid = (teamId, amount, season = selectedSeason) => {
    sound.playBidBeep();
    const team = teams.find(t => t.id === teamId);
    updateAuctionLiveState(season, prev => ({
      ...prev,
      currentBid: amount,
      currentBiddingTeam: teamId,
      bidHistory: [
        { team: team?.name || teamId, amount, time: new Date().toLocaleTimeString() },
        ...prev.bidHistory.slice(0, 7)
      ]
    }));
  };

  // Auction Arena: Sell Player
  const sellLivePlayer = (player, winningTeamId, finalAmount, season = selectedSeason) => {
    sound.playGavel();
    sound.playCheer();
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 }
    });

    const winningTeam = teams.find(t => t.id === winningTeamId);

    // Update player status in registration list
    updateRegistrationStatus(player.id, 'AUCTIONED', {
      soldTo: winningTeam?.name || winningTeamId,
      soldPrice: `₹${finalAmount.toLocaleString('en-IN')}`
    });

    // Update auction live state and team purse
    updateAuctionLiveState(season, prev => {
      const currentPurse = prev.teamPurses[winningTeamId] || 5000000;
      const updatedPurse = Math.max(0, currentPurse - finalAmount);
      return {
        ...prev,
        soldPlayers: [
          {
            playerId: player.id,
            playerName: player.fullName || player.name,
            role: player.role,
            basePrice: player.basePrice || `₹30,000`,
            soldPrice: `₹${finalAmount.toLocaleString('en-IN')}`,
            team: winningTeam?.name,
            teamShort: winningTeam?.shortName,
            teamColor: winningTeam?.primaryColor
          },
          ...prev.soldPlayers
        ],
        teamPurses: {
          ...prev.teamPurses,
          [winningTeamId]: updatedPurse
        },
        currentBid: 50000,
        currentBiddingTeam: null,
        bidHistory: []
      };
    });

    showToast(`SOLD! ${player.fullName || player.name} to ${winningTeam?.name || winningTeamId} for ₹${finalAmount.toLocaleString('en-IN')}`);
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
        highlights,
        setHighlights,
        news,
        setNews,
        auctionRegistrations,
        registerPlayerForAuction,
        updateRegistrationStatus,
        auctionLiveState,
        placeLiveBid,
        sellLivePlayer,
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
