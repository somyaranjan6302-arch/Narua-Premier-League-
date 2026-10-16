import React from 'react';
import { ArrowRight, MapPin, Trophy } from 'lucide-react';
import { useNpl } from '../context/NplContext';
import { TopPerformers } from './TopPerformers';
import { getChampionMediaKey, getSiteMedia } from '../utils/siteMedia';

const getEditionKey = (edition) => (
  String(edition || '').match(/Season\s*\d+/i)?.[0].replace(/\s+/g, ' ') || edition
);

export const HistoryOfNpl = ({ scrollToSection }) => {
  const { champions, seasons, siteMedia, tournamentInfo } = useNpl();
  const lastSession = seasons.find((season) => season.status === 'COMPLETED') || seasons[0];
  const edition = getEditionKey(lastSession?.edition);
  const champion = champions.find((item) => getEditionKey(item.edition) === edition);
  const championImage = champion
    ? getSiteMedia(siteMedia, getChampionMediaKey(champions, champion), champion.edition, champion.teamPhoto)
    : '';
  const aboutPhoto = siteMedia.stadium || '/assets/stadium.jpg';

  return (
    <section id="npl-history" className="overflow-hidden bg-[#05052f] text-white">
      {champion && (
        <article className="mb-14 grid overflow-hidden bg-[#0b1a43] shadow-2xl sm:mb-16 lg:min-h-[480px] lg:grid-cols-2">
          <div className="flex flex-col items-start justify-center p-6 sm:p-10 lg:px-16 xl:px-24">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-900/80 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-sky-200">
              <Trophy className="h-4 w-4 text-amber-300" />
              {champion.edition} · Champions
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
              Last session · Final report
            </p>
            <h3 className="mt-2 font-heading text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
              {champion.championTeam} lift the NPL trophy
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-blue-100/85 sm:text-base">
              {champion.description}
            </p>
            <div className="mt-5 grid w-full grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
              <div className="rounded-lg bg-white/[0.06] p-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-sky-300">Final result</span>
                <span className="mt-1 block text-sm font-bold leading-relaxed text-white">{champion.finalScores}</span>
              </div>
              <div className="rounded-lg bg-white/[0.06] p-3">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-amber-300">Champions</span>
                <span className="mt-1 block text-sm font-bold text-white">{champion.winningMargin}</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-blue-100/70">
                  <MapPin className="h-3 w-3" />
                  {champion.venue}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('champions')}
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-400 px-6 text-sm font-extrabold text-[#061538] transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Read More
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative min-h-64 overflow-hidden bg-slate-900 sm:min-h-80 lg:min-h-full">
            {championImage && (
              <img
                src={championImage}
                alt={`${champion.championTeam}, ${champion.edition} champions`}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06112b]/65 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-[#0b1a43]/10" />
            <div className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-slate-950/70 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
              NPL {champion.season} · {champion.edition}
            </div>
          </div>
        </article>
      )}

      <TopPerformers seasonOverride={edition} showSeasonSelector={false} />

      <section className="grid bg-white text-slate-800 lg:min-h-[480px] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative min-h-72 overflow-hidden bg-slate-900 sm:min-h-96 lg:min-h-full">
          <img
            src={aboutPhoto}
            alt="Narua Premier League cricket ground"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent" />
          <span className="absolute bottom-5 left-5 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
            Narua Premier League · Est. {tournamentInfo.established || 2024}
          </span>
        </div>
        <div className="relative flex items-center overflow-hidden px-6 py-12 sm:px-10 lg:px-16 lg:py-16">
          <span aria-hidden="true" className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 font-sports text-[20rem] leading-none text-slate-100">
            N
          </span>
          <div className="relative max-w-xl">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              The story behind
            </p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
              About Narua Premier League
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base sm:leading-8">
              {tournamentInfo.storyText}
            </p>
            <button
              type="button"
              onClick={() => scrollToSection('story')}
              className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-sky-400 px-6 text-sm font-extrabold text-[#061538] transition hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
            >
              Read Our Story
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </section>
  );
};
