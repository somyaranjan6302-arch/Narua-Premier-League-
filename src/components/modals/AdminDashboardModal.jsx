import React, { useState } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import {
  X,
  Shield,
  Users,
  Calendar,
  Trophy,
  Flame,
  Newspaper,
  Image,
  Search,
  Check,
  CheckCircle,
  XCircle,
  Download,
  RotateCcw,
  Plus,
  Edit,
  Save,
  Activity,
  Award
} from 'lucide-react';

export const AdminDashboardModal = ({ onClose }) => {
  const {
    tournamentInfo,
    setTournamentInfo,
    teams,
    setTeams,
    matches,
    updateMatchLiveScore,
    pointsTable,
    setPointsTable,
    auctionRegistrations,
    updateRegistrationStatus,
    champions,
    setChampions,
    news,
    setNews,
    isAdminLoggedIn,
    loginAdmin,
    logoutAdmin,
    resetToFactoryDefaults,
    openModal
  } = useNpl();

  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'livescore' | 'teams' | 'tournament' | 'news'
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');

  // Handle Login
  const handleLogin = (e) => {
    e.preventDefault();
    loginAdmin(pinInput);
  };

  // Quick 1-click test login
  const handleQuickDemoLogin = () => {
    loginAdmin('admin123');
  };

  // Export registrations as CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Role", "Phone", "Location", "Status", "Base Price", "Batting", "Bowling", "Runs", "Wickets"];
    const rows = auctionRegistrations.map(r => [
      r.registrationId,
      r.fullName || r.name,
      r.role,
      r.phone,
      r.location,
      r.status,
      r.basePrice,
      r.battingStyle,
      r.bowlingStyle,
      r.runs,
      r.wickets
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NPL_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRegs = auctionRegistrations.filter(r => {
    if (regStatusFilter !== 'ALL' && r.status !== regStatusFilter) return false;
    if (regSearch.trim() !== '') {
      const q = regSearch.toLowerCase();
      const matchName = (r.fullName || r.name)?.toLowerCase().includes(q);
      const matchId = r.registrationId?.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    return true;
  });

  // Live match for quick scoreboard adjuster
  const liveMatch = matches.find(m => m.status === 'LIVE') || matches[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#070D1E] border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-[#0A142D] to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                ORGANIZER CONTROL CENTER
              </span>
              <h3 className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-none">
                NPL TOURNAMENT DIRECTOR PORTAL
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
              >
                Sign Out
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isAdminLoggedIn ? (
          /* Authentication Screen */
          <div className="p-8 sm:p-16 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-sports text-3xl sm:text-4xl text-white tracking-wide">
                RESTRICTED TOURNAMENT ACCESS
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Enter your League Director PIN or click the demo button to unlock real-time tournament controls.
              </p>
            </div>

            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <input
                type="password"
                placeholder="Enter PIN (e.g. admin123)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-sports text-lg tracking-wider hover:bg-amber-400 transition-colors font-black"
              >
                UNLOCK ADMIN CONSOLE
              </button>

              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="w-full py-2 text-xs text-amber-400 hover:text-amber-300 font-semibold underline"
              >
                ⚡ 1-Click Quick Demo Login (admin123)
              </button>
            </form>
          </div>
        ) : (
          /* Main Admin Panel Dashboard */
          <div className="flex-grow flex flex-col overflow-hidden">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4 bg-slate-950 border-b border-slate-800 text-center text-xs flex-shrink-0">
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrations</span>
                <span className="font-sports text-2xl text-amber-400">{auctionRegistrations.length}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Verified</span>
                <span className="font-sports text-2xl text-emerald-400">
                  {auctionRegistrations.filter(r => r.status === 'VERIFIED' || r.status === 'SHORTLISTED' || r.status === 'AUCTIONED').length}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-amber-300 uppercase font-bold block">Auctioned</span>
                <span className="font-sports text-2xl text-white">
                  {auctionRegistrations.filter(r => r.status === 'AUCTIONED').length}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-blue-400 uppercase font-bold block">Teams</span>
                <span className="font-sports text-2xl text-blue-400">{teams.length}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-purple-400 uppercase font-bold block">Matches</span>
                <span className="font-sports text-2xl text-purple-400">{matches.length}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl flex items-center justify-center">
                <button
                  onClick={resetToFactoryDefaults}
                  className="px-2 py-1 rounded bg-rose-950 border border-rose-800 text-[10px] text-rose-300 font-bold hover:bg-rose-900 transition-colors flex items-center gap-1"
                  title="Restore factory seed data"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Data</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 px-4 bg-[#060D1E] overflow-x-auto flex-shrink-0">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`py-3 px-4 font-sports text-base tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'registrations' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                AUCTION REGISTRATIONS ({auctionRegistrations.length})
              </button>
              <button
                onClick={() => setActiveTab('livescore')}
                className={`py-3 px-4 font-sports text-base tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'livescore' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                LIVE MATCH SCORER
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-3 px-4 font-sports text-base tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'teams' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                POINTS TABLE & TEAMS
              </button>
              <button
                onClick={() => setActiveTab('tournament')}
                className={`py-3 px-4 font-sports text-base tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'tournament' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                EDIT TOURNAMENT SETTINGS
              </button>
            </div>

            {/* Tab 1: Auction Registrations Management */}
            {activeTab === 'registrations' && (
              <div className="p-5 overflow-y-auto space-y-4 flex-grow">
                {/* Search & Action bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:w-64">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white"
                      />
                    </div>

                    <select
                      value={regStatusFilter}
                      onChange={(e) => setRegStatusFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="VERIFIED">Verified</option>
                      <option value="SHORTLISTED">Shortlisted</option>
                      <option value="AUCTIONED">Auctioned</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportCSV}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-amber-400 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => openModal('live-auction-arena')}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-sports tracking-wider hover:bg-amber-400 flex items-center gap-1 font-bold"
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>LAUNCH AUCTION ARENA</span>
                    </button>
                  </div>
                </div>

                {/* Registrations Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold bg-slate-900/60">
                        <th className="py-3 px-3">PLAYER ID</th>
                        <th className="py-3 px-3">FULL NAME</th>
                        <th className="py-3 px-3">ROLE</th>
                        <th className="py-3 px-3">BASE PRICE</th>
                        <th className="py-3 px-3">STATUS</th>
                        <th className="py-3 px-3 text-right">DIRECTOR ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredRegs.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-900/40">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400">
                            {reg.registrationId}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <img src={reg.photo} alt={reg.fullName} className="w-7 h-7 rounded-full object-cover" />
                              <span className="font-bold text-white">{reg.fullName || reg.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {reg.role}
                          </td>
                          <td className="py-3 px-3 font-sports text-base text-slate-200">
                            {reg.basePrice || "₹30,000"}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              reg.status === 'VERIFIED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              reg.status === 'SHORTLISTED' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              reg.status === 'AUCTIONED' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                              reg.status === 'REJECTED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, 'VERIFIED')}
                                className="px-2 py-1 rounded bg-emerald-900/60 border border-emerald-700 text-emerald-300 text-[10px] font-bold hover:bg-emerald-800"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, 'SHORTLISTED')}
                                className="px-2 py-1 rounded bg-amber-900/60 border border-amber-700 text-amber-300 text-[10px] font-bold hover:bg-amber-800"
                              >
                                Shortlist
                              </button>
                              <button
                                onClick={() => updateRegistrationStatus(reg.id, 'REJECTED')}
                                className="px-2 py-1 rounded bg-rose-900/60 border border-rose-700 text-rose-300 text-[10px] font-bold hover:bg-rose-800"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 2: Live Match Scoreboard Adjuster */}
            {activeTab === 'livescore' && (
              <div className="p-6 overflow-y-auto space-y-6 flex-grow">
                <div className="glass-panel-card p-6 rounded-3xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest block">
                        ACTIVE LIVE FIXTURE
                      </span>
                      <h4 className="font-sports text-2xl text-white tracking-wider">
                        {liveMatch?.team1?.name} vs {liveMatch?.team2?.name}
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs uppercase animate-pulse">
                      BROADCAST LIVE
                    </span>
                  </div>

                  {/* Current Score Display */}
                  <div className="grid grid-cols-2 gap-4 text-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400 block">{liveMatch?.team1?.name}</span>
                      <span className="font-sports text-4xl text-amber-400">{liveMatch?.team1?.score}</span>
                      <span className="text-xs text-slate-400 block">({liveMatch?.team1?.overs} ov)</span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-400 block">{liveMatch?.team2?.name}</span>
                      <span className="font-sports text-4xl text-white">{liveMatch?.team2?.score}</span>
                      <span className="text-xs text-slate-400 block">({liveMatch?.team2?.overs} ov)</span>
                    </div>
                  </div>

                  {/* Quick Score Increments */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Add to {liveMatch?.team1?.shortName} Score (Updates Site Header Live):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const [runs, wkts] = liveMatch.team1.score.split('/');
                          const newRuns = parseInt(runs || 0) + 1;
                          updateMatchLiveScore(liveMatch.id, {
                            team1: { ...liveMatch.team1, score: `${newRuns}/${wkts || 0}` }
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-sports text-lg hover:border-amber-500"
                      >
                        +1 Single
                      </button>

                      <button
                        onClick={() => {
                          const [runs, wkts] = liveMatch.team1.score.split('/');
                          const newRuns = parseInt(runs || 0) + 4;
                          updateMatchLiveScore(liveMatch.id, {
                            team1: { ...liveMatch.team1, score: `${newRuns}/${wkts || 0}` }
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400 font-sports text-lg hover:bg-emerald-900"
                      >
                        +4 FOUR!
                      </button>

                      <button
                        onClick={() => {
                          const [runs, wkts] = liveMatch.team1.score.split('/');
                          const newRuns = parseInt(runs || 0) + 6;
                          updateMatchLiveScore(liveMatch.id, {
                            team1: { ...liveMatch.team1, score: `${newRuns}/${wkts || 0}` }
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-950 border border-amber-700 text-amber-400 font-sports text-lg hover:bg-amber-900"
                      >
                        +6 SIX!
                      </button>

                      <button
                        onClick={() => {
                          const [runs, wkts] = liveMatch.team1.score.split('/');
                          const newWkts = Math.min(10, parseInt(wkts || 0) + 1);
                          updateMatchLiveScore(liveMatch.id, {
                            team1: { ...liveMatch.team1, score: `${runs}/${newWkts}` }
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-700 text-rose-400 font-sports text-lg hover:bg-rose-900"
                      >
                        ⚡ WICKET!
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Teams & Points Table Editor */}
            {activeTab === 'teams' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-sports text-xl text-white tracking-wider">
                    EDIT POINTS TABLE & FRANCHISE RECORDS
                  </h4>
                  <span className="text-xs text-slate-400">All edits sync immediately</span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-3">Team</th>
                        <th className="py-2.5 px-2 text-center">Played</th>
                        <th className="py-2.5 px-2 text-center">Won</th>
                        <th className="py-2.5 px-2 text-center">Lost</th>
                        <th className="py-2.5 px-2 text-center">NRR</th>
                        <th className="py-2.5 px-2 text-center">PTS</th>
                        <th className="py-2.5 px-3 text-right">Quick Adj</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {pointsTable.map((row) => (
                        <tr key={row.teamId} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-bold text-white">
                            {row.short} - {row.team}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{row.p}</td>
                          <td className="py-2.5 px-2 text-center text-emerald-400 font-mono font-bold">{row.w}</td>
                          <td className="py-2.5 px-2 text-center text-rose-400 font-mono font-bold">{row.l}</td>
                          <td className="py-2.5 px-2 text-center text-slate-300 font-mono">{row.nrr}</td>
                          <td className="py-2.5 px-2 text-center font-sports text-lg text-amber-400">{row.pts}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setPointsTable(prev => prev.map(p => p.teamId === row.teamId ? { ...p, p: p.p + 1, w: p.w + 1, pts: p.pts + 2 } : p));
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 text-[10px] font-bold"
                              >
                                +1 Win (+2 Pts)
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 4: Tournament Settings Editor */}
            {activeTab === 'tournament' && (
              <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                <h4 className="font-sports text-xl text-white tracking-wider">
                  GENERAL LEAGUE SETTINGS
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Tournament Name</label>
                    <input
                      type="text"
                      value={tournamentInfo.name}
                      onChange={(e) => setTournamentInfo({ ...tournamentInfo, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Tournament Tagline</label>
                    <input
                      type="text"
                      value={tournamentInfo.tagline}
                      onChange={(e) => setTournamentInfo({ ...tournamentInfo, tagline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Auction Date</label>
                    <input
                      type="text"
                      value={tournamentInfo.auctionDate}
                      onChange={(e) => setTournamentInfo({ ...tournamentInfo, auctionDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Registration Deadline</label>
                    <input
                      type="text"
                      value={tournamentInfo.registrationDeadline}
                      onChange={(e) => setTournamentInfo({ ...tournamentInfo, registrationDeadline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1 font-bold">About NPL Story Text</label>
                    <textarea
                      rows={3}
                      value={tournamentInfo.storyText}
                      onChange={(e) => setTournamentInfo({ ...tournamentInfo, storyText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
