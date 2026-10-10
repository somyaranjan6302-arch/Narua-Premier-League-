import React, { useState, useEffect, useRef } from 'react';
import { useNpl } from '../../context/NplContext';
import { TeamBadge } from '../TeamBadge';
import { SessionSelector } from '../SessionSelector';
import { ImageCropEditor } from '../ImageCropEditor';
import { getSessionMediaKey } from '../../utils/siteMedia';
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
  Trash2,
  Edit,
  Save,
  Activity,
  Award,
  UserPlus,
  Upload,
  UserRound
} from 'lucide-react';

const getTeamSessions = (team, seasonEditions) => {
  if (Array.isArray(team.sessions)) return team.sessions;
  if (Array.isArray(team.seasons)) return team.seasons;
  if (team.session) return [team.session];
  return seasonEditions;
};

const mediaInfoFields = {
  team: [
    { key: 'name', label: 'Team name' },
    { key: 'shortName', label: 'Short name' },
    { key: 'primaryColor', label: 'Primary color' },
    { key: 'secondaryColor', label: 'Secondary color' },
    { key: 'captain', label: 'Captain' },
    { key: 'owner', label: 'Owner' },
    { key: 'home', label: 'Home ground' },
    { key: 'slogan', label: 'Team slogan' }
  ],
  player: [
    { key: 'name', label: 'Player name' },
    { key: 'role', label: 'Role' },
    { key: 'style', label: 'Playing style' },
    { key: 'age', label: 'Age', numeric: true },
    { key: 'runs', label: 'Runs', numeric: true },
    { key: 'wickets', label: 'Wickets', numeric: true },
    { key: 'dismissals', label: 'Dismissals', numeric: true },
    { key: 'strikeRate', label: 'Strike rate' },
    { key: 'economy', label: 'Economy' },
    { key: 'bestScore', label: 'Best batting' },
    { key: 'bestBowling', label: 'Best bowling' },
    { key: 'details', label: 'Profile details', multiline: true }
  ],
  champion: [
    { key: 'championTeam', label: 'Champion team' },
    { key: 'season', label: 'Season year' },
    { key: 'edition', label: 'Season / edition' },
    { key: 'championShort', label: 'Champion short name' },
    { key: 'captain', label: 'Captain' },
    { key: 'runnerUp', label: 'Runner-up' },
    { key: 'runnerUpShort', label: 'Runner-up short name' },
    { key: 'winningMargin', label: 'Winning margin' },
    { key: 'finalScores', label: 'Final scores', multiline: true },
    { key: 'venue', label: 'Venue' },
    { key: 'playerOfFinal', label: 'Player of the final' },
    { key: 'description', label: 'Description', multiline: true }
  ],
  news: [
    { key: 'headline', label: 'Headline' },
    { key: 'category', label: 'Category' },
    { key: 'date', label: 'Date' },
    { key: 'snippet', label: 'Caption / summary', multiline: true },
    { key: 'fullContent', label: 'Article content', multiline: true }
  ],
  highlight: [
    { key: 'title', label: 'Title' },
    { key: 'season', label: 'Season' },
    { key: 'duration', label: 'Duration' },
    { key: 'views', label: 'Views label' },
    { key: 'description', label: 'Description', multiline: true }
  ],
  performer: [
    { key: 'player', label: 'Player name' },
    { key: 'team', label: 'Team' },
    { key: 'category', label: 'Category' },
    { key: 'stat', label: 'Stat' },
    { key: 'details', label: 'Description', multiline: true }
  ],
  legacyPhoto: [
    { key: 'title', label: 'Title' },
    { key: 'caption', label: 'Caption', multiline: true }
  ]
};

