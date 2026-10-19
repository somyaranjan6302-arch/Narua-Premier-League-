import React from 'react';
import { NplLogo } from './NplLogo';
import { useNpl } from '../context/NplContext';
import { Mail, Phone, MapPin, MessageCircle, Shield, Award, Heart } from 'lucide-react';


export const Footer = ({ scrollToSection }) => {
  const { tournamentInfo, setIsAdminModalOpen, siteMedia } = useNpl();

  const sponsors = [
    { name: "FIRE CLUB", role: "TITLE SPONSOR" },
    { name: "YOUNG STAR CLUB", role: "OFFICIAL LOGISTICS" },
    { name: "MUKKE DA DOKAN", role: "HOSPITALITY PARTNER" },
    { name: "SUDHIR DADI VLOGS", role: "STREAMING PARTNER" },
  ];

  return (
    <footer className="relative isolate overflow-hidden border-t border-fuchsia-300/20 bg-[#1600bd] pt-12 text-slate-200 sm:pt-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-70" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(59, 45, 255, 0.85), transparent 55%), linear-gradient(180deg, #1600bd 0%, #10008d 56%, #090858 100%)' }} />
        <div className="absolute -left-16 top-0 h-56 w-40 -rotate-12 bg-gradient-to-br from-[#ff8a00]/50 via-[#e52bd1]/25 to-transparent [clip-path:polygon(0_0,100%_0,72%_100%,30%_74%)]" />
        <div className="absolute -right-16 top-0 h-56 w-40 rotate-12 bg-gradient-to-bl from-[#e52bd1]/50 via-[#ff8a00]/25 to-transparent [clip-path:polygon(0_0,100%_0,70%_75%,28%_100%)]" />
        <div className="absolute bottom-0 left-1/2 h-52 w-72 -translate-x-1/2 bg-gradient-to-t from-[#2513ff]/60 to-transparent [clip-path:polygon(50%_0,100%_100%,0_100%)]" />
      </div>
      {/* Top Sponsors Bar */}
      <div className="relative z-10 mx-auto mb-10 max-w-7xl border-b border-white/15 px-4 pb-8 sm:px-6 lg:px-8 sm:mb-12 sm:pb-10">
        <div className="text-center mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-100/75">
            OFFICIAL TOURNAMENT PARTNERS & SPONSORS
          </span>
        </div>

        <div className="mx-auto flex w-full flex-wrap items-center justify-center gap-4">
          {sponsors.map((sp, idx) => (
            <div
              key={idx}
              className="w-full max-w-xs rounded-xl border border-white/15 bg-[#080852]/45 p-3 text-center shadow-[inset_0_1px_rgba(255,255,255,0.08)] transition-colors hover:border-[#ffdb19]/60"
            >
              <span className="block font-sports text-base leading-tight text-white sm:text-lg">
                {sp.name}
              </span>
              <span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-[#ffdb19]">
                {sp.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/15 pb-10 md:grid-cols-2 lg:grid-cols-12 sm:pb-12">
          {/* Brand Info (4 cols) */}
          <div className="lg:col-span-4 min-w-0 space-y-4">
            <NplLogo size="md" imageSrc={siteMedia.logo} compactOnMobile compact />
            <p className="w-full min-w-0 max-w-sm break-words text-xs leading-relaxed text-blue-100/75 sm:text-sm">
              Narua Premier League (NPL) is Binjharpur's premier local franchise T20 cricket tournament, empowering grassroots cricket talent since 2024 through professional league standards.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.instagram.com/naruapremierleague/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#080852]/60 text-slate-100 transition-colors hover:border-[#ffdb19] hover:text-[#ffdb19]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#080852]/60 text-slate-100 transition-colors hover:border-[#ffdb19] hover:text-[#ffdb19]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                </svg>
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#080852]/60 text-slate-100 transition-colors hover:border-[#ffdb19] hover:text-[#ffdb19]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://chat.whatsapp.com/DwUomPVQh0oEfixMt1lOrs"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#080852]/60 text-slate-100 transition-colors hover:border-emerald-300 hover:text-emerald-300"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sports text-xl tracking-wider text-white">
              TOURNAMENT HUB
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => scrollToSection('matches')} className="transition-colors hover:text-[#ffdb19]">
                  Match Schedule & Live Scores
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('standings')} className="transition-colors hover:text-[#ffdb19]">
                  Official Points Table
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('teams')} className="transition-colors hover:text-[#ffdb19]">
                  Franchise Teams & Squads
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('champions')} className="transition-colors hover:text-[#ffdb19]">
                  NPL Champions & Roll of Honour
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('auction')} className="transition-colors hover:text-[#ffdb19]">
                  Mega Player Auction 2026
                </button>
              </li>
            </ul>
          </div>

          {/* Media & Resources (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-sports text-xl tracking-wider text-white">
              MEDIA & STATS
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => scrollToSection('gallery')} className="transition-colors hover:text-[#ffdb19]">
                  Match Day Gallery
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('highlights')} className="transition-colors hover:text-[#ffdb19]">
                  Video Highlights
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('news')} className="transition-colors hover:text-[#ffdb19]">
                  Press Releases & News
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('records')} className="transition-colors hover:text-[#ffdb19]">
                  All-time Records
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('trophy')} className="transition-colors hover:text-[#ffdb19]">
                  The NPL Trophy
                </button>
              </li>
            </ul>
          </div>

          {/* Official Contact Info (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-sports text-xl tracking-wider text-white">
              OFFICIAL CONTACT
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#ff8a00]" />
                <span>{tournamentInfo.venue}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 flex-shrink-0 text-[#ff8a00]" />
                <a href="mailto:naruapremierleague@gmail.com" className="transition-colors hover:text-[#ffdb19]">
                  naruapremierleague@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 flex-shrink-0 text-[#ff8a00]" />
                <a href={`tel:${tournamentInfo.contactPhone}`} className="transition-colors hover:text-[#ffdb19]">
                  {tournamentInfo.contactPhone}
                </a>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-[#080852]/60 px-3 py-1.5 text-xs font-semibold text-slate-100 transition-colors hover:text-[#ffdb19]"
                >
                  <Shield className="w-3.5 h-3.5 text-[#ff8a00]" />
                  <span>Admin Control Portal</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-center text-xs text-blue-100/65 sm:flex-row sm:text-left">
          <div>
            © 2026 Narua Premier League (NPL). All Rights Reserved. Established Since 2024.
          </div>

          <div className="flex items-center gap-1">
            <span>Powered by Narua Sports Council</span>
            <span>•</span>
            <span className="text-[#ffdb19]">Fair Play & Passion</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
