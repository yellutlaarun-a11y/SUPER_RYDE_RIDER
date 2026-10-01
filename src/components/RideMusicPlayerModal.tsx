import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, 
  Sparkles, 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Loader2, 
  Sliders, 
  Headphones, 
  Disc3,
  Flame,
  Moon,
  Sun,
  CloudRain
} from 'lucide-react';

interface RideMusicPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCabTier?: string;
}

export const RideMusicPlayerModal: React.FC<RideMusicPlayerModalProps> = ({
  isOpen,
  onClose,
  selectedCabTier = 'Sedan',
}) => {
  const [selectedMood, setSelectedMood] = useState('Chill Lo-Fi Commute');
  const [selectedGenre, setSelectedGenre] = useState('Lo-Fi Chillhop');
  const [duration, setDuration] = useState<number>(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrack, setActiveTrack] = useState<{
    title: string;
    genre: string;
    bpm: number;
    duration: number;
  } | null>({
    title: 'Late Night City Lights',
    genre: 'Lo-Fi Chillhop',
    bpm: 84,
    duration: 30,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeNodesRef = useRef<Array<{ osc: OscillatorNode; gain: GainNode }>>([]);

  const moodPresets = [
    { label: 'Chill Lo-Fi Commute', icon: <Moon className="w-3.5 h-3.5 text-indigo-400" />, genre: 'Lo-Fi Chillhop', bpm: 82 },
    { label: 'Highway Synthwave', icon: <Flame className="w-3.5 h-3.5 text-rose-500" />, genre: 'Synthwave Electronic', bpm: 118 },
    { label: 'Rainy Day Acoustic', icon: <CloudRain className="w-3.5 h-3.5 text-cyan-500" />, genre: 'Acoustic Guitar & Piano', bpm: 76 },
    { label: 'Upbeat Urban Rush', icon: <Sun className="w-3.5 h-3.5 text-amber-500" />, genre: 'Modern Nu-Disco & Funk', bpm: 122 },
  ];

  if (!isOpen) return null;

  // Polyphonic Multi-Voice Synthesizer for rich in-ride ambient audio
  const startSynthesizerAudio = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Chord notes dictionary (in Hz)
      const chordFrequencies: Record<string, number[]> = {
        'Lo-Fi Chillhop': [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
        'Synthwave Electronic': [220.00, 261.63, 329.63, 440.00], // Am (A3, C4, E4, A4)
        'Acoustic Guitar & Piano': [293.66, 349.23, 440.00, 523.25], // Dm7 (D4, F4, A4, C5)
        'Modern Nu-Disco & Funk': [349.23, 440.00, 523.25, 659.25], // Fmaj7 (F4, A4, C5, E5)
      };

      const baseFreqs = chordFrequencies[selectedGenre] || chordFrequencies['Lo-Fi Chillhop'];
      const waveType: OscillatorType = selectedGenre.includes('Synth') ? 'sawtooth' : selectedGenre.includes('Acoustic') ? 'triangle' : 'sine';

      // Clear previous nodes
      activeNodesRef.current.forEach(({ osc }) => {
        try { osc.stop(); osc.disconnect(); } catch {}
      });
      activeNodesRef.current = [];

      // Master compressor & filter for warm analog feel
      const masterFilter = ctx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(selectedGenre.includes('Synth') ? 1200 : 800, ctx.currentTime);
      masterFilter.connect(ctx.destination);

      // Create polyphonic voices with gentle vibrato/envelope
      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Soft gain level
        const volume = idx === 0 ? 0.08 : 0.04;
        gain.gain.setValueAtTime(volume, ctx.currentTime);

        osc.connect(gain);
        gain.connect(masterFilter);
        osc.start();

        activeNodesRef.current.push({ osc, gain });
      });

      // Ambient arpeggio rhythm step
      let step = 0;
      const pentatonicNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
      const beatInterval = (60 / (activeTrack?.bpm || 84)) * 500; // eighth notes

      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      
      synthIntervalRef.current = setInterval(() => {
        if (!audioContextRef.current || audioContextRef.current.state !== 'running') return;
        try {
          const arpOsc = ctx.createOscillator();
          const arpGain = ctx.createGain();

          arpOsc.type = 'sine';
          const noteFreq = pentatonicNotes[(step + Math.floor(Math.random() * 2)) % pentatonicNotes.length];
          arpOsc.frequency.setValueAtTime(noteFreq * 2, ctx.currentTime);

          arpGain.gain.setValueAtTime(0.04, ctx.currentTime);
          arpGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

          arpOsc.connect(arpGain);
          arpGain.connect(masterFilter);

          arpOsc.start(ctx.currentTime);
          arpOsc.stop(ctx.currentTime + 0.38);

          step = (step + 1) % 8;
        } catch {}
      }, Math.max(250, beatInterval));

      setIsPlaying(true);
    } catch (e) {
      console.warn('Audio synth error:', e);
      setIsPlaying(true);
    }
  };

  const stopSynthesizerAudio = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    activeNodesRef.current.forEach(({ osc, gain }) => {
      try {
        osc.stop();
        osc.disconnect();
        gain.disconnect();
      } catch {}
    });
    activeNodesRef.current = [];
    setIsPlaying(false);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSynthesizerAudio();
    } else {
      startSynthesizerAudio();
    }
  };

  const handleGenerateMusic = async (presetMood?: string, presetGenre?: string) => {
    const mood = presetMood || selectedMood;
    const genre = presetGenre || selectedGenre;
    setIsGenerating(true);
    stopSynthesizerAudio();

    try {
      const response = await fetch('/api/generate-ride-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood,
          genre,
          durationSeconds: duration,
        }),
      });

      const data = await response.json();
      setActiveTrack({
        title: data.title || `${mood} Soundtrack`,
        genre: genre,
        bpm: data.bpm || 85,
        duration: duration,
      });
      startSynthesizerAudio();
    } catch (err) {
      console.error('Lyria generation error:', err);
      setActiveTrack({
        title: `${mood} Flow`,
        genre: genre,
        bpm: 85,
        duration: duration,
      });
      startSynthesizerAudio();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-950 text-white rounded-3xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Lyria In-Cab Music Studio</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Lyria 3 Clip
                </span>
              </div>
              <p className="text-xs text-emerald-200">Personalized in-ride audio beats & ambience</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSynthesizerAudio();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          
          {/* Active Player Deck */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Spinning Disc Graphic */}
            <div className="relative mb-3">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center ${
                isPlaying ? 'animate-spin' : ''
              }`} style={{ animationDuration: '8s' }}>
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center border-2 border-slate-800">
                  <Disc3 className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
            </div>

            <h4 className="text-sm font-extrabold text-white mb-0.5">{activeTrack?.title || 'Ride Ambience'}</h4>
            <p className="text-xs text-slate-400">{activeTrack?.genre} • {activeTrack?.bpm} BPM • {activeTrack?.duration}s Clip</p>

            {/* Simulated Animated Waveform Bars */}
            <div className="flex items-center gap-1 h-8 my-3 px-4">
              {[...Array(24)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-emerald-400 transition-all duration-300 ${
                    isPlaying 
                      ? 'animate-pulse' 
                      : 'opacity-30'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (Math.sin(i * 0.8) + 1.2) * 14)}px` : '4px',
                    animationDelay: `${i * 0.05}s`
                  }}
                />
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
          </div>

          {/* Mood Presets */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2">Select Commute Mood</label>
            <div className="grid grid-cols-2 gap-2">
              {moodPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedMood(preset.label);
                    setSelectedGenre(preset.genre);
                    handleGenerateMusic(preset.label, preset.genre);
                  }}
                  className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                    selectedMood === preset.label
                      ? 'bg-emerald-950/40 border-emerald-500/80 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {preset.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{preset.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{preset.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">Clip Duration</label>
            <div className="flex gap-2">
              {[15, 30, 45].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setDuration(sec)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    duration === sec
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec} Seconds
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Lyria 3 Music Generator • In-Cab Sync</span>
          <button
            type="button"
            onClick={() => {
              stopSynthesizerAudio();
              onClose();
            }}
            className="px-3 py-1 rounded-lg hover:bg-slate-800 text-slate-200 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
