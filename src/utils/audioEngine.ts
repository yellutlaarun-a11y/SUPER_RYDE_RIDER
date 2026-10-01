// Real Web Audio API synthesizer for Google Music playback

class WebAudioMusicEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentOscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private volume: number = 0.7;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.gainNode.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public playTrackMelody(baseFreq: number = 261.63, bpm: number = 100) {
    try {
      this.stop();
      this.initContext();
      if (!this.ctx || !this.gainNode) return;

      this.isPlaying = true;
      const notes = [
        baseFreq,
        baseFreq * 1.25, // major third
        baseFreq * 1.5,  // perfect fifth
        baseFreq * 1.334, // fourth
        baseFreq * 1.875, // major 7th
        baseFreq * 2.0,   // octave
      ];

      let noteIdx = 0;
      const stepMs = Math.round((60 / bpm) * 500);

      const playChordNote = () => {
        if (!this.ctx || !this.gainNode || !this.isPlaying) return;

        const freq = notes[noteIdx % notes.length];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();

        osc.type = noteIdx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        noteGain.gain.linearRampToValueAtTime(this.volume * 0.35, this.ctx.currentTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + stepMs / 1000);

        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + stepMs / 1000);

        // Sub bass layer
        if (noteIdx % 2 === 0) {
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = 'sine';
          bassOsc.frequency.setValueAtTime(freq / 2, this.ctx.currentTime);

          bassGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
          bassGain.gain.linearRampToValueAtTime(this.volume * 0.2, this.ctx.currentTime + 0.04);
          bassGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (stepMs * 1.2) / 1000);

          bassOsc.connect(bassGain);
          bassGain.connect(this.gainNode);

          bassOsc.start();
          bassOsc.stop(this.ctx.currentTime + (stepMs * 1.2) / 1000);
        }

        noteIdx++;
      };

      playChordNote();
      this.intervalId = setInterval(playChordNote, stepMs);
    } catch {
      // safe fallback
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.currentOscillators = [];
  }
}

export const musicAudioEngine = new WebAudioMusicEngine();
