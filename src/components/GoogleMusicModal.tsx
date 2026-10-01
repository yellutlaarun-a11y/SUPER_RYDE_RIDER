import React, { useState, useEffect } from 'react';
import { MusicTrack, MusicPlaylist } from '../types';
import { CURATED_MUSIC_TRACKS, GOOGLE_MUSIC_PLAYLISTS } from '../data/musicTracks';
import { musicAudioEngine } from '../utils/audioEngine';
import { 
  Music, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Radio, 
  Sparkles, 
  Headphones, 
  Search, 
  Sliders, 
  Mic2, 
  ExternalLink, 
  Check, 
  X, 
  Share2, 
  Bluetooth,
  ListMusic,
  Flame,
  Speaker
} from 'lucide-react';

interface GoogleMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: MusicTrack | null;
  isPlaying: boolean;
  onSelectTrack: (track: MusicTrack) => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
}

export const GoogleMusicModal: React.FC<GoogleMusicModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'songs' | 'lyrics' | 'equalizer'>('playlists');
  const [selectedPlaylist, setSelectedPlaylist] = useState<MusicPlaylist | null>(GOOGLE_MUSIC_PLAYLISTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isCabSpeakerConnected, setIsCabSpeakerConnected] = useState(true);
  const [soundProfile, setSoundProfile] = useState<'Standard' | 'Bass Boost' | 'Vocal Pure' | 'Road Noise Cancel'>('Bass Boost');
  const [trackProgressSec, setTrackProgressSec] = useState(0);

  // Active track progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        setTrackProgressSec((prev) => {
          if (prev >= currentTrack.durationSec) {
            onNextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack, onNextTrack]);

  // Reset progress when track changes
  useEffect(() => {
    setTrackProgressSec(0);
  }, [currentTrack?.id]);

  if (!isOpen) return null;

  const activeSong = currentTrack || CURATED_MUSIC_TRACKS[0];

  const filteredTracks = CURATED_MUSIC_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.genre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVolumeChange = (newVal: number) => {
    setVolume(newVal);
    setIsMuted(newVal === 0);
    musicAudioEngine.setVolume(newVal);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      musicAudioEngine.setVolume(volume || 0.7);
    } else {
      setIsMuted(true);
      musicAudioEngine.setVolume(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/60 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-600/30">
              <Headphones className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white flex items-center gap-1">
                  Google <span className="text-rose-500 font-extrabold">Music</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/20 border border-rose-500/40 text-[9px] font-extrabold text-rose-300">
                  In-Cab Audio
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                {isCabSpeakerConnected ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400 font-bold">Connected:</span> Cab Bluetooth 5.2 Hi-Fi
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Phone Speaker Only
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCabSpeakerConnected(!isCabSpeakerConnected)}
              title="Toggle Cab Speaker Bluetooth Broadcast"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                isCabSpeakerConnected
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-2xs'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Bluetooth className="w-3 h-3 text-emerald-400" />
              <span>{isCabSpeakerConnected ? 'Cab Speakers' : 'Phone'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Interactive Now Playing Banner */}
        <div className="relative p-4 sm:p-5 bg-gradient-to-b from-slate-800/80 to-slate-900 border-b border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            
            {/* Album Cover Art */}
            <div className="relative group w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-xl border border-slate-700 flex-shrink-0">
              <img
                src={activeSong.coverUrl}
                alt={activeSong.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-rose-300 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  {activeSong.genre}
                </span>
              </div>

              {/* Animated Live Equalizer Waves */}
              {isPlaying && (
                <div className="absolute top-2 right-2 flex items-end gap-0.5 bg-black/60 p-1 rounded-md backdrop-blur-xs">
                  <div className="w-1 bg-rose-400 h-3 animate-pulse" />
                  <div className="w-1 bg-rose-400 h-4 animate-ping" />
                  <div className="w-1 bg-rose-400 h-2 animate-pulse" />
                </div>
              )}
            </div>

            {/* Song Meta & Playback Controls */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-spin" />
                    Now Playing in Cab
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeSong.tempoBpm} BPM • {soundProfile}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white truncate mt-0.5">
                  {activeSong.title}
                </h2>
                <p className="text-xs text-slate-300 truncate font-medium">
                  {activeSong.artist} • <span className="text-slate-400">{activeSong.album}</span>
                </p>
              </div>

              {/* Progress Slider */}
              <div className="flex flex-col gap-1">
                <div className="relative w-full h-1.5 bg-slate-700/80 rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${(trackProgressSec / activeSong.durationSec) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>{formatTime(trackProgressSec)}</span>
                  <span>{formatTime(activeSong.durationSec)}</span>
                </div>
              </div>

              {/* Main Controls Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onPrevTrack}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-transform active:scale-90"
                    title="Previous Song"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onTogglePlay}
                    className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-transform active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={onNextTrack}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-transform active:scale-90"
                    title="Next Song"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume & Equalizer Control */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 accent-rose-500 cursor-pointer h-1 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-900/90 text-xs font-bold overflow-x-auto no-scrollbar">
          {[
            { id: 'playlists', label: '🔥 Curated Playlists', icon: <Flame className="w-3.5 h-3.5" /> },
            { id: 'songs', label: '🎵 All Songs Library', icon: <ListMusic className="w-3.5 h-3.5" /> },
            { id: 'lyrics', label: '🎤 Sing-Along Lyrics', icon: <Mic2 className="w-3.5 h-3.5" /> },
            { id: 'equalizer', label: '🎛️ Cab Equalizer & FX', icon: <Sliders className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[44vh]">
          
          {/* TAB 1: CURATED PLAYLISTS */}
          {activeTab === 'playlists' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOOGLE_MUSIC_PLAYLISTS.map((pl) => {
                  const isSelected = selectedPlaylist?.id === pl.id;
                  return (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylist(pl)}
                      className={`cursor-pointer p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-lg'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={pl.coverImage}
                        alt={pl.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-white truncate">{pl.name}</h4>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                          {pl.description}
                        </p>
                        <p className="text-[9px] text-rose-300 font-bold mt-1">
                          {pl.tracks.length} Tracks • {pl.curator}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Playlist Tracks */}
              {selectedPlaylist && (
                <div className="mt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                    <span>Tracks in &ldquo;{selectedPlaylist.name}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTrack(selectedPlaylist.tracks[0]);
                        if (!isPlaying) onTogglePlay();
                      }}
                      className="text-rose-400 hover:text-rose-300 flex items-center gap-1 font-black"
                    >
                      <Play className="w-3 h-3 fill-rose-400" />
                      Play All
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {selectedPlaylist.tracks.map((track, idx) => {
                      const isCurrent = activeSong.id === track.id;
                      return (
                        <div
                          key={track.id}
                          onClick={() => onSelectTrack(track)}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer group ${
                            isCurrent
                              ? 'bg-rose-900/30 border-rose-500/50 text-white'
                              : 'bg-slate-800/30 border-transparent hover:bg-slate-800/70 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xs font-mono text-slate-500 w-4 text-center">
                              {idx + 1}
                            </span>
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-lg object-cover"
                            />
                            <div className="min-w-0">
                              <p className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-300' : 'text-white'}`}>
                                {track.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {track.genre}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatTime(track.durationSec)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL SONGS LIBRARY */}
          {activeTab === 'songs' && (
            <div className="flex flex-col gap-3">
              {/* Live Search */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search songs, artists, Bollywood, South beats, EDM..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 text-slate-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tracks List */}
              <div className="flex flex-col gap-1.5">
                {filteredTracks.map((track) => {
                  const isCurrent = activeSong.id === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => onSelectTrack(track)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-900/30 border-rose-500/50 text-white shadow-sm'
                          : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-300' : 'text-white'}`}>
                            {track.title}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">{track.artist} • {track.album}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                          {track.energy}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {formatTime(track.durationSec)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: KARAOKE & SYNCHRONIZED LYRICS */}
          {activeTab === 'lyrics' && (
            <div className="flex flex-col gap-3 text-center py-2">
              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <Mic2 className="w-4 h-4 text-rose-400" />
                  Sing along with cab passengers
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeSong.title} ({activeSong.artist})
                </span>
              </div>

              <div className="flex flex-col gap-3.5 py-3">
                {activeSong.lyrics && activeSong.lyrics.length > 0 ? (
                  activeSong.lyrics.map((line, idx) => (
                    <p
                      key={idx}
                      className={`text-sm sm:text-base font-black transition-all ${
                        idx === 1
                          ? 'text-rose-400 scale-105 drop-shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">
                    Instrumental track with synthesized ambient melodies.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CAB EQUALIZER & SOUND FX */}
          {activeTab === 'equalizer' && (
            <div className="flex flex-col gap-4">
              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                    <Speaker className="w-4 h-4 text-rose-400" />
                    Toyota In-Cab Surround Audio Matrix
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Adjust acoustics for road noise, highway speeds or city traffic.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  4.1 Dolby Surround
                </span>
              </div>

              {/* Sound Profile Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { name: 'Standard', desc: 'Balanced sound' },
                  { name: 'Bass Boost', desc: 'Heavy sub-bass' },
                  { name: 'Vocal Pure', desc: 'Clear voices' },
                  { name: 'Road Noise Cancel', desc: 'Active frequency filter' },
                ].map((prof) => (
                  <button
                    key={prof.name}
                    type="button"
                    onClick={() => setSoundProfile(prof.name as typeof soundProfile)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      soundProfile === prof.name
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-xs font-black">{prof.name}</p>
                    <p className="text-[9px] opacity-80 mt-0.5">{prof.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & external link */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Google Music & YouTube Music In-Cab Partner</span>
          </div>

          <a
            href="https://music.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-bold transition-colors"
          >
            <span>Open in YouTube Music</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
