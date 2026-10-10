import React from 'react';
import { useNpl } from '../context/NplContext';
import { getSiteMedia } from '../utils/siteMedia';

export const MemoriesLegacy = () => {
  const { gallery, siteMedia } = useNpl();

  return (
    <section className="min-h-screen border-t border-slate-800 bg-[var(--color-npl-navy)] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-amber-400">Our journey, captured</p>
          <h1 className="font-sports text-4xl uppercase tracking-wide text-white sm:text-5xl lg:text-6xl">
            Memories <span className="text-gold-gradient">&amp; Legacy</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Moments, faces, and celebrations that have shaped the Narua Premier League.
          </p>
        </div>

        {gallery.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-slate-400">
            Memories will appear here as photos are added to the gallery.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70 shadow-xl">
                <img
                  src={getSiteMedia(siteMedia, `gallery:${item.id}`, item.season || item.session, item.image)}
                  alt={item.title || 'NPL memory'}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-400">
                    {[item.date, item.season || item.session].filter(Boolean).join(' • ') || 'NPL MEMORY'}
                  </p>
                  <h2 className="mt-2 font-sports text-xl tracking-wide text-white">{item.title}</h2>
                  {item.caption && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.caption}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
