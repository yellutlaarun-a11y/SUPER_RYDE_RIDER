import React, { useState, useRef, useEffect } from 'react';
import { RideType, CabCategory, TripMode } from '../types';
import { 
  Clock, 
  Info, 
  ChevronRight, 
  ChevronDown, 
  Check,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { 
  AnimatedBikeIcon, 
  AnimatedAutoIcon, 
  AnimatedCabIcon, 
  AnimatedSelfDriveIcon, 
  AnimatedCarpoolIcon, 
  AnimatedCourierIcon 
} from './AnimatedVehicleIcons';

// Specialized Small Car Icons for Mini, Hatchback, Sedan, and SUV
const MiniIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 17h2c.6 0 1-.4 1-1v-2c0-.9-.7-1.7-1.5-1.9C18 11.5 15.5 11 15.5 11s-1.2-1.4-2-2.3c-.4-.4-1-.7-1.6-.7H8.5c-.6 0-1.2.3-1.6.7C6.1 9.6 5 11 5 11s-2.5.5-4 1.1C.2 12.3-.5 13.1-.5 14v2c0 .6.4 1 1 1h2" />
    <circle cx="6.5" cy="17" r="2" />
    <circle cx="16.5" cy="17" r="2" />
  </svg>
);

const HatchbackIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C-2.3 11.3-3 12.1-3 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
  </svg>
);

const SedanIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H7c-.7 0-1.3.3-1.8.7C4.3 8.6 3 10 3 10s-2.7.6-4.5 1.1C-2.3 11.3-3 12.1-3 13v3c0 .6.4 1 1 1h2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M16 10h4l2 3" />
  </svg>
);

const SuvIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="9" rx="2" />
    <path d="M5 7V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" />
    <circle cx="7" cy="17" r="2" />
    <circle cx="17" cy="17" r="2" />
    <path d="M2 12h20" />
  </svg>
);

interface RideCategoryRowProps {
  selectedRideType: RideType;
  onSelectRideType: (type: RideType) => void;
  selectedCabTier?: CabCategory;
  onSelectCabTier?: (tier: CabCategory) => void;
  tripMode?: TripMode;
  returnWaitMinutes?: number;
  hasDestination?: boolean;
  fares: {
    isRoundTrip?: boolean;
    tripMode?: TripMode;
    bike: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
    auto: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
    cab: {
      mini: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
      hatchback: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
      sedan: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
      suv: { fare: number; etaMins: number; tripMins: number; savings?: number; directFare?: number };
    };
    self_drive: { hourlyStarting: number; etaMins: number };
    carpooling: { perSeatAvg: number; availableRidesCount: number; savings?: number; directFare?: number };
    courier: { startingFare: number; etaMins: number; savings?: number; directFare?: number };
  };
  onBookDirectRide: (type: 'bike' | 'auto') => void;
  onBookCab?: (tier: CabCategory, fare: number) => void;
  onOpenSelfDrive: () => void;
  onOpenCarpooling: () => void;
  onOpenCourier: () => void;
  onOpenCabInfo: () => void;
}

