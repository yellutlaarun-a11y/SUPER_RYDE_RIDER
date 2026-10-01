import React, { useState } from 'react';
import { CarpoolRide, LocationPoint } from '../types';
import { INITIAL_CARPOOLS } from '../data/mockData';
import { 
  Users, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Car, 
  PlusCircle, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Sparkles, 
  CheckCircle2,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CarpoolingViewProps {
  pickup: LocationPoint;
  destination: LocationPoint | null;
  onBack: () => void;
  onBookCarpool: (carpool: CarpoolRide, passengers: number, totalFare: number) => void;
}

export const CarpoolingView: React.FC<CarpoolingViewProps> = ({
  pickup,
  destination,
  onBack,
  onBookCarpool,
}) => {
  const [carpools, setCarpools] = useState<CarpoolRide[]>(INITIAL_CARPOOLS);
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [selectedCarpool, setSelectedCarpool] = useState<CarpoolRide | null>(null);

  // New Carpool Registration Form State
  const [regHostName, setRegHostName] = useState('');
  const [regCarModel, setRegCarModel] = useState('');
  const [regPlate, setRegPlate] = useState('');
  const [regSeats, setRegSeats] = useState(3);
  const [regFare, setRegFare] = useState(60);
  const [regDepTime, setRegDepTime] = useState('In 20 mins');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regHostName || !regCarModel || !regPlate) return;

    const newRide: CarpoolRide = {
      id: `cp_reg_${Date.now()}`,
      hostName: regHostName,
      hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      hostRating: 5.0,
      vehicleModel: regCarModel,
      vehiclePlate: regPlate,
      vehicleColor: 'Silver Metallic',
      origin: pickup.name,
      destination: destination ? destination.name : 'Cyber Heights Tech Park',
      departureTime: regDepTime,
      totalSeats: regSeats,
      availableSeats: regSeats,
      baseFarePerSeat: regFare,
      features: ['AC On', 'Verified Commuter', 'Music On Demand'],
      instantBooking: true,
    };

    setCarpools([newRide, ...carpools]);
    setIsRegisterModalOpen(false);
    
    // Clear form
    setRegHostName('');
    setRegCarModel('');
    setRegPlate('');

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
  };

  const handleConfirmBook = (ride: CarpoolRide) => {
    const totalFare = ride.baseFarePerSeat * passengerCount;
    onBookCarpool(ride, passengerCount, totalFare);
  };

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 flex flex-col pb-24 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30 shadow-sm backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <span>RidePulse Carpooling</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Eco-Friendly (₹ INR)
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">Share rides with verified commuters & split the per-head fare</p>
            </div>
          </div>

          {/* Vehicle Registration Button */}
          <button
            id="register-vehicle-carpooling-btn"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Register Vehicle for Pooling</span>
            <span className="sm:hidden">Offer Ride</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        {/* Route Banner & Passenger Count Stepper */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold text-slate-900 truncate">{pickup.name}</span>
              <span>➔</span>
              <span className="font-bold text-rose-600 truncate">{destination ? destination.name : 'Select Destination'}</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Listing verified carpool drivers traveling along this corridor with transparent Indian Rupee (₹) pricing.
            </div>
          </div>

          {/* PERSONS ADDING / PASSENGER SEAT SELECTOR (+ and - ICONS) */}
          <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 w-full md:w-auto justify-between">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Passengers
              </span>
              <span className="text-xs font-bold text-slate-800">
                {passengerCount} {passengerCount === 1 ? 'Seat' : 'Seats'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="carpool-minus-passenger-btn"
                onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                disabled={passengerCount <= 1}
                className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 text-slate-800 flex items-center justify-center font-bold text-base transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>

              <span className="w-6 text-center font-black text-sm text-emerald-700">
                {passengerCount}
              </span>

              <button
                id="carpool-plus-passenger-btn"
                onClick={() => setPassengerCount(Math.min(4, passengerCount + 1))}
                disabled={passengerCount >= 4}
                className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center font-bold text-base transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Available Carpools List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Available Carpools ({carpools.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Showing rides matching your corridor
            </span>
          </div>

          <div className="flex flex-col gap-3.5">
            {carpools.map((ride) => {
              const perHead = ride.baseFarePerSeat;
              const totalForSelectedPassengers = perHead * passengerCount;
              const hasEnoughSeats = ride.availableSeats >= passengerCount;

              return (
                <div
                  key={ride.id}
                  className={`bg-white border rounded-2xl p-4 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                    hasEnoughSeats 
                      ? 'border-slate-200 hover:border-emerald-400 hover:shadow-md' 
                      : 'border-slate-200/50 opacity-60'
                  }`}
                >
                  {/* Host and Vehicle Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <img
                      src={ride.hostAvatar}
                      alt={ride.hostName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-300 shadow-sm flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{ride.hostName}</h4>
                        <div className="flex items-center gap-0.5 text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.2 rounded border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{ride.hostRating}</span>
                        </div>
                        {ride.instantBooking && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                            ⚡ Instant
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-slate-500" />
                        <span>{ride.vehicleModel}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{ride.vehiclePlate}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Clock className="w-3 h-3" />
                          {ride.departureTime}
                        </span>
                        <span>•</span>
                        <span className="text-sky-700 font-bold">
                          {ride.availableSeats} of {ride.totalSeats} seats open
                        </span>
                      </div>

                      {/* Feature tags */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {ride.features.map((f, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Pricing and Booking Button */}
                  <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 gap-3">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-slate-500">Per Head Fare</div>
                      <div className="text-lg font-black text-emerald-700">
                        ₹{perHead} <span className="text-xs text-slate-500 font-normal">/ person</span>
                      </div>
                      {passengerCount > 1 && (
                        <div className="text-xs font-bold text-slate-800">
                          Total ({passengerCount} seats): <span className="text-emerald-700 font-black">₹{totalForSelectedPassengers}</span>
                        </div>
                      )}
                    </div>

                    <button
                      id={`book-carpool-btn-${ride.id}`}
                      onClick={() => handleConfirmBook(ride)}
                      disabled={!hasEnoughSeats}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap ${
                        hasEnoughSeats
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{hasEnoughSeats ? `Book ${passengerCount} Seat${passengerCount > 1 ? 's' : ''} (₹${totalForSelectedPassengers})` : 'Not Enough Seats'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL: REGISTER VEHICLE FOR CARPOOLING */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Register Vehicle for Carpooling</h3>
                <p className="text-xs text-slate-500 font-medium">Offer your empty car seats to commuters & earn daily in ₹</p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={regHostName}
                  onChange={(e) => setRegHostName(e.target.value)}
                  placeholder="e.g. Vikram Mehta"
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Car Model & Color</label>
                  <input
                    type="text"
                    required
                    value={regCarModel}
                    onChange={(e) => setRegCarModel(e.target.value)}
                    placeholder="e.g. Honda City (White)"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">License Plate No.</label>
                  <input
                    type="text"
                    required
                    value={regPlate}
                    onChange={(e) => setRegPlate(e.target.value)}
                    placeholder="e.g. KA 05 MN 4821"
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Available Seats</label>
                  <select
                    value={regSeats}
                    onChange={(e) => setRegSeats(Number(e.target.value))}
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>1 Seat</option>
                    <option value={2}>2 Seats</option>
                    <option value={3}>3 Seats</option>
                    <option value={4}>4 Seats</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Fare / Person (₹)</label>
                  <input
                    type="number"
                    step="5"
                    min="20"
                    value={regFare}
                    onChange={(e) => setRegFare(Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Departure</label>
                  <input
                    type="text"
                    value={regDepTime}
                    onChange={(e) => setRegDepTime(e.target.value)}
                    placeholder="e.g. In 15 mins"
                    className="w-full mt-1 px-2.5 py-2 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20"
                >
                  Publish Carpool Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
