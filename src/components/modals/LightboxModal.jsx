import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Tag, Calendar, Download } from 'lucide-react';

export const LightboxModal = ({ data, onClose }) => {
  const { item, all, currentIndex: initialIndex = 0, photosOnly = false } = data || {};
  const [index, setIndex] = useState(initialIndex);

  const galleryList = all && all.length > 0 ? all : [item];
  const currentItem = galleryList[index] || item;

  if (!currentItem) return null;

  const handlePrev = (e) => {
    e.stopPropagation();
    setIndex(prev => (prev === 0 ? galleryList.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setIndex(prev => (prev === galleryList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-xl"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:bg-slate-800 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev / Next controls */}
      {galleryList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:text-amber-400 hover:border-amber-500 transition-colors shadow-2xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-white hover:text-amber-400 hover:border-amber-500 transition-colors shadow-2xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image & Caption Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
      >
        <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] max-h-[75vh]">
          <img
            src={currentItem.image}
            alt={currentItem.title}
            className="w-full h-full object-contain max-h-[75vh]"
          />
        </div>

        {(!photosOnly || currentItem.title || currentItem.caption) && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center max-w-xl w-full">
            {!photosOnly && (
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
                  {currentItem.category}
                </span>
                <span className="text-xs text-slate-400 font-semibold">{currentItem.date}</span>
              </div>
            )}
            {currentItem.title && <h3 className="font-sports text-xl text-white tracking-wide">{currentItem.title}</h3>}
            {currentItem.caption && <p className="text-xs text-slate-300 mt-1">{currentItem.caption}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
