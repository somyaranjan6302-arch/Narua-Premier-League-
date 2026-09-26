import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

export const VideoPlayerModal = ({ video, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-[#070E20] border-2 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-sports text-lg text-white tracking-wider">
              NPL BROADCAST PLAYER • {video.season}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Canvas / Broadcast Screen */}
        <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden group">
          <img
            src={video.thumbnail}
            alt={video.title}
            className={`w-full h-full object-cover filter brightness-75 transition-all duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
          />

          {/* Broadcast Graphics Overlay */}
          <div className="absolute top-4 left-4 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-700 text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>NPL TV • 1080p 60FPS</span>
          </div>

          {/* Video Control Bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/60 to-transparent flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 text-slate-300 hover:text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <div className="font-mono text-xs text-slate-300">
                02:14 / {video.duration}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
                {video.views}
              </span>
            </div>
          </div>
        </div>

        {/* Video Details */}
        <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-1">
          <h3 className="font-sports text-2xl text-white tracking-wide">
            {video.title}
          </h3>
          <p className="text-xs text-slate-300">
            {video.description}
          </p>
        </div>
      </div>
    </div>
  );
};
