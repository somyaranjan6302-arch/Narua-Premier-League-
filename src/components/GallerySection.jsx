import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Image, Maximize2, Tag } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';

export const GallerySection = () => {
  const { gallery, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    'ALL',
    'MATCH DAY',
    'FINALS',
    'CHAMPIONS',
    'AUCTION',
    'TEAMS',
    'PLAYERS',
    'CELEBRATIONS',
    'BEHIND THE SCENES'
  ];

  const filteredGallery = gallery.filter((item) => (item.season || item.session) === selectedSeason).filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  }).map(item => ({
    ...item,
    image: getSiteMedia(siteMedia, `gallery:${item.id}`, item.season || item.session, item.image)
  }));

  return (
    <section id="gallery" className="py-20 bg-[var(--color-npl-navy)] border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-600/40 text-blue-400 text-xs font-bold tracking-widest uppercase mb-3">
              <Image className="w-3.5 h-3.5" />
              <span>PHOTO ARCHIVE</span>
            </div>
            <h2 className="font-sports text-4xl sm:text-5xl lg:text-6xl text-white tracking-wide uppercase leading-none">
              NPL <span className="text-gold-gradient">GALLERY</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2">
              High-definition visual memories from high-voltage night fixtures, trophy celebrations, and player auctions.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
            <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
              Click any photo for high-resolution fullscreen lightbox view
            </div>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredGallery.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No gallery photos are available for {selectedSeason} yet.</p>
          ) : filteredGallery.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => openModal('lightbox', { item, all: filteredGallery, currentIndex: index })}
              className={`group relative rounded-[1.35rem] overflow-hidden cursor-pointer border border-white/10 hover:border-amber-400/70 shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-1 ring-1 ring-inset ring-white/[0.03] ${
                index % 5 === 0 ? "sm:col-span-2 sm:row-span-2 h-[380px]" : "h-[240px]"
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
              />

              {/* Gradient Dark Backdrop on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050b18] via-slate-950/30 to-slate-950/5 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-2 rounded-[1rem] border border-white/10 pointer-events-none transition-colors group-hover:border-amber-300/40" />

              {/* Category Badge top left */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  {item.category}
                </span>
              </div>

              {/* Expand Icon top right */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-slate-900/80 text-white border border-slate-700">
                <Maximize2 className="w-3.5 h-3.5" />
              </div>

              {/* Captions and Date at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-px w-5 bg-amber-400" />
                  <span className="text-[10px] text-amber-200/90 font-bold uppercase tracking-[0.16em]">
                    {item.date || 'NPL MOMENT'}
                  </span>
                </div>
                <h3 className="font-sports text-lg sm:text-xl text-white tracking-wide leading-tight group-hover:text-amber-300 transition-colors">
                  {item.title}
                </h3>
                {item.caption && (
                  <p className="text-xs sm:text-[13px] text-slate-200/85 mt-1.5 line-clamp-2 leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
