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
  Award,
  UserPlus,
  Upload,
  UserRound
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
    topPerformers,
    gallery,
    highlights,
    auctionRegistrations,
    updateRegistrationStatus,
    champions,
    setChampions,
    news,
    setNews,
    isAdminLoggedIn,
    adminUser,
    isAdminAuthLoading,
    siteMedia,
    refreshSiteMedia,
    showToast,
    loginAdmin,
    logoutAdmin,
    resetToFactoryDefaults,
    openModal
  } = useNpl();

  const [adminIdInput, setAdminIdInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [newAdminId, setNewAdminId] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [replacementAdminPassword, setReplacementAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminAccountError, setAdminAccountError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [mediaCategory, setMediaCategory] = useState('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [uploadingMediaKey, setUploadingMediaKey] = useState('');
  const [pendingMediaFiles, setPendingMediaFiles] = useState({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tournamentDraft, setTournamentDraft] = useState(() => ({ ...tournamentInfo }));
  const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'livescore' | 'teams' | 'tournament' | 'news'
  const [regSearch, setRegSearch] = useState('');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    const result = await loginAdmin(adminIdInput, passwordInput);
    if (!result.success) setLoginError(result.error);
  };

  const loadAdminAccounts = async () => {
    const response = await fetch('/api/admin/users');
    if (response.ok) {
      const result = await response.json();
      setAdminAccounts(result.users);
    }
  };

  const handleCreateAdmin = async (event) => {
    event.preventDefault();
    setAdminAccountError('');
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId: newAdminId, password: newAdminPassword })
    });
    const result = await response.json();
    if (!response.ok) {
      setAdminAccountError(result.error || 'Could not create admin account.');
      return;
    }
    setNewAdminId('');
    setNewAdminPassword('');
    await loadAdminAccounts();
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordChangeError('');
    if (replacementAdminPassword !== confirmAdminPassword) {
      setPasswordChangeError('The new passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    try {
      const response = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: replacementAdminPassword
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not change password.');
      setReplacementAdminPassword('');
      setConfirmAdminPassword('');
      showToast('Password changed. Other signed-in sessions have been signed out.');
    } catch (error) {
      setPasswordChangeError(error.message || 'Could not change password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleMediaSelection = (mediaKey, event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setMediaError('Choose a JPG, PNG, WebP, or GIF image.');
      input.value = '';
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMediaError('Images must be 8 MB or smaller.');
      input.value = '';
      return;
    }

    setMediaError('');
    const previewUrl = URL.createObjectURL(file);
    setPendingMediaFiles((current) => {
      if (current[mediaKey]) URL.revokeObjectURL(current[mediaKey].previewUrl);
      return { ...current, [mediaKey]: { file, previewUrl, zoom: 1 } };
    });
    input.value = '';
  };

  const handleMediaZoom = (mediaKey, zoom) => {
    setPendingMediaFiles((current) => ({
      ...current,
      [mediaKey]: { ...current[mediaKey], zoom: Number(zoom) }
    }));
  };

  const createAdjustedImage = async ({ file, previewUrl, zoom = 1 }) => {
    if (zoom === 1) return file;

    const image = new window.Image();
    image.src = previewUrl;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not adjust this image.');

    const outputType = file.type === 'image/jpeg' || file.type === 'image/webp' ? file.type : 'image/png';
    if (outputType === 'image/jpeg') {
      context.fillStyle = '#071026';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const scaledWidth = canvas.width * zoom;
    const scaledHeight = canvas.height * zoom;
    context.drawImage(image, (canvas.width - scaledWidth) / 2, (canvas.height - scaledHeight) / 2, scaledWidth, scaledHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType));
    if (!blob) throw new Error('Could not prepare the adjusted image.');

    const extension = outputType === 'image/jpeg' ? '.jpg' : outputType === 'image/webp' ? '.webp' : '.png';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}${extension}`, { type: outputType });
  };

  const handleMediaUpload = async (mediaKey) => {
    const pendingMedia = pendingMediaFiles[mediaKey];
    if (!pendingMedia) return;

    setMediaError('');
    setUploadingMediaKey(mediaKey);
    const formData = new FormData();
    formData.append('key', mediaKey);

    try {
      formData.append('image', await createAdjustedImage(pendingMedia));
      const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Image upload failed.');
      await refreshSiteMedia();
      URL.revokeObjectURL(pendingMedia.previewUrl);
      setPendingMediaFiles((current) => {
        const next = { ...current };
        delete next[mediaKey];
        return next;
      });
      showToast('Website image updated successfully.');
    } catch (error) {
      setMediaError(error.message || 'Image upload failed.');
    } finally {
      setUploadingMediaKey('');
    }
  };

  const mediaUploadControl = (mediaKey, title, description, fallbackImage = '') => {
    const pendingMedia = pendingMediaFiles[mediaKey];
    return (
    <div key={mediaKey} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 border-b border-slate-800 py-4 last:border-0 xl:grid-cols-[5rem_minmax(0,1fr)_auto] xl:gap-4">
      <label title={`Click to change ${title}`} className="group relative h-16 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-amber-400">
        {(pendingMedia?.previewUrl || siteMedia[mediaKey] || fallbackImage) ? (
          <img src={pendingMedia?.previewUrl || siteMedia[mediaKey] || fallbackImage} alt={`${title} preview`} className="h-full w-full object-cover transition-transform" style={{ transform: `scale(${pendingMedia?.zoom || 1})` }} />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-600"><Image className="h-6 w-6" /></div>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-slate-950/85 py-1 text-[9px] font-bold text-white transition-colors group-hover:bg-amber-500 group-hover:text-slate-950">
          <Upload className="h-3 w-3" />
          Change photo
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-label={`Choose replacement photo for ${title}`}
          className="sr-only"
          disabled={Boolean(uploadingMediaKey)}
          onChange={(event) => handleMediaSelection(mediaKey, event)}
        />
      </label>
      <div className="min-w-0">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="col-span-2 flex items-center justify-start gap-2 xl:col-span-1 xl:justify-end">
        <button
          type="button"
          onClick={() => handleMediaUpload(mediaKey)}
          disabled={!pendingMedia || Boolean(uploadingMediaKey)}
          title={pendingMedia ? `Save ${title}` : 'Choose an image to enable saving'}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-emerald-700 bg-emerald-950 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {uploadingMediaKey === mediaKey ? 'Saving...' : 'Save'}
        </button>
      </div>
      {pendingMedia && (
        <label className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)_3.5rem] items-center gap-3 pt-1 text-xs text-slate-400 xl:col-span-3">
          <span className="font-semibold">Zoom</span>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={pendingMedia.zoom}
            disabled={Boolean(uploadingMediaKey)}
            aria-label={`Adjust zoom for ${title}`}
            onChange={(event) => handleMediaZoom(mediaKey, event.target.value)}
            className="w-full accent-amber-500"
          />
          <output className="text-right font-mono text-slate-300">{Math.round(pendingMedia.zoom * 100)}%</output>
        </label>
      )}
    </div>
    );
  };

  const mediaItems = [
    { key: 'logo', category: 'branding', title: 'NPL logo', description: 'Shown in the header and footer.' },
    { key: 'stadium', category: 'branding', title: 'Stadium image', description: 'Shown on the home and league story pages.', fallback: '/assets/stadium.jpg' },
    { key: 'trophy', category: 'branding', title: 'Championship trophy', description: 'Shown in the trophy showcase.', fallback: '/assets/trophy.jpg' },
    ...champions.map((champion, index) => ({
      key: `champion:${index}`,
      category: 'champions',
      title: `${champion.season} ${champion.edition} • ${champion.championTeam}`,
      description: 'Champion feature photo.',
      fallback: champion.teamPhoto
    })),
    ...teams.flatMap((team) => [
      {
        key: `team:${team.id}`,
        category: 'teams',
        title: `${team.name} banner`,
        description: 'Shown in team details.',
        fallback: team.banner
      },
      {
        key: `team-logo:${team.id}`,
        category: 'teams',
        title: `${team.name} logo`,
        description: 'Shown inside the team badge.',
        fallback: team.logo
      }
    ]),
    ...news.map((article) => ({
      key: `news:${article.id}`,
      category: 'news',
      title: article.headline,
      description: `News image • ${article.category}`,
      fallback: article.image
    })),
    ...gallery.map((item) => ({
      key: `gallery:${item.id}`,
      category: 'gallery',
      title: item.title,
      description: `Gallery photo • ${item.category}`,
      fallback: item.image
    })),
    ...highlights.map((item) => ({
      key: `highlight:${item.id}`,
      category: 'highlights',
      title: item.title,
      description: 'Video highlight thumbnail.',
      fallback: item.thumbnail
    })),
    ...Object.entries(topPerformers).map(([key, performer]) => ({
      key: `performer:${key}`,
      category: 'performers',
      title: `${performer.player} • ${key.replace(/([A-Z])/g, ' $1')}`,
      description: 'Top performer profile photo.',
      fallback: performer.photo
    }))
  ];
  const mediaCategories = [
    { value: 'all', label: 'All image slots' },
    { value: 'branding', label: 'Brand & venue' },
    { value: 'champions', label: 'Champions' },
    { value: 'teams', label: 'Teams' },
    { value: 'news', label: 'News' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'highlights', label: 'Video highlights' },
    { value: 'performers', label: 'Player profiles' }
  ];
  const filteredMediaItems = mediaItems.filter((item) => {
    const matchesCategory = mediaCategory === 'all' || item.category === mediaCategory;
    const searchText = `${item.title} ${item.description}`.toLowerCase();
    return matchesCategory && searchText.includes(mediaSearch.trim().toLowerCase());
  });

  const handleTournamentSave = () => {
    setTournamentInfo(tournamentDraft);
    showToast('Tournament settings saved.');
  };

  const profileMenu = adminUser && (
    <div className="absolute right-0 top-full z-[70] mt-2 max-h-[70vh] w-[min(24rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-700 bg-[#081226] p-4 text-left shadow-2xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400">
          <UserRound className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{adminUser.adminId}</p>
          <p className="text-xs text-amber-300">{adminUser.role === 'owner' ? 'Developer Owner' : 'Administrator'}</p>
        </div>
      </div>
      <div className="space-y-1 py-3 text-xs text-slate-400">
        <p><span className="font-bold text-slate-200">Developer owner:</span> manages admin members and website media.</p>
        <p><span className="font-bold text-slate-200">Administrator:</span> manages tournament operations.</p>
      </div>
      <div className="space-y-3 border-t border-slate-800 pt-3">
        <h4 className="font-sports text-lg text-white">CHANGE PASSWORD</h4>
        <form onSubmit={handlePasswordChange} className="space-y-2">
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            placeholder="New password (6+ characters)"
            aria-label="New password"
            value={replacementAdminPassword}
            onChange={(event) => setReplacementAdminPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          <input
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            value={confirmAdminPassword}
            onChange={(event) => setConfirmAdminPassword(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          />
          {passwordChangeError && <p role="alert" className="text-xs text-rose-400">{passwordChangeError}</p>}
          <button
            type="submit"
            disabled={isSavingPassword}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm font-bold text-emerald-300 hover:bg-emerald-900 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSavingPassword ? 'Saving...' : 'Save new password'}
          </button>
        </form>
      </div>
      {adminUser.role === 'owner' ? (
        <div className="space-y-3 border-t border-slate-800 pt-3">
          <h4 className="font-sports text-lg text-white">ADMIN MEMBERS</h4>
          <form onSubmit={handleCreateAdmin} className="space-y-2">
            <input
              required
              minLength={3}
              maxLength={32}
              pattern="[A-Za-z0-9._-]+"
              autoComplete="off"
              placeholder="New admin ID"
              aria-label="New admin ID"
              value={newAdminId}
              onChange={(event) => setNewAdminId(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            <input
              required
              type="password"
              minLength={6}
              autoComplete="new-password"
              placeholder="Temporary password (6+ characters)"
              aria-label="Temporary password for new admin"
              value={newAdminPassword}
              onChange={(event) => setNewAdminPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
            {adminAccountError && <p role="alert" className="text-xs text-rose-400">{adminAccountError}</p>}
            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400">
              <UserPlus className="h-4 w-4" />
              Add admin member
            </button>
          </form>
          <div className="divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/60">
            {adminAccounts.map((account) => (
              <div key={account.adminId} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                <span className="truncate font-semibold text-white">{account.adminId}</span>
                <span className={account.role === 'owner' ? 'text-amber-300' : 'text-slate-400'}>
                  {account.role === 'owner' ? 'Developer' : 'Admin'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="border-t border-slate-800 pt-3 text-xs text-slate-400">
          Admin members can’t add other admins or change website media.
        </p>
      )}
    </div>
  );

  // Export registrations as CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Name", "Role", "Phone", "Location", "Status", "Batting", "Bowling", "Runs", "Wickets"];
    const rows = auctionRegistrations.map(r => [
      r.registrationId,
      r.fullName || r.name,
      r.role,
      r.phone,
      r.location,
      r.status,
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
        <div className="relative z-20 bg-gradient-to-r from-slate-950 via-[#0A142D] to-slate-950 p-5 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
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

          <div className="relative flex items-center gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={logoutAdmin}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
              >
                Sign Out
              </button>
            )}
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => {
                  const opening = !isProfileOpen;
                  setIsProfileOpen(opening);
                  if (opening && adminUser?.role === 'owner') loadAdminAccounts();
                }}
                aria-label="Open profile menu"
                aria-expanded={isProfileOpen}
                title="Profile and admin members"
                className={`rounded-lg border p-2 transition-colors ${isProfileOpen ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white'}`}
              >
                <UserRound className="h-5 w-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            {isProfileOpen && profileMenu}
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
                Admin access is limited to authorized NPL staff. Sign in with your admin ID and password.
              </p>
            </div>

            {isAdminAuthLoading ? (
              <p className="text-sm text-slate-400">Checking your secure session...</p>
            ) : (
            <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
              <input
                type="text"
                autoComplete="username"
                placeholder="Admin ID"
                value={adminIdInput}
                onChange={(e) => {
                  setAdminIdInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setLoginError('');
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-center text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              {loginError && (
                <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/70 px-3 py-2 text-sm text-rose-300">
                  {loginError.includes('Invalid admin ID or password')
                    ? 'Wrong admin ID or password. Please try again.'
                    : loginError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-sports text-lg tracking-wider hover:bg-amber-400 transition-colors font-black"
              >
                UNLOCK ADMIN CONSOLE
              </button>
            </form>
            )}
          </div>
        ) : (
          /* Main Admin Panel Dashboard */
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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
              {adminUser?.role === 'owner' && (
                <button
                  onClick={() => setActiveTab('media')}
                  className={`py-3 px-4 font-sports text-base tracking-wider whitespace-nowrap transition-colors border-b-2 ${activeTab === 'media' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  OWNER MEDIA
                </button>
              )}
            </div>

            {activeTab === 'media' && adminUser?.role === 'owner' && (
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-6">
                <div className="mb-4">
                  <h4 className="font-sports text-xl text-white">WEBSITE IMAGE LIBRARY</h4>
                  <p className="mt-1 text-xs text-slate-400">Changes appear for every visitor. JPG, PNG, WebP, or GIF up to 8 MB.</p>
                </div>
                <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(12rem,0.7fr)_minmax(14rem,1fr)]">
                  <label className="text-xs font-bold text-slate-400">
                    Image category
                    <select
                      value={mediaCategory}
                      onChange={(event) => setMediaCategory(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-semibold text-white focus:border-amber-500 focus:outline-none"
                    >
                      {mediaCategories.map((category) => (
                        <option key={category.value} value={category.value}>{category.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-400">
                    Find image slot
                    <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 focus-within:border-amber-500">
                      <Search className="h-4 w-4 flex-shrink-0 text-slate-500" />
                      <input
                        type="search"
                        value={mediaSearch}
                        onChange={(event) => setMediaSearch(event.target.value)}
                        placeholder="Search teams, players, or photos"
                        className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </span>
                  </label>
                </div>
                {mediaError && <p role="alert" className="mb-3 rounded-lg border border-rose-800 bg-rose-950/70 px-3 py-2 text-sm text-rose-300">{mediaError}</p>}
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/50 px-4">
                  {filteredMediaItems.length > 0 ? filteredMediaItems.map((item) => (
                    mediaUploadControl(item.key, item.title, item.description, item.fallback)
                  )) : (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">No image slots match that search.</p>
                  )}
                </div>
              </div>
            )}

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
                  <span className="text-xs text-slate-400">Quick actions apply immediately</span>
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
                      value={tournamentDraft.name}
                      onChange={(e) => setTournamentDraft({ ...tournamentDraft, name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Tournament Tagline</label>
                    <input
                      type="text"
                      value={tournamentDraft.tagline}
                      onChange={(e) => setTournamentDraft({ ...tournamentDraft, tagline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Auction Date</label>
                    <input
                      type="text"
                      value={tournamentDraft.auctionDate}
                      onChange={(e) => setTournamentDraft({ ...tournamentDraft, auctionDate: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 font-bold">Registration Deadline</label>
                    <input
                      type="text"
                      value={tournamentDraft.registrationDeadline}
                      onChange={(e) => setTournamentDraft({ ...tournamentDraft, registrationDeadline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1 font-bold">About NPL Story Text</label>
                    <textarea
                      rows={3}
                      value={tournamentDraft.storyText}
                      onChange={(e) => setTournamentDraft({ ...tournamentDraft, storyText: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-end border-t border-slate-800 pt-4">
                  <button
                    type="button"
                    onClick={handleTournamentSave}
                    disabled={JSON.stringify(tournamentDraft) === JSON.stringify(tournamentInfo)}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </button>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
