import React from 'react';
import { useNpl } from '../context/NplContext';
import { Newspaper, Calendar, Clock, ChevronRight, ArrowUpRight } from 'lucide-react';

export const NewsSection = () => {
  const { news, openModal } = useNpl();

  const featuredNews = news.find(n => n.featured) || news[0];
  const otherNews = news.filter(n => n.id !== featuredNews?.id);

  return (
    <section id="news" className="py-20 bg-[#050B17] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Newspaper className="w-3.5 h-3.5" />
              <span>OFFICIAL TOURNAMENT BULLETIN</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              LATEST <span className="text-gold-gradient">NPL NEWS</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Breaking developments, auction updates, match post-mortems, and league communiqués.
            </p>
          </div>

          <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
            Click any article to read official report
          </div>
        </div>

        {/* News Grid (Lead article + 3 sub articles) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Main Featured Article (Left - 7 cols) */}
          {featuredNews && (
            <div
              onClick={() => openModal('article-details', featuredNews)}
              className="lg:col-span-7 glass-panel-card rounded-3xl overflow-hidden border border-slate-800 hover:border-amber-500/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-2xl"
            >
              <div className="relative h-[280px] sm:h-[340px] overflow-hidden">
                <img
                  src={featuredNews.image}
                  alt={featuredNews.headline}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute top-4 left-4">
                  <span className="px-3.5 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
                    {featuredNews.category}
                  </span>
                </div>
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {featuredNews.date}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {featuredNews.readTime}
                    </span>
                  </div>

                  <h3 className="font-sports text-2xl sm:text-3xl lg:text-4xl text-white tracking-wide leading-tight group-hover:text-amber-400 transition-colors">
                    {featuredNews.headline}
                  </h3>

                  <p className="text-sm text-slate-300 leading-relaxed mt-3">
                    {featuredNews.snippet}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  <span>READ FULL COMMUNIQUÉ</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          )}

          {/* Sub News Stack (Right - 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {otherNews.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => openModal('article-details', item)}
                className="glass-panel-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-all duration-300 cursor-pointer group flex items-start gap-4 shadow-xl"
              >
                <div className="relative w-28 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-950 border border-slate-800">
                  <img
                    src={item.image}
                    alt={item.headline}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-grow flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400">
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.date}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight">
                      {item.headline}
                    </h4>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-amber-300 mt-2 flex items-center gap-1">
                    Read Report <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
