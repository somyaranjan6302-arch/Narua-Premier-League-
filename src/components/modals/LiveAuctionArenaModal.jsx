import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { DEFAULT_AUCTION_PURSE_CAP } from '../../data/nplData';
import { TeamBadge } from '../TeamBadge';
import { PlayerPortrait } from '../PlayerPortrait';
import { NplLogo } from '../NplLogo';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Filter,
  Flame,
  Gavel,
  History,
  MoreVertical,
  Radio,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
  X
} from 'lucide-react';

const SQUAD_SLOTS = 13;

export const LiveAuctionArenaModal = ({ onClose, isAdminControl = false, standalone = false }) => {
  const {
    teams,
    auctionRegistrations,
    auctionLiveState,
    auctionSyncStatus,
    selectedSeason,
    isAuctionDemo,
    isAdminLoggedIn,
    siteMedia,
    callLiveAuctionPlayer,
    setLiveAuctionPurseCap,
    setLiveAuctionTeamPurseCap,
    setLiveAuctionMinimumBidIncrement,
    setLiveAuctionMaxSquadSize,
    setLiveAuctionStatus,
    placeLiveBid,
    sellLivePlayer,
    markLivePlayerUnsold
  } = useNpl();

  const canControlAuction = isAdminControl && isAdminLoggedIn;

  const eligiblePlayers = auctionRegistrations.filter((player) =>
    player.season === selectedSeason && ['VERIFIED', 'SHORTLISTED'].includes(player.status)
  );

  const currentPlayer = auctionLiveState.currentPlayer;
  const currentBid = auctionLiveState.currentBid || 0;
  const currentBiddingTeamId = auctionLiveState.currentBiddingTeam;
  const currentBiddingTeam = teams.find((t) => t.id === currentBiddingTeamId);

  const sessionTeams = useMemo(() => teams.filter((team) => {
    const sessions = Array.isArray(team.sessions) ? team.sessions
      : Array.isArray(team.seasons) ? team.seasons
        : team.session ? [team.session] : [selectedSeason];
    return team.active !== false && sessions.includes(selectedSeason);
  }), [selectedSeason, teams]);

  const purseCap = auctionLiveState.purseCap ?? DEFAULT_AUCTION_PURSE_CAP;
  const minimumBidIncrement = auctionLiveState.minimumBidIncrement ?? 100;
  const squadSizeLimit = auctionLiveState.maxSquadSize ?? SQUAD_SLOTS;
  const bidIncrementOptions = [...new Set([
    minimumBidIncrement,
    minimumBidIncrement * 2,
    minimumBidIncrement * 3,
    minimumBidIncrement * 5,
    minimumBidIncrement * 10
  ])].filter(Number.isSafeInteger);

  const [activeTab, setActiveTab] = useState('arena'); // 'arena' | 'bidTape' | 'soldHistory' | 'wallets'
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedIncrement, setSelectedIncrement] = useState(minimumBidIncrement);
  const [customIncrement, setCustomIncrement] = useState('');
  const [purseCapDraft, setPurseCapDraft] = useState(String(purseCap));
  const [minimumBidIncrementDraft, setMinimumBidIncrementDraft] = useState(String(minimumBidIncrement));
  const [maxSquadSizeDraft, setMaxSquadSizeDraft] = useState(String(squadSizeLimit));
  const [teamPurseCapDrafts, setTeamPurseCapDrafts] = useState({});
  const [auctionAuditLog, setAuctionAuditLog] = useState([]);
  const [auctionAuditError, setAuctionAuditError] = useState('');
  const [reauctionPlayer, setReauctionPlayer] = useState(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [auctionError, setAuctionError] = useState('');
  const [showExtras, setShowExtras] = useState(false);
  const [showUnsoldDrawer, setShowUnsoldDrawer] = useState(false);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [failedPlayerPhoto, setFailedPlayerPhoto] = useState('');

  // Filters for Sold History
  const [soldTeamFilter, setSoldTeamFilter] = useState('ALL');
  const [soldRoleFilter, setSoldRoleFilter] = useState('ALL');
  const [soldSearchQuery, setSoldSearchQuery] = useState('');

  const selectedPlayer = eligiblePlayers.find((player) => player.id === selectedPlayerId);
  const liveStatus = auctionLiveState.status || 'waiting';
  const bidIncrement = selectedIncrement === 'custom'
    ? Number(customIncrement)
    : selectedIncrement;

  // Formatters
  const formatRupees = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const formatCompactRupees = (amount) => {
    const value = Number(amount) || 0;
    if (value >= 10000000) {
      const crores = Math.round((value / 10000000) * 10) / 10;
      return `${Number.isInteger(crores) ? crores : crores.toFixed(1)} C`;
    }
    if (value >= 100000) {
      const lakhs = Math.round((value / 100000) * 10) / 10;
      return `${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)} L`;
    }
    return formatRupees(value);
  };

  const formatPurseRatio = (remaining, cap) => {
    const left = Number(remaining) || 0;
    const total = Number(cap) || 0;
    if (total >= 10000000) {
      const leftC = Math.round((left / 10000000) * 10) / 10;
      const totalC = Math.round((total / 10000000) * 10) / 10;
      return `${Number.isInteger(leftC) ? leftC : leftC.toFixed(1)}/${Number.isInteger(totalC) ? totalC : totalC.toFixed(1)} C`;
    }
    if (total >= 100000) {
      const leftL = Math.round((left / 100000) * 10) / 10;
      const totalL = Math.round((total / 100000) * 10) / 10;
      return `${Number.isInteger(leftL) ? leftL : leftL.toFixed(1)}/${Number.isInteger(totalL) ? totalL : totalL.toFixed(1)} L`;
    }
    return `${left.toLocaleString('en-IN')}/${total.toLocaleString('en-IN')}`;
  };

  // Comprehensive list of all sold players across all teams for the active season
  const allSoldPlayers = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. From auctionLiveState.soldPlayers
    (auctionLiveState.soldPlayers || []).forEach((sp, idx) => {
      const name = sp.playerName || sp.name || `Player-${idx}`;
      const matchedTeam = sessionTeams.find((t) =>
        t.id === sp.teamId ||
        t.name?.toLowerCase() === (sp.team || sp.teamName || '').toLowerCase() ||
        t.shortName?.toLowerCase() === (sp.teamShort || '').toLowerCase()
      );
      const teamName = matchedTeam?.name || sp.team || sp.teamName || 'Acquired';
      const key = `${name}-${teamName}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          id: sp.playerId || `sold-${idx}`,
          name,
          role: sp.role || 'Cricketer',
          basePrice: sp.basePrice || '₹100',
          soldPrice: sp.soldPrice || '₹100',
          teamName,
          teamShort: matchedTeam?.shortName || sp.teamShort || '',
          teamColor: matchedTeam?.primaryColor || sp.teamColor || '#2563eb',
          teamId: matchedTeam?.id || sp.teamId || '',
          photo: sp.photo || '',
          battingStyle: sp.battingStyle || '',
          bowlingStyle: sp.bowlingStyle || '',
          lotNumber: sp.lotNumber || '',
          season: sp.season || selectedSeason
        });
      }
    });

    // 2. From sessionTeams squads
    sessionTeams.forEach((t) => {
      (t.squad || []).forEach((m, mIdx) => {
        const key = `${m.name}-${t.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: m.id || `squad-${mIdx}`,
            name: m.name,
            role: m.role || 'Cricketer',
            basePrice: m.basePrice || '₹100',
            soldPrice: m.soldPrice || '₹1,00,000',
            teamName: t.name,
            teamShort: t.shortName,
            teamColor: t.primaryColor || '#2563eb',
            teamId: t.id,
            photo: m.photo || '',
            battingStyle: m.battingStyle || m.style || '',
            bowlingStyle: m.bowlingStyle || '',
            lotNumber: m.lotNumber || '',
            season: m.season || selectedSeason
          });
        }
      });
    });

    // 3. From auctionRegistrations with status AUCTIONED
    auctionRegistrations
      .filter((r) => r.season === selectedSeason && r.status === 'AUCTIONED')
      .forEach((r) => {
        const matchedTeam = sessionTeams.find((t) => t.id === r.soldToTeamId || t.name === r.soldTo);
        const teamName = matchedTeam?.name || r.soldTo || 'Team';
        const key = `${r.fullName || r.name}-${teamName}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            id: r.id,
            registrationId: r.registrationId,
            name: r.fullName || r.name,
            role: r.role || 'Cricketer',
            basePrice: r.basePrice || '₹100',
            soldPrice: r.soldPrice || '₹100',
            teamName,
            teamShort: matchedTeam?.shortName || '',
            teamColor: matchedTeam?.primaryColor || '#2563eb',
            teamId: matchedTeam?.id || r.soldToTeamId || '',
            photo: r.photo || '',
            battingStyle: r.battingStyle || '',
            bowlingStyle: r.bowlingStyle || '',
            lotNumber: String(r.registrationId || '').match(/(\d+)\s*$/)?.[1] || '',
            season: r.season
          });
        }
      });

    return list;
  }, [auctionLiveState.soldPlayers, sessionTeams, auctionRegistrations, selectedSeason]);

  // Total money spent in the auction
  const totalSpentAcrossTeams = useMemo(() => {
    return allSoldPlayers.reduce((acc, p) => {
      const num = Number(String(p.soldPrice || '').replace(/[^\d]/g, '')) || 0;
      return acc + num;
    }, 0);
  }, [allSoldPlayers]);

  // Highest sale / marquee player
  const marqueeSale = useMemo(() => {
    if (!allSoldPlayers.length) return null;
    let highest = null;
    let maxPrice = -1;
    allSoldPlayers.forEach((p) => {
      const numericPrice = Number(String(p.soldPrice || '').replace(/[^\d]/g, '')) || 0;
      if (numericPrice > maxPrice) {
        maxPrice = numericPrice;
        highest = p;
      }
    });
    return highest;
  }, [allSoldPlayers]);

  // Helper: Get sold players for a specific franchise
  const getSoldPlayersForTeam = useCallback((team) => {
    return allSoldPlayers.filter((p) => (
      p.teamId === team.id ||
      p.teamName?.toLowerCase() === team.name?.toLowerCase() ||
      (p.teamShort && p.teamShort.toLowerCase() === (team.shortName || '').toLowerCase())
    ));
  }, [allSoldPlayers]);

  // Team insight stats
  const teamInsight = useCallback((team) => {
    const boughtList = getSoldPlayersForTeam(team);
    const bought = boughtList.length;
    const slotsLeft = Math.max(0, squadSizeLimit - bought);

    let remainingPurse = auctionLiveState.teamPurses?.[team.id];
    if (remainingPurse === undefined) {
      const teamPurseCap = auctionLiveState.teamPurseCaps?.[team.id] ?? purseCap;
      const spent = boughtList.reduce((acc, p) => {
        return acc + (Number(String(p.soldPrice || '').replace(/[^\d]/g, '')) || 0);
      }, 0);
      remainingPurse = Math.max(0, teamPurseCap - spent);
    }

    const maxBid = slotsLeft <= 0 ? 0 : remainingPurse;
    return { remainingPurse, bought, slotsLeft, maxBid, boughtList };
  }, [getSoldPlayersForTeam, auctionLiveState.teamPurseCaps, auctionLiveState.teamPurses, purseCap, squadSizeLimit]);

  // Lot number & style chips for current player
  const lotNumber = useMemo(() => {
    if (currentPlayer?.lotNumber) return String(currentPlayer.lotNumber);
    const match = String(currentPlayer?.registrationId || currentPlayer?.id || '').match(/(\d+)\s*$/);
    return match ? match[1] : '8';
  }, [currentPlayer]);

  const styleChips = useMemo(() => {
    if (!currentPlayer) return [];
    return [
      currentPlayer.battingStyle || (currentPlayer.role?.includes('Bat') ? 'Right Hand Batsman' : null),
      currentPlayer.bowlingStyle || (currentPlayer.role?.includes('Bowl') ? 'Right Arm Medium' : null),
      currentPlayer.age ? `Age ${currentPlayer.age}` : null,
      currentPlayer.location || null
    ].filter(Boolean);
  }, [currentPlayer]);

  const showCurrentPlayerPhoto = Boolean(currentPlayer?.photo) && currentPlayer.photo !== failedPlayerPhoto;

  useEffect(() => {
    setFailedPlayerPhoto('');
    setIsPhotoExpanded(false);
  }, [currentPlayer?.id, currentPlayer?.photo]);

  useEffect(() => {
    if (!isPhotoExpanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsPhotoExpanded(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isPhotoExpanded]);

  useEffect(() => {
    setPurseCapDraft(String(purseCap));
    setMinimumBidIncrementDraft(String(minimumBidIncrement));
    setMaxSquadSizeDraft(String(squadSizeLimit));
    setSelectedIncrement(minimumBidIncrement);
    setTeamPurseCapDrafts(Object.fromEntries(sessionTeams.map((team) => [
      team.id,
      String(auctionLiveState.teamPurseCaps?.[team.id] ?? purseCap)
    ])));
  }, [auctionLiveState.teamPurseCaps, minimumBidIncrement, purseCap, selectedSeason, sessionTeams, squadSizeLimit]);

  useEffect(() => {
    if (!canControlAuction) {
      setAuctionAuditLog([]);
      setAuctionAuditError('');
      return undefined;
    }

    let active = true;
    setAuctionAuditError('');
    fetch(`/api/admin/auction/audit?season=${encodeURIComponent(selectedSeason)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Could not load the auction audit log.');
        return result.entries;
      })
      .then((entries) => {
        if (active) setAuctionAuditLog(Array.isArray(entries) ? entries : []);
      })
      .catch((error) => {
        if (active) setAuctionAuditError(error.message || 'Could not load the auction audit log.');
      });

    return () => { active = false; };
  }, [auctionLiveState.updatedAt, canControlAuction, selectedSeason]);

  const performAction = async (action) => {
    setAuctionError('');
    setIsSaving(true);
    try {
      await action();
    } catch (error) {
      setAuctionError(error.message || 'The auction update could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRaiseBid = (teamId, increment) => {
    performAction(() => placeLiveBid(teamId, increment, selectedSeason));
  };

  const handleSell = () => {
    if (!currentPlayer || !currentBiddingTeamId) return;
    performAction(async () => {
      await sellLivePlayer(currentPlayer, currentBiddingTeamId, currentBid, selectedSeason);
      try {
        sound.playGavel();
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // audio/canvas fallback
      }
    });
  };

  const handleSavePurseCap = () => {
    const nextPurseCap = Number(purseCapDraft);
    if (!Number.isSafeInteger(nextPurseCap) || nextPurseCap <= 0) {
      setAuctionError('Enter a purse cap greater than zero rupees.');
      return;
    }
    performAction(() => setLiveAuctionPurseCap(nextPurseCap, selectedSeason));
  };

  const handleSaveMinimumBidIncrement = () => {
    const nextMinimum = Number(minimumBidIncrementDraft);
    if (!Number.isSafeInteger(nextMinimum) || nextMinimum <= 0) {
      setAuctionError('Enter a minimum bid increment greater than zero rupees.');
      return;
    }
    performAction(() => setLiveAuctionMinimumBidIncrement(nextMinimum, selectedSeason));
  };

  const handleSaveMaxSquadSize = () => {
    const nextSize = Number(maxSquadSizeDraft);
    if (!Number.isSafeInteger(nextSize) || nextSize < 1 || nextSize > 30) {
      setAuctionError('Squad size must be from 1 to 30 players.');
      return;
    }
    performAction(() => setLiveAuctionMaxSquadSize(nextSize, selectedSeason));
  };

  const handleSaveTeamPurseCap = (teamId) => {
    const nextCap = Number(teamPurseCapDrafts[teamId]);
    if (!Number.isSafeInteger(nextCap) || nextCap <= 0) {
      setAuctionError('Enter a team purse cap greater than zero rupees.');
      return;
    }
    performAction(() => setLiveAuctionTeamPurseCap(teamId, nextCap, selectedSeason));
  };

  const handleReauction = () => {
    const player = auctionRegistrations.find((registration) =>
      registration.id === reauctionPlayer?.playerId &&
      registration.season === selectedSeason &&
      registration.status === 'UNSOLD'
    );
    if (!player) {
      setAuctionError('This unsold player is no longer available for re-auction.');
      return;
    }
    if (exceptionReason.trim().length < 5 || exceptionReason.trim().length > 500) {
      setAuctionError('Enter a re-auction exception reason between 5 and 500 characters.');
      return;
    }
    performAction(async () => {
      await callLiveAuctionPlayer(player, selectedSeason, { exceptionReason: exceptionReason.trim() });
      setReauctionPlayer(null);
      setExceptionReason('');
    });
  };

  const handleUnsold = () => {
    if (currentPlayer) performAction(() => markLivePlayerUnsold(currentPlayer, selectedSeason));
  };

  // Filtered sold players for the dedicated tab
  const filteredSoldPlayers = useMemo(() => {
    return allSoldPlayers.filter((p) => {
      const matchesTeam = soldTeamFilter === 'ALL' ||
        p.teamId === soldTeamFilter ||
        p.teamName?.toLowerCase() === soldTeamFilter.toLowerCase();
      const matchesRole = soldRoleFilter === 'ALL' ||
        p.role?.toLowerCase().includes(soldRoleFilter.toLowerCase());
      const matchesSearch = !soldSearchQuery.trim() ||
        p.name?.toLowerCase().includes(soldSearchQuery.toLowerCase()) ||
        p.teamName?.toLowerCase().includes(soldSearchQuery.toLowerCase());
      return matchesTeam && matchesRole && matchesSearch;
    });
  }, [allSoldPlayers, soldTeamFilter, soldRoleFilter, soldSearchQuery]);

  const backControl = standalone ? (
    <a
      href={isAuctionDemo ? '/?demoAuction=1' : '/'}
      aria-label="Back to NPL"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors"
    >
      <ChevronLeft className="h-6 w-6" />
    </a>
  ) : (
    <button
      onClick={onClose}
      aria-label="Close live auction"
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 hover:bg-white/10 transition-colors"
    >
      <ChevronLeft className="h-6 w-6" />
    </button>
  );

  return (
    <div
      role={standalone ? undefined : 'dialog'}
      aria-modal={standalone ? undefined : 'true'}
      aria-labelledby="live-auction-title"
      className={standalone
        ? 'flex min-h-[100dvh] w-full items-stretch justify-center bg-[var(--color-npl-navy)]'
        : 'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#070e20]/95 p-2 sm:p-4 backdrop-blur-xl'}
    >
      <div className={standalone
        ? 'relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[var(--color-npl-navy)]'
        : 'relative my-4 sm:my-6 flex max-h-[96vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-blue-400/20 bg-[var(--color-npl-navy)] shadow-[0_0_70px_rgba(16,35,110,0.5)]'}>

        {/* 1. TOP APP BAR (Modeled after modern sports apps in user screenshots) */}
        <header className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-blue-500/20 bg-[#071126] px-3 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {backControl}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-md">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#071126]">
                  <NplLogo size="sm" imageSrc={siteMedia?.logo} showText={false} compact />
                </div>
              </div>
              <div className="min-w-0">
                <h3 id="live-auction-title" className="truncate text-sm sm:text-base font-extrabold text-white leading-tight">
                  Narua Premier League
                </h3>
                <p className="truncate text-[11px] font-semibold text-blue-200/80">
                  {selectedSeason} • Live Mega Auction
                </p>
              </div>
            </div>
          </div>

          {/* Right Status Badge & Menu */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
              liveStatus === 'live'
                ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300'
                : liveStatus === 'paused'
                  ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                  : 'border-slate-500/40 bg-slate-700/30 text-slate-300'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                liveStatus === 'live' ? 'animate-ping bg-emerald-400' : liveStatus === 'paused' ? 'bg-amber-400' : 'bg-slate-400'
              }`} />
              {liveStatus === 'live' ? 'LIVE' : liveStatus.toUpperCase()}
            </span>

            <button
              type="button"
              aria-label="Auction options"
              onClick={() => setShowExtras((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* 2. MODERN APP NAVIGATION TABS (Auction Floor | Live Feed | Sold to Teams | Team Wallets) */}
        <nav aria-label="Auction Views" className="flex-shrink-0 border-b border-blue-500/15 bg-[#091535] px-3 py-2 sm:px-5">
          <div className="mx-auto flex w-full max-w-4xl items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('arena')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'arena'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                  : 'bg-white/5 text-blue-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Gavel className="h-3.5 w-3.5" />
              <span>Auction Floor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bidTape')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'bidTape'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                  : 'bg-white/5 text-blue-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Live Bid Feed</span>
              {auctionLiveState.bidHistory?.length > 0 && (
                <span className="ml-0.5 rounded-full bg-white/20 px-1.5 py-0.2 text-[9px] font-bold">
                  {auctionLiveState.bidHistory.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('soldHistory')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'soldHistory'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                  : 'bg-white/5 text-blue-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Trophy className="h-3.5 w-3.5 text-amber-300" />
              <span>Sold to Teams</span>
              <span className="ml-0.5 rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.2 text-[9px] font-black">
                {allSoldPlayers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallets')}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'wallets'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                  : 'bg-white/5 text-blue-200/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Team Wallets</span>
            </button>
            {canControlAuction && (
              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-102'
                    : 'bg-white/5 text-blue-200/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <History className="h-3.5 w-3.5" />
                <span>Audit Log</span>
              </button>
            )}
          </div>
        </nav>

        {/* Quick Extras Panel Drawer (when 3-dots clicked) */}
        {showExtras && (
          <div className="z-20 border-b border-blue-500/20 bg-[#07122b] p-3 sm:px-5">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-blue-100">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span><strong>Purse Cap per Franchise:</strong> {formatCompactRupees(purseCap)}</span>
                <span className="text-white/40">•</span>
                <span><strong>Slots:</strong> {squadSizeLimit} Max</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  auctionSyncStatus === 'online' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  Socket: {auctionSyncStatus}
                </span>
                <button
                  type="button"
                  onClick={() => setShowExtras(false)}
                  className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300 hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN BODY AREA */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-8 pt-3 sm:px-5">
          <div className="mx-auto w-full max-w-4xl space-y-4">

            {/* ERROR BANNER */}
            {auctionError && (
              <div role="alert" className="flex items-center justify-between rounded-2xl border border-rose-500/40 bg-rose-950/80 p-3 text-xs text-rose-200 shadow-lg">
                <span>{auctionError}</span>
                <button type="button" onClick={() => setAuctionError('')} className="p-1 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* TAB 1: AUCTION FLOOR (Exact layout from user screenshot with blue theme) */}
            {activeTab === 'arena' && (
              <div className="space-y-4">

                {/* ADMIN CALL PLAYER BAR (When Admin) */}
                {canControlAuction && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-blue-400/25 bg-[#091535] p-3 sm:flex-row sm:items-center">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-200 shrink-0">
                      Call Player:
                    </span>
                    <select
                      value={selectedPlayerId}
                      onChange={(event) => setSelectedPlayerId(event.target.value)}
                      disabled={isSaving || liveStatus === 'completed'}
                      aria-label="Choose player for auction"
                      className="min-h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#070e20] px-3 py-2 text-xs text-white"
                    >
                      <option value="">Select an eligible player from auction pool</option>
                      {eligiblePlayers.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.fullName || player.name} • {player.role} ({player.basePrice || '₹100'})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedPlayer || isSaving || liveStatus === 'completed'}
                      onClick={() => performAction(() => callLiveAuctionPlayer(selectedPlayer, selectedSeason))}
                      className="min-h-10 shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-black uppercase text-white shadow-md hover:scale-102 transition-all disabled:opacity-40"
                    >
                      Call to Stage
                    </button>
                  </div>
                )}

                {/* CARD 1: THE PLAYER CARD (White background with next-gen trading card design) */}
                {currentPlayer ? (
                  <article className="overflow-hidden rounded-[26px] bg-white p-3.5 sm:p-5 shadow-[0_12px_36px_rgba(3,10,30,0.14)] border border-slate-100 relative">
                    <div className="flex items-stretch gap-3 sm:gap-5">
                      {/* Advanced Player Photo Frame */}
                      <button
                        type="button"
                        onClick={() => setIsPhotoExpanded(true)}
                        aria-label={`Expand ${currentPlayer.fullName || currentPlayer.name}'s photo`}
                        className="relative h-40 w-32 sm:h-48 sm:w-40 shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200/90 bg-gradient-to-tr from-slate-900 via-blue-950 to-slate-900 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
                      >
                        {/* Lot Badge (Top Left - matching uploaded photo) */}
                        <div className="absolute top-2 left-2 z-20 flex min-h-[28px] min-w-[28px] items-center justify-center rounded-xl bg-white/95 px-2 py-0.5 text-xs sm:text-sm font-black text-slate-900 shadow-md border border-slate-200">
                          {lotNumber}
                        </div>

                        {/* Verified Official Badge (Top Right) */}
                        <div className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm" title="Verified Auction Pool">
                          <ShieldCheck className="h-3.5 w-3.5 text-white" />
                        </div>

                        {/* Player Photo with crisp rendering & fallback */}
                        {showCurrentPlayerPhoto ? (
                          <img
                            src={currentPlayer.photo}
                            alt={currentPlayer.fullName || currentPlayer.name}
                            onError={() => setFailedPlayerPhoto(currentPlayer.photo)}
                            className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <PlayerPortrait
                            photo={null}
                            alt={currentPlayer.fullName || currentPlayer.name}
                            className="absolute inset-0 h-full w-full"
                            teamColor="#1d4ed8"
                          />
                        )}

                        {/* Bottom Light Vignette & Live Status */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent pointer-events-none z-10" />
                        <div className="absolute bottom-1.5 inset-x-1.5 z-20 flex items-center justify-center gap-1 rounded bg-black/40 backdrop-blur-xs py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-200">
                          <Flame className="h-2.5 w-2.5 text-amber-400 fill-current animate-pulse" />
                          <span>ON THE BLOCK</span>
                        </div>
                      </button>

                      {/* Player Info (Right side) */}
                      <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
                        <h4 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                          {currentPlayer.fullName || currentPlayer.name}
                        </h4>

                        {/* Role Pill Button (Directly below name, like in photo) */}
                        <div className="mt-2.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-50 px-4 py-1 text-xs sm:text-sm font-bold text-slate-800 shadow-2xs">
                            {currentPlayer.role || 'All Rounder'}
                          </span>
                        </div>

                        {/* Base Price Pill */}
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/90 px-3 py-1 text-xs font-extrabold text-amber-900 shadow-2xs">
                            <Coins className="h-3.5 w-3.5 text-amber-500" />
                            <span>Base: {currentPlayer.basePrice || '₹100'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pill Badges Row (Batting style, bowling style, etc. matching screenshot 2) */}
                    {styleChips.length > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                        {styleChips.map((chip, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-slate-100/90 px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </article>
                ) : (
                  <div className="rounded-[26px] border border-dashed border-blue-400/30 bg-[#091535] p-8 text-center text-white">
                    <Gavel className="mx-auto h-10 w-10 text-blue-400 animate-bounce" />
                    <h4 className="mt-3 text-lg font-black uppercase tracking-wide">Waiting for the Next Player</h4>
                    <p className="mt-1 text-xs text-blue-200/70 max-w-md mx-auto">
                      {canControlAuction
                        ? 'Select a player from the dropdown above and click "Call to Stage" to start bidding.'
                        : 'The auctioneer will announce the next player shortly. Stand by for real-time bids.'}
                    </p>
                  </div>
                )}

                {/* CARD 2: CURRENT BID BANNER (Blue theme as requested by user) */}
                <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-[#0a1838] via-[#12398b] to-[#1c53d4] p-4 sm:p-5 shadow-xl shadow-blue-950/40 text-white">
                  {/* Subtle carbon texture overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_65%)] pointer-events-none" />

                  <div className="relative z-10 grid grid-cols-2 items-center gap-2">
                    {/* Left Column: CURRENT BID */}
                    <div className="pr-2 sm:pr-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/90 flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-amber-400" />
                        <span>CURRENT BID</span>
                      </p>

                      <div className="mt-2.5 flex items-center gap-2 sm:gap-3">
                        {/* 3D Gold Coin Icon */}
                        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 shadow-md text-amber-950 font-black border border-yellow-200 shrink-0">
                          <Coins className="h-4 w-4 text-amber-950" />
                        </div>
                        <span className="font-sports text-2xl sm:text-4xl font-black tracking-tight text-white drop-shadow-sm">
                          {Number(currentBid || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Right Column: LEADING TEAM */}
                    <div className="border-l border-white/20 pl-3 sm:pl-5">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300">
                        LEADING TEAM
                      </p>

                      {currentBiddingTeam ? (
                        <div className="mt-2 flex items-center gap-2.5 min-w-0">
                          {/* Team logo squircle */}
                          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/80 border border-white/15 p-1.5 shadow-md">
                            <TeamBadge team={currentBiddingTeam} size="sm" shape="rounded" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm sm:text-base font-black text-white leading-tight">
                              {currentBiddingTeam.name}
                            </p>
                            <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Highest Bidder
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/50 border border-white/10 text-white/40">
                            <Gavel className="h-5 w-5" />
                          </div>
                          <span className="text-2xl font-black text-white/50 leading-none">—</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isPhotoExpanded && currentPlayer && (
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label={`${currentPlayer.fullName || currentPlayer.name} photo`}
                      onClick={() => setIsPhotoExpanded(false)}
                      className="fixed inset-0 z-[120] flex h-[100dvh] w-full items-center justify-center bg-black p-0"
                    >
                      <button
                        type="button"
                        autoFocus
                        aria-label="Close expanded photo"
                        onClick={() => setIsPhotoExpanded(false)}
                        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-white/30"
                      >
                        <X className="h-6 w-6" />
                      </button>
                      {showCurrentPlayerPhoto ? (
                        <img
                          src={currentPlayer.photo}
                          alt={currentPlayer.fullName || currentPlayer.name}
                          onClick={(event) => event.stopPropagation()}
                          onError={() => setFailedPlayerPhoto(currentPlayer.photo)}
                          className="h-[100dvh] w-full select-none object-contain"
                        />
                      ) : (
                        <PlayerPortrait
                          photo={null}
                          alt={currentPlayer.fullName || currentPlayer.name}
                          className="h-[100dvh] w-full"
                          teamColor="#1d4ed8"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* ADMIN LIVE BIDDING DOCK (When admin & player is on stage) */}
                {canControlAuction && currentPlayer && (
                  <div className="rounded-[26px] border border-blue-400/25 bg-[#091535] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-blue-200">
                        Quick Bid Increment:
                      </span>
                      <span className="text-xs font-extrabold text-amber-300">
                        Active: +₹{Number(bidIncrement || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Increment Pills */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {bidIncrementOptions.map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          disabled={isSaving}
                          onClick={() => setSelectedIncrement(increment)}
                          className={`rounded-full py-1.5 text-xs font-black transition-all ${
                            selectedIncrement === increment
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20'
                          }`}
                        >
                          +₹{increment}
                        </button>
                      ))}
                    </div>

                    {/* Team Bidding Buttons Grid */}
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200/80 mb-2">
                        Raise bid for franchise:
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {sessionTeams.map((team) => {
                          const remainingPurse = auctionLiveState.teamPurses?.[team.id] ?? purseCap;
                          const nextBid = currentBid + bidIncrement;
                          const exceedsPurse = nextBid > remainingPurse;
                          const isLeading = currentBiddingTeamId === team.id;

                          return (
                            <button
                              key={team.id}
                              type="button"
                              disabled={isSaving || liveStatus !== 'live' || !currentPlayer || bidIncrement <= 0 || exceedsPurse}
                              onClick={() => handleRaiseBid(team.id, bidIncrement)}
                              className={`flex items-center gap-2 rounded-2xl border p-2 text-left transition-all ${
                                isLeading
                                  ? 'border-blue-400 bg-blue-600/30 ring-2 ring-blue-400'
                                  : 'border-white/10 bg-[#071126] hover:border-blue-400/50 hover:bg-blue-900/40'
                              } disabled:opacity-40 disabled:cursor-not-allowed`}
                            >
                              <TeamBadge team={team} size="xs" />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-extrabold text-white">
                                  {team.shortName || team.name}
                                </p>
                                <p className="text-[10px] font-semibold text-blue-200/70">
                                  {exceedsPurse ? 'Limit' : `+₹${bidIncrement}`}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar (Sell / Unsold / Pause) */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        disabled={isSaving || liveStatus !== 'live' || !currentPlayer || !currentBiddingTeamId}
                        onClick={handleSell}
                        className="flex-1 min-h-12 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 font-sports text-sm sm:text-base font-black uppercase text-white shadow-lg shadow-emerald-500/25 hover:scale-102 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Gavel className="h-4 w-4" />
                        <span>Sell to {currentBiddingTeam?.shortName || 'Highest Bidder'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSaving || liveStatus !== 'live' || !currentPlayer}
                        onClick={handleUnsold}
                        className="min-h-12 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-black uppercase text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                      >
                        Mark Unsold
                      </button>

                      {liveStatus !== 'completed' && (
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => performAction(() => setLiveAuctionStatus(liveStatus === 'live' ? 'paused' : 'live', selectedSeason))}
                          className="min-h-12 rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2.5 text-xs font-black uppercase text-amber-200 hover:bg-amber-500/25 disabled:opacity-40"
                        >
                          {liveStatus === 'live' ? 'Pause' : 'Resume'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* SECTION: TEAM INSIGHTS (Matching uploaded screenshot structure) */}
                <section className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-base sm:text-lg font-black text-white tracking-wide">
                      <TrendingUp className="h-5 w-5 text-sky-400" />
                      <span>Team Insights</span>
                    </h4>
                    <span className="text-xs font-semibold text-blue-200/70">
                      {sessionTeams.length} Franchises
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {sessionTeams.map((team) => {
                      const insight = teamInsight(team);
                      const isLeading = currentBiddingTeamId === team.id;
                      const teamColor = team.primaryColor || '#f59e0b';

                      return (
                        <article
                          key={team.id}
                          style={{ borderLeftColor: teamColor }}
                          className={`rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-slate-100 border-l-[6px] transition-all hover:shadow-md relative overflow-hidden ${
                            isLeading ? 'ring-2 ring-blue-500 shadow-md shadow-blue-500/20' : ''
                          }`}
                        >
                          {/* Top Row: Team Badge & Name */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <TeamBadge team={team} size="sm" shape="rounded" />
                              <h5 className="truncate text-base sm:text-lg font-black text-slate-900 tracking-tight">
                                {team.name}
                              </h5>
                            </div>
                            {isLeading && (
                              <span className="shrink-0 rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-black uppercase text-white shadow-xs">
                                Leading Bid
                              </span>
                            )}
                          </div>

                          {/* 3 Columns: Purse Left | Max Bid | Slots Left (Exact columns from user photo) */}
                          <div className="mt-3 grid grid-cols-3 gap-2 text-center border-t border-slate-100 pt-2.5">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Purse Left
                              </p>
                              <p className="mt-0.5 text-sm sm:text-base font-black text-slate-900">
                                {formatPurseRatio(insight.remainingPurse, purseCap)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Max Bid
                              </p>
                              <p className="mt-0.5 text-sm sm:text-base font-black text-slate-900">
                                {formatCompactRupees(insight.maxBid).replace('₹', '')}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Slots Left
                              </p>
                              <p className="mt-0.5 text-sm sm:text-base font-black text-slate-900">
                                {insight.slotsLeft}/{squadSizeLimit}
                              </p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 2: LIVE BID FEED ("Current Big History" of active bidding war) */}
            {activeTab === 'bidTape' && (
              <div className="space-y-4">
                <div className="rounded-[26px] bg-gradient-to-r from-[#0a1838] via-[#12398b] to-[#1c53d4] p-5 text-white shadow-xl">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                        Active Lot Tape
                      </span>
                      <h4 className="text-xl font-black">
                        {currentPlayer ? (currentPlayer.fullName || currentPlayer.name) : 'No Active Player'}
                      </h4>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-extrabold">
                      {auctionLiveState.bidHistory?.length || 0} Bids Placed
                    </span>
                  </div>

                  {currentPlayer && (
                    <div className="mt-4 flex items-center justify-between rounded-2xl bg-black/30 p-3.5 border border-white/10">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-blue-200">Current Highest</p>
                        <p className="text-2xl font-black text-white">{formatRupees(currentBid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-blue-200">Holding Franchise</p>
                        <p className="text-sm font-black text-amber-300">{currentBiddingTeam?.name || 'Opening Bid'}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline of Bids */}
                <section className="rounded-[26px] border border-blue-500/20 bg-[#091535] p-4 sm:p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <h5 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4 text-sky-400" />
                      <span>Live Bidding Log</span>
                    </h5>
                    <span className="text-[10px] font-bold text-blue-200">Latest bids first</span>
                  </div>

                  <div className="space-y-2.5">
                    {auctionLiveState.bidHistory && auctionLiveState.bidHistory.length > 0 ? (
                      auctionLiveState.bidHistory.map((bid, index) => {
                        const isTopBid = index === 0;
                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between gap-3 rounded-2xl p-3 text-xs transition-all ${
                              isTopBid
                                ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-400/40 text-white shadow-sm'
                                : 'bg-[#071126] border border-white/5 text-blue-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                isTopBid ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-slate-300'
                              }`}>
                                #{auctionLiveState.bidHistory.length - index}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate font-black text-white text-sm">{bid.team}</p>
                                <p className="text-[10px] text-blue-200/60">{bid.time || 'Live'}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-sports text-base font-black text-amber-300">
                                {formatRupees(bid.amount)}
                              </span>
                              {isTopBid && (
                                <span className="block text-[9px] font-black uppercase text-emerald-300">
                                  Leading Bid
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-blue-200/60 text-xs">
                        <Activity className="mx-auto h-8 w-8 text-blue-400 mb-2 opacity-60" />
                        <p className="font-bold text-white">No bids recorded yet for this lot.</p>
                        <p className="mt-1">When franchises raise bids, the complete timeline will appear here.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* TAB 3: SOLD TO ALL TEAMS ("Player History Sold to All Teams") */}
            {activeTab === 'soldHistory' && (
              <div className="space-y-4">
                {/* 1. Header Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl bg-[#091535] border border-blue-400/20 p-3.5 text-center">
                    <span className="text-[10px] font-bold uppercase text-blue-200/70 block">Total Sold</span>
                    <span className="text-2xl font-black text-amber-400 font-sports">
                      {allSoldPlayers.length}
                    </span>
                    <span className="text-[10px] text-blue-200/50 block mt-0.5">Players Acquired</span>
                  </div>

                  <div className="rounded-2xl bg-[#091535] border border-blue-400/20 p-3.5 text-center">
                    <span className="text-[10px] font-bold uppercase text-blue-200/70 block">Total Spent</span>
                    <span className="text-2xl font-black text-emerald-400 font-sports truncate block">
                      {formatCompactRupees(totalSpentAcrossTeams)}
                    </span>
                    <span className="text-[10px] text-blue-200/50 block mt-0.5">Across All Teams</span>
                  </div>

                  <div className="rounded-2xl bg-[#091535] border border-blue-400/20 p-3.5 text-center col-span-2 sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-blue-200/70 block">Marquee Buy of Season</span>
                    {marqueeSale ? (
                      <div className="mt-0.5">
                        <p className="text-sm font-black text-white truncate">{marqueeSale.name}</p>
                        <p className="text-xs font-extrabold text-amber-300">
                          {marqueeSale.soldPrice} • {marqueeSale.teamName}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-blue-200/50 mt-1 block">Awaiting First Sale</span>
                    )}
                  </div>
                </div>

                {/* 2. Team Filter Selector Bar */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={() => setSoldTeamFilter('ALL')}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-black transition-all shrink-0 ${
                        soldTeamFilter === 'ALL'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20'
                      }`}
                    >
                      All Franchises ({allSoldPlayers.length})
                    </button>
                    {sessionTeams.map((team) => {
                      const count = getSoldPlayersForTeam(team).length;
                      return (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => setSoldTeamFilter(team.id)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                            soldTeamFilter === team.id
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white/10 text-blue-100 hover:bg-white/20'
                          }`}
                        >
                          <TeamBadge team={team} size="xs" />
                          <span>{team.shortName || team.name}</span>
                          <span className="rounded-full bg-black/30 px-1.5 py-0.2 text-[9px] font-black">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search and Role Filter */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-blue-300" />
                      <input
                        type="text"
                        value={soldSearchQuery}
                        onChange={(e) => setSoldSearchQuery(e.target.value)}
                        placeholder="Search sold players by name..."
                        className="w-full rounded-xl border border-white/10 bg-[#091535] py-2 pl-9 pr-3 text-xs text-white placeholder-blue-300/50 focus:outline-hidden focus:border-blue-400"
                      />
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {['ALL', 'Batsman', 'Bowler', 'All-Rounder', 'Wicketkeeper'].map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSoldRoleFilter(role)}
                          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all shrink-0 ${
                            soldRoleFilter === role
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-white/5 text-blue-200 hover:bg-white/10'
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Sold Players Roster */}
                {filteredSoldPlayers.length > 0 ? (
                  <div className="space-y-4">
                    {/* If ALL teams selected, group by team */}
                    {soldTeamFilter === 'ALL' && !soldSearchQuery ? (
                      sessionTeams.map((team) => {
                        const teamSold = getSoldPlayersForTeam(team);
                        const insight = teamInsight(team);
                        if (teamSold.length === 0) return null;

                        return (
                          <div key={team.id} className="rounded-[24px] border border-blue-500/20 bg-[#091535] p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <TeamBadge team={team} size="sm" shape="rounded" />
                                <div>
                                  <h5 className="font-black text-white text-base leading-tight">{team.name}</h5>
                                  <p className="text-[10px] text-blue-200 font-semibold">
                                    {teamSold.length}/{squadSizeLimit} slots filled • {formatCompactRupees(purseCap - insight.remainingPurse)} spent
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-black text-emerald-400">
                                {formatCompactRupees(insight.remainingPurse)} Left
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {teamSold.map((player, pIdx) => (
                                <div
                                  key={pIdx}
                                  className="flex items-center justify-between rounded-xl bg-white p-3 shadow-xs text-slate-900 border border-slate-100"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                      {player.photo ? (
                                        <img src={player.photo} alt={player.name} className="h-full w-full object-cover object-top" />
                                      ) : (
                                        <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-black text-xs">
                                          {player.name?.[0] || 'P'}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-black text-slate-900 text-sm truncate">{player.name}</p>
                                      <span className="inline-block text-[10px] font-semibold text-slate-500">
                                        {player.role} • Base {player.basePrice}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0">
                                    <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-black text-emerald-700 block font-sports">
                                      {player.soldPrice}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {filteredSoldPlayers.map((player, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-2xl bg-white p-3.5 shadow-sm text-slate-900 border border-slate-100"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                {player.photo ? (
                                  <img src={player.photo} alt={player.name} className="h-full w-full object-cover object-top" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-black text-sm">
                                    {player.name?.[0] || 'P'}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-black text-slate-900 text-sm truncate">{player.name}</p>
                                <p className="text-[11px] font-bold text-blue-700 truncate">{player.teamName}</p>
                                <span className="text-[10px] text-slate-500">
                                  {player.role} • Base {player.basePrice}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-black text-emerald-700 block font-sports">
                                {player.soldPrice}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[26px] border border-dashed border-blue-400/30 bg-[#091535] p-10 text-center text-white">
                    <Trophy className="mx-auto h-10 w-10 text-amber-400 mb-2 opacity-60" />
                    <h5 className="font-black text-base">No Sold Players Found</h5>
                    <p className="mt-1 text-xs text-blue-200/70">
                      {soldSearchQuery || soldRoleFilter !== 'ALL' || soldTeamFilter !== 'ALL'
                        ? 'Try clearing the search or filters to see all auction purchases.'
                        : 'No players have been sold yet in this session.'}
                    </p>
                  </div>
                )}

                {/* 4. Unsold Players Section Toggle */}
                {auctionLiveState.unsoldPlayers && auctionLiveState.unsoldPlayers.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-[#071126] p-3 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowUnsoldDrawer((prev) => !prev)}
                      className="flex w-full items-center justify-between font-bold text-blue-200 hover:text-white"
                    >
                      <span>Unsold Players Pool ({auctionLiveState.unsoldPlayers.length})</span>
                      <span>{showUnsoldDrawer ? 'Hide ▲' : 'Show ▼'}</span>
                    </button>
                    {showUnsoldDrawer && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10">
                        {auctionLiveState.unsoldPlayers.map((u, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-2 text-xs">
                            <div>
                              <span className="text-white font-bold">{u.playerName || u.name}</span>
                              <span className="ml-2 text-slate-400">{u.role} • Base {u.basePrice}</span>
                            </div>
                            {canControlAuction && (
                              <button
                                type="button"
                                disabled={isSaving || Boolean(currentPlayer) || liveStatus === 'completed'}
                                onClick={() => {
                                  setReauctionPlayer(u);
                                  setExceptionReason('');
                                }}
                                className="ml-2 shrink-0 rounded-full border border-amber-400/40 px-2.5 py-1 font-bold text-amber-200 hover:bg-amber-400/10 disabled:opacity-40"
                              >
                                Re-auction
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: TEAM WALLETS & PURSE MANAGEMENT */}
            {activeTab === 'wallets' && (
              <div className="space-y-4">
                <div className="rounded-[26px] bg-gradient-to-r from-[#0a1838] via-[#12398b] to-[#1c53d4] p-5 text-white shadow-xl">
                  <h4 className="text-lg font-black flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-300" />
                    <span>Franchise Financials & Wallet Balance</span>
                  </h4>
                  <p className="text-xs text-blue-200/80 mt-1">
                    Track purse caps, expenditure, squad slots, and maximum bid allowances.
                  </p>
                </div>

                {/* Admin Budget Cap Control */}
                {canControlAuction && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#091535] p-3.5 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      Set Purse Cap per Team (₹):
                      <input
                        type="number"
                        min="1"
                        step="10000"
                        value={purseCapDraft}
                        onChange={(event) => setPurseCapDraft(event.target.value)}
                        disabled={isSaving}
                        className="mt-1 min-h-10 w-full rounded-xl border border-white/15 bg-[#071126] px-3 text-sm font-bold text-white"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSavePurseCap}
                      className="min-h-10 shrink-0 rounded-full bg-blue-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Update Budget'}
                    </button>
                  </div>
                )}

                {canControlAuction && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#091535] p-3.5 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      Minimum Bid Increment (₹):
                      <input
                        type="number"
                        min="1"
                        max={purseCap}
                        step="1"
                        value={minimumBidIncrementDraft}
                        onChange={(event) => setMinimumBidIncrementDraft(event.target.value)}
                        disabled={isSaving}
                        className="mt-1 min-h-10 w-full rounded-xl border border-white/15 bg-[#071126] px-3 text-sm font-bold text-white"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveMinimumBidIncrement}
                      className="min-h-10 shrink-0 rounded-full bg-blue-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Update Minimum'}
                    </button>
                  </div>
                )}

                {canControlAuction && (
                  <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#091535] p-3.5 sm:flex-row sm:items-end">
                    <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      Maximum Squad Size:
                      <input
                        type="number"
                        min="1"
                        max="30"
                        step="1"
                        value={maxSquadSizeDraft}
                        onChange={(event) => setMaxSquadSizeDraft(event.target.value)}
                        disabled={isSaving}
                        className="mt-1 min-h-10 w-full rounded-xl border border-white/15 bg-[#071126] px-3 text-sm font-bold text-white"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveMaxSquadSize}
                      className="min-h-10 shrink-0 rounded-full bg-blue-600 px-5 py-2 text-xs font-black uppercase text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Update Squad Limit'}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sessionTeams.map((team) => {
                    const insight = teamInsight(team);
                    const teamPurseCap = auctionLiveState.teamPurseCaps?.[team.id] ?? purseCap;
                    const spent = teamPurseCap - insight.remainingPurse;
                    const spentPercentage = Math.min(100, Math.round((spent / teamPurseCap) * 100));

                    return (
                      <article key={team.id} className="rounded-2xl bg-[#091535] border border-blue-500/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <TeamBadge team={team} size="sm" shape="rounded" />
                            <div>
                              <h5 className="font-black text-white text-base leading-tight">{team.name}</h5>
                              <p className="text-[10px] text-blue-200">{team.captain ? `Cap: ${team.captain}` : 'Franchise'}</p>
                            </div>
                          </div>
                          <span className="font-sports text-sm font-black text-amber-300">
                            {formatCompactRupees(insight.remainingPurse)} Left
                          </span>
                        </div>

                        {/* Progress bar of purse spent */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-blue-200">
                            <span>Spent: {formatCompactRupees(spent)} ({spentPercentage}%)</span>
                            <span>Cap: {formatCompactRupees(teamPurseCap)}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                            <div
                              style={{ width: `${spentPercentage}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2 text-blue-100">
                          <div>
                            <span className="text-[10px] text-blue-300/70 block">Slots Left:</span>
                            <span className="font-extrabold text-white">{insight.slotsLeft}/{squadSizeLimit}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-blue-300/70 block">Max Permissible Bid:</span>
                            <span className="font-extrabold text-emerald-400">{formatCompactRupees(insight.maxBid)}</span>
                          </div>
                        </div>
                        {canControlAuction && (
                          <div className="flex items-end gap-2 border-t border-white/10 pt-3">
                            <label className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-blue-200">
                              Team Purse Cap (₹)
                              <input
                                type="number"
                                min={spent}
                                step="10000"
                                aria-label={`${team.name} purse cap`}
                                value={teamPurseCapDrafts[team.id] ?? String(teamPurseCap)}
                                onChange={(event) => setTeamPurseCapDrafts((previous) => ({
                                  ...previous,
                                  [team.id]: event.target.value
                                }))}
                                disabled={isSaving}
                                className="mt-1 min-h-9 w-full rounded-lg border border-white/15 bg-[#071126] px-2 text-xs font-bold text-white"
                              />
                            </label>
                            <button
                              type="button"
                              disabled={isSaving || Number(teamPurseCapDrafts[team.id] ?? teamPurseCap) === teamPurseCap}
                              onClick={() => handleSaveTeamPurseCap(team.id)}
                              className="min-h-9 shrink-0 rounded-full bg-blue-600 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-blue-500 disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'audit' && canControlAuction && (
              <section className="space-y-4">
                <header className="rounded-[26px] bg-gradient-to-r from-[#0a1838] via-[#12398b] to-[#1c53d4] p-5 text-white shadow-xl">
                  <h4 className="flex items-center gap-2 text-lg font-black">
                    <History className="h-5 w-5 text-amber-300" />
                    Auction Transaction Audit
                  </h4>
                  <p className="mt-1 text-xs text-blue-200/80">
                    Administrator actions, bids, player outcomes, and rule changes for {selectedSeason}.
                  </p>
                </header>
                {auctionAuditError && <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-950/70 p-3 text-sm text-rose-200">{auctionAuditError}</p>}
                {!auctionAuditError && auctionAuditLog.length === 0 && (
                  <p className="rounded-xl border border-white/10 bg-[#091535] p-5 text-sm text-blue-100">
                    No auction actions have been recorded for this season yet.
                  </p>
                )}
                <ol className="space-y-2">
                  {[...auctionAuditLog].reverse().map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-white/10 bg-[#091535] p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <strong className="text-xs font-black uppercase tracking-wide text-amber-200">
                          {entry.action.replaceAll('_', ' ')}
                        </strong>
                        <time className="text-[10px] text-slate-400" dateTime={entry.timestamp}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </time>
                      </div>
                      <p className="mt-1 text-xs text-blue-100">
                        By {entry.actorId} ({entry.actorRole})
                        {entry.details?.playerId ? ` • Player ${entry.details.playerId}` : ''}
                        {entry.details?.teamId ? ` • Team ${entry.details.teamId}` : ''}
                        {entry.details?.amount ? ` • ₹${Number(entry.details.amount).toLocaleString('en-IN')}` : ''}
                      </p>
                      {entry.details?.reason && (
                        <p className="mt-1 text-xs text-slate-300">Reason: {entry.details.reason}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            )}

          </div>
        </div>
      </div>
      {reauctionPlayer && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="reauction-title" className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-[#091535] p-5 text-white shadow-2xl">
            <h4 id="reauction-title" className="font-sports text-xl font-black">Authorize Re-auction</h4>
            <p className="mt-2 text-sm text-blue-100">
              {reauctionPlayer.playerName || reauctionPlayer.name} was previously marked unsold. Record why this exception is approved.
            </p>
            <label className="mt-4 block text-xs font-bold uppercase tracking-wide text-blue-200">
              Exception reason (5–500 characters)
              <textarea
                autoFocus
                maxLength={500}
                minLength={5}
                value={exceptionReason}
                onChange={(event) => setExceptionReason(event.target.value)}
                className="mt-2 min-h-24 w-full rounded-xl border border-white/15 bg-[#071126] p-3 text-sm normal-case text-white"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={isSaving} onClick={() => setReauctionPlayer(null)} className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                Cancel
              </button>
              <button type="button" disabled={isSaving || exceptionReason.trim().length < 5} onClick={handleReauction} className="rounded-full bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-50">
                {isSaving ? 'Saving…' : 'Confirm Re-auction'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
