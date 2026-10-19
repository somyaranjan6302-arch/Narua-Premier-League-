import React, { useEffect, useRef, useState } from 'react';
import { useNpl } from './context/NplContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { AboutNPL } from './components/AboutNPL';
import { ChampionsSection } from './components/ChampionsSection';
import { SeasonHistory } from './components/SeasonHistory';
import { MatchCenter } from './components/MatchCenter';
import { PointsTable } from './components/PointsTable';
import { TeamsSection } from './components/TeamsSection';
import { TopPerformers } from './components/TopPerformers';
import { PlayerSection } from './components/PlayerSection';
import { NplRecords } from './components/NplRecords';
import { GallerySection } from './components/GallerySection';
import { SectionPhotoGallery } from './components/SectionPhotoGallery';
import { VideoHighlights } from './components/VideoHighlights';
import { NewsSection } from './components/NewsSection';
import { AuctionSection } from './components/AuctionSection';
import { TrophySection } from './components/TrophySection';
import { MemoriesLegacy } from './components/MemoriesLegacy';
import { HistoryOfNpl } from './components/HistoryOfNpl';
import { Footer } from './components/Footer';

// Modals
import { AuctionRegistrationModal } from './components/modals/AuctionRegistrationModal';
import { LiveAuctionArenaModal } from './components/modals/LiveAuctionArenaModal';
import { MatchDetailsModal } from './components/modals/MatchDetailsModal';
import { TeamDetailsModal } from './components/modals/TeamDetailsModal';
import { PlayerProfileModal } from './components/modals/PlayerProfileModal';
import { NewsModal } from './components/modals/NewsModal';
import { LightboxModal } from './components/modals/LightboxModal';
import { VideoPlayerModal } from './components/modals/VideoPlayerModal';
import { AdminDashboardModal } from './components/modals/AdminDashboardModal';

export const App = () => {
  const [activeSection, setActiveSection] = useState(() => (
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('demoStandings') === '1'
      ? 'standings'
      : import.meta.env.DEV &&
        new URLSearchParams(window.location.search).get('demoMatches') === '1'
        ? 'matches'
        : 'home'
  ));
  const {
    activeModal,
    closeModal,
    openModal,
    teams,
    seasons,
    selectedSeason,
    setSelectedSeason,
    isAdminModalOpen,
    setIsAdminModalOpen,
    toastMessage
  } = useNpl();
  const openedTeamProfile = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamId = params.get('team');
    if (!teamId || openedTeamProfile.current || activeModal.type === 'team-details') return;

    const profileTeam = teams.find((team) => team.id === teamId);
    if (!profileTeam) return;

    const requestedSeasonValue = params.get('season');
    const teamSeasons = Array.isArray(profileTeam.sessions)
      ? profileTeam.sessions
      : Array.isArray(profileTeam.seasons)
        ? profileTeam.seasons
        : profileTeam.session
          ? [profileTeam.session]
          : seasons.map((season) => season.edition);
    const requestedSeason = seasons.find((season) => season.edition === requestedSeasonValue)
      || seasons.find((season) => (
        String(season.year || season.season) === requestedSeasonValue &&
        teamSeasons.includes(season.edition)
      ));

    if (requestedSeason && requestedSeason.edition !== selectedSeason) {
      setSelectedSeason(requestedSeason.edition);
    }
    openedTeamProfile.current = true;
    openModal('team-details', profileTeam);
  }, [activeModal.type, openModal, seasons, selectedSeason, setSelectedSeason, teams]);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topPaddingClass = activeSection === 'home' ? '' : 'pt-28 sm:pt-32 lg:pt-36';

  return (
    <div className="min-h-screen bg-[var(--color-npl-navy)] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className="px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-2xl flex items-center gap-2.5 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
            <span className="text-xs sm:text-sm font-sports tracking-wider text-base">
              {toastMessage.msg}
            </span>
          </div>
        </div>
      )}

      {/* 1. STICKY NAVBAR */}
      <Navbar activeSection={activeSection} setActiveSection={setActiveSection} />

      {/* Show one destination at a time instead of stacking every section. */}
      <main className={`flex-grow ${topPaddingClass}`}>
        {activeSection === 'home' && <HeroSection scrollToSection={scrollToSection} />}
        {activeSection === 'story' && <AboutNPL scrollToSection={scrollToSection} />}
        {activeSection === 'champions' && <ChampionsSection />}
        {activeSection === 'history' && <SeasonHistory />}
        {activeSection === 'matches' && <MatchCenter />}
        {activeSection === 'standings' && <PointsTable />}
        {activeSection === 'teams' && <TeamsSection />}
        {activeSection === 'players' && <PlayerSection />}
        {activeSection === 'performers' && <TopPerformers />}
        {activeSection === 'records' && <NplRecords />}
        {activeSection === 'gallery' && <GallerySection />}
        {activeSection === 'highlights' && <VideoHighlights />}
        {activeSection === 'news' && <NewsSection />}
        {activeSection === 'auction' && <AuctionSection />}
        {activeSection === 'trophy' && <TrophySection />}
        {activeSection === 'memories' && <MemoriesLegacy />}
        {activeSection !== 'news' && <SectionPhotoGallery sectionId={activeSection} />}
        {activeSection === 'home' && <HistoryOfNpl scrollToSection={scrollToSection} />}
      </main>

      {/* 18. LARGE PROFESSIONAL FOOTER */}
      <Footer scrollToSection={scrollToSection} />

      {/* MODALS RENDERER */}
      {activeModal.type === 'auction-register' && (
        <AuctionRegistrationModal onClose={closeModal} />
      )}

      {activeModal.type === 'live-auction-arena' && (
        <LiveAuctionArenaModal onClose={closeModal} />
      )}

      {activeModal.type === 'match-details' && (
        <MatchDetailsModal match={activeModal.data} onClose={closeModal} />
      )}

      {activeModal.type === 'team-details' && (
        <TeamDetailsModal team={activeModal.data} onClose={closeModal} />
      )}

      {activeModal.type === 'player-profile' && (
        <PlayerProfileModal player={activeModal.data} onClose={closeModal} />
      )}

      {activeModal.type === 'article-details' && (
        <NewsModal article={activeModal.data} onClose={closeModal} />
      )}

      {activeModal.type === 'lightbox' && (
        <LightboxModal data={activeModal.data} onClose={closeModal} />
      )}

      {activeModal.type === 'video-player' && (
        <VideoPlayerModal video={activeModal.data} onClose={closeModal} />
      )}

      {isAdminModalOpen && (
        <AdminDashboardModal onClose={() => setIsAdminModalOpen(false)} />
      )}
    </div>
  );
};

export default App;
