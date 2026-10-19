import React from 'react';
import { useNpl } from '../context/NplContext';

export const MemoriesLegacy = () => {
  const { legacyPhotos, openModal, siteMedia } = useNpl();
  const memories = legacyPhotos
    .map((photo) => ({
      id: photo.id,
      title: photo.title || '',
      caption: photo.caption || '',
      image: siteMedia[`memory-photo:${photo.id}`]
    }))
    .filter((photo) => photo.image);

  return (
    <section className="npl-section-bg min-h-screen border-t border-slate-800 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Our journey, captured</p>
          <h1 className="font-sports text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Memories <span className="text-gold-gradient">&amp; Legacy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Old photographs from the league and its organization.
          </p>
        </div>

        {memories.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
            No old photos have been added yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {memories.map((item, index) => (
              <button
                type="button"
                key={item.id}
                aria-label={`View photo: ${item.title || 'NPL league memory'}`}
                onClick={() => openModal('lightbox', { item, all: memories, currentIndex: index, photosOnly: true })}
                className="group relative aspect-[5/4] cursor-pointer overflow-hidden rounded-[1.35rem] border border-white/10 bg-slate-950 shadow-xl shadow-black/25 ring-1 ring-inset ring-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <img
                  src={item.image}
                  alt={item.title || 'NPL league memory'}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
