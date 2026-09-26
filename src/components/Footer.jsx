import React from 'react';
import { NplLogo } from './NplLogo';
import { useNpl } from '../context/NplContext';
import { Mail, Phone, MapPin, MessageCircle, Shield, Award, Heart } from 'lucide-react';


export const Footer = ({ scrollToSection }) => {
  const { tournamentInfo, setIsAdminModalOpen } = useNpl();

  const sponsors = [
    { name: "NARUA STEEL CORP", role: "TITLE SPONSOR" },
    { name: "BENGAL APEX LOGISTICS", role: "OFFICIAL LOGISTICS" },
    { name: "ROYAL HERITAGE RESORTS", role: "HOSPITALITY PARTNER" },
    { name: "PAL STAR DIGITAL", role: "STREAMING PARTNER" },
    { name: "DELTA AGRO", role: "BEVERAGE PARTNER" },
  ];

  return (
    <footer className="bg-[#030712] text-slate-400 border-t border-slate-800/80 pt-16 pb-8 relative overflow-hidden">
      {/* Top Sponsors Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 mb-12 border-b border-slate-800/80">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
            OFFICIAL TOURNAMENT PARTNERS & SPONSORS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 items-center justify-center">
          {sponsors.map((sp, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center hover:border-slate-700 transition-colors"
            >
              <span className="font-sports text-base sm:text-lg text-slate-200 block leading-tight">
                {sp.name}
              </span>
              <span className="text-[9px] font-bold uppercase text-amber-500 tracking-wider">
                {sp.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <NplLogo size="lg" />
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
              Narua Premier League (NPL) is Bengal's premier local franchise T20 cricket tournament, empowering grassroots cricket talent since 2024 through professional league standards.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                </svg>
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-emerald-400 hover:border-emerald-500 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sports text-xl text-white tracking-wider">
              TOURNAMENT HUB
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => scrollToSection('matches')} className="hover:text-amber-400 transition-colors">
                  Match Schedule & Live Scores
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('standings')} className="hover:text-amber-400 transition-colors">
                  Official Points Table
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('teams')} className="hover:text-amber-400 transition-colors">
                  Franchise Teams & Squads
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('champions')} className="hover:text-amber-400 transition-colors">
                  NPL Champions & Roll of Honour
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('auction')} className="hover:text-amber-400 transition-colors">
                  Mega Player Auction 2026
                </button>
              </li>
            </ul>
          </div>

          {/* Media & Resources (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-sports text-xl text-white tracking-wider">
              MEDIA & STATS
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => scrollToSection('gallery')} className="hover:text-amber-400 transition-colors">
                  Match Day Gallery
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('highlights')} className="hover:text-amber-400 transition-colors">
                  Video Highlights
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('news')} className="hover:text-amber-400 transition-colors">
                  Press Releases & News
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('records')} className="hover:text-amber-400 transition-colors">
                  All-time Records
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('trophy')} className="hover:text-amber-400 transition-colors">
                  The NPL Trophy
                </button>
              </li>
            </ul>
          </div>

          {/* Official Contact Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sports text-xl text-white tracking-wider">
              OFFICIAL CONTACT
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{tournamentInfo.venue}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href={`mailto:${tournamentInfo.contactEmail}`} className="hover:text-white transition-colors">
                  {tournamentInfo.contactEmail}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <a href={`tel:${tournamentInfo.contactPhone}`} className="hover:text-white transition-colors">
                  {tournamentInfo.contactPhone}
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-amber-400 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Control Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © 2026 Narua Premier League (NPL). All Rights Reserved. Established Since 2024.
          </div>

          <div className="flex items-center gap-1">
            <span>Powered by Narua Sports Council</span>
            <span>•</span>
            <span className="text-amber-500/80">Fair Play & Passion</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
