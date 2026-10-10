import React from 'react';
import { Maximize2 } from 'lucide-react';
import { useNpl } from '../context/NplContext';

export const MemoriesLegacy = () => {
  const { legacyPhotos, openModal, siteMedia } = useNpl();
  const memories = legacyPhotos
    .map((photo) => ({
      id: photo.id,
      image: siteMedia[`memory-photo:${photo.id}`]
    }))
    .filter((photo) => photo.image);

  return (
    <section className="min-h-screen border-t border-slate-800 bg-[var(--color-npl-navy)] py-20">
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {memories.map((item, index) => (
              <article
                key={item.id}
                onClick={() => openModal('lightbox', { item, all: memories, currentIndex: index, photosOnly: true })}
                className={`group relative cursor-pointer overflow-hidden rounded-[1.35rem] border border-white/10 shadow-xl shadow-black/25 ring-1 ring-inset ring-white/[0.03] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/70 ${
                  index % 5 === 0 ? 'sm:col-span-2 sm:row-span-2 h-[380px]' : 'h-[240px]'
                }`}
              >
                <img
                  src={item.image}
                  alt="NPL league memory"
                  className="h-full w-full object-cover brightness-90 transition-transform duration-700 group-hover:scale-105 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b18] via-slate-950/30 to-slate-950/5 opacity-40 transition-opacity group-hover:opacity-70" />
                <div className="pointer-events-none absolute inset-2 rounded-[1rem] border border-white/10 transition-colors group-hover:border-amber-300/40" />
                <div className="absolute right-3 top-3 rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Maximize2 className="h-3.5 w-3.5" />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
