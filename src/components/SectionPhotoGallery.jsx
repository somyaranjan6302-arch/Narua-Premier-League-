import React from 'react';
import { useNpl } from '../context/NplContext';
import { Image } from 'lucide-react';

export const SectionPhotoGallery = ({ sectionId }) => {
  const { sectionPhotos, siteMedia } = useNpl();
  const photos = sectionPhotos.filter((photo) => photo.sectionId === sectionId);

  if (photos.length === 0) return null;

  return (
    <section className="npl-section-bg border-t border-slate-800 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Image className="h-5 w-5 text-amber-400" />
          <h2 className="font-sports text-2xl tracking-wide text-white">SECTION PHOTOS</h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <img
                src={siteMedia[`section-photo:${photo.id}`] || photo.image}
                alt={photo.title}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
              <figcaption className="p-4">
                <p className="font-sports text-lg text-white">{photo.title}</p>
                {photo.caption && <p className="mt-1 text-sm leading-relaxed text-slate-300">{photo.caption}</p>}
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  {photo.season}{photo.date ? ` • ${photo.date}` : ''}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};
