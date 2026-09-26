import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialTournamentInfo,
  initialChampions,
  initialSeasons,
  initialTeams,
  initialMatches,
  initialPointsTable,
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
  const [champions, setChampions] = useState(() => loadState('champions', initialChampions));
  const [seasons, setSeasons] = useState(() => loadState('seasons', initialSeasons));
  const [teams, setTeams] = useState(() => loadState('teams', initialTeams));
  const [matches, setMatches] = useState(() => loadState('matches', initialMatches));
  const [pointsTable, setPointsTable] = useState(() => loadState('pointsTable', initialPointsTable));
  const [topPerformers, setTopPerformers] = useState(() => loadState('topPerformers', initialTopPerformers));
  const [records, setRecords] = useState(() => loadState('records', initialRecords));
  const [gallery, setGallery] = useState(() => loadState('gallery', initialGallery));
  const [highlights, setHighlights] = useState(() => loadState('highlights', initialHighlights));
  const [news, setNews] = useState(() => loadState('news', initialNews));
  const [auctionRegistrations, setAuctionRegistrations] = useState(() => loadState('auctionRegistrations', initialAuctionRegistrations));
  const [auctionLiveState, setAuctionLiveState] = useState(() => loadState('auctionLiveState', initialAuctionLiveState));

  // Admin authentication state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('npl_admin_auth') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Universal Modal Controller
  const [activeModal, setActiveModal] = useState({ type: null, data: null });
  const [toastMessage, setToastMessage] = useState(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('npl_tournamentInfo', JSON.stringify(tournamentInfo));
  }, [tournamentInfo]);

  useEffect(() => {
    localStorage.setItem('npl_champions', JSON.stringify(champions));
  }, [champions]);

  useEffect(() => {
    localStorage.setItem('npl_teams', JSON.stringify(teams));
  }, [teams]);

  useEffect(() => {
    localStorage.setItem('npl_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('npl_pointsTable', JSON.stringify(pointsTable));
  }, [pointsTable]);

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
      photo: formData.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
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

  // Admin login toggle
  const loginAdmin = (password) => {
    if (password === 'admin123' || password === 'npl2026') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('npl_admin_auth', 'true');
      showToast("Welcome back, NPL Tournament Director!", "success");
      return true;
    } else {
      showToast("Invalid Admin PIN. (Default: admin123)", "error");
      return false;
    }
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('npl_admin_auth');
    showToast("Signed out of Admin Portal.");
  };

  // Reset demo data
  const resetToFactoryDefaults = () => {
    localStorage.clear();
    setTournamentInfo(initialTournamentInfo);
    setChampions(initialChampions);
    setSeasons(initialSeasons);
    setTeams(initialTeams);
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
        isAdminLoggedIn,
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
