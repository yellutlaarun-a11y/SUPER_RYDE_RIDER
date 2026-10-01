import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint, RideType } from '../types';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  Volume2, 
  VolumeX, 
  CheckCircle2,
  Navigation,
  Car,
  Radio,
  AudioWaveform,
  RotateCcw,
  Zap,
  PhoneOff
} from 'lucide-react';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: LocationPoint;
  destination: LocationPoint | null;
  onApplyAiBooking: (data: {
    pickupName?: string;
    destinationName?: string;
    rideType?: RideType;
  }) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  pickup,
  destination,
  onApplyAiBooking,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [liveInterimText, setLiveInterimText] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<'Puck' | 'Charon' | 'Aoede' | 'Fenrir'>('Puck');
  const [handsFreeContinuous, setHandsFreeContinuous] = useState(true);
  const [extractedIntent, setExtractedIntent] = useState<{
    destination?: string;
    rideType?: RideType;
    fareEstimate?: number;
  } | null>(null);

  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hi there! I'm your Gemini Live ride assistant. Where can I take you today? You can ask for cabs, bike taxis, self-drive cars, or compare fares.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveInterimText, isLoading]);

  // Speech Recognition Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (interim) {
            setLiveInterimText(interim);
          }

          if (final.trim()) {
            setLiveInterimText('');
            handleSendPrompt(final.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          if (handsFreeContinuous && isOpen && !isAiSpeaking) {
            // Keep listening in hands-free mode unless closed
            try {
              recognition.start();
              setIsListening(true);
            } catch (err) {
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [handsFreeContinuous, isOpen, isAiSpeaking]);

  // Auto-start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (e) {
          // ignore
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
    } else {
      setSpeechText('');
      setLiveInterimText('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Personality voice pitch & speed tweaks
      if (selectedVoice === 'Puck') {
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
      } else if (selectedVoice === 'Charon') {
        utterance.rate = 0.95;
        utterance.pitch = 0.9;
      } else if (selectedVoice === 'Aoede') {
        utterance.rate = 1.0;
        utterance.pitch = 1.15;
      } else {
        utterance.rate = 1.1;
        utterance.pitch = 0.95;
      }

      utterance.onstart = () => {
        setIsAiSpeaking(true);
        // Pause listening temporarily to avoid echo feedback
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            // ignore
          }
        }
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        // Resume listening in hands-free continuous mode
        if (handsFreeContinuous && isOpen) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              setIsListening(true);
            } catch (e) {
              // ignore
            }
          }, 300);
        }
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendPrompt = async (promptToSend?: string) => {
    const query = promptToSend || speechText;
    if (!query.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message to conversation
    setMessages((prev) => [...prev, { sender: 'user', text: query, time: timeStr }]);
    setSpeechText('');
    setLiveInterimText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentPickup: pickup.name,
          currentDestination: destination ? destination.name : '',
        }),
      });

      const data = await response.json();
      const aiReply = data.reply || `Got it! I found the best ride route for you.`;

      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'ai', 
          text: aiReply, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      speakText(aiReply);

      // Extract ride booking intent if detected
      if (data.recommendedRideType || data.suggestedDestination) {
        setExtractedIntent({
          destination: data.suggestedDestination,
          rideType: data.recommendedRideType as RideType,
          fareEstimate: data.estimatedFare,
        });

        onApplyAiBooking({
          destinationName: data.suggestedDestination,
          rideType: data.recommendedRideType as RideType,
        });
      }
    } catch (error) {
      const fallback = `I'm ready to set up your ride! I can lock in a Bike, Auto, Cab (Sedan or SUV), or Self-Drive rental right away.`;
      setMessages((prev) => [
        ...prev, 
        { 
          sender: 'ai', 
          text: fallback, 
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        }
      ]);
      speakText(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-slate-700/80 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-blue-950/60 flex flex-col h-[620px] max-h-[92vh] overflow-hidden">
        
        {/* Glowing Gemini ambient background halos */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            {/* Live Indicator Pulse */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-blue-500/30">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="absolute -inset-0.5 rounded-xl bg-cyan-400/40 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-wide bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 bg-clip-text text-transparent">
                  Gemini Live
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-extrabold border border-blue-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time Voice
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Ultra-low latency conversational mobility engine</p>
            </div>
          </div>

          {/* Voice Personality & Close */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value as any)}
              className="bg-slate-800/90 border border-slate-700 text-slate-200 text-[10px] font-bold rounded-lg px-2 py-1 outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="Puck">Voice: Puck (Warm)</option>
              <option value="Charon">Voice: Charon (Calm)</option>
              <option value="Aoede">Voice: Aoede (Expressive)</option>
              <option value="Fenrir">Voice: Fenrir (Direct)</option>
            </select>

            <button
              type="button"
              id="close-gemini-live-modal-btn"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* GEMINI LIVE VISUALIZER ORB & SOUNDWAVE SPHERE */}
        <div className="relative py-4 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
            
            {/* Multi-layered animated aura waves */}
            <div className={`absolute inset-0 rounded-full transition-all duration-700 ${
              isAiSpeaking 
                ? 'bg-gradient-to-tr from-purple-600/40 via-blue-500/40 to-cyan-400/40 animate-spin blur-xl scale-125' 
                : isListening 
                ? 'bg-gradient-to-tr from-cyan-500/35 via-teal-400/35 to-blue-500/35 animate-pulse blur-xl scale-115' 
                : 'bg-blue-600/20 blur-lg scale-95'
            }`} />

            {/* Pulsating Gemini Core Orb */}
            <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 ${
              isAiSpeaking 
                ? 'bg-gradient-to-tr from-purple-500 via-indigo-600 to-cyan-400 shadow-purple-500/50 scale-105 ring-4 ring-purple-400/30' 
                : isListening 
                ? 'bg-gradient-to-tr from-cyan-400 via-blue-500 to-teal-400 shadow-cyan-500/50 scale-100 ring-4 ring-cyan-400/30' 
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 shadow-slate-900/80 scale-95'
            }`}>
              
              {/* Dynamic Soundwave Spectrum Bars in Orb */}
              <div className="flex items-center gap-1">
                {[4, 8, 12, 16, 14, 10, 6].map((baseH, idx) => (
                  <span
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isAiSpeaking 
                        ? 'bg-white shadow-xs' 
                        : isListening 
                        ? 'bg-cyan-100' 
                        : 'bg-slate-500'
                    }`}
                    style={{
                      height: isAiSpeaking 
                        ? `${Math.max(6, Math.round(baseH * (Math.sin(Date.now() / 200 + idx) + 1.2)))}px`
                        : isListening 
                        ? `${Math.max(4, Math.round(baseH * 0.9))}px`
                        : '4px',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Orb Status Ring */}
            {isAiSpeaking && (
              <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-purple-900/90 text-purple-200 text-[9px] font-black border border-purple-400/40 backdrop-blur-md animate-bounce">
                Gemini Speaking
              </span>
            )}
            {isListening && !isAiSpeaking && (
              <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-cyan-900/90 text-cyan-200 text-[9px] font-black border border-cyan-400/40 backdrop-blur-md animate-pulse">
                Listening to You...
              </span>
            )}
            {!isListening && !isAiSpeaking && (
              <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-slate-800/90 text-slate-300 text-[9px] font-semibold border border-slate-700 backdrop-blur-md">
                Tap Mic to Speak
              </span>
            )}
          </div>
        </div>

        {/* Actionable Intent Card (Extracted automatically from conversation) */}
        {extractedIntent && (
          <div className="mb-2 p-2.5 rounded-2xl bg-gradient-to-r from-blue-950/70 to-indigo-950/70 border border-blue-500/40 flex items-center justify-between text-xs text-white backdrop-blur-md animate-fadeIn">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-cyan-300 font-bold uppercase block">Ready to Book</span>
                <p className="font-bold text-white truncate">
                  {extractedIntent.rideType?.toUpperCase() || 'CAB'} to {extractedIntent.destination || 'Selected Spot'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              Confirm on Map
            </button>
          </div>
        )}

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 max-w-[88%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                  msg.sender === 'user'
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gradient-to-tr from-blue-600 to-purple-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? 'You' : <Sparkles className="w-3 h-3" />}
              </div>

              <div
                className={`p-3 rounded-2xl text-xs leading-relaxed font-medium ${
                  msg.sender === 'user'
                    ? 'bg-cyan-950/80 text-cyan-100 rounded-tr-none border border-cyan-800/60 shadow-md'
                    : 'bg-slate-900/90 text-slate-200 rounded-tl-none border border-slate-800 shadow-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Live Interim Speech Preview */}
          {liveInterimText && (
            <div className="ml-auto flex items-start gap-2 max-w-[88%] flex-row-reverse animate-pulse">
              <div className="w-6 h-6 rounded-lg bg-cyan-600/60 text-white flex items-center justify-center flex-shrink-0 text-[10px]">
                You
              </div>
              <div className="p-3 rounded-2xl text-xs leading-relaxed font-medium bg-cyan-950/40 text-cyan-200 rounded-tr-none border border-cyan-600/40 italic">
                &ldquo;{liveInterimText}...&rdquo;
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-cyan-300 font-semibold bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-500/30 max-w-fit animate-fadeIn">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Gemini is analyzing ride options & rates...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Quick Voice Prompt Suggestions */}
        <div className="my-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            'Book Sedan to Airport',
            'Find fastest bike ride',
            'Rent self-drive car for 4 hrs',
            'What is cheapest ride right now?',
          ].map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendPrompt(promptText)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 whitespace-nowrap transition-all active:scale-95 cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Gemini Live Control Footer */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          
          {/* Main Mic / Live Toggle */}
          <div className="flex items-center gap-2">
            <button
              id="gemini-live-mic-toggle-btn"
              type="button"
              onClick={toggleListening}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-cyan-500/25 active:scale-95'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  <span>Mute Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  <span>Start Live Voice</span>
                </>
              )}
            </button>

            {/* Interrupt / Stop speaking button */}
            {isAiSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Interrupt Gemini Voice"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interrupt</span>
              </button>
            )}
          </div>

          {/* Hands-Free Toggle & Text fallback */}
          <div className="flex items-center gap-2">
            <label 
              onClick={() => setHandsFreeContinuous(!handsFreeContinuous)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 cursor-pointer select-none bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800"
            >
              <input
                type="checkbox"
                checked={handsFreeContinuous}
                onChange={(e) => setHandsFreeContinuous(e.target.checked)}
                className="accent-cyan-400 rounded cursor-pointer"
              />
              <span>Hands-free</span>
            </label>

            {/* Text input trigger */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt();
              }}
              className="relative flex items-center"
            >
              <input
                id="gemini-live-text-fallback-input"
                type="text"
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                placeholder="Type if noisy..."
                className="w-28 sm:w-36 px-2.5 py-1.5 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl text-[11px] text-white placeholder-slate-500 outline-none transition-all"
              />
              {speechText.trim() && (
                <button
                  type="submit"
                  className="absolute right-1 p-1 bg-cyan-500 text-slate-950 rounded-lg"
                >
                  <Send className="w-3 h-3" />
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
