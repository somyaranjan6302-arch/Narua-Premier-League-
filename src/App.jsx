import React, { useState } from 'react';
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
import { VideoHighlights } from './components/VideoHighlights';
import { NewsSection } from './components/NewsSection';
import { AuctionSection } from './components/AuctionSection';
import { TrophySection } from './components/TrophySection';
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
  const [activeSection, setActiveSection] = useState('home');
  const {
    activeModal,
    closeModal,
    isAdminModalOpen,
    setIsAdminModalOpen,
    toastMessage
  } = useNpl();

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050B17] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
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

      {/* MAIN HOMEPAGE SECTIONS IN REQUESTED HIERARCHY */}
      <main className="flex-grow">
        {/* 2 & 3. HERO & TOURNAMENT STATS */}
        <HeroSection scrollToSection={scrollToSection} />

        {/* 4. THE STORY OF NARUA PREMIER LEAGUE / INTRODUCTION */}
        <AboutNPL scrollToSection={scrollToSection} />

        {/* 5. NPL CHAMPIONS */}
        <ChampionsSection />

        {/* 6. TOURNAMENT HISTORY / SEASONS ARCHIVE */}
        <SeasonHistory />

        {/* 7. NPL MATCH CENTER (LIVE, UPCOMING, COMPLETED) */}
        <MatchCenter />

        {/* 8. POINTS TABLE */}
        <PointsTable />

        {/* 9. NPL FRANCHISE TEAMS */}
        <TeamsSection />

        {/* 10. NPL PLAYERS ROSTER BROWSER */}
        <PlayerSection />

        {/* 11. TOP PERFORMERS (ORANGE CAP, PURPLE CAP, AWARDS) */}
        <TopPerformers />

        {/* 12. NPL RECORDS & MILESTONES */}
        <NplRecords />

        {/* 13. PHOTO GALLERY */}
        <GallerySection />

        {/* 14. VIDEO HIGHLIGHTS */}
        <VideoHighlights />

        {/* 15. LATEST NPL NEWS */}
        <NewsSection />

        {/* 16. DEDICATED AUCTION SECTION */}
        <AuctionSection />

        {/* 17. TOURNAMENT TROPHY SECTION */}
        <TrophySection />
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
