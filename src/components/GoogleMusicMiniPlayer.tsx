import React from 'react';
import { MusicTrack } from '../types';
import { Play, Pause, SkipForward, Headphones, X, Maximize2 } from 'lucide-react';

interface GoogleMusicMiniPlayerProps {
  currentTrack: MusicTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onOpenFullPlayer: () => void;
  onClosePlayer: () => void;
}

export const GoogleMusicMiniPlayer: React.FC<GoogleMusicMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onOpenFullPlayer,
  onClosePlayer,
}) => {
  return (
    <aside aria-label="Google Music in-cab player" className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 animate-slideUp">
      <div className="flex items-center gap-2.5 p-1.5 sm:p-2 pr-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl text-white max-w-[320px] sm:max-w-[360px]">
        {/* Track Thumbnail */}
        <div 
          onClick={onOpenFullPlayer}
          className="relative w-10 h-10 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group"
        >
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 bg-rose-400 h-full animate-pulse" />
                <span className="w-0.5 bg-rose-400 h-2 animate-ping" />
                <span className="w-0.5 bg-rose-400 h-3 animate-pulse" />
              </div>
            </div>
          )}
        </div>

        {/* Title & Artist */}
        <div 
          onClick={onOpenFullPlayer}
          className="min-w-0 flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">
              Google Music
            </span>
          </div>
          <p className="text-xs font-bold text-white truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onTogglePlay}
            className="w-7 h-7 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-sm transition-transform active:scale-95"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={onNextTrack}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-transform active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onOpenFullPlayer}
            className="w-6 h-6 rounded-full text-slate-400 hover:text-white flex items-center justify-center"
            title="Expand Full Google Music Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClosePlayer}
            className="w-6 h-6 rounded-full text-slate-400 hover:text-white flex items-center justify-center"
            title="Close Player"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
