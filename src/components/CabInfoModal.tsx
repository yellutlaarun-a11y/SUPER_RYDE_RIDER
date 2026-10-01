import React, { useState } from 'react';
import { CabCategory, LocationPoint } from '../types';
import { 
  Car, 
  Users, 
  Briefcase, 
  ShieldCheck, 
  Check, 
  X, 
  Sparkles, 
  Fuel, 
  Zap, 
  Clock, 
  ChevronRight,
  Info,
  BadgeCheck,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CabInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier: CabCategory;
  onSelectTier: (tier: CabCategory) => void;
  fares: {
    mini: { fare: number; etaMins: number; tripMins: number };
    hatchback: { fare: number; etaMins: number; tripMins: number };
    sedan: { fare: number; etaMins: number; tripMins: number };
    suv: { fare: number; etaMins: number; tripMins: number };
  };
  distanceKm: number;
  durationMins: number;
  pickup: LocationPoint;
  destination: LocationPoint | null;
  onBookCab: (tier: CabCategory, fare: number) => void;
}

export const CabInfoModal: React.FC<CabInfoModalProps> = ({
  isOpen,
  onClose,
  selectedTier,
  onSelectTier,
  fares,
  distanceKm,
  durationMins,
  pickup,
  destination,
  onBookCab,
}) => {
  const [activeCategory, setActiveCategory] = useState<CabCategory | 'ev'>(selectedTier);

  if (!isOpen) return null;

  const evFare = Math.round(65 + distanceKm * 16);

  const carTypesList = [
    {
      id: 'mini' as CabCategory,
      title: 'Mini Economy',
      badge: 'Lowest Fare',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      tagline: 'Maruti Alto K10, Renault Kwid, Datsun Go',
      description: 'Ultra-compact economy cars designed for fast, budget-friendly solo or couple travel with low running costs.',
      capacity: 4,
      luggage: 1,
      fuel: 'Petrol / CNG',
      etaMins: fares.mini.etaMins,
      fare: fares.mini.fare,
      baseRateText: '₹45 Base + ₹11/km',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
      features: [
        'Economy AC travel',
        'Zippy through tight traffic',
        'Fits 4 passengers with 1 bag',
        'Lowest per-kilometer rate',
      ],
      suitableFor: 'Quick solo hops, market visits, and student commutes',
    },
    {
      id: 'hatchback' as CabCategory,
      title: 'Hatchback',
      badge: 'Comfort Commute',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      tagline: 'WagonR, Swift, Tiago, Grand i10',
      description: 'Compact 4-seater cars engineered for fast navigation through Indian city traffic and everyday pocket-friendly commuting.',
      capacity: 4,
      luggage: 2,
      fuel: 'Petrol / CNG',
      etaMins: fares.hatchback.etaMins,
      fare: fares.hatchback.fare,
      baseRateText: '₹55 Base + ₹14/km',
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=500&auto=format&fit=crop&q=80',
      features: [
        'Air Conditioning (AC) guaranteed',
        'Top fuel-efficient city commuter',
        'Fits 4 passengers with 2 medium bags',
        'Instant pickup & quick dispatches',
      ],
      suitableFor: 'Solo travel, daily office runs, and quick city trips',
    },
    {
      id: 'sedan' as CabCategory,
      title: 'Sedan Prime',
      badge: 'Top Rated Choice',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      tagline: 'Maruti Dzire, Honda City, Hyundai Verna, Etios',
      description: 'Spacious 4-door executive sedans featuring superior rear legroom, dedicated large trunk storage, and top-rated professional captains.',
      capacity: 4,
      luggage: 3,
      fuel: 'Petrol / Diesel',
      etaMins: fares.sedan.etaMins,
      fare: fares.sedan.fare,
      baseRateText: '₹75 Base + ₹18/km',
      image: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=500&auto=format&fit=crop&q=80',
      features: [
        'Enhanced rear passenger legroom',
        'Large boot trunk (fits 3-4 bags)',
        'Top 5★ rated executive drivers',
        'Silent, smooth highway comfort',
      ],
      suitableFor: 'Business meetings, airport runs with luggage, and date nights',
    },
    {
      id: 'suv' as CabCategory,
      title: 'SUV Prime XL',
      badge: '6-7 Seater Family',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      tagline: 'Toyota Innova Crysta, Maruti Ertiga, Mahindra XUV700, Carens',
      description: 'High-capacity 3-row vehicles with powerful AC cooling across all rows and massive cargo capacity for families and group airport travel.',
      capacity: 6,
      luggage: 5,
      fuel: 'Diesel / Petrol',
      etaMins: fares.suv.etaMins,
      fare: fares.suv.fare,
      baseRateText: '₹115 Base + ₹24/km',
      image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&auto=format&fit=crop&q=80',
      features: [
        '3-Row seating for 6-7 passengers',
        'Triple-zone rear AC vents',
        'Generous luggage space & roof carrier option',
        'Elevated high ground clearance & plush suspension',
      ],
      suitableFor: 'Family outings, group travel, outstation trips & airport bulk luggage',
    },
    {
      id: 'ev' as const,
      title: 'Electric Green Cab',
      badge: 'Zero Emissions 🌱',
      badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
      tagline: 'Tata Nexon EV, Tata Tigor EV, MG ZS EV',
      description: '100% battery-electric cabs delivering a whisper-quiet, smooth ride with zero tailpipe carbon emissions.',
      capacity: 4,
      luggage: 2,
      fuel: '100% Electric',
      etaMins: 4,
      fare: evFare,
      baseRateText: '₹65 Base + ₹16/km',
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format&fit=crop&q=80',
      features: [
        '100% eco-friendly zero emissions',
        'Silent electric motor cabin acoustics',
        'Instant torque and smooth regenerative braking',
        'Earns Green Commuter badge on your profile',
      ],
      suitableFor: 'Environment-conscious commuters wanting an ultra-smooth quiet ride',
    },
  ];

  const handleSelectAndBook = (tierId: CabCategory | 'ev') => {
    const targetTier: CabCategory = tierId === 'ev' ? 'sedan' : tierId;
    onSelectTier(targetTier);
    const selectedFare = tierId === 'ev' ? evFare : fares[targetTier].fare;
    
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    onBookCab(targetTier, selectedFare);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 border-b border-slate-100 pb-4 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 flex-shrink-0">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Available Cab Fleet & Car Types
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-200 flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" />
                Indian Rupee (₹) Pricing
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Explore available car models, seating capacity, luggage room, and transparent fares for your route.
            </p>
          </div>
        </div>

        {/* Route Details Banner */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 sm:p-3.5 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span className="truncate">{pickup.name}</span>
            </div>
            <span className="text-slate-400 font-bold">➔</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span className="truncate">{destination ? destination.name : 'Selected Destination'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 flex-shrink-0">
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              📍 {distanceKm} km
            </span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              ⏱ ~{durationMins} mins trip
            </span>
          </div>
        </div>

        {/* Car Types Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
          {carTypesList.map((car) => {
            const isCurrentSelected = activeCategory === car.id;

            return (
              <div
                key={car.id}
                onClick={() => setActiveCategory(car.id)}
                className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isCurrentSelected
                    ? 'bg-indigo-50/40 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-800'
                }`}
              >
                <div>
                  {/* Top Image Banner & Badges */}
                  <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                    <img
                      src={car.image}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${car.badgeColor}`}>
                      {car.badge}
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 text-white text-[10px] font-bold backdrop-blur-xs">
                      {car.etaMins} mins away
                    </div>
                  </div>

                  {/* Title & Models */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <span>{car.title}</span>
                      </h4>
                      <p className="text-[11px] font-bold text-indigo-700 mt-0.5">
                        {car.tagline}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-black text-slate-900">
                        ₹{car.fare}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {car.baseRateText}
                      </div>
                    </div>
                  </div>

                  {/* Key Capacity Badges */}
                  <div className="grid grid-cols-3 gap-1.5 my-3 text-[11px] font-medium text-slate-600">
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{car.capacity} Seats</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{car.luggage} Bags</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200 truncate">
                      <Fuel className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="truncate">{car.fuel}</span>
                    </div>
                  </div>

                  {/* Description & Features */}
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {car.description}
                  </p>

                  <div className="space-y-1 mb-3 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    {car.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAndBook(car.id);
                  }}
                  className={`w-full py-2.5 px-4 rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                    isCurrentSelected
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Select & Book {car.title.split('/')[0]} (₹{car.fare})</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Assurance */}
        <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>All rides include 24x7 SOS, verified commercial driver partners & GPS tracking</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500">Pay via:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-700 border border-slate-200">
              UPI (GPay/PhonePe) • Cash • Card • Wallet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
