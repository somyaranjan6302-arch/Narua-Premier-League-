import React, { useState } from 'react';
import { useNpl } from '../context/NplContext';
import { Image, Maximize2, Tag, Calendar } from 'lucide-react';

export const GallerySection = () => {
  const { gallery, openModal } = useNpl();
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

  const filteredGallery = gallery.filter(item => {
    if (selectedCategory === 'ALL') return true;
    return item.category === selectedCategory;
  });

  return (
    <section id="gallery" className="py-20 bg-[#050B17] border-t border-slate-800">
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

          <div className="text-xs text-slate-400 font-semibold bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 self-start md:self-auto">
            Click any photo for high-resolution fullscreen lightbox view
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
          {filteredGallery.map((item, index) => (
            <div
              key={item.id || index}
              onClick={() => openModal('lightbox', { item, all: filteredGallery, currentIndex: index })}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer border border-slate-800 hover:border-amber-500/50 shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                index % 5 === 0 ? "sm:col-span-2 sm:row-span-2 h-[380px]" : "h-[240px]"
              }`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 filter brightness-95"
              />

              {/* Gradient Dark Backdrop on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

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
              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
                  {item.date}
                </span>
                <h3 className="font-sports text-lg sm:text-xl text-white tracking-wide leading-tight group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 line-clamp-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
