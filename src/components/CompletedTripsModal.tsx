import React, { useState, useEffect, useMemo } from 'react';
import { ActiveBooking, LocationPoint, RideType } from '../types';
import { 
  X, 
  Car, 
  Bike, 
  Package, 
  Users, 
  Navigation, 
  MapPin, 
  Clock, 
  IndianRupee, 
  Calendar, 
  Receipt, 
  Download, 
  RotateCw, 
  Star, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  TrendingUp,
  FileText,
  Milestone,
  ArrowRight,
  Filter,
  Check,
  Share2
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { subscribeToCompletedTrips } from '../services/firebaseDb';

export interface CompletedTripRecord {
  id: string;
  bookingCode: string;
  rideType: RideType;
  cabCategory?: string;
  date: string;
  time: string;
  timestamp: string;
  pickup: LocationPoint;
  destination: LocationPoint;
  stops?: LocationPoint[];
  fare: number;
  baseFare: number;
  taxesAndFees: number;
  discount: number;
  durationMins: number;
  distanceKm: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'RidePulse Wallet';
  paymentStatus: 'Paid' | 'Settled';
  captain: {
    name: string;
    phone: string;
    rating: number;
    photo: string;
    vehicleModel: string;
    vehicleNumber: string;
    vehicleColor: string;
  };
  tripMode?: 'direct' | 'round_trip';
  ratingGiven?: number;
}

interface CompletedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedBooking: ActiveBooking | null;
  onRebookRoute?: (pickup: LocationPoint, destination: LocationPoint, rideType: RideType) => void;
}

// Initial default trips if storage is fresh
const SEED_COMPLETED_TRIPS: CompletedTripRecord[] = [
  {
    id: 'trip_seed_1',
    bookingCode: 'RP-8924',
    rideType: 'cab',
    cabCategory: 'sedan',
    date: '22 Sep 2026',
    time: '02:30 AM',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    pickup: {
      id: 'p_1',
      name: 'Cyber Heights Tech Park',
      address: 'Outer Ring Road, Phase 2, Hitech Zone',
      lat: 15.4985,
      lng: 80.0573,
    },
    destination: {
      id: 'd_1',
      name: 'Grand Horizon Luxury Hotel',
      address: 'Avenue 4, Residency Road, Central District',
      lat: 15.512,
      lng: 80.045,
    },
    fare: 285,
    baseFare: 240,
    taxesAndFees: 45,
    discount: 0,
    durationMins: 22,
    distanceKm: 8.4,
    paymentMethod: 'RidePulse Wallet',
    paymentStatus: 'Paid',
    captain: {
      name: 'Ramesh Kumar',
      phone: '+91 98450 12345',
      rating: 4.95,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      vehicleModel: 'Toyota Etios (White)',
      vehicleNumber: 'AP 27 CZ 4920',
      vehicleColor: 'Pearl White',
    },
    tripMode: 'direct',
    ratingGiven: 5,
  },
  {
    id: 'trip_seed_2',
    bookingCode: 'RP-7411',
    rideType: 'bike',
    date: '21 Sep 2026',
    time: '06:15 PM',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    pickup: {
      id: 'p_2',
      name: 'Metro Terminal Station',
      address: 'North Concourse Gate 2, Station Blvd',
      lat: 15.501,
      lng: 80.052,
    },
    destination: {
      id: 'd_2',
      name: 'Phoenix Marketcity Mall',
      address: 'Food Court Gate 4, Main Highway',
      lat: 15.485,
      lng: 80.065,
    },
    fare: 78,
    baseFare: 68,
    taxesAndFees: 10,
    discount: 0,
    durationMins: 11,
    distanceKm: 3.8,
    paymentMethod: 'UPI',
    paymentStatus: 'Paid',
    captain: {
      name: 'Suresh Babu',
      phone: '+91 94401 88231',
      rating: 4.88,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      vehicleModel: 'Honda Activa 6G',
      vehicleNumber: 'AP 27 BK 1902',
      vehicleColor: 'Midnight Blue',
    },
    tripMode: 'direct',
    ratingGiven: 5,
  },
  {
    id: 'trip_seed_3',
    bookingCode: 'RP-6109',
    rideType: 'cab',
    cabCategory: 'suv',
    date: '19 Sep 2026',
    time: '11:40 AM',
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    pickup: {
      id: 'p_3',
      name: 'Apollo Super Specialty Hospital',
      address: 'Main Entrance OPD, Health City',
      lat: 15.515,
      lng: 80.048,
    },
    destination: {
      id: 'd_3',
      name: 'Kurnool Bypass Airport Shuttle Hub',
      address: 'Terminal Approach Rd, Airport Link',
      lat: 15.472,
      lng: 80.082,
    },
    fare: 540,
    baseFare: 470,
    taxesAndFees: 70,
    discount: 0,
    durationMins: 38,
    distanceKm: 16.2,
    paymentMethod: 'Card',
    paymentStatus: 'Paid',
    captain: {
      name: 'Venkat Rao',
      phone: '+91 99887 66554',
      rating: 4.92,
      photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      vehicleModel: 'Maruti Ertiga Hybrid',
      vehicleNumber: 'AP 27 EX 8810',
      vehicleColor: 'Silky Silver',
    },
    tripMode: 'round_trip',
    ratingGiven: 5,
  },
];

