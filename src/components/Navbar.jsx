import React, { useState, useEffect } from 'react';
import { NplLogo } from './NplLogo';
import { useNpl } from '../context/NplContext';
import { Menu, X, Shield, Award, Calendar, Users, Trophy, Image, Play, Flame, Newspaper, ChevronDown, UserPlus } from 'lucide-react';

export const Navbar = ({ activeSection, setActiveSection }) => {
  const { matches, matchDataLoaded, openModal, setIsAdminModalOpen, isAdminLoggedIn, siteMedia } = useNpl();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Find live match or upcoming match for the ticker strip
  const availableMatches = Array.isArray(matches)
    ? matches.filter((match) => match && typeof match === 'object')
    : [];
  const liveMatch = matchDataLoaded
    ? availableMatches.find((match) => match.status === 'LIVE') ||
      availableMatches.find((match) => match.status === 'UPCOMING') ||
      availableMatches[0]
    : null;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { label: "HOME", target: "home", icon: null },
    { label: "MATCHES", target: "matches", icon: Calendar },
    { label: "POINTS TABLE", target: "standings", icon: Trophy },
    { label: "TEAMS", target: "teams", icon: Users },
    { label: "CHAMPIONS", target: "champions", icon: Award },
    { label: "GALLERY", target: "gallery", icon: Image },
    { label: "HIGHLIGHTS", target: "highlights", icon: Play },
    { label: "NEWS", target: "news", icon: Newspaper },
    { label: "AUCTION", target: "auction", icon: Flame },
  ];

  const moreItems = [
    { label: "Tournament Records", target: "records" },
    { label: "About NPL Story", target: "story" },
    { label: "Players", target: "players" },
    { label: "Memories and Legacy", target: "memories" },
    { label: "Top Performers (Caps)", target: "performers" },
  ];

  const handleNavClick = (target) => {
    setActiveSection(target);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed left-0 top-0 z-50 w-screen transition-all duration-300">
      {/* Top Live Match Strip / Broadcast Ticker */}
      {liveMatch && (
        <div className="flex items-center justify-between gap-2 overflow-hidden whitespace-nowrap border-b border-indigo-400/20 bg-[#070744] px-2 py-1.5 text-[10px] font-medium text-slate-200 shadow-[inset_0_-1px_rgba(255,255,255,0.04)] sm:gap-4 sm:px-4 sm:text-xs">
          <div className="mx-0 flex min-w-0 flex-1 items-center justify-start gap-2 sm:mx-auto sm:gap-3">
            <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-white animate-pulse sm:text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              {liveMatch.status || 'MATCH'}
            </span>
            <span className="flex-shrink-0 font-semibold text-[#ffdb19]">{liveMatch.matchNumber || 'MATCH'}:</span>
            <span className="max-w-[5.5rem] min-w-0 truncate font-bold text-white sm:max-w-none">{liveMatch.team1?.shortName || liveMatch.team1?.name || 'TBD'} {liveMatch.team1?.score || ''}</span>
            <span className="flex-shrink-0 text-slate-400">vs</span>
            <span className="max-w-[5.5rem] min-w-0 truncate font-bold text-white sm:max-w-none">{liveMatch.team2?.shortName || liveMatch.team2?.name || 'TBD'} {liveMatch.team2?.score || 'Yet to bat'}</span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-amber-300/90 italic">{liveMatch.equation || liveMatch.preview}</span>
            <button
              onClick={() => openModal('match-details', liveMatch)}
              className="ml-2 hidden flex-shrink-0 text-[11px] font-semibold text-sky-300 underline decoration-sky-300/50 underline-offset-4 transition-colors hover:text-[#ffdb19] sm:inline"
            >
              Match Center →
            </button>
          </div>

          {/* Quick Admin Access */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="hidden lg:flex items-center gap-1 text-[11px] text-slate-300 hover:text-[#ffdb19] transition-colors ml-4 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-300/20"
            title="Tournament Admin Console"
          >
            <Shield className="w-3 h-3 text-amber-500" />
            <span>{isAdminLoggedIn ? "Admin Panel" : "Admin Login"}</span>
          </button>
        </div>
      )}

      {/* Main Sticky Navigation Bar */}
      <nav
        className={`relative w-full overflow-visible border-b transition-all duration-300 ${
          isScrolled
            ? "border-indigo-300/20 bg-[#0b0870]/95 py-1.5 shadow-2xl backdrop-blur-md"
            : "border-indigo-300/20 bg-[#1800c9]/95 py-2.5 shadow-[0_10px_35px_rgba(5,5,75,0.35)] backdrop-blur-sm"
        }`}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 opacity-35" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(100, 116, 255, 0.55), transparent 45%), repeating-conic-gradient(from 225deg at 50% 50%, rgba(56, 48, 255, 0.7) 0deg 8deg, transparent 8deg 18deg)' }} />
          <div className="absolute -left-8 top-0 h-full w-24 -skew-x-[28deg] bg-gradient-to-r from-[#ff8a00]/30 to-[#e52bd1]/20" />
          <div className="absolute -right-8 top-0 h-full w-24 skew-x-[28deg] bg-gradient-to-l from-[#ff8a00]/30 to-[#e52bd1]/20" />
        </div>
        <div className="relative z-10 flex w-full min-w-0 max-w-none items-center justify-between px-3 sm:px-6 2xl:px-8">
          {/* Left: NPL Brand Logo */}
          <div className="min-w-0" onClick={() => handleNavClick('home')}>
            <NplLogo size="sm" imageSrc={siteMedia.logo} compactOnMobile compact />
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden xl:flex flex-1 items-center justify-center gap-0.5 text-sm font-semibold tracking-wide">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => handleNavClick(item.target)}
                className={`px-2 py-1.5 transition-all duration-200 text-xs font-bold uppercase tracking-wide whitespace-nowrap ${
                  activeSection === item.target
                    ? "text-[#ffdb19] bg-white/10 shadow-[inset_0_-2px_0_#ffdb19]"
                    : "text-slate-100 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* "MORE" Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center gap-1 px-2 py-1.5 text-xs font-bold uppercase tracking-wide whitespace-nowrap text-slate-100 hover:text-white hover:bg-white/10 transition-colors"
              >
                <span>MORE</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-indigo-300/20 bg-[#090858] py-2 shadow-2xl backdrop-blur-lg">
                  {moreItems.map((subItem) => (
                    subItem.external ? (
                      <a
                        key={subItem.target}
                        href="/scorer"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setIsMoreOpen(false)}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-semibold text-amber-300 transition-colors hover:bg-white/10 hover:text-[#ffdb19]"
                      >
                        <Trophy className="h-3.5 w-3.5" />
                        <span>{subItem.label}</span>
                      </a>
                    ) : (
                      <button
                        key={subItem.target}
                        onClick={() => handleNavClick(subItem.target)}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-[#ffdb19]"
                      >
                        {subItem.label}
                      </button>
                    )
                  ))}
                  <div className="my-1 border-t border-indigo-300/20"></div>
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      setIsAdminModalOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-2"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Console</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right: High-impact Action Buttons */}
          <div className="flex shrink-0 items-center gap-3">
            {/* Prominent Auction Registration Button */}
            <button
              onClick={() => openModal('auction-register')}
              className="relative hidden group overflow-hidden rounded-full p-[1.5px] font-sports text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(255,138,0,0.3)] md:block"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-[#ff8a00] via-[#ffdb19] to-[#e52bd1]"></span>
              <span className="relative flex items-center gap-2 whitespace-nowrap rounded-full bg-[#090858] px-3 py-2 text-xs font-bold text-[#ffdb19] transition-all duration-200 group-hover:bg-opacity-80">
                <Flame className="w-4 h-4 text-[#ff8a00] group-hover:animate-bounce" />
                <span>REGISTER FOR AUCTION</span>
              </span>
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-[#090858]/70 p-2 text-slate-100 hover:text-white"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="npl-navigation-drawer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div id="npl-navigation-drawer" className="relative z-20 mt-2 space-y-2 border-t border-indigo-300/20 bg-[#090858] px-4 pb-6 pt-4 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 border-b border-indigo-300/20 pb-3">
              {navItems.map((item) => (
                  <button
                    key={item.target}
                    onClick={() => handleNavClick(item.target)}
                    className={`flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                      activeSection === item.target
                        ? "text-[#ffdb19] bg-white/10"
                        : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {item.icon && <item.icon className="w-4 h-4 text-[#ff8a00]" />}
                    <span>{item.label}</span>
                  </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1 pt-2 text-[10px] sm:text-xs font-medium text-slate-300">
              {moreItems.map((subItem) => (
                <button
                  key={subItem.target}
                  onClick={() => handleNavClick(subItem.target)}
                  className="px-2 py-1.5 text-left hover:text-[#ffdb19]"
                >
                  • {subItem.label}
                </button>
              ))}
            </div>

            <div className="border-t border-indigo-300/20 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsAdminModalOpen(true);
                  }}
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-[10px] font-bold text-slate-100 transition hover:border-[#ffdb19]/50 hover:bg-white/10 hover:text-[#ffdb19] sm:text-xs"
                >
                  <Shield className="h-3.5 w-3.5 shrink-0 text-[#ff8a00]" />
                  <span className="truncate">Admin Control</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openModal('auction-register');
                  }}
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff8a00] to-[#ffdb19] px-2 py-2 text-[10px] font-extrabold text-slate-950 transition hover:brightness-110 active:scale-[0.98] sm:text-xs"
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Register Now</span>
                </button>
                <button
                  onClick={() => handleNavClick('auction')}
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#ff8a00]/40 bg-[#ff8a00]/10 px-2 py-2 text-[10px] font-bold text-amber-200 transition hover:bg-[#ff8a00]/20 sm:text-xs"
                >
                  <Flame className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Auction</span>
                </button>
                <a
                  href="/scorer"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-lg border border-[#ffdb19]/40 bg-[#ffdb19]/10 px-2 py-2 text-[10px] font-bold text-[#ffdb19] transition hover:bg-[#ffdb19]/20 sm:text-xs"
                >
                  <Trophy className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Scoring</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
