import React, { useState, useEffect } from 'react';
import { NplLogo } from './NplLogo';
import { useNpl } from '../context/NplContext';
import { Menu, X, Shield, Award, Calendar, Users, Trophy, Image, Play, Flame, Newspaper, ChevronDown } from 'lucide-react';

export const Navbar = ({ activeSection, setActiveSection }) => {
  const { matches, openModal, setIsAdminModalOpen, isAdminLoggedIn } = useNpl();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Find live match or upcoming match for the ticker strip
  const liveMatch = matches.find(m => m.status === 'LIVE') || matches[0];

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
    { label: "Trophy Showcase", target: "trophy" },
    { label: "Top Performers (Caps)", target: "performers" },
  ];

  const handleNavClick = (target) => {
    setActiveSection(target);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
    const element = document.getElementById(target);
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
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Live Match Strip / Broadcast Ticker */}
      {liveMatch && (
        <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 border-b border-blue-900/50 py-1.5 px-4 text-xs font-medium text-slate-300 flex items-center justify-between overflow-x-auto whitespace-nowrap">
          <div className="flex items-center gap-3 mx-auto">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-bold text-[10px] tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              {liveMatch.status}
            </span>
            <span className="text-amber-400 font-semibold">{liveMatch.matchNumber}:</span>
            <span className="text-white font-bold">{liveMatch.team1.shortName} {liveMatch.team1.score}</span>
            <span className="text-slate-400">vs</span>
            <span className="text-white font-bold">{liveMatch.team2.shortName} {liveMatch.team2.score || "Yet to bat"}</span>
            <span className="hidden md:inline text-slate-400">•</span>
            <span className="hidden md:inline text-amber-300/90 italic">{liveMatch.equation || liveMatch.preview}</span>
            <button
              onClick={() => openModal('match-details', liveMatch)}
              className="text-blue-400 hover:text-amber-400 underline ml-2 text-[11px] font-semibold transition-colors"
            >
              Match Center →
            </button>
          </div>

          {/* Quick Admin Access */}
          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors ml-4 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60"
            title="Tournament Admin Console"
          >
            <Shield className="w-3 h-3 text-amber-500" />
            <span>{isAdminLoggedIn ? "Admin Panel" : "Admin Login"}</span>
          </button>
        </div>
      )}

      {/* Main Sticky Navigation Bar */}
      <nav
        className={`w-full transition-all duration-300 border-b ${
          isScrolled
            ? "bg-[#060D1E]/95 backdrop-blur-md border-slate-800 shadow-2xl py-2.5"
            : "bg-[#071026]/85 backdrop-blur-sm border-slate-800/60 py-3.5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: NPL Brand Logo */}
          <div onClick={() => handleNavClick('home')}>
            <NplLogo size="md" />
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden xl:flex items-center gap-1 text-sm font-semibold tracking-wide">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => handleNavClick(item.target)}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 text-xs 2xl:text-sm font-bold uppercase tracking-wider ${
                  activeSection === item.target
                    ? "text-amber-400 bg-amber-500/10 shadow-[inset_0_0_12px_rgba(245,158,11,0.2)]"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* "MORE" Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
              >
                <span>MORE</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
              </button>

              {isMoreOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0B152B] border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 backdrop-blur-lg">
                  {moreItems.map((subItem) => (
                    <button
                      key={subItem.target}
                      onClick={() => handleNavClick(subItem.target)}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-300 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
                    >
                      {subItem.label}
                    </button>
                  ))}
                  <div className="border-t border-slate-800 my-1"></div>
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
          <div className="flex items-center gap-3">
            {/* Prominent Auction Registration Button */}
            <button
              onClick={() => openModal('auction-register')}
              className="relative group overflow-hidden rounded-full p-[1.5px] font-sports text-sm tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500 rounded-full animate-pulse"></span>
              <span className="relative block px-4 sm:px-5 py-2 rounded-full bg-[#080F21] group-hover:bg-opacity-80 transition-all duration-200 text-amber-300 font-bold flex items-center gap-2 text-xs sm:text-sm">
                <Flame className="w-4 h-4 text-amber-400 group-hover:animate-bounce" />
                <span>REGISTER FOR AUCTION</span>
              </span>
            </button>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg bg-slate-800/80 text-slate-200 hover:text-white border border-slate-700/60"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#070E20] border-t border-slate-800 px-4 pt-4 pb-6 mt-2 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-800/80">
              {navItems.map((item) => (
                <button
                  key={item.target}
                  onClick={() => handleNavClick(item.target)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-left transition-colors ${
                    activeSection === item.target
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  {item.icon && <item.icon className="w-4 h-4 text-amber-400" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs text-slate-400 font-medium">
              {moreItems.map((subItem) => (
                <button
                  key={subItem.target}
                  onClick={() => handleNavClick(subItem.target)}
                  className="text-left px-3 py-1.5 hover:text-amber-300"
                >
                  • {subItem.label}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAdminModalOpen(true);
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-amber-400 py-2"
              >
                <Shield className="w-4 h-4 text-amber-500" />
                <span>Tournament Admin Panel</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openModal('auction-register');
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Register Now
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
