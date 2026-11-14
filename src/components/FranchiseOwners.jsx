import React, { useEffect, useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { ChevronLeft, ChevronRight, UserRound, Shield, Trophy, Crown, Sparkles, Building2, LayoutGrid, Award } from 'lucide-react';
import { getSessionMediaKey, getSiteMedia } from '../utils/siteMedia';
import { AwardBannerCard } from './AwardBannerCard';

export const FranchiseOwners = ({
  seasonOverride,
  showSeasonSelector = true,
  featured = false,
  scrollToSection
}) => {
  const { teams, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const displaySeason = seasonOverride || selectedSeason;

  const [viewMode, setViewMode] = useState(featured ? 'carousel' : 'carousel'); // 'carousel' | 'grid'
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    setFeaturedIndex(0);
  }, [displaySeason]);

  // Filter active teams participating in the selected season
  const activeFranchises = teams.filter((team) => {
    const teamSessions = Array.isArray(team.sessions)
      ? team.sessions
      : Array.isArray(team.seasons)
        ? team.seasons
        : team.session
          ? [team.session]
          : seasons.map((s) => s.edition);

    return team.active !== false && teamSessions.includes(displaySeason);
  });

  const selectedIndex = activeFranchises.length ? featuredIndex % activeFranchises.length : 0;
  const currentTeam = activeFranchises[selectedIndex];

  const getOwnerPhoto = (team) => {
    if (!team) return '';
    const mediaKey = `franchise-owner:${team.id}`;
    const uploadedPhoto = siteMedia[getSessionMediaKey(mediaKey, displaySeason)]
      || siteMedia[getSessionMediaKey(`owner-photo:${team.id}`, displaySeason)]
      || getSiteMedia(siteMedia, mediaKey, displaySeason)
      || getSiteMedia(siteMedia, `owner-photo:${team.id}`, displaySeason);

    return uploadedPhoto || team.ownerPhoto || '';
  };

  const currentPhoto = currentTeam ? getOwnerPhoto(currentTeam) : '';
  const currentLogo = currentTeam
    ? getSiteMedia(siteMedia, `team-logo:${currentTeam.id}`, displaySeason, currentTeam.logo)
    : '';

  const seasonObj = seasons.find((s) => s.edition === displaySeason);
  const seasonYear = seasonObj?.year || displaySeason.replace(/^Season\s*/i, '');

  const openTeamProfile = (team) => {
    if (!team) return;
    openModal('team-details', team);
  };

  // If featured prop is true, force carousel mode without view switcher
  const isCarousel = featured || viewMode === 'carousel';

  if (isCarousel) {
    return (
      <section
        id={showSeasonSelector ? 'owners' : undefined}
        className="relative isolate overflow-hidden border-t border-indigo-300/15 bg-[#100b89] py-10 sm:py-14"
      >
        {/* Dynamic Stadium Royal Blue Gradient Overlay */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(29,40,255,0.14),transparent_47%),linear-gradient(180deg,#130a91_0%,#100b83_62%,#0d0875_100%)]" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                'repeating-conic-gradient(from 222deg at 50% 58%, rgba(37, 81, 255, 0.32) 0deg 7deg, transparent 7deg 18deg)'
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1760px] px-3 sm:px-6 lg:px-10">
          {/* Section Header */}
          <div className="relative z-10 mb-4 flex flex-col items-center text-center sm:mb-2">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-amber-300 backdrop-blur-md">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              <span>FRANCHISE PATRONS & LEADERSHIP</span>
            </div>
            <h2 className="font-heading text-4xl font-medium uppercase tracking-[0.12em] text-white sm:text-5xl lg:text-6xl">
              Our Franchise Owners
            </h2>

            {showSeasonSelector && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <SessionSelector
                  seasons={seasons}
                  selectedSeason={selectedSeason}
                  setSelectedSeason={setSelectedSeason}
                />
                {!featured && (
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-200 transition hover:bg-white/20 hover:text-white"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>View All Grid</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {currentTeam ? (
            <div className="relative mx-auto min-h-[650px] max-w-[1760px] md:min-h-[620px]">
              {/* Desktop Carousel Navigation Chevrons */}
              <button
                type="button"
                onClick={() =>
                  setFeaturedIndex((selectedIndex - 1 + activeFranchises.length) % activeFranchises.length)
                }
                aria-label="Previous franchise owner"
                className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-slate-200/90 transition hover:text-white md:flex sm:left-1 lg:left-2"
              >
                <ChevronLeft className="h-9 w-9 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => setFeaturedIndex((selectedIndex + 1) % activeFranchises.length)}
                aria-label="Next franchise owner"
                className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-slate-200/90 transition hover:text-white md:flex sm:right-1 lg:right-2"
              >
                <ChevronRight className="h-9 w-9 stroke-[1.5]" />
              </button>

              {/* 2-Column Main Showcase Grid */}
              <div className="mx-auto grid min-h-[650px] max-w-[1500px] items-end md:min-h-[620px] md:grid-cols-[1fr_1fr]">
                {/* Left Column: Owner High-Res Portrait Frame */}
                <button
                  type="button"
                  onClick={() => openTeamProfile(currentTeam)}
                  aria-label={`Open ${currentTeam.name} franchise profile`}
                  className="group relative mx-auto h-[350px] w-full max-w-[420px] overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 sm:h-[460px] md:h-[570px] md:max-w-none"
                >
                  {/* Subtle team primary aura ring behind owner */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-4 left-1/2 h-[75%] w-[85%] -translate-x-1/2 rounded-full opacity-35 blur-3xl transition duration-500 group-hover:opacity-50"
                    style={{
                      background: `radial-gradient(circle, ${currentTeam.primaryColor || '#1d4ed8'} 0%, ${currentTeam.secondaryColor || '#071535'} 70%, transparent 100%)`
                    }}
                  />

                  {currentPhoto ? (
                    <img
                      src={currentPhoto}
                      alt={`${currentTeam.owner || 'Franchise Owner'} portrait`}
                      className="absolute inset-x-0 bottom-0 mx-auto h-full max-h-full w-full origin-bottom object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-x-0 bottom-8 flex h-[75%] flex-col items-center justify-center text-sky-100/25">
                      <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-2 border-dashed border-white/20 bg-white/5 shadow-inner sm:h-44 sm:w-44">
                        <UserRound className="h-24 w-24 stroke-[1] text-sky-100/40" />
                        <div
                          className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/80 bg-white p-1 shadow-lg"
                        >
                          {currentLogo ? (
                            <img src={currentLogo} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <Shield className="h-5 w-5 text-indigo-900" />
                          )}
                        </div>
                      </div>
                      <p className="mt-4 text-[11px] font-black uppercase tracking-[0.25em] text-sky-200/60">
                        {currentTeam.owner ? 'Official Franchise Owner' : 'Owner Photo Pending'}
                      </p>
                    </div>
                  )}
                </button>

                {/* Right Column: Owner Information & Franchise Details */}
                <div className="relative z-10 mx-auto flex w-full max-w-[530px] flex-col justify-center px-5 pb-8 pt-2 sm:px-10 md:mb-8 md:ml-0 md:max-w-[510px] md:justify-start md:px-0 md:pb-0 md:pt-8">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">
                    Season {seasonYear}
                  </p>

                  <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-[#ff8a00]/70 bg-[#702612]/70 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white">
                    <span className="h-2 w-2 rounded-full bg-[#ff8a00] shadow-[0_0_10px_#ff8a00]" />
                    FRANCHISE OWNER & PATRON
                  </span>

                  {/* Headline: Huge Metric + Owner Name & Team Badge */}
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-7">
                    <p className="bg-gradient-to-b from-[#ffdb19] via-[#ffb000] to-[#ff5a18] bg-clip-text text-7xl font-black leading-none text-transparent sm:text-8xl lg:text-9xl">
                      {currentTeam.titles > 0 ? `0${currentTeam.titles}` : `0${selectedIndex + 1}`}
                    </p>
                    <div className="min-w-0">
                      <h3 className="font-heading text-4xl font-normal leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                        {currentTeam.owner || `${currentTeam.name} Ownership`}
                      </h3>
                      <div className="mt-2.5 flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/80 bg-white p-0.5 shadow-md">
                          {currentLogo ? (
                            <img src={currentLogo} alt="" className="h-full w-full object-contain" />
                          ) : (
                            <span className="text-[9px] font-black uppercase leading-tight text-slate-900">
                              {(currentTeam.shortName || currentTeam.name || 'NPL').slice(0, 3)}
                            </span>
                          )}
                        </span>
                        <p className="text-sm font-bold uppercase tracking-widest text-white/90 sm:text-base truncate">
                          {currentTeam.name}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-300/80">
                        {currentTeam.titles > 0
                          ? currentTeam.titles === 1
                            ? 'NPL Champion Franchise'
                            : `${currentTeam.titles}x NPL Champions`
                          : 'Official Franchise Member'}
                      </p>
                    </div>
                  </div>

                  {/* 3-Column Info & Stats Box */}
                  <div className="mt-7 grid grid-cols-3 divide-x divide-white/20 rounded-2xl border border-[#ffdb19]/80 bg-[#100b89]/35 px-3 py-4 sm:mt-9 sm:px-5 sm:py-5">
                    <div className="min-w-0 px-2 text-center">
                      <span className="block truncate text-[9px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                        HOME GROUND
                      </span>
                      <span className="mt-2 block truncate text-base font-bold text-white sm:text-xl">
                        {currentTeam.home || 'Narua Ground'}
                      </span>
                    </div>
                    <div className="min-w-0 px-2 text-center">
                      <span className="block truncate text-[9px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                        TEAM MOTTO
                      </span>
                      <span className="mt-2 block truncate text-base font-bold text-white sm:text-xl">
                        {currentTeam.slogan || 'Pride of Narua'}
                      </span>
                    </div>
                    <div className="min-w-0 px-2 text-center">
                      <span className="block truncate text-[9px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                        TITLES WON
                      </span>
                      <span className="mt-2 block truncate text-base font-bold text-white sm:text-xl">
                        {currentTeam.titles > 0 ? `${currentTeam.titles} ★` : 'Challenger'}
                      </span>
                    </div>
                  </div>

                  {/* Call to Action Button */}
                  <div className="mt-7 flex flex-wrap items-center gap-4 sm:mt-9">
                    <button
                      type="button"
                      onClick={() => openTeamProfile(currentTeam)}
                      className="inline-flex min-h-14 w-fit items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5a18] via-[#ffdb19] to-[#e52bd1] px-10 text-base font-black text-[#10105b] shadow-[0_8px_22px_rgba(255,125,20,0.2)] transition hover:brightness-110 active:scale-95"
                    >
                      Explore Franchise Squad
                    </button>
                    {scrollToSection && (
                      <button
                        type="button"
                        onClick={() => scrollToSection('teams')}
                        className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-white/20"
                      >
                        All Teams
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Previous / Next Buttons */}
              {activeFranchises.length > 1 && (
                <div className="relative z-20 mx-auto flex w-full max-w-[420px] items-center justify-between px-4 pb-5 md:hidden">
                  <button
                    type="button"
                    onClick={() =>
                      setFeaturedIndex((selectedIndex - 1 + activeFranchises.length) % activeFranchises.length)
                    }
                    aria-label="Previous franchise owner"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#090852]/70 px-4 text-xs font-bold text-white transition active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Previous
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-100/80">
                    {selectedIndex + 1} / {activeFranchises.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFeaturedIndex((selectedIndex + 1) % activeFranchises.length)}
                    aria-label="Next franchise owner"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#090852]/70 px-4 text-xs font-bold text-white transition active:scale-95"
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {/* Carousel Dot Indicators */}
              {activeFranchises.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 xl:bottom-4">
                  {activeFranchises.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setFeaturedIndex(index)}
                      aria-label={`Show ${item.name} owner`}
                      aria-pressed={selectedIndex === index}
                      className={`h-1.5 rounded-full transition-all ${
                        selectedIndex === index ? 'w-8 bg-[#ffdb19]' : 'w-1.5 bg-white/45 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-300">
              No franchise owner records are available for {displaySeason} yet.
            </p>
          )}
        </div>
      </section>
    );
  }

  // Grid Mode (All Franchise Owners Grid View)
  return (
    <section
      id={showSeasonSelector ? 'owners' : undefined}
      className="npl-section-bg border-t border-slate-800 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400">
              <Crown className="h-4 w-4" />
              {displaySeason} Leadership
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Our Franchise Owners
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setViewMode('carousel')}
              className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-300 transition hover:bg-amber-500/20"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Featured View</span>
            </button>
            {showSeasonSelector && (
              <SessionSelector
                seasons={seasons}
                selectedSeason={selectedSeason}
                setSelectedSeason={setSelectedSeason}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
          {activeFranchises.map((team, idx) => {
            const photo = getOwnerPhoto(team);
            const teamLogo = getSiteMedia(siteMedia, `team-logo:${team.id}`, displaySeason, team.logo);
            const ownerName = team.owner || `${team.name} Ownership`;

            return (
              <div key={team.id} className="min-w-0">
                <AwardBannerCard
                  title="FRANCHISE OWNER & PATRON"
                  name={ownerName}
                  value={team.titles > 0 ? `0${team.titles} ★` : `0${idx + 1}`}
                  valueLabel={team.titles > 0 ? (team.titles === 1 ? 'NPL CHAMPION' : 'TITLES WON') : 'FRANCHISE NO.'}
                  details={`${team.name} • ${team.home || 'Narua Ground'} • "${team.slogan || 'Pride of Narua'}"`}
                  photo={photo}
                  teamLogo={teamLogo}
                  teamName={team.shortName || team.name}
                  primaryColor={team.primaryColor || '#1d4ed8'}
                  secondaryColor={team.secondaryColor || '#071535'}
                  onClick={() => openTeamProfile(team)}
                />
                <div className="mt-2.5 flex items-center justify-between">
                  <p className="min-h-5 text-sm font-extrabold leading-tight text-white sm:text-base truncate">
                    {team.name}
                  </p>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300/80">
                    {team.titles > 0 ? `${team.titles} Title${team.titles > 1 ? 's' : ''}` : 'Contender'}
                  </span>
                </div>
              </div>
            );
          })}

          {activeFranchises.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No franchise owners are registered for {displaySeason} yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

