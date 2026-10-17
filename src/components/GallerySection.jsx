import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { SessionSelector } from './SessionSelector';
import { Image } from 'lucide-react';
import { getSiteMedia } from '../utils/siteMedia';

export const GallerySection = () => {
  const { gallery, openModal, siteMedia, seasons, selectedSeason, setSelectedSeason } = useNpl();
  const filteredGallery = gallery
    .filter((item) => (item.season || item.session) === selectedSeason)
    .map(item => ({
      ...item,
      image: getSiteMedia(siteMedia, `gallery:${item.id}`, item.season || item.session, item.image)
    }));

  return (
    <section id="gallery" className="npl-section-bg border-t border-slate-800 py-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
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
              Browse every NPL moment in one photo gallery. Select an image to view its story.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SessionSelector seasons={seasons} selectedSeason={selectedSeason} setSelectedSeason={setSelectedSeason} />
            <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
              Click any photo for high-resolution fullscreen lightbox view
            </div>
          </div>
        </div>

        {/* All categories share one photo-only gallery; details appear in the lightbox. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGallery.length === 0 ? (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">No gallery photos are available for {selectedSeason} yet.</p>
          ) : filteredGallery.map((item, index) => (
            <button
              type="button"
              key={item.id || index}
              aria-label={`View photo: ${item.title}`}
              onClick={() => openModal('lightbox', { item, all: filteredGallery, currentIndex: index })}
              className="group relative aspect-[5/4] cursor-pointer overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950 shadow-xl shadow-black/25 ring-1 ring-inset ring-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              <img
                src={item.image}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
