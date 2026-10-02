import React, { createContext, useContext, useState, useEffect } from 'react';
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
  initialAuctionLiveState
} from '../data/nplData';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

const NplContext = createContext();

export const NplProvider = ({ children }) => {
  // Helper for localStorage
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`npl_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [tournamentInfo, setTournamentInfo] = useState(() => loadState('tournamentInfo', initialTournamentInfo));
  const [champions, setChampions] = useState(() => {
    const savedChampions = loadState('champions', []);
    if (!Array.isArray(savedChampions)) return initialChampions;

    const savedByEdition = new Map(
      savedChampions
        .filter((champion) => champion?.edition)
        .map((champion) => [champion.edition, champion])
    );
    const seededEditions = new Set(initialChampions.map((champion) => champion.edition));

    return [
      ...initialChampions.map((champion) => savedByEdition.get(champion.edition) || champion),
      ...savedChampions.filter((champion) => !seededEditions.has(champion?.edition))
    ];
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
  const [matches, setMatches] = useState(() => loadState('matches', initialMatches));
  const [pointsTable, setPointsTable] = useState(() => loadState('pointsTable', initialPointsTable));
  const [seasonStandings, setSeasonStandings] = useState(() => {
    const savedStandings = loadState('seasonStandings', initialSeasonStandings);
    return Object.fromEntries(initialSeasons.map((season) => [
      season.edition,
      savedStandings[season.edition] || savedStandings[season.season] || initialSeasonStandings[season.edition]
    ]));
  });
  const [selectedSeason, setSelectedSeason] = useState(() => loadState('selectedSeason', initialSeasons[0]?.edition || 'Season 5'));
  const [topPerformers, setTopPerformers] = useState(() => loadState('topPerformers', initialTopPerformers));
  const [records, setRecords] = useState(() => loadState('records', initialRecords));
  const [gallery, setGallery] = useState(() => {
    const savedGallery = loadState('gallery', []);
    if (!Array.isArray(savedGallery)) return initialGallery;

    const savedById = new Map(
      savedGallery
        .filter((item) => item?.id)
        .map((item) => [item.id, item])
    );
    const seededIds = new Set(initialGallery.map((item) => item.id));

    return [
      ...initialGallery.map((item) => ({ ...(savedById.get(item.id) || {}), ...item })),
      ...savedGallery.filter((item) => !seededIds.has(item?.id))
    ];
  });
  const [highlights, setHighlights] = useState(() => loadState('highlights', initialHighlights));
  const [news, setNews] = useState(() => loadState('news', initialNews));
  const [auctionRegistrations, setAuctionRegistrations] = useState(() => loadState('auctionRegistrations', initialAuctionRegistrations));
  const [auctionLiveState, setAuctionLiveState] = useState(() => loadState('auctionLiveState', initialAuctionLiveState));
  const [siteMedia, setSiteMedia] = useState({});

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
      .then(setSiteMedia)
      .catch(() => setSiteMedia({}));
  }, []);

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
    localStorage.setItem('npl_selectedSeason', JSON.stringify(selectedSeason));
  }, [selectedSeason]);

  useEffect(() => {
    localStorage.setItem('npl_auctionRegistrations', JSON.stringify(auctionRegistrations));
  }, [auctionRegistrations]);

  useEffect(() => {
    localStorage.setItem('npl_auctionLiveState', JSON.stringify(auctionLiveState));
  }, [auctionLiveState]);

  useEffect(() => {
    localStorage.setItem('npl_news', JSON.stringify(news));
  }, [news]);

  useEffect(() => {
    localStorage.setItem('npl_gallery', JSON.stringify(gallery));
  }, [gallery]);

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
    setSiteMedia(await response.json());
  };

  // Auction Registration submission
  const registerPlayerForAuction = (formData) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const regId = `NPL26-${randomNum}`;
    const newPlayer = {
      id: `reg-${Date.now()}`,
      registrationId: regId,
      ...formData,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      photo: formData.photo || ''
    };

    setAuctionRegistrations(prev => [newPlayer, ...prev]);
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
  const placeLiveBid = (teamId, amount) => {
    sound.playBidBeep();
    const team = teams.find(t => t.id === teamId);
    setAuctionLiveState(prev => ({
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
  const sellLivePlayer = (player, winningTeamId, finalAmount) => {
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
    setAuctionLiveState(prev => {
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
  const updateMatchLiveScore = (matchId, updates) => {
    setMatches(prev =>
      prev.map(m => m.id === matchId ? { ...m, ...updates } : m)
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
    setTopPerformers(initialTopPerformers);
    setRecords(initialRecords);
    setGallery(initialGallery);
    setHighlights(initialHighlights);
    setNews(initialNews);
    setAuctionRegistrations(initialAuctionRegistrations);
    setAuctionLiveState(initialAuctionLiveState);
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
