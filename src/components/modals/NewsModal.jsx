import React from 'react';
import { X, Calendar, Clock, Share2, Tag } from 'lucide-react';

export const NewsModal = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#091124] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Article Image Banner */}
        <div className="relative h-64 sm:h-72 bg-slate-950 overflow-hidden flex-shrink-0">
          <img src={article.image} alt={article.headline} className="w-full h-full object-cover filter brightness-85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#091124] via-transparent to-transparent" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/70 border border-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg">
              {article.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {article.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {article.readTime}
            </span>
            <span>•</span>
            <span>Official NPL Media Release</span>
          </div>

          <h2 className="font-sports text-3xl sm:text-4xl text-white tracking-wide leading-tight">
            {article.headline}
          </h2>

          <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4 pt-2 border-t border-slate-800">
            {article.fullContent || article.snippet}
          </div>
        </div>
      </div>
    </div>
  );
};
