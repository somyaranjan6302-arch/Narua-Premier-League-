import React, { useMemo, useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { PlayerPortrait } from '../PlayerPortrait';
import { X, Gavel, Radio, Activity, CircleDollarSign, CheckCircle2 } from 'lucide-react';

export const LiveAuctionArenaModal = ({ onClose }) => {
  const {
    teams,
    auctionRegistrations,
    auctionLiveState,
    auctionSyncStatus,
    selectedSeason,
    isAdminLoggedIn,
    callLiveAuctionPlayer,
    setLiveAuctionStatus,
    placeLiveBid,
    sellLivePlayer,
    markLivePlayerUnsold
  } = useNpl();

  const eligiblePlayers = auctionRegistrations.filter((player) =>
    player.season === selectedSeason && ['VERIFIED', 'SHORTLISTED'].includes(player.status)
  );
  const currentPlayer = auctionLiveState.currentPlayer;
  const currentBid = auctionLiveState.currentBid || 0;
  const currentBiddingTeamId = auctionLiveState.currentBiddingTeam;
  const currentBiddingTeam = teams.find(t => t.id === currentBiddingTeamId);
  const sessionTeams = useMemo(() => teams.filter((team) => {
    const sessions = Array.isArray(team.sessions) ? team.sessions
      : Array.isArray(team.seasons) ? team.seasons
        : team.session ? [team.session] : [selectedSeason];
    return sessions.includes(selectedSeason);
  }), [selectedSeason, teams]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedIncrement, setSelectedIncrement] = useState(25000);
  const [isSaving, setIsSaving] = useState(false);
  const [auctionError, setAuctionError] = useState('');
  const selectedPlayer = eligiblePlayers.find((player) => player.id === selectedPlayerId);
  const liveStatus = auctionLiveState.status || 'waiting';

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
    const nextAmount = currentBid + increment;
    performAction(() => placeLiveBid(teamId, nextAmount, selectedSeason));
  };

  const handleSell = () => {
    if (!currentPlayer || !currentBiddingTeamId) return;
    performAction(() => sellLivePlayer(currentPlayer, currentBiddingTeamId, currentBid, selectedSeason));
  };

  const handleUnsold = () => {
    if (currentPlayer) performAction(() => markLivePlayerUnsold(currentPlayer, selectedSeason));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-auction-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-lg sm:p-4"
    >
      <div className="relative w-full max-w-6xl bg-[#070E20] border-2 border-amber-500/50 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0C1733] to-slate-950 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Gavel className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                {isAdminLoggedIn ? 'AUCTION CONTROL ROOM' : 'LIVE AUCTION BROADCAST'}
              </span>
              <h3 id="live-auction-title" className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-none">
                NPL MEGA AUCTION ARENA • {selectedSeason.toUpperCase()}
              </h3>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase sm:inline-flex ${
              auctionSyncStatus === 'online'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${auctionSyncStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {auctionSyncStatus === 'online' ? 'Live updates connected' : 'Reconnecting'}
            </span>
            <button
              onClick={onClose}
              aria-label="Close live auction"
              className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body Grid: Left Hammer Stage (7 cols) + Right Teams Purse & History (5 cols) */}
        <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Player on the Hammer */}
          <div className="lg:col-span-7 space-y-6">
            {/* Player Selector Strip */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                  liveStatus === 'live' ? 'bg-rose-500/15 text-rose-300' :
                    liveStatus === 'paused' ? 'bg-amber-500/15 text-amber-300' :
                      liveStatus === 'completed' ? 'bg-slate-700 text-slate-300' : 'bg-sky-500/15 text-sky-300'
                }`}>
                  {liveStatus === 'live' ? <Radio className="h-3 w-3 animate-pulse" /> : <Activity className="h-3 w-3" />}
                  {liveStatus}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {currentPlayer
                    ? 'Player on the auction stage'
                    : isAdminLoggedIn
                      ? `${eligiblePlayers.length} approved players ready for auction`
                      : 'Watching for the next player announcement'}
                </span>
              </div>
              {isAdminLoggedIn && (
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:ml-4 sm:max-w-xl sm:flex-row">
                  <select
                    value={selectedPlayerId}
                    onChange={(event) => setSelectedPlayerId(event.target.value)}
                    disabled={isSaving || liveStatus === 'completed'}
                    aria-label="Choose player for auction"
                    className="min-h-10 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
                  >
                    <option value="">Select an eligible player</option>
                    {eligiblePlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.fullName || player.name} • {player.role}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedPlayer || isSaving || liveStatus === 'completed'}
                    onClick={() => performAction(() => callLiveAuctionPlayer(selectedPlayer, selectedSeason))}
                    className="min-h-10 shrink-0 rounded-lg border border-amber-600 bg-amber-500 px-4 py-2 text-xs font-black uppercase text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Call player
                  </button>
                </div>
              )}
            </div>

            {/* Main Stage Spotlight Card */}
            {currentPlayer ? (
              <div className="glass-panel-gold relative overflow-hidden rounded-3xl border-2 border-amber-500/50 p-4 shadow-2xl sm:p-6">
                <div className="relative mx-auto aspect-[2/3] w-full max-w-[19rem] overflow-hidden rounded-2xl border border-blue-300/30 bg-[#102d71] shadow-2xl shadow-blue-950/40">
                  <PlayerPortrait
                    photo={currentPlayer.photo}
                    alt={currentPlayer.fullName || currentPlayer.name}
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-transparent to-[#071a4d]" />
                  <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
                    <span className="rounded-md border border-white/25 bg-slate-950/65 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                      NPL AUCTION
                    </span>
                    <span className="rounded-md border border-white/25 bg-slate-950/65 px-2 py-1 text-[9px] font-mono font-bold text-white">
                      {currentPlayer.registrationId || 'PLAYER'}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#06163f] via-[#123b87]/95 to-[#1d4ed8]/80 px-4 pb-4 pt-12 text-center">
                    <span className="inline-flex max-w-full rounded-full border border-blue-200/40 bg-slate-950/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-blue-100">
                      {currentPlayer.role || 'Cricketer'}
                    </span>
                    <h3 className="mt-2 break-words font-sports text-2xl uppercase leading-none tracking-wide text-white drop-shadow-lg sm:text-3xl">
                      {currentPlayer.fullName || currentPlayer.name}
                    </h3>
                    <div className="mt-3 border-t border-blue-100/20 pt-2">
                      <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-blue-100/70">
                        Base Price
                      </span>
                      <span className="mt-0.5 block font-sports text-xl text-white">
                        {currentPlayer.basePrice || '₹30,000'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Current Bid Box */}
                <div className="mt-6 p-4 rounded-2xl bg-slate-950 border-2 border-amber-500/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {currentBiddingTeam ? 'CURRENT HIGHEST BID' : 'OPENING BID'}
                    </span>
                    <div className="font-sports text-4xl sm:text-5xl text-amber-400 leading-none mt-1">
                      ₹{currentBid.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      BIDDING FRANCHISE
                    </span>
                    {currentBiddingTeam ? (
                      <div className="flex items-center gap-2 mt-1 justify-end">
                        <TeamBadge team={currentBiddingTeam} size="sm" />
                        <span className="font-sports text-xl text-white">
                          {currentBiddingTeam.shortName || currentBiddingTeam.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic mt-1 block">
                        Waiting for the first franchise bid...
                      </span>
                    )}
                  </div>
                </div>

                {isAdminLoggedIn && (
                  <div className="mt-6 space-y-3 border-t border-slate-800 pt-4">
                    <div className="flex flex-wrap gap-2">
                      {[1000, 5000, 10000, 25000].map((increment) => (
                        <button
                          key={increment}
                          type="button"
                          disabled={isSaving}
                          onClick={() => setSelectedIncrement(increment)}
                          aria-pressed={selectedIncrement === increment}
                          className={`min-h-10 rounded-lg border px-3 py-2 text-xs font-black transition ${
                            selectedIncrement === increment
                              ? 'border-amber-400 bg-amber-500 text-slate-950'
                              : 'border-amber-700/60 bg-amber-950/50 text-amber-200 hover:bg-amber-900'
                          }`}
                        >
                          +₹{increment.toLocaleString('en-IN')} per bid
                        </button>
                      ))}
                    </div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Register the bidding franchise
                    </span>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {sessionTeams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          disabled={isSaving || liveStatus !== 'live' || !currentPlayer}
                          onClick={() => handleRaiseBid(team.id, selectedIncrement)}
                          className={`flex min-h-12 items-center gap-2 rounded-xl border p-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                            currentBiddingTeamId === team.id
                              ? 'border-amber-400 bg-amber-500/15'
                              : 'border-slate-800 bg-slate-900 hover:border-amber-500/50 hover:bg-slate-800'
                          }`}
                        >
                          <TeamBadge team={team} size="xs" />
                          <span className="min-w-0 truncate text-xs font-bold text-white">{team.shortName || team.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row">
                      {liveStatus !== 'completed' && (
                        <button
                          type="button"
                          disabled={isSaving || (liveStatus !== 'live' && !currentPlayer)}
                          onClick={() => performAction(() => setLiveAuctionStatus(liveStatus === 'live' ? 'paused' : 'live', selectedSeason))}
                          className="min-h-12 flex-1 rounded-xl border border-sky-700 bg-sky-950/70 px-4 py-3 text-sm font-black uppercase text-sky-200 hover:bg-sky-900 disabled:opacity-40"
                        >
                          {liveStatus === 'live' ? 'Pause bidding' : liveStatus === 'paused' ? 'Resume live auction' : 'Start live auction'}
                        </button>
                      )}
                      {liveStatus !== 'completed' && (
                        <button
                          type="button"
                          disabled={isSaving || Boolean(currentPlayer)}
                          onClick={() => performAction(() => setLiveAuctionStatus('completed', selectedSeason))}
                          className="min-h-12 rounded-xl border border-rose-800 bg-rose-950/50 px-4 py-3 text-xs font-black uppercase text-rose-300 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Close auction
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isSaving || liveStatus !== 'live' || !currentPlayer || !currentBiddingTeamId}
                        onClick={handleSell}
                        className="min-h-12 flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-sports text-lg font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Gavel className="h-5 w-5" />
                        Sell to highest bidder
                      </button>
                      <button
                        type="button"
                        disabled={isSaving || liveStatus !== 'live' || !currentPlayer}
                        onClick={handleUnsold}
                        className="min-h-12 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-xs font-black uppercase text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mark unsold
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center sm:p-12">
                <Gavel className="mx-auto h-10 w-10 text-amber-400" />
                <p className="mt-3 font-sports text-xl text-white">
                  {liveStatus === 'completed' ? 'AUCTION CLOSED' : 'WAITING FOR THE NEXT PLAYER'}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  {isAdminLoggedIn
                    ? 'Select an eligible player above and call them to the auction stage.'
                    : 'The auctioneer will announce the next player here. Live updates refresh automatically.'}
                </p>
              </div>
            )}
            {auctionError && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">{auctionError}</p>}
          </div>

          {/* Right Column: Franchise Purse & Sold Players Live Ledger */}
          <div className="lg:col-span-5 space-y-6">
            {/* Franchise Purses Table */}
            <div className="glass-panel-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="flex items-center gap-2 font-sports text-lg tracking-wider text-white">
                  <CircleDollarSign className="h-4 w-4 text-amber-300" />
                  FRANCHISE REMAINING PURSES
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">CAP: ₹50 LAKHS</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {sessionTeams.map(t => {
                  const purse = auctionLiveState.teamPurses[t.id] ?? 5000000;
                  return (
                    <div key={t.id} className="min-w-0 rounded-xl border border-slate-800/80 bg-slate-950/80 p-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <TeamBadge team={t} size="xs" />
                        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-200" title={t.name}>
                          {t.shortName || t.name}
                        </span>
                      </div>
                      <span className="mt-1 block text-right font-mono text-xs font-bold text-amber-400">
                        ₹{(purse / 100000).toFixed(1)}L
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-panel-card rounded-2xl border border-sky-800/60 p-4">
              <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="flex items-center gap-2 font-sports text-lg tracking-wider text-white">
                  <Activity className="h-4 w-4 text-sky-300" />
                  LIVE BID TAPE
                </h4>
                <span className={`text-[10px] font-bold uppercase ${auctionSyncStatus === 'online' ? 'text-sky-300' : 'text-rose-300'}`}>
                  {auctionSyncStatus === 'online' ? 'Live updates' : 'Reconnecting'}
                </span>
              </div>
              <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                {auctionLiveState.bidHistory?.length ? auctionLiveState.bidHistory.map((bid, index) => (
                  <div key={`${bid.team}-${bid.amount}-${bid.time}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs">
                    <span className="min-w-0 truncate font-bold text-slate-200">{bid.team}</span>
                    <span className="shrink-0 font-mono font-bold text-amber-300">₹{bid.amount.toLocaleString('en-IN')}</span>
                    <time className="shrink-0 text-slate-500">{bid.time}</time>
                  </div>
                )) : (
                  <p className="py-3 text-center text-xs text-slate-500">No bids have been recorded for this player yet.</p>
                )}
              </div>
            </div>

            {/* Sold Players Table */}
            <div className="glass-panel-card p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="flex items-center gap-2 font-sports text-lg tracking-wider text-white">
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  SOLD PLAYERS LEDGER
                </h4>
                <span className="text-xs font-bold text-emerald-400">
                  {auctionLiveState.soldPlayers?.length || 0} SOLD
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {auctionLiveState.unsoldPlayers?.length || 0} UNSOLD
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {auctionLiveState.soldPlayers && auctionLiveState.soldPlayers.length > 0 ? (
                  auctionLiveState.soldPlayers.map((sp, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white block">
                          {sp.playerName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {sp.role} • Base {sp.basePrice}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-sports text-base text-amber-400 block leading-tight">
                          {sp.soldPrice}
                        </span>
                        <span className="text-[10px] font-bold text-slate-300">
                          Sold to {sp.teamShort || sp.team}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No players sold yet in this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
