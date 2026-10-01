import React from 'react';
import { CalendarClock, Home, Navigation, Headphones, Camera } from 'lucide-react';
import { RideType, CabCategory } from '../types';
import { 
  AnimatedBikeIcon, 
  AnimatedAutoIcon, 
  AnimatedCabIcon, 
  AnimatedSelfDriveIcon, 
  AnimatedCarpoolIcon, 
  AnimatedCourierIcon 
} from './AnimatedVehicleIcons';

export type BottomNavTab = 'advance' | 'book' | 'home' | 'account';

interface BottomStaticNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
  advanceBookingsCount?: number;
  selectedRideType?: RideType;
  selectedCabTier?: CabCategory;
  selectedFare?: number | string;
  selectedEta?: string;
  hasDestination?: boolean;
  onBookSelectedVehicle?: () => void;
  onOpenMusicPlayer?: () => void;
  isMusicPlaying?: boolean;
  onOpenSelfieCamera?: () => void;
}

export const BottomStaticNav: React.FC<BottomStaticNavProps> = ({
  activeTab,
  onTabChange,
  advanceBookingsCount = 0,
  selectedRideType = 'cab',
  selectedCabTier = 'sedan',
  selectedFare,
  selectedEta,
  hasDestination = true,
  onBookSelectedVehicle,
  onOpenMusicPlayer,
  isMusicPlaying,
  onOpenSelfieCamera,
}) => {
  // Determine vehicle specific icon, label, and theme
  const getVehicleDisplay = () => {
    switch (selectedRideType) {
      case 'bike':
        return {
          name: 'Bike',
          icon: <AnimatedBikeIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-amber-600 via-amber-700 to-yellow-600',
          badgeText: 'Fastest ⚡',
        };
      case 'auto':
        return {
          name: 'Auto',
          icon: <AnimatedAutoIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-emerald-700 via-teal-700 to-emerald-800',
          badgeText: 'Budget',
        };
      case 'cab': {
        const tierName = selectedCabTier.charAt(0).toUpperCase() + selectedCabTier.slice(1);
        return {
          name: `Cab (${tierName})`,
          icon: <AnimatedCabIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-indigo-600 via-blue-700 to-indigo-800',
          badgeText: `${tierName} AC`,
        };
      }
      case 'self_drive':
        return {
          name: 'Self Drive',
          icon: <AnimatedSelfDriveIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-orange-600 via-amber-700 to-orange-800',
          badgeText: 'OTP Key',
        };
      case 'carpooling':
        return {
          name: 'Carpool',
          icon: <AnimatedCarpoolIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-teal-600 via-emerald-700 to-teal-800',
          badgeText: 'Eco Split',
        };
      case 'courier':
        return {
          name: 'Courier',
          icon: <AnimatedCourierIcon className="w-6 h-6" isActive={true} />,
          colorGradient: 'from-sky-600 via-cyan-700 to-blue-800',
          badgeText: 'Delivery',
        };
      default:
        return {
          name: 'Ride',
          icon: <Navigation className="w-5 h-5 text-emerald-200" />,
          colorGradient: 'from-emerald-600 via-teal-700 to-emerald-800',
          badgeText: 'Active',
        };
    }
  };

  const vehicle = getVehicleDisplay();

  const handleBookClick = () => {
    if (onBookSelectedVehicle) {
      onBookSelectedVehicle();
    } else {
      onTabChange('book');
    }
  };

  return (
    <div 
      id="static-bottom-navigation-component"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 sm:px-4 py-1.5 sm:py-2 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] select-none"
    >
      <div className="max-w-xl mx-auto flex items-center justify-between gap-1 sm:gap-2">
        {/* 1. HOME FUNCTIONALITY COMPONENT (LEFT) */}
        <button
          type="button"
          id="customer-account-icon-btn"
          onClick={() => onTabChange('home')}
          className={`flex-1 min-w-0 max-w-[64px] sm:max-w-[72px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 group cursor-pointer ${
            activeTab === 'home' || activeTab === 'book'
              ? 'text-emerald-700 font-black'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
          title="Return to Home / Booking Screen"
        >
          <div className={`relative p-1.5 rounded-xl transition-colors ${
            activeTab === 'home' || activeTab === 'book' ? 'bg-emerald-50 text-emerald-700' : 'group-hover:bg-slate-100'
          }`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight mt-0.5 truncate">Home</span>
        </button>

        {/* 2. GOOGLE MUSIC COMPONENT (BESIDE HOME) */}
        {onOpenMusicPlayer && (
          <button
            type="button"
            id="google-music-bottom-nav-btn"
            onClick={onOpenMusicPlayer}
            className={`flex-1 min-w-0 max-w-[64px] sm:max-w-[72px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 group cursor-pointer ${
              isMusicPlaying
                ? 'text-rose-600 font-black'
                : 'text-slate-600 hover:text-slate-900 font-semibold'
            }`}
            title="Google Music In-Cab Audio Player"
          >
            <div className={`relative p-1.5 rounded-xl transition-colors ${
              isMusicPlaying ? 'bg-rose-50 text-rose-600 shadow-2xs' : 'group-hover:bg-slate-100'
            }`}>
              <Headphones className="w-5 h-5" />
              {isMusicPlaying && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight mt-0.5 truncate">Music</span>
          </button>
        )}

        {/* 3. DYNAMIC VEHICLE-AWARE BOOKING ACTION BUTTON (CENTER) */}
        <button
          type="button"
          id="main-book-ride-icon-btn"
          onClick={handleBookClick}
          className="flex-shrink-0 min-w-[110px] max-w-[145px] sm:max-w-[165px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white py-1.5 px-2 sm:px-2.5 rounded-xl shadow-md shadow-emerald-700/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border border-emerald-500/40 group relative overflow-hidden cursor-pointer"
          title={`Book ${vehicle.name} Now`}
        >
          {/* Subtle shine effect on button */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          {/* Selected Vehicle Icon & Name */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-bold flex-shrink-0 border border-white/25 shadow-2xs">
              {vehicle.icon}
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[11px] font-black leading-none truncate text-white">
                {selectedRideType === 'self_drive' 
                  ? 'Rent Self Drive' 
                  : hasDestination 
                    ? `Book ${vehicle.name}` 
                    : 'Enter Destination'}
              </span>
              <span className="text-[8.5px] text-emerald-100 font-medium leading-tight truncate">
                {selectedRideType === 'self_drive' 
                  ? 'Instant Unlock' 
                  : hasDestination 
                    ? (selectedEta ? `ETA ${selectedEta}` : 'Confirm') 
                    : 'Required for fare'}
              </span>
            </div>
          </div>
        </button>

        {/* 4. CUSTOMER ADVANCE BOOK ICON */}
        <button
          type="button"
          id="customer-advance-book-icon-btn"
          onClick={() => onTabChange('advance')}
          className={`flex-1 min-w-0 max-w-[64px] sm:max-w-[72px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 group cursor-pointer ${
            activeTab === 'advance'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
          title="Schedule Advance Booking"
        >
          <div className={`relative p-1.5 rounded-xl transition-colors ${
            activeTab === 'advance' ? 'bg-emerald-50 text-emerald-700' : 'group-hover:bg-slate-100'
          }`}>
            <CalendarClock className="w-5 h-5" />
            {advanceBookingsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white font-mono font-black text-[9px] flex items-center justify-center shadow-xs">
                {advanceBookingsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight mt-0.5 truncate">Advance</span>
        </button>

        {/* 5. SELFIE CAMERA COMPONENT (BESIDE ADVANCE BOOK) */}
        {onOpenSelfieCamera && (
          <button
            type="button"
            id="selfie-camera-bottom-nav-btn"
            onClick={onOpenSelfieCamera}
            className="flex-1 min-w-0 max-w-[64px] sm:max-w-[72px] flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 group cursor-pointer text-slate-600 hover:text-slate-900 font-semibold"
            title="Open RideCam Selfie & Passenger Safety Check"
          >
            <div className="relative p-1.5 rounded-xl transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700 text-slate-700">
              <Camera className="w-5 h-5" />
            </div>
            <span className="text-[10px] sm:text-[10.5px] font-bold tracking-tight mt-0.5 truncate">Selfie</span>
          </button>
        )}
      </div>
    </div>
  );
};

