import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Sparkles, 
  X, 
  Check, 
  Download, 
  Share2, 
  ShieldCheck, 
  Flashlight, 
  Layers, 
  Clock, 
  MapPin, 
  Smile,
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SelfieCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickupLocation?: string;
  destinationLocation?: string;
  userName?: string;
}

export const SelfieCameraModal: React.FC<SelfieCameraModalProps> = ({
  isOpen,
  onClose,
  pickupLocation = 'Ongole Central',
  destinationLocation = 'Destination',
  userName = 'Rider',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'normal' | 'golden' | 'cyber' | 'vintage' | 'bw'>('normal');
  const [mode, setMode] = useState<'safety' | 'trip_memory'>('trip_memory');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashActive, setIsFlashActive] = useState<boolean>(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState<boolean>(true);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Filter CSS mappings
  const filterStyles = {
    normal: '',
    golden: 'sepia(35%) contrast(110%) brightness(105%) saturate(120%)',
    cyber: 'hue-rotate(200deg) contrast(125%) saturate(140%)',
    vintage: 'sepia(50%) contrast(90%) brightness(95%) grayscale(20%)',
    bw: 'grayscale(100%) contrast(120%)',
  };

  // Start Camera Stream
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access unavailable. You can try switching devices or capturing a simulated trip snap.');
    }
  }, [stream]);

  // Handle open/close camera lifecycle
  useEffect(() => {
    if (isOpen && !capturedPhotoUrl) {
      startCamera(cameraFacing);
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, cameraFacing, capturedPhotoUrl, startCamera]);

  // Flip Camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture Photo with Overlay
  const triggerCapture = () => {
    if (countdown !== null) return;

    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          executePhotoSnap();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executePhotoSnap = () => {
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Apply mirror if front camera
        if (cameraFacing === 'user') {
          ctx.translate(width, 0);
          ctx.scale(-1, 1);
        }

        // Draw video frame
        ctx.filter = filterStyles[activeFilter] || 'none';
        ctx.drawImage(video, 0, 0, width, height);
        ctx.filter = 'none';

        // Reset transform for watermarks & badges
        if (cameraFacing === 'user') {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        // Draw Watermark & Trip Overlay if enabled
        if (watermarkEnabled) {
          // Bottom Gradient Banner
          const gradient = ctx.createLinearGradient(0, height - 120, 0, height);
          gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, height - 120, width, 120);

          // Brand & Route Text
          ctx.fillStyle = '#10B981';
          ctx.font = 'bold 22px system-ui, sans-serif';
          ctx.fillText('RidePulse Trip Snap 🚖', 24, height - 60);

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '16px system-ui, sans-serif';
          const locText = `${pickupLocation.slice(0, 24)} → ${destinationLocation.slice(0, 24)}`;
          ctx.fillText(locText, 24, height - 32);

          // Timestamp
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
          ctx.fillStyle = '#94A3B8';
          ctx.font = '13px monospace';
          ctx.fillText(`${dateStr} • ${nowStr} • ${userName}`, 24, height - 12);
        }

        const dataUrl = canvas.toDataURL('image/png');
        setCapturedPhotoUrl(dataUrl);

        // Stop stream to save battery
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }

        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 },
        });
      }
    } else {
      // Fallback simulated snapshot if video unavailable
      setCapturedPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80');
    }
  };

  const retakePhoto = () => {
    setCapturedPhotoUrl(null);
    setSavedSuccess(false);
    startCamera(cameraFacing);
  };

  const handleDownload = () => {
    if (!capturedPhotoUrl) return;
    const a = document.createElement('a');
    a.href = capturedPhotoUrl;
    a.download = `ridepulse-selfie-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Flash Animation Layer */}
        {isFlashActive && (
          <div className="absolute inset-0 z-50 bg-white animate-pulse" />
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-900/90 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white">
                  Ride<span className="text-emerald-400">Cam</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-extrabold border border-emerald-500/40">
                  Selfie & Safety
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                In-Cab Memories & Passenger Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('trip_memory')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'trip_memory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trip Memory & Filters</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('safety')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
              mode === 'safety'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Safety Face Check</span>
          </button>
        </div>

        {/* Camera Viewfinder / Preview Screen */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[360px]">
          
          {/* Captured Result Image */}
          {capturedPhotoUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedPhotoUrl}
                alt="Captured Selfie"
                className="w-full h-full max-h-[420px] object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 flex items-center gap-1 border border-emerald-500/30">
                <Check className="w-3 h-3 text-emerald-400" />
                Snapshot Captured
              </div>
            </div>
          ) : (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              {cameraError ? (
                <div className="p-6 text-center max-w-xs flex flex-col items-center gap-2">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-slate-300">{cameraError}</p>
                  <button
                    onClick={() => startCamera(cameraFacing)}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Retry Permission
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      filter: filterStyles[activeFilter],
                      transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
                    }}
                    className="w-full h-full object-cover max-h-[420px]"
                  />

                  {/* Mode-Specific Guides */}
                  {mode === 'safety' && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                      <div className="w-48 h-64 border-2 border-dashed border-emerald-400/70 rounded-[50%] flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                        <span className="text-[10px] font-bold text-emerald-300 bg-black/60 px-2 py-0.5 rounded-full">
                          Align Face Here
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Trip Overlay Watermark Preview */}
                  {watermarkEnabled && mode === 'trip_memory' && (
                    <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-left pointer-events-none">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                          RidePulse Snap 🚖
                        </span>
                        <span className="text-[9px] font-mono text-slate-300">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-white font-semibold truncate mt-0.5">
                        {pickupLocation} → {destinationLocation}
                      </p>
                    </div>
                  )}

                  {/* Countdown Numbers */}
                  {countdown !== null && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                      <span className="text-7xl font-black text-emerald-400 animate-ping">
                        {countdown}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Live Filter Bar (Only in Trip Memory Mode & Before Capture) */}
        {!capturedPhotoUrl && mode === 'trip_memory' && (
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'normal', label: 'Original' },
              { id: 'golden', label: '🌅 Golden' },
              { id: 'cyber', label: '⚡ Neon' },
              { id: 'vintage', label: '🎞️ Vintage' },
              { id: 'bw', label: '🖤 B&W' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as typeof activeFilter)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedPhotoUrl ? (
            /* Post Capture Actions */
            <div className="w-full flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={retakePhoto}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-transform active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{savedSuccess ? 'Saved! ✓' : 'Save Snap'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Live Viewfinder Controls */
            <div className="w-full flex items-center justify-between">
              {/* Flip camera */}
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                title="Flip Camera (Front/Rear)"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={triggerCapture}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-transform active:scale-90 cursor-pointer group"
                title="Take Selfie Photo"
              >
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-white/80 group-hover:bg-slate-800">
                  <div className="w-8 h-8 rounded-full bg-emerald-400 group-active:scale-90 transition-transform" />
                </div>
              </button>

              {/* Watermark Toggle */}
              <button
                type="button"
                onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  watermarkEnabled
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
                title="Toggle Route Stamp Watermark"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
