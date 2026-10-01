import React from 'react';
import { UserProfile, DeviceGpsState } from '../types';
import { 
  User, 
  Navigation,
  Receipt,
  LocateFixed,
  Radio,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface HeaderNavProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onOpenUserAccount?: () => void;
  onOpenCompletedTrips?: () => void;
  completedTripsCount?: number;
  onOpenVoiceAssistant?: () => void;
  onOpenMapsExplorer?: () => void;
  onOpenTripAnimator?: () => void;
  onOpenMusicPlayer?: () => void;
  isMusicPlaying?: boolean;
  onAutoGpsClick: () => void;
  gpsActive: boolean;
  deviceGps?: DeviceGpsState | null;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  user,
  onOpenAuth,
  onOpenUserAccount,
  onOpenCompletedTrips,
  completedTripsCount = 0,
  onAutoGpsClick,
  gpsActive,
  deviceGps,
}) => {
  const handleAccountClick = () => {
    if (onOpenUserAccount) {
      onOpenUserAccount();
    } else {
      onOpenAuth();
    }
  };

  // Helper to compute GPS signal tier based on accuracy in meters
  const getGpsSignalQuality = () => {
    if (gpsActive || deviceGps?.status === 'requesting') {
      return {
        tier: 'loading' as const,
        label: 'Locking GPS...',
        colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
        dotClass: 'bg-slate-400',
        icon: <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />,
        tooltip: 'Acquiring satellite GPS signal (<50m high-accuracy threshold)...',
      };
    }

    if (!deviceGps || deviceGps.status === 'denied' || deviceGps.status === 'error') {
      return {
        tier: 'red' as const,
        label: deviceGps?.status === 'denied' ? 'GPS Blocked' : 'No GPS',
        colorClass: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100',
        dotClass: 'bg-rose-500',
        icon: <AlertCircle className="w-3 h-3 text-rose-600" />,
        tooltip: 'GPS permission denied or unavailable. Click to retry.',
      };
    }

    const acc = deviceGps.accuracy;

    // GREEN: High Precision (<= 50 meters)
    if (acc <= 50 && !deviceGps.isAccuracyPoor && deviceGps.status === 'granted') {
      return {
        tier: 'green' as const,
        label: `GPS ±${acc}m`,
        colorClass: 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
        dotClass: 'bg-emerald-500 shadow-xs shadow-emerald-500/50',
        icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />,
        tooltip: `Strong High-Accuracy GPS Signal (±${acc}m precision). Click to refresh.`,
      };
    }

    // YELLOW / AMBER: Moderate Signal (51m to 150m)
    if (acc <= 150) {
      return {
        tier: 'yellow' as const,
        label: `GPS ±${acc}m`,
        colorClass: 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100',
        dotClass: 'bg-amber-500',
        icon: <AlertTriangle className="w-3 h-3 text-amber-600" />,
        tooltip: `Moderate GPS accuracy (±${acc}m > 50m limit). Coordinates filtered for safety. Click to refine.`,
      };
    }

    // RED: Poor Signal / IP fallback (> 150 meters)
    return {
      tier: 'red' as const,
      label: `Weak ±${acc > 999 ? `${(acc / 1000).toFixed(1)}k` : acc}m`,
      colorClass: 'text-rose-800 bg-rose-50 border-rose-200 hover:bg-rose-100',
      dotClass: 'bg-rose-500',
      icon: <Radio className="w-3 h-3 text-rose-600" />,
      tooltip: `Poor GPS Signal / Regional IP area (±${acc}m). Click to retry GPS fix.`,
    };
  };

  const signalQuality = getGpsSignalQuality();

  return (
    <header className="relative z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-4 py-1.5 sm:py-2 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Left: App Logo & Branding */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black shadow-sm shadow-emerald-600/20">
            <Navigation className="w-4 h-4 fill-white" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-white animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">Super <span className="text-emerald-600">Ryde</span></span>
            </div>
            <p className="text-[9px] text-slate-500 hidden sm:block font-medium">Smart Taxi, Pooling & Mobility</p>
          </div>
        </div>

        {/* Right Corner: GPS Signal Indicator, Trips History & Customer Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          
          {/* Signal Quality Indicator in HeaderNav */}
          <button
            type="button"
            onClick={onAutoGpsClick}
            title={signalQuality.tooltip}
            className={`flex items-center gap-1.5 h-7 px-2 py-0.5 rounded-lg border text-[10px] font-bold shadow-2xs transition-all active:scale-95 cursor-pointer group whitespace-nowrap ${signalQuality.colorClass}`}
          >
            <div className="relative flex items-center justify-center">
              {signalQuality.icon}
              <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ${signalQuality.dotClass} ${signalQuality.tier === 'green' ? 'animate-pulse' : ''}`} />
            </div>
            <span className="font-mono tracking-tight">
              {signalQuality.label}
            </span>
          </button>

          {/* Completed Trips & Receipts Button */}
          {onOpenCompletedTrips && (
            <button
              id="completed-trips-header-btn"
              onClick={onOpenCompletedTrips}
              title="View Completed Trips, Fares & Receipts"
              className="flex items-center gap-1.5 h-7 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 shadow-2xs transition-all active:scale-95 cursor-pointer group whitespace-nowrap"
            >
              <div className="relative w-4 h-4 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-2.5 h-2.5 text-emerald-700" />
              </div>
              <span className="text-[10px] font-bold text-slate-800 hidden xs:inline">
                Trips
              </span>
              {completedTripsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white font-mono font-bold text-[8.5px] flex items-center justify-center shadow-xs">
                  {completedTripsCount}
                </span>
              )}
            </button>
          )}

          {/* Customer Account / Profile */}
          <button
            id="rider-registration-top-right-btn"
            onClick={handleAccountClick}
            title="Open Customer Account & Wallet"
            className="flex items-center gap-1.5 h-7 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 shadow-2xs transition-all active:scale-95 cursor-pointer group whitespace-nowrap"
          >
            {user ? (
              <>
                <div className="w-4 h-4 rounded-md bg-emerald-600 border border-emerald-500 flex items-center justify-center text-white font-bold text-[9px] shadow-2xs flex-shrink-0">
                  {user.name.charAt(0) || <User className="w-2.5 h-2.5 text-white" />}
                </div>
                <div className="flex items-center gap-1 min-w-0 text-left">
                  <span className="text-[10px] font-bold text-slate-800 truncate max-w-[65px] sm:max-w-[85px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[8.5px] text-amber-600 font-extrabold flex items-center">
                    ★{user.rating}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="w-4 h-4 rounded-md bg-slate-200 flex items-center justify-center text-slate-700 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors flex-shrink-0">
                  <User className="w-2.5 h-2.5" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  Account
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