export const AdminDashboardModal = ({ onClose }) => {
  const {
    tournamentInfo,
    setTournamentInfo,
    teams,
    setTeams,
    seasons,
    setSeasons,
    selectedSeason,
    setSelectedSeason,
    matches,
    setMatches,
    updateMatchLiveScore,
    pointsTable,
    setPointsTable,
    seasonStandings,
    setSeasonStandings,
    topPerformers,
    setTopPerformers,
    gallery,
    setGallery,
    legacyPhotos,
    setLegacyPhotos,
    highlights,
    setHighlights,
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
  const [mediaCropFiles, setMediaCropFiles] = useState({});
  const [mediaSessionSelections, setMediaSessionSelections] = useState({});
  const mediaPreviewUrls = useRef(new Set());
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tournamentDraft, setTournamentDraft] = useState(() => ({ ...tournamentInfo }));
  const [teamSessionFocus, setTeamSessionFocus] = useState(selectedSeason || seasons[0]?.edition || 'Season 5');
  const [isSessionWorkspaceOpen, setIsSessionWorkspaceOpen] = useState(false);
  const [alsoAddNextSeason, setAlsoAddNextSeason] = useState(false);
  const [teamDraft, setTeamDraft] = useState({
    name: '',
    shortName: '',
    captain: '',
    owner: '',
    home: '',
    primaryColor: '#F59E0B',
    secondaryColor: '#0F172A',
    slogan: '',
    sessions: [selectedSeason || seasons[0]?.edition || 'Season 5']
  });

  const createMediaPreviewUrl = (file) => {
    const previewUrl = URL.createObjectURL(file);
    mediaPreviewUrls.current.add(previewUrl);
    return previewUrl;
  };

  const revokeMediaPreviewUrl = (previewUrl) => {
    if (!previewUrl || !mediaPreviewUrls.current.delete(previewUrl)) return;
    URL.revokeObjectURL(previewUrl);
  };

  useEffect(() => () => {
    mediaPreviewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    mediaPreviewUrls.current.clear();
  }, []);
  const [teamError, setTeamError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [matchDraft, setMatchDraft] = useState({
    team1Id: '',
    team2Id: '',
    matchNumber: '',
    tournamentPhase: 'League',
    date: '',
    time: '',
    venue: 'Narua Bada Padia',
    status: 'UPCOMING'
  });
  const [galleryDraft, setGalleryDraft] = useState({
    title: '',
    category: 'MATCH DAY',
    caption: '',
    date: '',
    season: selectedSeason
  });
  const [editingGalleryItemId, setEditingGalleryItemId] = useState(null);
  const [editingMediaInfo, setEditingMediaInfo] = useState(null);
  const [mediaInfoDraft, setMediaInfoDraft] = useState({});
  const nextTeamSession = `Season ${(Number(teamSessionFocus.match(/\d+/)?.[0]) || 0) + 1}`;

  const ensureTeamSessionExists = (edition) => {
    if (seasons.some((season) => season.edition === edition)) return;

    const currentSeasonYear = Number(tournamentInfo.currentSeason.match(/\((\d{4})\)/)?.[1]) || new Date().getFullYear();
    setSeasons((previousSeasons) => previousSeasons.some((season) => season.edition === edition)
      ? previousSeasons
      : [{ edition, season: String(currentSeasonYear), year: String(currentSeasonYear), status: 'UPCOMING', teamsCount: 0, matchesCount: 0 }, ...previousSeasons]);
  };
  useEffect(() => {
    setTeamSessionFocus((current) => current || selectedSeason || seasons[0]?.edition || 'Season 5');
    setTeamDraft((current) => ({ ...current, sessions: current.sessions?.length ? current.sessions : [selectedSeason || seasons[0]?.edition || 'Season 5'] }));
  }, [selectedSeason, seasons]);
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

  const handleAddSessionMatch = (event) => {
    event.preventDefault();
    if (adminUser?.role !== 'owner') {
      setMatchError('Only the developer can add fixtures.');
      return;
    }

    const sessionTeams = teams.filter((team) => getTeamSessions(team, seasons.map((season) => season.edition)).includes(selectedSeason));
    const team1 = sessionTeams.find((team) => team.id === matchDraft.team1Id);
    const team2 = sessionTeams.find((team) => team.id === matchDraft.team2Id);
    if (!team1 || !team2 || team1.id === team2.id) {
      setMatchError('Choose two different teams assigned to this session.');
      return;
    }

    const match = {
      id: `match-${Date.now()}`,
      season: selectedSeason,
      matchNumber: matchDraft.matchNumber.trim() || `Match ${matches.filter((item) => item.season === selectedSeason).length + 1}`,
      tournamentPhase: matchDraft.tournamentPhase,
      date: matchDraft.date,
      time: matchDraft.time,
      venue: matchDraft.venue.trim() || 'Narua Bada Padia',
      status: matchDraft.status,
      team1: { id: team1.id, name: team1.name, shortName: team1.shortName, score: '0/0', overs: '0' },
      team2: { id: team2.id, name: team2.name, shortName: team2.shortName, score: '0/0', overs: '0' }
    };

    setMatches((previousMatches) => [match, ...previousMatches]);
    setMatchDraft((current) => ({ ...current, team1Id: '', team2Id: '', matchNumber: '' }));
    setMatchError('');
    showToast(`${match.matchNumber} was added to ${selectedSeason}.`);
  };

  const handleRemoveSessionMatch = () => {
    if (adminUser?.role !== 'owner' || !liveMatch) return;
    setMatches((previousMatches) => previousMatches.filter((match) => match.id !== liveMatch.id));
    showToast(`${liveMatch.matchNumber} was removed from ${selectedSeason}.`);
  };

  const handleAddSessionGalleryItem = (event) => {
    event.preventDefault();
    if (adminUser?.role !== 'owner') return;

    const title = galleryDraft.title.trim();
    if (!title) {
      showToast('Enter a title for the gallery photo.', 'error');
      return;
    }

    if (editingGalleryItemId) {
      setGallery((previousGallery) => previousGallery.map((item) => (
        item.id === editingGalleryItemId
          ? {
              ...item,
              season: galleryDraft.season || selectedSeason,
              category: galleryDraft.category,
              title,
              caption: galleryDraft.caption.trim(),
              date: galleryDraft.date.trim()
            }
          : item
      )));
      showToast(`"${title}" was updated.`);
      setEditingGalleryItemId(null);
      setGalleryDraft({ title: '', category: 'MATCH DAY', caption: '', date: '', season: selectedSeason });
      return;
    }

    const newItem = {
      id: `gallery-${Date.now()}`,
      season: selectedSeason,
      category: galleryDraft.category,
      title,
      caption: galleryDraft.caption.trim(),
      image: '/assets/stadium.jpg',
      date: galleryDraft.date.trim() || selectedSeason
    };
    setGallery((previousGallery) => [newItem, ...previousGallery]);
    setGalleryDraft({ title: '', category: 'MATCH DAY', caption: '', date: '', season: selectedSeason });
    showToast(`Gallery photo slot added to ${selectedSeason}. Upload its image in Owner Media.`);
  };

  const handleEditSessionGalleryItem = (item) => {
    setEditingGalleryItemId(item.id);
    setGalleryDraft({
      title: item.title || '',
      category: item.category || 'MATCH DAY',
      caption: item.caption || '',
      date: item.date || '',
      season: item.season || item.session || selectedSeason
    });
  };

  const handleCancelGalleryEdit = () => {
    setEditingGalleryItemId(null);
    setGalleryDraft({ title: '', category: 'MATCH DAY', caption: '', date: '', season: selectedSeason });
  };

  const handleRemoveSessionGalleryItem = async (itemId) => {
    if (adminUser?.role !== 'owner') return;
    const targetItem = gallery.find((item) => item.id === itemId);
    if (!targetItem || !window.confirm(`Delete “${targetItem.title}” and its uploaded image? This cannot be undone.`)) return;

    setMediaError('');
    try {
      await deleteMediaImage(`gallery:${targetItem.id}`, false);
      await refreshSiteMedia();
    } catch (error) {
      setMediaError(error.message || 'The gallery photo could not be deleted.');
      return;
    }

    setGallery((previousGallery) => previousGallery.filter((item) => item.id !== itemId));
    if (editingGalleryItemId === itemId) handleCancelGalleryEdit();
    showToast(`"${targetItem.title}" was deleted from the gallery.`);
  };

  const handleGallerySeasonChange = (itemId, season) => {
    setGallery((previousGallery) => previousGallery.map((item) => (
      item.id === itemId ? { ...item, season } : item
    )));
  };

  const handleAddLegacyPhoto = () => {
    if (adminUser?.role !== 'owner') return;
    const id = `memory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setLegacyPhotos((previousPhotos) => [{ id }, ...previousPhotos]);
    setMediaCategory('memories');
    showToast('Photo slot added. Choose and save its image below.');
  };

  const handleAddTeam = (event) => {
    event.preventDefault();
    if (adminUser?.role !== 'owner') {
      setTeamError('Only the developer can add or remove team records.');
      return;
    }

    const cleanName = teamDraft.name.trim();
    const cleanShortName = teamDraft.shortName.trim() || cleanName.slice(0, 18);
    const cleanCaptain = teamDraft.captain.trim();
    const cleanOwner = teamDraft.owner.trim();
    const cleanHome = teamDraft.home.trim();
    const targetSessions = alsoAddNextSeason
      ? [teamSessionFocus, nextTeamSession]
      : [teamSessionFocus];

    if (!cleanName || !cleanCaptain || !cleanOwner || !cleanHome) {
      setTeamError('Name, captain, owner, and home ground are required.');
      return;
    }

    const teamSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `team-${Date.now()}`;
    const newTeams = targetSessions.map((session) => ({
      id: `${teamSlug}-${session.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: cleanName,
      shortName: cleanShortName,
      captain: cleanCaptain,
      owner: cleanOwner,
      home: cleanHome,
      primaryColor: teamDraft.primaryColor || '#F59E0B',
      secondaryColor: teamDraft.secondaryColor || '#0F172A',
      slogan: teamDraft.slogan.trim() || 'Built for glory',
      sessions: [session],
      titles: 0,
      matches: 0,
      wins: 0,
      losses: 0,
      winPercentage: 0,
      banner: '/assets/stadium.jpg',
      squad: []
    }));

    if (alsoAddNextSeason) ensureTeamSessionExists(nextTeamSession);

    setTeams((previousTeams) => [...newTeams, ...previousTeams]);
    setTeamDraft({
      name: '',
      shortName: '',
      captain: '',
      owner: '',
      home: '',
      primaryColor: '#F59E0B',
      secondaryColor: '#0F172A',
      slogan: '',
      sessions: [teamSessionFocus]
    });
    setTeamError('');
    setAlsoAddNextSeason(false);
    showToast(`${cleanName} has been added to ${targetSessions.join(' and ')}.`);
  };

  const handleCopyTeamToNextSession = (team) => {
    if (adminUser?.role !== 'owner') {
      showToast('Only the developer can add team records.', 'error');
      return;
    }

    const alreadyInNextSession = teams.some((candidate) => (
      candidate.name === team.name &&
      getTeamSessions(candidate, seasons.map((season) => season.edition)).includes(nextTeamSession)
    ));
    if (alreadyInNextSession) {
      showToast(`${team.name} is already in ${nextTeamSession}.`, 'error');
      return;
    }

    ensureTeamSessionExists(nextTeamSession);
    const teamSlug = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const nextSessionSlug = nextTeamSession.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const nextSeasonCopy = {
      ...team,
      id: `${teamSlug}-${nextSessionSlug}`,
      sessions: [nextTeamSession],
      squad: Array.isArray(team.squad) ? team.squad.map((player) => ({ ...player })) : []
    };

    setTeams((previousTeams) => [nextSeasonCopy, ...previousTeams]);
    showToast(`${team.name} has been added to ${nextTeamSession}.`);
  };

  const handleRemoveTeam = (teamId) => {
    if (adminUser?.role !== 'owner') {
      showToast('Only the developer can remove team records.', 'error');
      return;
    }

    const targetTeam = teams.find((team) => team.id === teamId);
    if (!targetTeam) return;

    setTeams((previousTeams) => previousTeams.map((team) => {
      if (team.id !== teamId) return team;

      const currentSessions = getTeamSessions(team, seasons.map((season) => season.edition));
      const nextSessions = currentSessions.filter((session) => session !== teamSessionFocus);
      return { ...team, sessions: nextSessions };
    }));

    showToast(`${targetTeam.name} was removed from ${teamSessionFocus} only.`);
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
    revokeMediaPreviewUrl(mediaCropFiles[mediaKey]?.previewUrl);
    revokeMediaPreviewUrl(pendingMediaFiles[mediaKey]?.previewUrl);
    const previewUrl = createMediaPreviewUrl(file);
    setMediaCropFiles((current) => ({ ...current, [mediaKey]: { file, previewUrl } }));
    setPendingMediaFiles((current) => {
      const next = { ...current };
      delete next[mediaKey];
      return next;
    });
    input.value = '';
  };

  const handleMediaCrop = (mediaKey, file) => {
    const previewUrl = createMediaPreviewUrl(file);
    revokeMediaPreviewUrl(pendingMediaFiles[mediaKey]?.previewUrl);
    revokeMediaPreviewUrl(mediaCropFiles[mediaKey]?.previewUrl);
    setPendingMediaFiles((current) => ({ ...current, [mediaKey]: { file, previewUrl } }));
    setMediaCropFiles((current) => {
      const next = { ...current };
      delete next[mediaKey];
      return next;
    });
  };

  const handleMediaUpload = async (mediaKey) => {
    const pendingMedia = pendingMediaFiles[mediaKey];
    if (!pendingMedia) return;

    setMediaError('');
    setUploadingMediaKey(mediaKey);
    const formData = new FormData();
    formData.append('key', mediaKey);

    try {
      formData.append('image', pendingMedia.file);
      const response = await fetch('/api/admin/media', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Image upload failed.');
      await refreshSiteMedia();
      revokeMediaPreviewUrl(pendingMedia.previewUrl);
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

  const handleMediaDelete = async (mediaKey, title) => {
    if (!window.confirm(`Remove the uploaded image for “${title}”? The original fallback image will be used if one exists.`)) return;
    setMediaError('');
    setUploadingMediaKey(mediaKey);
    try {
      const response = await fetch(`/api/admin/media/${encodeURIComponent(mediaKey)}`, { method: 'DELETE' });
      const result = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(result?.error || 'Image could not be removed.');
      await refreshSiteMedia();
      showToast(`Uploaded image removed for ${title}.`);
    } catch (error) {
      setMediaError(error.message || 'Image could not be removed.');
    } finally {
      setUploadingMediaKey('');
    }
  };

  const deleteMediaImage = async (mediaKey, refresh = true) => {
    const response = await fetch(`/api/admin/media/${encodeURIComponent(mediaKey)}`, { method: 'DELETE' });
    const result = response.status === 204 ? null : await response.json();
    if (!response.ok) throw new Error(result?.error || 'Image could not be removed.');
    if (refresh) await refreshSiteMedia();
  };

  const handleEditMediaInfo = (item) => {
    if (item.galleryItem) {
      handleEditSessionGalleryItem(item.galleryItem);
      document.getElementById('gallery-admin-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const target = item.editTarget;
    const fields = target && mediaInfoFields[target.type];
    if (!fields) return;
    setEditingMediaInfo({ item, target, fields });
    setMediaInfoDraft(Object.fromEntries(fields.map((field) => [field.key, item.record?.[field.key] ?? ''])));
  };

  const handleSaveMediaInfo = (event) => {
    event.preventDefault();
    if (!editingMediaInfo) return;
    const { target, fields } = editingMediaInfo;
    const updates = Object.fromEntries(fields.map((field) => [
      field.key,
      field.numeric ? (mediaInfoDraft[field.key] === '' ? 0 : Number(mediaInfoDraft[field.key])) : mediaInfoDraft[field.key]
    ]));

    if (target.type === 'team') {
      setTeams((previous) => previous.map((team) => team.id === target.teamId ? { ...team, ...updates } : team));
    } else if (target.type === 'player') {
      setTeams((previous) => previous.map((team) => team.id === target.teamId
        ? { ...team, squad: (team.squad || []).map((player) => player.id === target.playerId ? { ...player, ...updates } : player) }
        : team));
    } else if (target.type === 'champion') {
      setChampions((previous) => previous.map((record, index) => index === target.index ? { ...record, ...updates } : record));
    } else if (target.type === 'news') {
      setNews((previous) => previous.map((record) => record.id === target.id ? { ...record, ...updates } : record));
    } else if (target.type === 'highlight') {
      setHighlights((previous) => previous.map((record) => record.id === target.id ? { ...record, ...updates } : record));
    } else if (target.type === 'legacyPhoto') {
      setLegacyPhotos((previous) => previous.map((photo) => photo.id === target.id ? { ...photo, ...updates } : photo));
    } else if (target.type === 'performer') {
      setTopPerformers((previous) => Array.isArray(previous)
        ? previous.map((record) => record.key === target.key ? { ...record, ...updates } : record)
        : { ...previous, [target.key]: { ...previous[target.key], ...updates } });
    }

    showToast(`${editingMediaInfo.item.title} information updated.`);
    setEditingMediaInfo(null);
    setMediaInfoDraft({});
  };

  const handleDeleteMediaItem = async (item) => {
    if (!item.editTarget) return;
    if (!window.confirm(`Delete “${item.title}” and its associated information? This cannot be undone.`)) return;

    try {
      const target = item.editTarget;
      const mediaKeys = new Set([
        item.sessionSpecific
          ? getSessionMediaKey(item.key, item.defaultSession || selectedSeason)
          : item.key
      ]);
      const recordSession = item.defaultSession || selectedSeason;
      if (target.type === 'team') {
        mediaKeys.add(getSessionMediaKey(`team:${target.teamId}`, recordSession));
        mediaKeys.add(getSessionMediaKey(`team-logo:${target.teamId}`, recordSession));
        (item.record?.squad || []).forEach((player) => mediaKeys.add(getSessionMediaKey(`player-photo:${target.teamId}-${player.id}`, recordSession)));
      }
      for (const key of mediaKeys) await deleteMediaImage(key, false);
      if (mediaKeys.size > 0) await refreshSiteMedia();

      if (target.type === 'team') setTeams((previous) => previous.filter((team) => team.id !== target.teamId));
      else if (target.type === 'player') {
        setTeams((previous) => previous.map((team) => team.id === target.teamId
          ? { ...team, squad: (team.squad || []).filter((player) => player.id !== target.playerId) }
          : team));
      } else if (target.type === 'champion') setChampions((previous) => previous.filter((_, index) => index !== target.index));
      else if (target.type === 'news') setNews((previous) => previous.filter((record) => record.id !== target.id));
      else if (target.type === 'highlight') setHighlights((previous) => previous.filter((record) => record.id !== target.id));
      else if (target.type === 'gallery') {
        setGallery((previous) => previous.filter((record) => record.id !== target.id));
        if (editingGalleryItemId === target.id) handleCancelGalleryEdit();
      }
      else if (target.type === 'legacyPhoto') setLegacyPhotos((previous) => previous.filter((photo) => photo.id !== target.id));
      else if (target.type === 'performer') {
        setTopPerformers((previous) => {
          if (Array.isArray(previous)) return previous.filter((record) => record.key !== target.key);
          const next = { ...previous };
          delete next[target.key];
          return next;
        });
      }
      if (editingMediaInfo?.item.key === item.key) setEditingMediaInfo(null);
      showToast(`${item.title} and its information were deleted.`);
    } catch (error) {
      setMediaError(error.message || 'The item could not be deleted.');
    }
  };

  const mediaUploadControl = (item) => {
    const { key: baseMediaKey, title, description, fallback: fallbackImage = '', aspectRatio = 1, fit = false, galleryItem, sessionSpecific = false } = item;
    const mediaSession = mediaSessionSelections[baseMediaKey] || item.defaultSession || selectedSeason;
    const mediaKey = sessionSpecific ? getSessionMediaKey(baseMediaKey, mediaSession) : baseMediaKey;
    const activeMediaKey = siteMedia[mediaKey] ? mediaKey : siteMedia[baseMediaKey] ? baseMediaKey : null;
    const pendingMedia = pendingMediaFiles[mediaKey];
    const cropFile = mediaCropFiles[mediaKey];
    return (
    <div key={baseMediaKey} className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-3 border-b border-slate-800 py-4 last:border-0 xl:grid-cols-[5rem_minmax(0,1fr)_auto] xl:gap-4">
      <label title={`Click to change ${title}`} className="group relative w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border border-slate-700 bg-slate-950 focus-within:border-amber-400" style={{ aspectRatio }}>
        {(pendingMedia?.previewUrl || cropFile?.previewUrl || siteMedia[mediaKey] || siteMedia[baseMediaKey] || fallbackImage) ? (
          <img src={pendingMedia?.previewUrl || cropFile?.previewUrl || siteMedia[mediaKey] || siteMedia[baseMediaKey] || fallbackImage} alt={`${title} preview`} className={`h-full w-full ${fit ? 'object-contain' : 'object-cover'}`} />
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
        {sessionSpecific && (
          <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Session
            <select
              value={mediaSession}
              onChange={(event) => setMediaSessionSelections((current) => ({ ...current, [baseMediaKey]: event.target.value }))}
              aria-label={`Session for ${title}`}
              className="min-w-0 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold normal-case tracking-normal text-white focus:border-amber-500 focus:outline-none"
            >
              {seasons.map((season) => (
                <option key={season.edition} value={season.edition}>
                  {season.edition} ({season.year || season.season})
                </option>
              ))}
            </select>
          </label>
        )}
        {galleryItem && (
          <label className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Session
            <select
              value={galleryItem.season || galleryItem.session || selectedSeason}
              onChange={(event) => handleGallerySeasonChange(galleryItem.id, event.target.value)}
              aria-label={`Session for ${galleryItem.title}`}
              className="min-w-0 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold normal-case tracking-normal text-white focus:border-amber-500 focus:outline-none"
            >
              {seasons.map((season) => (
                <option key={season.edition} value={season.edition}>
                  {season.edition} ({season.year || season.season})
                </option>
              ))}
            </select>
          </label>
        )}
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
        {item.editTarget && (
          <>
            <button
              type="button"
              onClick={() => handleEditMediaInfo(item)}
              disabled={Boolean(uploadingMediaKey)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-blue-700 bg-blue-950/70 px-3 py-2 text-xs font-bold text-blue-200 hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Edit className="h-4 w-4" />
              Edit info
            </button>
            <button
              type="button"
              onClick={() => handleDeleteMediaItem(item)}
              disabled={Boolean(uploadingMediaKey)}
              className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/70 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Delete item
            </button>
          </>
        )}
        {activeMediaKey && (
          <button
            type="button"
            onClick={() => handleMediaDelete(activeMediaKey, title)}
            disabled={Boolean(uploadingMediaKey)}
            title={`Remove uploaded image for ${title}`}
            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/70 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </button>
        )}
      </div>
      {cropFile && (
        <ImageCropEditor
          file={cropFile.file}
          previewUrl={cropFile.previewUrl}
          title={title}
          aspectRatio={aspectRatio}
          fit={fit}
          onApply={(file) => handleMediaCrop(mediaKey, file)}
          onCancel={() => {
            revokeMediaPreviewUrl(cropFile.previewUrl);
            setMediaCropFiles((current) => {
              const next = { ...current };
              delete next[mediaKey];
              return next;
            });
          }}
        />
      )}
    </div>
    );
  };

  const mediaItems = [
    { key: 'logo', category: 'branding', title: 'NPL logo', description: 'Shown in the header and footer.', aspectRatio: 1, fit: true },
    { key: 'stadium', category: 'branding', title: 'Stadium image', description: 'Shown on the home and league story pages.', fallback: '/assets/stadium.jpg', aspectRatio: 16 / 9 },
    { key: 'trophy', category: 'branding', title: 'Championship trophy', description: 'Shown in the trophy showcase.', fallback: '/assets/trophy.jpg', aspectRatio: 4 / 5 },
    ...champions.map((champion, index) => ({
      key: `champion:${index}`,
      category: 'champions',
      record: champion,
      editTarget: { type: 'champion', index },
      title: `${champion.season} ${champion.edition} • ${champion.championTeam}`,
      description: 'Champion feature photo.',
      fallback: champion.teamPhoto,
      aspectRatio: 4 / 3,
      sessionSpecific: true,
      defaultSession: seasons.find((season) => champion.edition.startsWith(season.edition))?.edition
    })),
    ...teams.flatMap((team) => [
      {
        key: `team:${team.id}`,
        category: 'teams',
        record: team,
        editTarget: { type: 'team', teamId: team.id },
        title: `${team.name} banner`,
        description: 'Shown in team details.',
        fallback: team.banner,
        aspectRatio: 16 / 9,
        sessionSpecific: true,
        defaultSession: getTeamSessions(team, seasons.map((season) => season.edition))[0]
      },
      {
        key: `team-logo:${team.id}`,
        category: 'player-assets',
        record: team,
        editTarget: { type: 'team', teamId: team.id },
        title: `${team.name} logo`,
        description: 'Square franchise crest shown on team badges and player cards.',
        fallback: team.logo,
        aspectRatio: 1,
        fit: true,
        sessionSpecific: true,
        defaultSession: getTeamSessions(team, seasons.map((season) => season.edition))[0]
      },
      ...(team.squad || []).map((player) => ({
        key: `player-photo:${team.id}-${player.id}`,
        category: 'player-assets',
        record: player,
        editTarget: { type: 'player', teamId: team.id, playerId: player.id },
        title: `${player.name} portrait`,
        description: `${team.name} • vertical 4:5 player photo`,
        fallback: player.photo,
        aspectRatio: 4 / 5,
        sessionSpecific: true,
        defaultSession: getTeamSessions(team, seasons.map((season) => season.edition))[0]
      }))
    ]),
    ...news.map((article) => ({
      key: `news:${article.id}`,
      category: 'news',
      record: article,
      editTarget: { type: 'news', id: article.id },
      title: article.headline,
      description: `News image • ${article.category}`,
      fallback: article.image,
      aspectRatio: 16 / 9,
      sessionSpecific: true,
      defaultSession: article.season || article.session
    })),
    ...gallery.map((item) => ({
      key: `gallery:${item.id}`,
      category: 'gallery',
      editTarget: { type: 'gallery', id: item.id },
      title: item.title,
      description: `Gallery photo • ${item.category}`,
      fallback: item.image,
      aspectRatio: 4 / 3,
      galleryItem: item
    })),
    ...legacyPhotos.map((photo, index) => ({
      key: `memory-photo:${photo.id}`,
      category: 'memories',
      record: photo,
      editTarget: { type: 'legacyPhoto', id: photo.id },
      title: `League memory photo ${legacyPhotos.length - index}`,
      description: 'Photo in the Memories and Legacy archive.',
      aspectRatio: 4 / 3
    })),
    ...highlights.map((item) => ({
      key: `highlight:${item.id}`,
      category: 'highlights',
      record: item,
      editTarget: { type: 'highlight', id: item.id },
      title: item.title,
      description: 'Video highlight thumbnail.',
      fallback: item.thumbnail,
      aspectRatio: 16 / 9,
      sessionSpecific: true,
      defaultSession: item.season || item.session
    })),
    ...Object.entries(topPerformers).map(([key, performer]) => ({
      key: `performer:${key}`,
      category: 'performers',
      record: performer,
      editTarget: { type: 'performer', key },
      title: `${performer.player} • ${key.replace(/([A-Z])/g, ' $1')}`,
      description: 'Top performer profile photo.',
      fallback: performer.photo,
      aspectRatio: 1,
      sessionSpecific: true
    }))
  ];
  const mediaCategories = [
    { value: 'all', label: 'All image slots' },
    { value: 'branding', label: 'Brand & venue' },
    { value: 'champions', label: 'Champions' },
    { value: 'teams', label: 'Team banners' },
    { value: 'player-assets', label: 'Player & team photos' },
    { value: 'news', label: 'News' },
    { value: 'gallery', label: 'Gallery' },
    { value: 'memories', label: 'Memories and Legacy' },
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
    const rows = auctionRegistrations.filter((registration) => registration.season === selectedSeason).map(r => [
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
    if (r.season !== selectedSeason) return false;
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
  const liveSessionMatches = matches.filter((match) => (match.season || match.session) === selectedSeason);
  const liveMatch = liveSessionMatches.find(m => m.status === 'LIVE') || liveSessionMatches[0];
  const teamsForSelectedSession = teams.filter((team) => getTeamSessions(team, seasons.map((season) => season.edition)).includes(selectedSeason));
  const registrationsForSelectedSession = auctionRegistrations.filter((registration) => registration.season === selectedSeason);
  const adminPointsTable = seasonStandings[selectedSeason]
    || (selectedSeason === seasons[0]?.edition ? pointsTable : []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 p-0 backdrop-blur-md sm:p-4">
      <div className="relative my-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 border-slate-700 bg-[#070D1E] shadow-2xl sm:my-6 sm:h-auto sm:max-h-[94vh] sm:max-w-6xl sm:rounded-3xl sm:border-2">
        {/* Header */}
        <div className="relative z-20 flex flex-shrink-0 items-center justify-between gap-2 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0A142D] to-slate-950 p-3 sm:gap-3 sm:p-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-amber-500/50 bg-amber-500/20 text-amber-400 sm:h-10 sm:w-10">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[8px] font-bold uppercase tracking-widest text-amber-400 sm:text-[10px]">
                ORGANIZER CONTROL CENTER
              </span>
              <h3 className="break-words font-sports text-base leading-tight tracking-wide text-white sm:text-3xl">
                NPL TOURNAMENT DIRECTOR PORTAL
              </h3>
            </div>
          </div>

          <div className="relative flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
            {isAdminLoggedIn && (
              <button
                onClick={logoutAdmin}
                className="min-h-10 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white sm:px-3 sm:text-xs"
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
          <div className="flex flex-col items-center justify-center space-y-5 overflow-y-auto p-5 text-center sm:space-y-6 sm:p-16">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <h4 className="font-sports text-2xl tracking-wide text-white sm:text-4xl">
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
            <div className="grid flex-shrink-0 grid-cols-2 gap-2 border-b border-slate-800 bg-slate-950 p-2 text-center text-xs sm:grid-cols-4 sm:gap-3 sm:p-4 lg:grid-cols-6">
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Registrations</span>
                <span className="font-sports text-2xl text-amber-400">{registrationsForSelectedSession.length}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-emerald-400 uppercase font-bold block">Verified</span>
                <span className="font-sports text-2xl text-emerald-400">
                  {registrationsForSelectedSession.filter(r => r.status === 'VERIFIED' || r.status === 'SHORTLISTED' || r.status === 'AUCTIONED').length}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-amber-300 uppercase font-bold block">Auctioned</span>
                <span className="font-sports text-2xl text-white">
                  {registrationsForSelectedSession.filter(r => r.status === 'AUCTIONED').length}
                </span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-blue-400 uppercase font-bold block">Teams</span>
                <span className="font-sports text-2xl text-blue-400">{teamsForSelectedSession.length}</span>
              </div>
              <div className="p-2 bg-slate-900/60 rounded-xl">
                <span className="text-[10px] text-purple-400 uppercase font-bold block">Matches</span>
                <span className="font-sports text-2xl text-purple-400">{liveSessionMatches.length}</span>
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
            <div className="flex flex-shrink-0 touch-pan-x overflow-x-auto border-b border-slate-800 bg-[#060D1E] px-1 sm:px-4">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`min-h-12 whitespace-nowrap border-b-2 px-3 py-2 font-sports text-sm tracking-wider transition-colors sm:px-4 sm:py-3 sm:text-base ${activeTab === 'registrations' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                <span className="sm:hidden">REG ({registrationsForSelectedSession.length})</span>
                <span className="hidden sm:inline">AUCTION REGISTRATIONS ({registrationsForSelectedSession.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('livescore')}
                className={`min-h-12 whitespace-nowrap border-b-2 px-3 py-2 font-sports text-sm tracking-wider transition-colors sm:px-4 sm:py-3 sm:text-base ${activeTab === 'livescore' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                <span className="sm:hidden">LIVE SCORE</span>
                <span className="hidden sm:inline">LIVE MATCH SCORER</span>
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`min-h-12 whitespace-nowrap border-b-2 px-3 py-2 font-sports text-sm tracking-wider transition-colors sm:px-4 sm:py-3 sm:text-base ${activeTab === 'teams' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                <span className="sm:hidden">TEAMS</span>
                <span className="hidden sm:inline">POINTS TABLE &amp; TEAMS</span>
              </button>
              <button
                onClick={() => setActiveTab('tournament')}
                className={`min-h-12 whitespace-nowrap border-b-2 px-3 py-2 font-sports text-sm tracking-wider transition-colors sm:px-4 sm:py-3 sm:text-base ${activeTab === 'tournament' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
              >
                <span className="sm:hidden">SETTINGS</span>
                <span className="hidden sm:inline">EDIT TOURNAMENT SETTINGS</span>
              </button>
              {adminUser?.role === 'owner' && (
                <button
                  onClick={() => setActiveTab('media')}
                  className={`min-h-12 whitespace-nowrap border-b-2 px-3 py-2 font-sports text-sm tracking-wider transition-colors sm:px-4 sm:py-3 sm:text-base ${activeTab === 'media' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  OWNER MEDIA
                </button>
              )}
            </div>

            {activeTab === 'media' && adminUser?.role === 'owner' && (
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6">
                <div className="mb-4">
                  <h4 className="font-sports text-xl text-white">WEBSITE IMAGE LIBRARY</h4>
                  <p className="mt-1 text-xs text-slate-400">Changes appear for every visitor. Player portraits use a vertical 4:5 crop; franchise logos use a square crop. Content photos can have separate images for each session. JPG, PNG, WebP, or GIF up to 8 MB.</p>
                </div>
                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-blue-700/50 bg-blue-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h5 className="font-sports text-base text-white">PLAYER & TEAM PHOTO DESK</h5>
                    <p className="mt-1 text-xs text-slate-300">Upload portrait photos for every roster player and square franchise logos. Missing player portraits use the virtual player illustration.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaCategory('player-assets')}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-blue-400"
                  >
                    <Users className="h-4 w-4" />
                    Manage player & team photos
                  </button>
                </div>
                <p className="mb-5 rounded-lg border border-amber-700/60 bg-amber-950/30 px-3 py-2.5 text-xs leading-relaxed text-amber-200">
                  Production uploads are saved in the shared database and appear for every visitor. For local clones, commit and push <code className="font-mono text-amber-100">public/uploads/</code> and <code className="font-mono text-amber-100">public/site-media.json</code> after uploading.
                </p>
                <form id="gallery-admin-form" onSubmit={handleAddSessionGalleryItem} className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-amber-800/60 bg-amber-950/20 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h5 className="font-sports text-base text-amber-300">
                        {editingGalleryItemId ? 'EDIT GALLERY PHOTO' : `ADD PHOTO TO ${selectedSeason.toUpperCase()}`}
                      </h5>
                      <p className="text-xs text-slate-400">
                        {editingGalleryItemId ? 'Update the photo information. The uploaded image will stay unchanged.' : 'The new photo slot belongs only to this session.'}
                      </p>
                    </div>
                    {!editingGalleryItemId && (
                      <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
                    )}
                  </div>
                  <label className="text-xs font-bold text-slate-400">
                    Photo title
                    <input required value={galleryDraft.title} onChange={(event) => setGalleryDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-400">
                    Category
                    <select value={galleryDraft.category} onChange={(event) => setGalleryDraft((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white">
                      {['MATCH DAY', 'FINALS', 'CHAMPIONS', 'AUCTION', 'TEAMS', 'PLAYERS', 'CELEBRATIONS', 'BEHIND THE SCENES'].map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </label>
                  {editingGalleryItemId && (
                    <label className="text-xs font-bold text-slate-400">
                      Session
                      <select
                        value={galleryDraft.season}
                        onChange={(event) => setGalleryDraft((current) => ({ ...current, season: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white"
                      >
                        {seasons.map((season) => (
                          <option key={season.edition} value={season.edition}>{season.edition} ({season.year || season.season})</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <label className="text-xs font-bold text-slate-400">
                    Caption
                    <textarea value={galleryDraft.caption} onChange={(event) => setGalleryDraft((current) => ({ ...current, caption: event.target.value }))} rows={2} className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" />
                  </label>
                  <label className="text-xs font-bold text-slate-400">
                    Date or event
                    <input value={galleryDraft.date} onChange={(event) => setGalleryDraft((current) => ({ ...current, date: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white" placeholder={selectedSeason} />
                  </label>
                  <div className="sm:col-span-2 flex justify-end">
                    {editingGalleryItemId && (
                      <button type="button" onClick={handleCancelGalleryEdit} className="mr-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800">
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400">
                      {editingGalleryItemId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {editingGalleryItemId ? 'Save changes' : 'Add photo slot'}
                    </button>
                  </div>
                </form>
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <h5 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    All gallery entries ({gallery.length})
                  </h5>
                  <p className="mb-3 text-xs text-slate-500">
                    These are session gallery photos and are managed separately from Memories and Legacy.
                  </p>
                  <div className="space-y-2">
                    {gallery.map((item) => (
                      <div key={item.id} className="flex flex-col justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={siteMedia[getSessionMediaKey(`gallery:${item.id}`, item.season || item.session)] || siteMedia[`gallery:${item.id}`] || item.image}
                            alt=""
                            className="h-14 w-20 flex-shrink-0 rounded-md border border-slate-800 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {item.category} • {item.season || item.session || 'Unassigned'}{item.date ? ` • ${item.date}` : ''}
                            </p>
                            {item.caption && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.caption}</p>}
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditSessionGalleryItem(item)}
                            aria-label={`Edit ${item.title}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-900"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSessionGalleryItem(item.id)}
                            aria-label={`Delete ${item.title}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-900"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {gallery.length === 0 && (
                      <p className="py-3 text-sm text-slate-500">No gallery entries have been added yet.</p>
                    )}
                  </div>
                </div>
                <div className="mb-5 flex flex-col gap-3 rounded-xl border border-violet-800/60 bg-violet-950/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h5 className="font-sports text-base text-violet-300">MEMORIES AND LEGACY PHOTOS</h5>
                    <p className="mt-1 text-xs text-slate-400">
                      Add an old league or organization photo slot, then choose and save its image in the Memories and Legacy image slots below. Titles and captions are optional.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLegacyPhoto}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-violet-400"
                  >
                    <Plus className="h-4 w-4" />
                    Add old photo
                  </button>
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
                {editingMediaInfo && (
                  <form onSubmit={handleSaveMediaInfo} className="mb-5 rounded-xl border border-blue-700/50 bg-blue-950/25 p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <h5 className="font-sports text-base text-white">EDIT {editingMediaInfo.item.title.toUpperCase()}</h5>
                        <p className="mt-1 text-xs text-slate-400">Update the information shown with this photo. The image stays unchanged.</p>
                      </div>
                      <button type="button" onClick={() => setEditingMediaInfo(null)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-800">Cancel</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {editingMediaInfo.fields.map((field) => (
                        <label key={field.key} className={`text-xs font-bold text-slate-300 ${field.multiline ? 'sm:col-span-2' : ''}`}>
                          {field.label}
                          {field.multiline ? (
                            <textarea
                              value={mediaInfoDraft[field.key]}
                              onChange={(event) => setMediaInfoDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                              rows={3}
                              className="mt-1 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white"
                            />
                          ) : (
                            <input
                              type={field.numeric ? 'number' : 'text'}
                              value={mediaInfoDraft[field.key]}
                              onChange={(event) => setMediaInfoDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-normal text-white"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white hover:bg-blue-400">
                        <Save className="h-4 w-4" /> Save information
                      </button>
                    </div>
                  </form>
                )}
                {mediaError && <p role="alert" className="mb-3 rounded-lg border border-rose-800 bg-rose-950/70 px-3 py-2 text-sm text-rose-300">{mediaError}</p>}
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/50 px-4">
                  {filteredMediaItems.length > 0 ? filteredMediaItems.map((item) => mediaUploadControl(item)) : (
                    <p className="px-3 py-8 text-center text-sm text-slate-400">No image slots match that search.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tab 1: Auction Registrations Management */}
            {activeTab === 'registrations' && (
              <div className="flex-grow space-y-4 overflow-y-auto p-3 sm:p-5">
                {/* Search & Action bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
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
              <div className="flex-grow space-y-5 overflow-y-auto p-3 sm:space-y-6 sm:p-6">
                {adminUser?.role === 'owner' && (
                  <form onSubmit={handleAddSessionMatch} className="grid grid-cols-1 gap-3 rounded-2xl border border-amber-800/60 bg-amber-950/20 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="sm:col-span-2 lg:col-span-3">
                      <h4 className="font-sports text-lg text-amber-300">ADD FIXTURE TO {selectedSeason.toUpperCase()}</h4>
                      <p className="text-xs text-slate-400">Only teams registered for this session are selectable.</p>
                    </div>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Team 1
                      <select required value={matchDraft.team1Id} onChange={(event) => setMatchDraft((current) => ({ ...current, team1Id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white">
                        <option value="">Select team</option>
                        {teamsForSelectedSession.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Team 2
                      <select required value={matchDraft.team2Id} onChange={(event) => setMatchDraft((current) => ({ ...current, team2Id: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white">
                        <option value="">Select team</option>
                        {teamsForSelectedSession.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Match number
                      <input value={matchDraft.matchNumber} onChange={(event) => setMatchDraft((current) => ({ ...current, matchNumber: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white" placeholder="Match 1" />
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Stage
                      <input value={matchDraft.tournamentPhase} onChange={(event) => setMatchDraft((current) => ({ ...current, tournamentPhase: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white" />
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Status
                      <select value={matchDraft.status} onChange={(event) => setMatchDraft((current) => ({ ...current, status: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white">
                        {['UPCOMING', 'LIVE', 'COMPLETED'].map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Date
                      <input type="date" value={matchDraft.date} onChange={(event) => setMatchDraft((current) => ({ ...current, date: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white" />
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Time
                      <input type="time" value={matchDraft.time} onChange={(event) => setMatchDraft((current) => ({ ...current, time: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white" />
                    </label>
                    <label className="text-[11px] font-bold uppercase text-slate-400">
                      Venue
                      <input value={matchDraft.venue} onChange={(event) => setMatchDraft((current) => ({ ...current, venue: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm normal-case text-white" />
                    </label>
                    {matchError && <p role="alert" className="sm:col-span-2 lg:col-span-3 text-sm text-rose-300">{matchError}</p>}
                    <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
                      <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"><Plus className="h-4 w-4" />Add fixture</button>
                    </div>
                  </form>
                )}
                {!liveMatch && (
                  <p className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-5 text-center text-sm text-slate-400">No match is assigned to {selectedSeason} yet.</p>
                )}
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
                    <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
                    <span className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs uppercase animate-pulse">
                      BROADCAST LIVE
                    </span>
                    {adminUser?.role === 'owner' && liveMatch && (
                      <button type="button" onClick={handleRemoveSessionMatch} className="rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-1.5 text-[10px] font-bold uppercase text-rose-300 hover:bg-rose-900">Remove fixture</button>
                    )}
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
                          }, selectedSeason);
                        }}
                        disabled={!liveMatch}
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
                          }, selectedSeason);
                        }}
                        disabled={!liveMatch}
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
                          }, selectedSeason);
                        }}
                        disabled={!liveMatch}
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
                          }, selectedSeason);
                        }}
                        disabled={!liveMatch}
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
              <div className="flex-grow space-y-4 overflow-y-auto p-3 sm:p-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h4 className="font-sports text-xl text-white tracking-wider">
                    EDIT POINTS TABLE & FRANCHISE RECORDS
                  </h4>
                  <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
                </div>

                {adminUser?.role === 'owner' && (
                  <div className="rounded-2xl border border-amber-800/60 bg-amber-950/20 p-4 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h5 className="font-sports text-lg text-amber-300">DEVELOPER TEAM MANAGER</h5>
                        <p className="text-xs text-slate-300">Open a session to manage only its teams. Changes are saved to this browser automatically.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {seasons.map((season) => (
                          <button
                            key={season.edition}
                            type="button"
                            onClick={() => {
                              setTeamSessionFocus(season.edition);
                              setTeamDraft((current) => ({ ...current, sessions: [season.edition] }));
                              setTeamError('');
                              setIsSessionWorkspaceOpen(true);
                            }}
                            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-left hover:border-amber-500 hover:bg-slate-900"
                          >
                            <span className="block text-sm font-bold text-white">{season.edition}</span>
                            <span className="mt-1 block text-[10px] font-bold uppercase text-amber-400">Open teams</span>
                          </button>
                        ))}
                    </div>
                      </div>

                    {isSessionWorkspaceOpen && (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 sm:p-6">
                        <section
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby="session-team-workspace-title"
                          className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-700/70 bg-slate-950 shadow-2xl"
                        >
                          <header className="flex items-center justify-between gap-4 border-b border-slate-800 px-4 py-3 sm:px-6">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Independent team workspace</p>
                              <h3 id="session-team-workspace-title" className="font-sports text-xl text-white">{teamSessionFocus}</h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => setIsSessionWorkspaceOpen(false)}
                              aria-label="Close session workspace"
                              className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:border-amber-500 hover:text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </header>
                          <div className="space-y-4 overflow-y-auto p-4 sm:p-6">
                    <form onSubmit={handleAddTeam} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Team Name
                        <input
                          type="text"
                          value={teamDraft.name}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, name: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          placeholder="e.g. Royal Strikers"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Short Name
                        <input
                          type="text"
                          value={teamDraft.shortName}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, shortName: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                          placeholder="RS"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Captain
                        <input
                          type="text"
                          value={teamDraft.captain}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, captain: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Owner
                        <input
                          type="text"
                          value={teamDraft.owner}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, owner: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 md:col-span-2">
                        Home Ground
                        <input
                          type="text"
                          value={teamDraft.home}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, home: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Primary Color
                        <input
                          type="color"
                          value={teamDraft.primaryColor}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, primaryColor: event.target.value }))}
                          className="mt-1 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 p-1"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Secondary Color
                        <input
                          type="color"
                          value={teamDraft.secondaryColor}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, secondaryColor: event.target.value }))}
                          className="mt-1 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 p-1"
                        />
                      </label>

                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 md:col-span-2">
                        Slogan
                        <input
                          type="text"
                          value={teamDraft.slogan}
                          onChange={(event) => setTeamDraft((current) => ({ ...current, slogan: event.target.value }))}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                        />
                      </label>

                      <label className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200">
                        <input
                          type="checkbox"
                          checked={alsoAddNextSeason}
                          onChange={(event) => setAlsoAddNextSeason(event.target.checked)}
                          className="h-4 w-4 accent-amber-500"
                        />
                        <span>Add the same team to {nextTeamSession} too</span>
                      </label>

                      {teamError && (
                        <div className="md:col-span-2 rounded-xl border border-rose-900 bg-rose-950/50 px-3 py-2 text-xs text-rose-300">
                          {teamError}
                        </div>
                      )}

                      <div className="md:col-span-2 flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-400"
                        >
                          <Plus className="h-4 w-4" />
                          Add Team
                        </button>
                      </div>
                    </form>

                    <div className="space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teams in {teamSessionFocus}</p>
                      <div className="space-y-2">
                        {teams.filter((team) => {
                          return getTeamSessions(team, seasons.map((season) => season.edition)).includes(teamSessionFocus);
                        }).map((team) => (
                          <div key={team.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                            <div>
                              <p className="font-bold text-white">{team.name}</p>
                              <p className="text-[10px] text-slate-400">This session only</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={teams.some((candidate) => candidate.name === team.name && getTeamSessions(candidate, seasons.map((season) => season.edition)).includes(nextTeamSession))}
                                onClick={() => handleCopyTeamToNextSession(team)}
                                className="rounded-lg border border-emerald-800 bg-emerald-950/60 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {teams.some((candidate) => candidate.name === team.name && getTeamSessions(candidate, seasons.map((season) => season.edition)).includes(nextTeamSession))
                                  ? `Already in ${nextTeamSession}`
                                  : `Add to ${nextTeamSession}`}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTeam(team.id)}
                                className="rounded-lg border border-rose-800 bg-rose-950/60 px-2 py-1 text-[10px] font-bold uppercase text-rose-300 hover:bg-rose-900"
                              >
                                Remove from {teamSessionFocus}
                              </button>
                            </div>
                          </div>
                        ))}
                        {teams.filter((team) => getTeamSessions(team, seasons.map((season) => season.edition)).includes(teamSessionFocus)).length === 0 && (
                          <p className="rounded-xl border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">No teams are assigned to {teamSessionFocus}.</p>
                        )}
                      </div>
                    </div>
                        </div>
                      </section>
                    </div>
                  )}
                  </div>
                )}

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
                      {adminPointsTable.map((row) => (
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
                                  setSeasonStandings((previousStandings) => ({
                                    ...previousStandings,
                                    [selectedSeason]: (previousStandings[selectedSeason] || adminPointsTable).map((pointRow) => (
                                      pointRow.teamId === row.teamId
                                        ? { ...pointRow, p: pointRow.p + 1, w: pointRow.w + 1, pts: pointRow.pts + 2 }
                                        : pointRow
                                    ))
                                  }));
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
              <div className="flex-grow space-y-4 overflow-y-auto p-3 sm:p-6">
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
