import React, { useState } from 'react';
import { LocationPoint, RideType, ScheduledBooking, TripMode } from '../types';
import { 
  CalendarClock, 
  MapPin, 
  Clock, 
  Calendar, 
  Car, 
  Bike, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Trash2,
  X,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AdvanceBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: LocationPoint;
  destination: LocationPoint | null;
  scheduledList: ScheduledBooking[];
  onAddSchedule: (booking: ScheduledBooking) => void;
  onDeleteSchedule: (id: string) => void;
}

export const AdvanceBookingModal: React.FC<AdvanceBookingModalProps> = ({
  isOpen,
  onClose,
  pickup,
  destination,
  scheduledList,
  onAddSchedule,
  onDeleteSchedule,
}) => {
  const [selectedRideType, setSelectedRideType] = useState<RideType>('cab');
  const [tripMode, setTripMode] = useState<TripMode>('direct');
  const [scheduledDate, setScheduledDate] = useState('2026-09-21');
  const [scheduledTime, setScheduledTime] = useState('08:30');
  const [notes, setNotes] = useState('Airport departure flight boarding at 11:00 AM');

  if (!isOpen) return null;

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const baseFare = selectedRideType === 'bike' ? 65 : selectedRideType === 'auto' ? 95 : 220;
    const finalFare = tripMode === 'round_trip' ? Math.round(baseFare * 1.85) : baseFare;

    const destPoint = destination || {
      id: 'loc_dest_def',
      name: 'International Airport (T3)',
      address: 'Terminal 3 departure boulevard',
      lat: 82,
      lng: 88,
    };

    const newScheduled: ScheduledBooking = {
      id: `sched_${Date.now()}`,
      rideType: selectedRideType,
      tripMode,
      roundTripDetails: tripMode === 'round_trip' ? {
        returnWaitMinutes: 45,
        returnPickup: destPoint,
        returnDestination: pickup,
        returnFareDiscount: 15,
        currentLeg: 1,
      } : undefined,
      pickup,
      destination: destPoint,
      scheduledDate,
      scheduledTime,
      estimatedFare: finalFare,
      status: 'Confirmed',
    };

    onAddSchedule(newScheduled);
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-3.5 border-b border-slate-100 pb-2.5">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300 shadow-2xs flex-shrink-0">
            <CalendarClock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Customer Advance Ride Booking</h3>
          </div>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
          {/* Pick Locations Overview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">From:</span>
              <strong className="text-slate-900 truncate">{pickup.name}</strong>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span className="text-slate-500">To:</span>
              <strong className="text-slate-900 truncate">
                {destination ? destination.name : 'International Airport (T3 Departure)'}
              </strong>
            </div>
          </div>

          {/* Date & Time Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Select Date
              </label>
              <input
                type="date"
                required
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Pickup Time
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Vehicle Type Choice */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Choose Advance Vehicle Type:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'bike' as RideType, label: 'Bike Ride', fare: '₹65', icon: <Bike className="w-4 h-4" /> },
                { type: 'auto' as RideType, label: 'Auto Ride', fare: '₹95', icon: <Car className="w-4 h-4" /> },
                { type: 'cab' as RideType, label: 'Cab Prime', fare: '₹220', icon: <Car className="w-4 h-4" /> },
              ].map((v) => (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => setSelectedRideType(v.type)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                    selectedRideType === v.type
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {v.icon}
                  <span className="text-xs font-bold">{v.label}</span>
                  <span className="text-[10px] text-slate-500">Est. {v.fare}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Advance Reservation</span>
          </button>
        </form>

        {/* Existing Scheduled Rides List */}
        {scheduledList.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Your Upcoming Scheduled Rides ({scheduledList.length})
            </h4>
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
              {scheduledList.map((sched) => (
                <div
                  key={sched.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="capitalize text-emerald-700">{sched.rideType} Ride</span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                        {sched.scheduledDate} at {sched.scheduledTime}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5 font-medium">
                      {sched.pickup.name} ➔ {sched.destination.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-black text-emerald-700 text-sm">₹{sched.estimatedFare}</span>
                    <button
                      onClick={() => onDeleteSchedule(sched.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 transition-colors"
                      title="Cancel schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
