import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Play, Eye, Clock, Film } from 'lucide-react';

export const VideoHighlights = () => {
  const { highlights, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const sessionHighlights = highlights.filter((highlight) => (highlight.season || highlight.session) === selectedSeason);
  const sessionVideoIndex = Math.min(activeVideoIndex, Math.max(0, sessionHighlights.length - 1));
  const activeVideo = sessionHighlights[sessionVideoIndex];
  const featuredVideo = activeVideo ? {
    ...activeVideo,
    thumbnail: siteMedia[`highlight:${activeVideo.id}`] || activeVideo.thumbnail
  } : null;

  return (
    <section id="highlights" className="py-20 bg-[#060D1E] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/30 text-red-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Film className="w-3.5 h-3.5" />
              <span>MATCH RECAPS & REELS</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">HIGHLIGHTS</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              Broadcast-quality video action, Super Over nail-biters, monster sixes, and auction room drama.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
            <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
              Official NPL Media & Broadcast Archive
            </div>
          </div>
        </div>

        {/* Video Player Layout (Large featured on left, playlist on right) */}
        {sessionHighlights.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No video highlights are available for {selectedSeason} yet.</p>
        ) : <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Featured Video Card */}
          {featuredVideo && (
            <div className="lg:col-span-8 glass-panel-card rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl overflow-hidden">
              <div
                onClick={() => openModal('video-player', featuredVideo)}
                className="relative rounded-2xl overflow-hidden aspect-video bg-slate-950 cursor-pointer group shadow-2xl"
              >
                <img
                  src={featuredVideo.thumbnail}
                  alt={featuredVideo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Big Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-amber-500/90 group-hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] group-hover:scale-115 transition-all">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                </div>

                {/* Top Duration and Season Badges */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-bold text-amber-400 uppercase tracking-widest">
                    {featuredVideo.season}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-red-600 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {featuredVideo.views}
                  </span>
                </div>

                {/* Bottom Right Duration Badge */}
                <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-lg bg-black/80 text-white font-mono text-xs font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{featuredVideo.duration}</span>
                </div>
              </div>

              {/* Title & Description under featured video */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold uppercase tracking-wider">
                  <span>FEATURED BROADCAST REEL</span>
                  <span>•</span>
                  <span>NPL STREAM ARCHIVE</span>
                </div>
                <h3 className="font-sports text-2xl sm:text-3xl text-white tracking-wide leading-tight">
                  {featuredVideo.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {featuredVideo.description}
                </p>
              </div>
            </div>
          )}

          {/* Right Column: Playlist Queue */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-sports text-xl text-white tracking-wider">
                MORE TOURNAMENT HIGHLIGHTS
              </h4>
              <span className="text-xs text-slate-400 font-bold">
                {sessionHighlights.length} VIDEOS
              </span>
            </div>

            <div className="space-y-3">
              {sessionHighlights.map((video, idx) => {
                const isActive = idx === sessionVideoIndex;
                return (
                  <div
                    key={video.id}
                    onClick={() => setActiveVideoIndex(idx)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all duration-200 border flex items-center gap-3.5 group ${
                      isActive
                        ? "bg-slate-900 border-amber-500/80 shadow-md"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Small thumbnail */}
                    <div className="relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-slate-950">
                      <img
                        src={siteMedia[`highlight:${video.id}`] || video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-5 h-5 text-white/90 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono px-1 rounded bg-black/80 text-white">
                        {video.duration}
                      </span>
                    </div>

                    {/* Title and stats */}
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                        {video.season}
                      </span>
                      <h5 className="font-heading font-bold text-xs sm:text-sm text-white group-hover:text-amber-400 transition-colors line-clamp-2 leading-tight mt-0.5">
                        {video.title}
                      </h5>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {video.views}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>}
      </div>
    </section>
  );
};