export const RideCategoryRow: React.FC<RideCategoryRowProps> = ({
  selectedRideType,
  onSelectRideType,
  selectedCabTier = 'sedan',
  onSelectCabTier,
  tripMode = 'direct',
  returnWaitMinutes = 30,
  hasDestination = true,
  fares,
  onBookDirectRide,
  onBookCab,
  onOpenSelfDrive,
  onOpenCarpooling,
  onOpenCourier,
  onOpenCabInfo,
}) => {
  const isRound = tripMode === 'round_trip' || fares.isRoundTrip;

  const cabTiers: Array<{
    id: CabCategory;
    name: string;
    description: string;
    icon: React.ReactNode;
    fare: number;
    etaMins: number;
    capacity: string;
    savings?: number;
  }> = [
    {
      id: 'mini',
      name: 'Mini',
      description: 'Budget compact',
      icon: <MiniIcon className="w-3.5 h-3.5 text-emerald-600" />,
      fare: fares.cab.mini?.fare || fares.cab.hatchback.fare - 10,
      etaMins: fares.cab.mini?.etaMins || 2,
      capacity: '4 seats',
      savings: fares.cab.mini?.savings,
    },
    {
      id: 'hatchback',
      name: 'Hatchback',
      description: 'Daily comfy ride',
      icon: <HatchbackIcon className="w-3.5 h-3.5 text-indigo-600" />,
      fare: fares.cab.hatchback.fare,
      etaMins: fares.cab.hatchback.etaMins,
      capacity: '4 seats',
      savings: fares.cab.hatchback.savings,
    },
    {
      id: 'sedan',
      name: 'Sedan',
      description: 'Spacious & top rated',
      icon: <SedanIcon className="w-3.5 h-3.5 text-blue-600" />,
      fare: fares.cab.sedan.fare,
      etaMins: fares.cab.sedan.etaMins,
      capacity: '4 seats',
      savings: fares.cab.sedan.savings,
    },
    {
      id: 'suv',
      name: 'SUV',
      description: '6-Seater XL',
      icon: <SuvIcon className="w-3.5 h-3.5 text-purple-600" />,
      fare: fares.cab.suv.fare,
      etaMins: fares.cab.suv.etaMins,
      capacity: '6 seats',
      savings: fares.cab.suv.savings,
    },
  ];

  const currentCabTierObj = cabTiers.find((t) => t.id === selectedCabTier) || cabTiers[2];

  const categories: Array<{
    type: RideType;
    name: string;
    tagline: string;
    fareLabel: string;
    etaLabel: string;
    etaBadgeText: string;
    renderIcon: (isActive: boolean) => React.ReactNode;
    colorTheme: string;
    borderActive: string;
    badge?: string;
    savings?: number;
  }> = [
    {
      type: 'bike',
      name: 'Bike Ride',
      tagline: isRound ? 'Round trip with 15% return off' : 'Fastest in traffic • 1 Rider',
      fareLabel: hasDestination ? `₹${fares.bike.fare}` : 'Enter destination',
      etaLabel: `${fares.bike.etaMins} mins away`,
      etaBadgeText: `${fares.bike.etaMins}m`,
      renderIcon: (isActive) => <AnimatedBikeIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-amber-100 via-amber-200 to-amber-300 border-amber-300/80',
      borderActive: 'border-amber-500 ring-amber-400/30 bg-amber-50/80',
      badge: isRound ? '15% Off Return' : 'Fastest ⚡',
      savings: fares.bike.savings,
    },
    {
      type: 'auto',
      name: 'Auto Ride',
      tagline: isRound ? 'Round trip • Up to 3 Riders' : 'Budget 3-Wheeler • Up to 3 Riders',
      fareLabel: hasDestination ? `₹${fares.auto.fare}` : 'Enter destination',
      etaLabel: `${fares.auto.etaMins} mins away`,
      etaBadgeText: `${fares.auto.etaMins}m`,
      renderIcon: (isActive) => <AnimatedAutoIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-emerald-100 via-emerald-200 to-teal-300 border-emerald-300/80',
      borderActive: 'border-emerald-600 ring-emerald-500/30 bg-emerald-50/80',
      badge: isRound ? '15% Off Return' : 'Pocket Friendly',
      savings: fares.auto.savings,
    },
    {
      type: 'cab',
      name: 'Cab Ride',
      tagline: isRound ? 'Round trip • Same driver waits' : 'Mini, Hatch, Sedan & SUV',
      fareLabel: hasDestination ? `From ₹${fares.cab.mini?.fare || fares.cab.hatchback.fare}` : 'Enter destination',
      etaLabel: `${currentCabTierObj.etaMins} mins away`,
      etaBadgeText: `${currentCabTierObj.etaMins}m`,
      renderIcon: (isActive) => <AnimatedCabIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-indigo-100 via-indigo-200 to-blue-300 border-indigo-300/80',
      borderActive: 'border-indigo-600 ring-indigo-500/30 bg-indigo-50/80',
      badge: isRound ? 'Round Trip Deal' : 'Mini • Hatch • Sedan • SUV',
      savings: currentCabTierObj.savings,
    },
    {
      type: 'self_drive',
      name: 'Self Drive',
      tagline: 'Rent & drive with digital OTP key',
      fareLabel: `From ₹${fares.self_drive.hourlyStarting}/hr`,
      etaLabel: 'Instant unlock',
      etaBadgeText: 'Instant',
      renderIcon: (isActive) => <AnimatedSelfDriveIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-orange-100 via-orange-200 to-amber-300 border-orange-300/80',
      borderActive: 'border-orange-500 ring-orange-400/30 bg-orange-50/80',
      badge: 'Rentals 🔑',
    },
    {
      type: 'carpooling',
      name: 'Car Pooling',
      tagline: isRound ? 'Two-way shared ride split' : 'Shared rides • Split per head fare',
      fareLabel: hasDestination ? `₹${fares.carpooling.perSeatAvg}/seat` : 'Enter destination',
      etaLabel: `${fares.carpooling.availableRidesCount} cars nearby`,
      etaBadgeText: '4m',
      renderIcon: (isActive) => <AnimatedCarpoolIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-teal-100 via-teal-200 to-emerald-300 border-teal-300/80',
      borderActive: 'border-teal-600 ring-teal-500/30 bg-teal-50/80',
      badge: isRound ? 'Split Round' : 'Eco Split 👥',
      savings: fares.carpooling.savings,
    },
    {
      type: 'courier',
      name: 'Courier Service',
      tagline: isRound ? 'Round parcel drop & return' : 'Weight-based parcel delivery',
      fareLabel: hasDestination ? `From ₹${fares.courier.startingFare}` : 'Enter destination',
      etaLabel: '3 mins pickup',
      etaBadgeText: '3m',
      renderIcon: (isActive) => <AnimatedCourierIcon className="w-8 h-8" isActive={isActive} />,
      colorTheme: 'from-sky-100 via-sky-200 to-cyan-300 border-sky-300/80',
      borderActive: 'border-cyan-600 ring-cyan-500/30 bg-cyan-50/80',
      badge: 'Weight Pick 📦',
      savings: fares.courier.savings,
    },
  ];

  const handleCardClick = (type: RideType) => {
    onSelectRideType(type);
    if (type === 'self_drive') {
      onOpenSelfDrive();
    } else if (type === 'carpooling') {
      onOpenCarpooling();
    } else if (type === 'courier') {
      onOpenCourier();
    }
  };

  const handleCabTierSelect = (tierId: CabCategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    onSelectRideType('cab');
    if (onSelectCabTier) {
      onSelectCabTier(tierId);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3">
      {/* RIDE CATEGORY CARDS GRID */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categories.map((cat) => {
            const isSelected = selectedRideType === cat.type;

            return (
              <div
                key={cat.type}
                id={`ride-category-${cat.type}-card`}
                onClick={() => handleCardClick(cat.type)}
                className={`relative cursor-pointer rounded-2xl p-3 border transition-all duration-200 flex flex-col justify-between select-none group ${
                  isSelected
                    ? `${cat.borderActive} ring-2 shadow-md scale-[1.02]`
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Badge Tag */}
                {cat.badge && (
                  <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[9px] font-extrabold text-amber-800 shadow-sm flex items-center gap-0.5">
                    {isRound && <RotateCcw className="w-2.5 h-2.5 text-emerald-600" />}
                    <span>{cat.badge}</span>
                  </div>
                )}

                <div>
                  {/* Icon & Name */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* ICON WRAPPER WITH PROMINENT ANIMATED VEHICLE GRAPHIC & LIVE ETA CHIP */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${cat.colorTheme} text-slate-950 flex items-center justify-center font-bold shadow-xs p-1 border transition-transform duration-300 group-hover:scale-105`}>
                        {cat.renderIcon(isSelected)}
                      </div>
                      {/* ETA BADGE ON THE ICON */}
                      <span 
                        id={`category-${cat.type}-icon-eta-badge`}
                        className="absolute -bottom-1.5 -right-1 px-1 py-0.2 bg-slate-900 text-emerald-400 font-extrabold text-[8px] rounded-md shadow-xs border border-slate-700 flex items-center gap-0.5"
                        title={`Estimated Arrival Time: ${cat.etaLabel}`}
                      >
                        <Clock className="w-2 h-2 text-emerald-400" />
                        {cat.etaBadgeText}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-slate-900 truncate">{cat.name}</h4>
                      {isRound && cat.savings && cat.savings > 0 ? (
                        <p className="text-[9px] font-bold text-emerald-600 truncate">
                          Save ₹{cat.savings}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* SPECIALIZED MINI, HATCHBACK, SEDAN, SUV DROPDOWN (For Cab Card) */}
                  {cat.type === 'cab' && (
                    <div className="mt-1 mb-1.5 flex flex-col gap-1.5">
                      {/* CRYSTAL-CLEAR STYLED DROPDOWN SELECTOR */}
                      <div className="relative">
                        <select
                          id="cab-category-dropdown-trigger"
                          value={selectedCabTier}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRideType('cab');
                          }}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCabTierSelect(e.target.value as CabCategory);
                          }}
                          className={`w-full py-1.5 px-2 pr-7 rounded-xl font-bold text-[11px] border outline-none cursor-pointer appearance-none transition-all shadow-xs ${
                            isSelected
                              ? 'bg-white border-indigo-400 text-indigo-950 ring-2 ring-indigo-200/60'
                              : 'bg-slate-50/95 border-slate-300 text-slate-800 hover:bg-white'
                          }`}
                        >
                          <option value="mini">Mini{hasDestination ? ` • ₹${fares.cab.mini?.fare || fares.cab.hatchback.fare - 10}${isRound ? ' (Round)' : ''}` : ''}</option>
                          <option value="hatchback">Hatchback{hasDestination ? ` • ₹${fares.cab.hatchback.fare}${isRound ? ' (Round)' : ''}` : ''}</option>
                          <option value="sedan">Sedan{hasDestination ? ` • ₹${fares.cab.sedan.fare}${isRound ? ' (Round)' : ''}` : ''}</option>
                          <option value="suv">SUV{hasDestination ? ` • ₹${fares.cab.suv.fare}${isRound ? ' (Round)' : ''}` : ''}</option>
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600 flex items-center">
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price and Action Indicator */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={`text-xs font-black ${hasDestination || cat.type === 'self_drive' ? 'text-slate-900' : 'text-slate-400 text-[11px] font-semibold'}`}>
                      {cat.type === 'cab' 
                        ? (hasDestination ? `₹${currentCabTierObj.fare}` : 'Enter destination')
                        : cat.fareLabel}
                    </span>
                    {isRound && hasDestination && (
                      <span className="text-[9px] font-bold text-slate-400">
                        round trip
                      </span>
                    )}
                  </div>
                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                      <Check className="w-3 h-3" />
                    </div>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

