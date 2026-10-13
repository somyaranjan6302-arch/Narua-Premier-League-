import React from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Newspaper, Calendar, Clock, ArrowRight, Megaphone } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';

export const NewsSection = () => {
  const { news, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const sessionNews = news.filter((item) => (item.season || item.session) === selectedSeason);
  const announcements = sessionNews.filter((item) => (
    item.contentType === 'announcement' ||
    item.contentType === 'textOnly' ||
    item.category === 'ANNOUNCEMENT'
  ));
  const articles = sessionNews.filter((item) => (
    item.contentType !== 'announcement' &&
    item.contentType !== 'textOnly' &&
    item.category !== 'ANNOUNCEMENT'
  ));
  const featuredNews = articles.find((item) => item.featured) || articles[0];
  const otherNews = articles.filter((item) => item.id !== featuredNews?.id);
  const getNewsImage = (item) => item.imageEnabled === false
    ? ''
    : getSiteMedia(siteMedia, `news:${item.id}`, item.season || item.session, item.image);
  const openArticle = (item) => openModal('article-details', {
    ...item,
    image: getNewsImage(item)
  });

  return (
    <section id="news" className="min-h-[calc(100vh-8rem)] border-t border-slate-800 bg-[#050936] py-10 sm:py-14">
      <div className="mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-sky-400">
              <Newspaper className="h-4 w-4" />
              OFFICIAL TOURNAMENT BULLETIN
            </div>
            <h2 className="font-sports text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">
              NPL <span className="text-sky-400">NEWS</span>
            </h2>
            <p className="mt-2 text-sm text-slate-400">Match reports, league announcements, and stories from every session.</p>
          </div>
          <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
        </div>

        {announcements.length > 0 && (
          <div className="mb-7 space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-sky-300">
              <Megaphone className="h-4 w-4" />
              Important news &amp; announcements
            </h3>
            {announcements.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openArticle(item)}
                className="flex w-full items-start justify-between gap-4 rounded-xl border border-sky-900/70 bg-[#0a1745] p-4 text-left transition hover:border-sky-500/70 sm:items-center sm:p-5"
              >
                <span className="min-w-0">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-sky-400">
                    {item.category === 'ANNOUNCEMENT' || item.contentType === 'announcement' ? 'Announcement' : 'Important news'}
                    {item.date ? ` • ${item.date}` : ''}
                  </span>
                  <span className="block font-heading text-base font-bold text-white sm:text-lg">{item.headline}</span>
                  {item.snippet && <span className="mt-1 block text-sm text-slate-300">{item.snippet}</span>}
                </span>
                <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-sky-400 sm:mt-0" />
              </button>
            ))}
          </div>
        )}

        {featuredNews ? (
          <>
            <button
              type="button"
              onClick={() => openArticle(featuredNews)}
              className="group grid min-h-[360px] w-full overflow-hidden rounded-xl text-left shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 md:min-h-[450px] md:grid-cols-12"
            >
              <span className="relative z-10 flex flex-col items-start justify-between bg-[#091a4d] p-5 sm:p-8 md:col-span-4 md:p-8">
                <span>
                  <span className="block text-sm font-bold text-sky-400">{featuredNews.category || 'Press Releases'}</span>
                  <span className="mt-2 block font-heading text-3xl font-extrabold leading-tight text-white transition-colors group-hover:text-sky-200 sm:text-4xl md:text-[clamp(2rem,3.5vw,4.5rem)]">
                    {featuredNews.headline}
                  </span>
                  <span className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-300 sm:text-sm">
                    <Calendar className="h-4 w-4 shrink-0 text-sky-400" />
                    {featuredNews.date}
                  </span>
                </span>
                <span className="mt-8 inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-2.5 text-sm font-extrabold text-[#06133b] transition group-hover:bg-sky-300">
                  Read <ArrowRight className="h-4 w-4" />
                </span>
              </span>
              <span className="relative block min-h-[250px] overflow-hidden bg-slate-950 md:col-span-8 md:min-h-full">
                {getNewsImage(featuredNews) ? (
                  <img
                    src={getNewsImage(featuredNews)}
                    alt={featuredNews.headline}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#10285e] to-[#07112e]">
                    <Newspaper className="h-20 w-20 text-sky-300/40" />
                  </span>
                )}
              </span>
            </button>

            {otherNews.length > 0 && (
              <div className="mt-7 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                {otherNews.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openArticle(item)}
                    className="group min-w-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <span className="relative mb-3 block aspect-[4/2.55] overflow-hidden rounded-lg bg-[#0b1745]">
                      {getNewsImage(item) ? (
                        <img
                          src={getNewsImage(item)}
                          alt={item.headline}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <Newspaper className="h-10 w-10 text-sky-300/50" />
                        </span>
                      )}
                    </span>
                    <span className="block text-xs font-bold text-sky-400">{item.category || 'League News'}</span>
                    <span className="mt-1 block font-heading text-base font-bold leading-snug text-white transition-colors group-hover:text-sky-300">
                      {item.headline}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      {item.date}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : sessionNews.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
            No news is published for {selectedSeason} yet.
          </p>
        ) : null}
      </div>
    </section>
  );
};
