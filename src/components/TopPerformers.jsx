import React, { useEffect, useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Award, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { getSessionMediaKey, getSiteMedia } from '../utils/siteMedia';
import { session3Performers } from '../data/session3Data';
import { session4Performers } from '../data/session4Data';
import { session5Performers } from '../data/session5Data';
import { session2Performers } from '../data/session2Data';
import { session1Performers } from '../data/session1Performers';
import { AwardBannerCard } from './AwardBannerCard';

const getMetric = (text) => {
  const trimmed = text.trim();
  const leadingValue = trimmed.match(/^([\d][\d.,/*%*]*(?:\s*\([^)]*\))?)\s+(.+)$/);
  if (leadingValue) return { value: leadingValue[1], label: leadingValue[2] };

  const trailingValue = trimmed.match(/^(.+?)\s+([\d][\d.,/*%*]*(?:\s*\([^)]*\))?)$/);
  if (trailingValue) return { value: trailingValue[2], label: trailingValue[1] };

  return { value: trimmed, label: '' };
};

export const TopPerformers = ({ seasonOverride, showSeasonSelector = true, featured = false, scrollToSection }) => {
  const { topPerformers, teams, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const displaySeason = seasonOverride || selectedSeason;
  const activePerformers = displaySeason === 'Season 5'
    ? session5Performers
    : displaySeason === 'Season 2' ? session2Performers
      : displaySeason === 'Season 3' ? session3Performers
        : displaySeason === 'Season 4' ? session4Performers
          : displaySeason === 'Season 1' ? session1Performers : topPerformers;
  const knownLabels = {
    orangeCap: 'Orange Cap',
    purpleCap: 'Purple Cap',
    mostSixes: 'Maximum Sixes',
    bestEconomy: 'Best Economy',
    highestScore: 'Highest Scorer',
    bestBowling: 'Best Bowling Figures',
    bestFielder: 'Best Fielder'
  };
  const sessionPerformers = Object.entries(activePerformers || {})
    .filter(([, data]) => data && (data.player || data.team || data.stat))
    .map(([key, data]) => ({
      key,
      data,
      label: knownLabels[key] || data.category || key.replace(/([A-Z])/g, ' $1')
    }));
  const [featuredIndex, setFeaturedIndex] = useState(0);
  useEffect(() => setFeaturedIndex(0), [displaySeason]);
  const selectedIndex = sessionPerformers.length ? featuredIndex % sessionPerformers.length : 0;
  const selectedPerformer = sessionPerformers[selectedIndex];

  const getPerformerPhoto = (key) => {
    const mediaKey = `${featured ? 'featured-performer' : 'performer'}:${key}`;
    const uploadedPhoto = featured
      ? siteMedia[getSessionMediaKey(mediaKey, displaySeason)] || ''
      : getSiteMedia(siteMedia, mediaKey, displaySeason);
    return uploadedPhoto || (
      import.meta.env.DEV && key === 'orangeCap'
        ? '/local-demo-player.png'
        : ''
    );
  };

  const getRosterTeam = (data) => teams.find((team) => (
    (team.name === data.team || team.shortName === data.teamShort) &&
    (team.sessions || team.seasons || [team.session]).includes(displaySeason)
  ));

  const openPerformerProfile = (key, data, label, photo) => {
    const rosterTeam = getRosterTeam(data);
    const teamLogo = rosterTeam
      ? getSiteMedia(siteMedia, `team-logo:${rosterTeam.id}`, displaySeason, rosterTeam.logo)
      : '';
    openModal('player-profile', {
      name: data.player,
      team: data.team,
      teamName: data.team,
      teamShort: data.teamShort || rosterTeam?.shortName,
      teamColor: rosterTeam?.primaryColor,
      teamLogo,
      season: displaySeason,
      role: data.category || label,
      runs: data.stat,
      photo,
      details: data.details
    });
  };

  if (featured) {
    const performer = selectedPerformer;
    const data = performer?.data;
    const photo = data ? getPerformerPhoto(performer.key) : '';
    const primaryMetric = data ? getMetric(data.stat || '') : { value: '', label: '' };
    const details = (data?.details || '').split('•').map((item) => item.trim()).filter(Boolean);
    const detailMetrics = details.map(getMetric).slice(0, 3);

    return (
      <section id={showSeasonSelector ? 'performers' : undefined} className="relative isolate overflow-hidden border-t border-indigo-300/15 bg-[#100b89] py-10 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(29,40,255,0.14),transparent_47%),linear-gradient(180deg,#130a91_0%,#100b83_62%,#0d0875_100%)]" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-conic-gradient(from 222deg at 50% 58%, rgba(37, 81, 255, 0.32) 0deg 7deg, transparent 7deg 18deg)' }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-[1760px] px-3 sm:px-6 lg:px-10">
          <div className="relative z-10 mb-4 flex flex-col items-center text-center sm:mb-0">
            <h2 className="font-heading text-4xl font-medium uppercase tracking-[0.12em] text-white sm:text-5xl lg:text-6xl">
              Top Performers
            </h2>
            {showSeasonSelector && (
              <div className="mt-4">
                <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
              </div>
            )}
          </div>

          {data ? (
            <div className="relative mx-auto min-h-[650px] max-w-[1760px] md:min-h-[620px]">
              <button
                type="button"
                onClick={() => setFeaturedIndex((selectedIndex - 1 + sessionPerformers.length) % sessionPerformers.length)}
                aria-label="Previous top performer"
                className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-slate-200/90 transition hover:text-white md:flex sm:left-1 lg:left-2"
              >
                <ChevronLeft className="h-9 w-9 stroke-[1.5]" />
              </button>
              <button
                type="button"
                onClick={() => setFeaturedIndex((selectedIndex + 1) % sessionPerformers.length)}
                aria-label="Next top performer"
                className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center text-slate-200/90 transition hover:text-white md:flex sm:right-1 lg:right-2"
              >
                <ChevronRight className="h-9 w-9 stroke-[1.5]" />
              </button>

              <div className="mx-auto grid min-h-[650px] max-w-[1500px] items-end md:min-h-[620px] md:grid-cols-[1fr_1fr]">
                <button
                  type="button"
                  onClick={() => openPerformerProfile(performer.key, data, performer.label, photo)}
                  aria-label={`Open ${data.player || data.team} profile`}
                  className="group relative mx-auto h-[350px] w-full max-w-[420px] overflow-hidden text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 sm:h-[460px] md:h-[570px] md:max-w-none"
                >
                  {photo ? (
                    <img
                      src={photo}
                      alt={`${data.player || data.team} portrait`}
                      className="absolute inset-x-0 bottom-0 mx-auto h-full max-h-full w-full origin-bottom object-contain object-bottom transition-transform duration-500 ease-out group-hover:scale-[1.08]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-x-0 bottom-8 flex h-[70%] flex-col items-center justify-center text-sky-100/20">
                      <UserRound className="h-24 w-24 stroke-[1]" />
                    </div>
                  )}
                </button>

                <div className="relative z-10 mx-auto flex w-full max-w-[530px] flex-col justify-center px-5 pb-8 pt-2 sm:px-10 md:mb-8 md:ml-0 md:max-w-[510px] md:justify-start md:px-0 md:pb-0 md:pt-8">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Season {seasons.find((season) => season.edition === displaySeason)?.year || displaySeason.replace(/^Season\s*/i, '')}</p>
                  <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-md border border-[#ff8a00]/70 bg-[#702612]/70 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-white">
                    <span className="h-2 w-2 rounded-full bg-[#ff8a00] shadow-[0_0_10px_#ff8a00]" />
                    {data.category || performer.label}
                  </span>

                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4 sm:gap-7">
                    <p className="bg-gradient-to-b from-[#ffdb19] via-[#ffb000] to-[#ff5a18] bg-clip-text text-7xl font-black leading-none text-transparent sm:text-8xl lg:text-9xl">
                      {primaryMetric.value}
                    </p>
                    <div className="min-w-0">
                      <h3 className="font-heading text-4xl font-normal leading-[1.08] text-white sm:text-5xl lg:text-6xl">
                        {data.player || data.team}
                      </h3>
                      {primaryMetric.label && (
                        <p className="mt-2 text-sm font-bold uppercase tracking-widest text-white/85 sm:text-base">{primaryMetric.label}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-7 grid grid-cols-3 divide-x divide-white/20 rounded-2xl border border-[#ffdb19]/80 bg-[#100b89]/35 px-3 py-4 sm:mt-9 sm:px-5 sm:py-5">
                    {detailMetrics.map((metric, index) => (
                      <div key={`${metric.value}-${index}`} className="min-w-0 px-2 text-center">
                        <span className="block truncate text-[9px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">
                          {metric.label || `Stat ${index + 1}`}
                        </span>
                        <span className="mt-2 block truncate text-lg font-bold text-white sm:text-2xl">{metric.value}</span>
                      </div>
                    ))}
                    {detailMetrics.length === 0 && (
                      <div className="col-span-3 min-w-0 px-2 text-center">
                        <span className="block text-[9px] font-black uppercase tracking-[0.12em] text-white sm:text-xs">Team</span>
                        <span className="mt-2 block truncate text-lg font-bold text-white sm:text-2xl">{data.team || 'NPL'}</span>
                      </div>
                    )}
                  </div>

                  {scrollToSection && (
                    <button
                      type="button"
                      onClick={() => scrollToSection('performers')}
                      className="mt-7 inline-flex min-h-14 w-fit items-center justify-center rounded-xl bg-gradient-to-r from-[#ff5a18] via-[#ffdb19] to-[#e52bd1] px-10 text-base font-black text-[#10105b] shadow-[0_8px_22px_rgba(255,125,20,0.2)] transition hover:brightness-110 sm:mt-9"
                    >
                      Full Leaderboard
                    </button>
                  )}
                </div>
              </div>

              {sessionPerformers.length > 1 && (
                <div className="relative z-20 mx-auto flex w-full max-w-[420px] items-center justify-between px-4 pb-5 md:hidden">
                  <button
                    type="button"
                    onClick={() => setFeaturedIndex((selectedIndex - 1 + sessionPerformers.length) % sessionPerformers.length)}
                    aria-label="Previous top performer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#090852]/70 px-4 text-xs font-bold text-white transition active:scale-95"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    Previous
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-sky-100/80">
                    {selectedIndex + 1} / {sessionPerformers.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFeaturedIndex((selectedIndex + 1) % sessionPerformers.length)}
                    aria-label="Next top performer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-[#090852]/70 px-4 text-xs font-bold text-white transition active:scale-95"
                  >
                    Next
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              {sessionPerformers.length > 1 && (
                <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 xl:bottom-4">
                  {sessionPerformers.map((item, index) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFeaturedIndex(index)}
                      aria-label={`Show ${item.label}`}
                      aria-pressed={selectedIndex === index}
                      className={`h-1.5 rounded-full transition-all ${selectedIndex === index ? 'w-8 bg-[#ffdb19]' : 'w-1.5 bg-white/45 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-300">
              No performer records are available for {displaySeason} yet.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section id={showSeasonSelector ? 'performers' : undefined} className="npl-section-bg border-t border-slate-800 py-12 sm:py-16">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-sky-400">
              <Award className="h-4 w-4" />
              {displaySeason} awards
            </div>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Season&apos;s Top Performers
            </h2>
          </div>
          {showSeasonSelector && (
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-5 gap-y-16 sm:grid-cols-2 xl:grid-cols-3">
          {sessionPerformers.map(({ key, data, label }) => {
            const rosterTeam = getRosterTeam(data);
            const photo = getPerformerPhoto(key);
            const teamLogo = rosterTeam
              ? getSiteMedia(siteMedia, `team-logo:${rosterTeam.id}`, displaySeason, rosterTeam.logo)
              : '';
            const teamInitials = (data.teamShort || data.team || 'NPL')
              .split(/\s+/)
              .filter(Boolean)
              .map((part) => part[0])
              .join('')
              .slice(0, 3);
            const primaryMetric = getMetric(data.stat || '');

            return (
              <div key={key} className="min-w-0">
                <AwardBannerCard
                  title={data.category || label}
                  name={data.player || data.team || 'NPL'}
                  value={primaryMetric.value}
                  valueLabel={primaryMetric.label}
                  details={data.details}
                  photo={photo}
                  teamLogo={teamLogo}
                  teamName={data.teamShort || data.team || teamInitials}
                  primaryColor={rosterTeam?.primaryColor || '#0e7490'}
                  secondaryColor={rosterTeam?.secondaryColor || '#075985'}
                  onClick={() => openPerformerProfile(key, data, label, photo)}
                />
                <p className="mt-2.5 min-h-5 text-sm font-extrabold leading-tight text-white sm:text-base">{label}</p>
              </div>
            );
          })}
          {sessionPerformers.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
              No performer records are available for {displaySeason} yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
