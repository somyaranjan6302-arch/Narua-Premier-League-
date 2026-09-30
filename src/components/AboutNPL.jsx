import React from 'react';
import { useNpl } from '../context/NplContext';
import { History, Award, Flag, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const AboutNPL = ({ scrollToSection }) => {
  const { tournamentInfo, seasons, siteMedia } = useNpl();

  const timelineMilestones = [
    {
      year: "2024",
      title: "THE BEGINNING",
      subtitle: "Inaugural Chapter",
      desc: "Founded by passionate local sports patrons of Young Star Narua Cricket Club. 6 grassroots teams competed in day matches, drawing 4,000+ passionate village spectators.",
      highlight: "Inaugural Champions: Bajrangi 11 Narua"
    },
    {
      year: "2025",
      title: "THE NEXT CHAPTER",
      subtitle: "League Expansion",
      desc: "Expanded to 8 official franchise teams with corporate ownership, professional player auctions, and Online Scoring highlights.",
      highlight: "Champions: No Compromise Kaina"
    },
    {
      year: "2025",
      title: "A NEW ERA",
      subtitle: "Professional Frontier",
      desc: "Digital ball-by-ball scoring, live stream integration, ₹5000 team auction purse, and a dedicated platform connecting grassroots talent with higher-grade cricket.",
      highlight: "Mega Auction & 6 Contenders"
    }, {
      year: "2026",
      title: "THE NEXT CHAPTER",
      subtitle: "Summer Cup",
      desc: "Digital ball-by-ball scoring, live stream integration, ₹5000 team auction purse, and a dedicated platform connecting grassroots talent with higher-grade cricket.",
      highlight: "Mega Auction & 6 Contenders"
    }, {
      year: "2026",
      title: "THE NEXT CHAPTER",
      subtitle: "Demanded Tournaments",
      desc: "Digital ball-by-ball scoring, live stream integration, ₹5000 team auction purse, and a dedicated platform connecting grassroots talent with higher-grade cricket.",
      highlight: "Mega Auction & 6 Contenders"
    }
  ];

  return (
    <section id="story" className="py-20 relative bg-[#060D1D] border-t border-b border-slate-800/80 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: The Story Text & Timeline */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase">
              <History className="w-3.5 h-3.5" />
              <span>TOURNAMENT GENESIS • EST. 2024</span>
            </div>

            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              {tournamentInfo.storyHeading || "THE STORY OF NARUA PREMIER LEAGUE"}
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed border-l-4 border-amber-500 pl-4 bg-slate-900/40 py-2 rounded-r-lg">
              "{tournamentInfo.storyText}"
            </p>

            {/* Interactive Timeline */}
            <div className="pt-4 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>CHRONICLE OF EXCELLENCE</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {timelineMilestones.map((item) => (
                  <div
                    key={`${item.year}-${item.subtitle}`}
                    className="glass-panel-card p-4 rounded-xl border border-slate-800 hover:border-amber-500/50 transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-sports text-3xl text-amber-400 group-hover:scale-105 transition-transform">
                        {item.year}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.subtitle}
                      </span>
                    </div>

                    <h4 className="font-sports text-lg text-white tracking-wider mb-1">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-400 leading-relaxed mb-2 line-clamp-3">
                      {item.desc}
                    </p>

                    <div className="text-[11px] font-semibold text-amber-400/90 pt-1 border-t border-slate-800">
                      ★ {item.highlight}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA to Explore History */}
            <div className="pt-2 flex items-center gap-4">
              <button
                onClick={() => scrollToSection('history')}
                className="px-6 py-3 rounded-xl font-sports text-base tracking-wider uppercase bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>EXPLORE NPL HISTORY</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Officially recognized local championship</span>
              </div>
            </div>
          </div>

          {/* Right Column: High Quality Tournament Photo & Badge Plaque */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 group">
              <img
                src={siteMedia.stadium || "/assets/stadium.jpg"}
                alt="Narua Premier League Tournament"
                className="w-full h-[440px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060D1D] via-transparent to-transparent" />
              
              {/* Floating Plaque */}
              <div className="absolute bottom-4 left-4 right-4 glass-panel p-4 rounded-xl border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-sports text-2xl shadow-lg flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <h5 className="font-sports text-lg text-white tracking-wider leading-none">
                      A PROUD REGIONAL LEGACY
                    </h5>
                    <p className="text-xs text-slate-300 mt-1">
                      Connecting local cricket passion with high-standard professional sports presentation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Corner Accent Badge */}
            <div className="absolute -top-4 -right-4 bg-slate-900 border border-amber-500/50 p-3 rounded-xl shadow-xl text-center">
              <span className="font-sports text-2xl text-amber-400 block leading-none">3RD</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">EDITION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