export const CompletedTripsModal: React.FC<CompletedTripsModalProps> = ({
  isOpen,
  onClose,
  completedBooking,
  onRebookRoute,
}) => {
  const [trips, setTrips] = useState<CompletedTripRecord[]>(() => {
    try {
      const stored = localStorage.getItem('ridepulse_completed_trips_list');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored completed trips:', e);
    }
    return SEED_COMPLETED_TRIPS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'cab' | 'bike' | 'auto' | 'courier' | 'self_drive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTripForReceipt, setSelectedTripForReceipt] = useState<CompletedTripRecord | null>(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  // Subscribe to real-time trips from Firestore for logged-in user
  useEffect(() => {
    if (!isOpen) return;
    const userId = auth.currentUser?.uid || 'usr_default';
    const unsubscribe = subscribeToCompletedTrips(userId, (firestoreTrips) => {
      if (firestoreTrips && firestoreTrips.length > 0) {
        setTrips((prev) => {
          // Merge Firestore trips with local seeds without duplicating IDs
          const existingIds = new Set(firestoreTrips.map((t) => t.id));
          const localOnly = prev.filter((t) => !existingIds.has(t.id));
          const combined = [...firestoreTrips as unknown as CompletedTripRecord[], ...localOnly];
          try {
            localStorage.setItem('ridepulse_completed_trips_list', JSON.stringify(combined));
          } catch {}
          return combined;
        });
      }
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Sync when completedBooking changes
  useEffect(() => {
    if (!completedBooking) return;

    // Check if this booking is already in the trips list
    setTrips((prevTrips) => {
      const alreadyExists = prevTrips.some(
        (t) => t.bookingCode === completedBooking.bookingCode || t.id === completedBooking.id
      );

      if (alreadyExists) return prevTrips;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const formattedTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const baseFare = Math.round(completedBooking.fare * 0.85);
      const taxesAndFees = Math.round(completedBooking.fare * 0.15);

      const newRecord: CompletedTripRecord = {
        id: completedBooking.id || `trip_${Date.now()}`,
        bookingCode: completedBooking.bookingCode || `RP-${Math.floor(1000 + Math.random() * 9000)}`,
        rideType: completedBooking.rideType || 'cab',
        cabCategory: completedBooking.cabCategory,
        date: formattedDate,
        time: formattedTime,
        timestamp: now.toISOString(),
        pickup: completedBooking.pickup,
        destination: completedBooking.destination,
        fare: completedBooking.fare,
        baseFare,
        taxesAndFees,
        discount: 0,
        durationMins: completedBooking.durationMins || Math.max(8, Math.round(completedBooking.distanceKm * 2.4)),
        distanceKm: completedBooking.distanceKm,
        paymentMethod: completedBooking.paymentMethod || 'RidePulse Wallet',
        paymentStatus: 'Paid',
        captain: {
          name: completedBooking.captain?.name || 'Captain Assigned',
          phone: completedBooking.captain?.phone || '+91 98000 00000',
          rating: completedBooking.captain?.rating || 4.9,
          photo: completedBooking.captain?.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          vehicleModel: completedBooking.captain?.vehicleModel || 'Standard Cab',
          vehicleNumber: completedBooking.captain?.vehicleNumber || 'AP 27 RIDE 01',
          vehicleColor: completedBooking.captain?.vehicleColor || 'Silver',
        },
        tripMode: completedBooking.tripMode,
        ratingGiven: 5,
      };

      const updated = [newRecord, ...prevTrips];
      try {
        localStorage.setItem('ridepulse_completed_trips_list', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [completedBooking]);

  // Persist whenever trips state updates
  const handlePersistTrips = (updated: CompletedTripRecord[]) => {
    setTrips(updated);
    try {
      localStorage.setItem('ridepulse_completed_trips_list', JSON.stringify(updated));
    } catch {}
  };

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Category filter
      if (activeFilter !== 'all' && trip.rideType !== activeFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPickup = trip.pickup.name.toLowerCase().includes(query) || trip.pickup.address.toLowerCase().includes(query);
        const matchesDest = trip.destination.name.toLowerCase().includes(query) || trip.destination.address.toLowerCase().includes(query);
        const matchesCaptain = trip.captain.name.toLowerCase().includes(query) || trip.captain.vehicleNumber.toLowerCase().includes(query);
        const matchesCode = trip.bookingCode.toLowerCase().includes(query);
        return matchesPickup || matchesDest || matchesCaptain || matchesCode;
      }

      return true;
    });
  }, [trips, activeFilter, searchQuery]);

  // Statistics Summary
  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalFare = trips.reduce((sum, t) => sum + t.fare, 0);
    const totalDistance = trips.reduce((sum, t) => sum + t.distanceKm, 0);
    const totalDuration = trips.reduce((sum, t) => sum + t.durationMins, 0);
    return {
      totalTrips,
      totalFare,
      totalDistance: totalDistance.toFixed(1),
      totalDuration,
    };
  }, [trips]);

  const handleCopyInvoice = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedInvoiceId(code);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const handleDownloadInvoice = (trip: CompletedTripRecord) => {
    const invoiceContent = `
========================================
         RIDEPULSE TRIP RECEIPT
========================================
Booking Code: ${trip.bookingCode}
Date & Time: ${trip.date} at ${trip.time}
Status: Completed (${trip.paymentStatus})
----------------------------------------
RIDE DETAILS:
Vehicle: ${trip.rideType.toUpperCase()} ${trip.cabCategory ? `(${trip.cabCategory})` : ''}
Captain: ${trip.captain.name}
Vehicle No: ${trip.captain.vehicleNumber}
Model: ${trip.captain.vehicleModel}
----------------------------------------
ROUTE:
From: ${trip.pickup.name}
      ${trip.pickup.address}
To:   ${trip.destination.name}
      ${trip.destination.address}
Distance: ${trip.distanceKm} km
Duration: ${trip.durationMins} mins
----------------------------------------
FARE BREAKDOWN:
Base Fare:        Rs. ${trip.baseFare}.00
Taxes & Fees:     Rs. ${trip.taxesAndFees}.00
Discount:        -Rs. ${trip.discount}.00
----------------------------------------
TOTAL PAID:       Rs. ${trip.fare}.00
Payment Method:   ${trip.paymentMethod}
========================================
Thank you for riding with RidePulse!
Support: help@ridepulse.in | +91 1800 120 4040
========================================
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RidePulse_Receipt_${trip.bookingCode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn select-none">
      <div 
        id="completed-trips-modal-container"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">Completed Trips & Receipts</h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {trips.length} {trips.length === 1 ? 'Trip' : 'Trips'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Detailed history, itemized fares, and download receipts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close trips modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* METRICS SUMMARY BANNER */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border-b border-slate-200 text-center flex-shrink-0">
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Spent</span>
            <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">₹{stats.totalFare}</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Trips Done</span>
            <span className="text-xs sm:text-sm font-black text-slate-800 font-mono">{stats.totalTrips}</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Distance</span>
            <span className="text-xs sm:text-sm font-black text-indigo-700 font-mono">{stats.totalDistance} km</span>
          </div>
          <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Time Saved</span>
            <span className="text-xs sm:text-sm font-black text-amber-700 font-mono">{stats.totalDuration} m</span>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-2 items-center justify-between bg-white flex-shrink-0">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by location, captain, code..."
              className="w-full text-xs font-semibold pl-8 pr-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'All Trips' },
              { id: 'cab', label: 'Cabs' },
              { id: 'bike', label: 'Bike' },
              { id: 'auto', label: 'Auto' },
              { id: 'courier', label: 'Courier' },
              { id: 'self_drive', label: 'Self Drive' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* TRIP LIST CONTENT */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3">
          {filteredTrips.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No completed trips found</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {searchQuery ? 'No trips match your search query.' : 'Complete your first ride to view receipt and trip logs here.'}
              </p>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              return (
                <div
                  key={trip.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all group flex flex-col gap-3"
                >
                  {/* Trip Card Top Row: Date, Vehicle Type, Booking Code & Fare */}
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {trip.rideType === 'bike' ? <Bike className="w-4 h-4 text-amber-300" /> :
                         trip.rideType === 'auto' ? <Navigation className="w-4 h-4 text-emerald-300" /> :
                         trip.rideType === 'courier' ? <Package className="w-4 h-4 text-sky-300" /> :
                         trip.rideType === 'carpooling' ? <Users className="w-4 h-4 text-teal-300" /> :
                         <Car className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900 capitalize">
                            {trip.rideType} {trip.cabCategory ? `• ${trip.cabCategory}` : ''}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {trip.bookingCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {trip.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {trip.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Fare & Status Badge */}
                    <div className="text-right">
                      <div className="text-sm sm:text-base font-black text-emerald-700 font-mono leading-none">
                        ₹{trip.fare}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full mt-1 inline-flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        {trip.paymentStatus} via {trip.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {/* Route Timeline */}
                  <div className="flex flex-col gap-2 relative pl-6 border-l-2 border-dashed border-slate-200 ml-3 py-0.5">
                    {/* Pickup Point */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100" />
                      <p className="text-xs font-bold text-slate-900 leading-snug">{trip.pickup.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{trip.pickup.address}</p>
                    </div>

                    {/* Intermediate stops if any */}
                    {trip.stops && trip.stops.length > 0 && trip.stops.map((stop, sIdx) => (
                      <div key={stop.id || sIdx} className="relative pt-1">
                        <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-100" />
                        <p className="text-xs font-semibold text-amber-900 leading-snug">Stop {sIdx + 1}: {stop.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{stop.address}</p>
                      </div>
                    ))}

                    {/* Destination Point */}
                    <div className="relative pt-1">
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100" />
                      <p className="text-xs font-bold text-slate-900 leading-snug">{trip.destination.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{trip.destination.address}</p>
                    </div>
                  </div>

                  {/* Driver & Trip Specs Footer */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60 p-2.5 rounded-xl">
                    {/* Driver info */}
                    <div className="flex items-center gap-2">
                      <img 
                        src={trip.captain.photo} 
                        alt={trip.captain.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-bold text-slate-800">{trip.captain.name}</span>
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                            ★{trip.captain.rating}
                          </span>
                        </div>
                        <p className="text-[9.5px] text-slate-500 font-mono">
                          {trip.captain.vehicleNumber} • {trip.captain.vehicleModel}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedTripForReceipt(trip)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                        title="View itemized fare receipt"
                      >
                        <Receipt className="w-3 h-3 text-slate-500" />
                        <span>Receipt</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(trip)}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
                        title="Download text receipt"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      {onRebookRoute && (
                        <button
                          type="button"
                          onClick={() => {
                            onRebookRoute(trip.pickup, trip.destination, trip.rideType);
                            onClose();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          title="Rebook this exact route"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Rebook</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ITEMIZED RECEIPT MODAL OVERLAY */}
        {selectedTripForReceipt && (
          <div className="absolute inset-0 z-20 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col gap-3">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">RidePulse Tax Invoice</h3>
                    <p className="text-[10px] text-slate-500 font-mono">Invoice #{selectedTripForReceipt.bookingCode}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTripForReceipt(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Receipt Summary Details */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Date & Time</span>
                  <span className="font-bold text-slate-800">{selectedTripForReceipt.date} • {selectedTripForReceipt.time}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Vehicle & Captain</span>
                  <span className="font-bold text-slate-800">{selectedTripForReceipt.captain.name} ({selectedTripForReceipt.captain.vehicleNumber})</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Total Distance & Time</span>
                  <span className="font-bold text-slate-800">{selectedTripForReceipt.distanceKm} km • {selectedTripForReceipt.durationMins} mins</span>
                </div>
              </div>

              {/* Itemized Fare Breakdown Table */}
              <div className="flex flex-col gap-1.5 py-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Fare ({selectedTripForReceipt.rideType.toUpperCase()})</span>
                  <span className="font-mono font-semibold">₹{selectedTripForReceipt.baseFare}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Distance & Time Surcharge</span>
                  <span className="font-mono font-semibold">₹{(selectedTripForReceipt.taxesAndFees * 0.6).toFixed(0)}.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST + SGST (5%)</span>
                  <span className="font-mono font-semibold">₹{(selectedTripForReceipt.taxesAndFees * 0.4).toFixed(0)}.00</span>
                </div>
                {selectedTripForReceipt.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Promotional Discount</span>
                    <span className="font-mono">-₹{selectedTripForReceipt.discount}.00</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="font-extrabold text-slate-900 text-sm">Total Paid</span>
                  <span className="font-black text-emerald-700 text-base font-mono">₹{selectedTripForReceipt.fare}.00</span>
                </div>
                <p className="text-[10px] text-slate-400 text-right">Paid securely via {selectedTripForReceipt.paymentMethod}</p>
              </div>

              {/* Receipt Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyInvoice(selectedTripForReceipt.bookingCode)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedInvoiceId === selectedTripForReceipt.bookingCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Code</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-slate-600" />
                      <span>Copy Invoice Code</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedTripForReceipt)}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
