import React, { useState, useEffect } from 'react';
import { CourierVehicleOption, CourierVehicleType, LocationPoint } from '../types';
import { COURIER_OPTIONS } from '../data/mockData';
import { 
  Package, 
  X, 
  Weight, 
  Bike, 
  Truck, 
  Boxes, 
  Container, 
  ShieldCheck, 
  Clock, 
  User, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface CourierServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: LocationPoint;
  destination: LocationPoint | null;
  distanceKm: number;
  onBookCourier: (details: {
    weightKg: number;
    vehicleType: CourierVehicleType;
    packageType: string;
    receiverName: string;
    receiverPhone: string;
    deliveryInstructions: string;
    fare: number;
  }) => void;
}

export const CourierServiceModal: React.FC<CourierServiceModalProps> = ({
  isOpen,
  onClose,
  pickup,
  destination,
  distanceKm,
  onBookCourier,
}) => {
  const [weightKg, setWeightKg] = useState<number>(3.5);
  const [selectedVehicleType, setSelectedVehicleType] = useState<CourierVehicleType>('bike_express');
  const [packageType, setPackageType] = useState('Documents & Small Parcel');
  const [receiverName, setReceiverName] = useState('Sarah Jenkins');
  const [receiverPhone, setReceiverPhone] = useState('+91 98765 43210');
  const [deliveryInstructions, setDeliveryInstructions] = useState('Leave at front desk reception, call on arrival');

  // Automatic Vehicle Recommendation based on Weight
  useEffect(() => {
    if (weightKg <= 5) {
      setSelectedVehicleType('bike_express');
    } else if (weightKg <= 20) {
      setSelectedVehicleType('auto_cargo');
    } else if (weightKg <= 100) {
      setSelectedVehicleType('van_tempo');
    } else {
      setSelectedVehicleType('heavy_truck');
    }
  }, [weightKg]);

  if (!isOpen) return null;

  // Calculate fare for the selected vehicle option
  const activeVehicle = COURIER_OPTIONS.find((v) => v.type === selectedVehicleType) || COURIER_OPTIONS[0];
  const calculatedFare = Math.round(activeVehicle.baseFare + Math.max(1, distanceKm) * activeVehicle.ratePerKm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onBookCourier({
      weightKg,
      vehicleType: selectedVehicleType,
      packageType,
      receiverName,
      receiverPhone,
      deliveryInstructions,
      fare: calculatedFare,
    });
    onClose();
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-teal-100 border border-teal-300 text-teal-800 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900">RidePulse Express Courier</h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-bold border border-teal-200">
                Door-to-Door Delivery (₹ INR)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Mention the parcel weight below — our system automatically selects the ideal vehicle.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. MENTION WEIGHT OF PRODUCT */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-teal-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                <Weight className="w-4 h-4" />
                <span>1. Mention Item Weight (kg)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Current:</span>
                <span className="text-base font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                  {weightKg} kg
                </span>
              </div>
            </div>

            {/* Quick Weight Presets */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                { label: '0.5 kg (Doc)', val: 0.5 },
                { label: '2 kg (Small Box)', val: 2.0 },
                { label: '5 kg (Bag)', val: 5.0 },
                { label: '12 kg (Carton)', val: 12.0 },
                { label: '35 kg (Appliances)', val: 35.0 },
                { label: '150 kg (Heavy Bulk)', val: 150.0 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setWeightKg(preset.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                    weightKg === preset.val
                      ? 'bg-teal-600 text-white font-black shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Weight Slider */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-semibold">0.5 kg</span>
              <input
                id="courier-weight-range-slider"
                type="range"
                min="0.5"
                max="200"
                step="0.5"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="text-[10px] text-slate-500 font-semibold">200+ kg</span>
            </div>
          </div>

          {/* 2. AUTOMATICALLY PICKED & AVAILABLE VEHICLE OPTIONS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>2. System Recommended Vehicle</span>
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                Auto-assigned for {weightKg} kg
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COURIER_OPTIONS.map((veh) => {
                const isSelected = selectedVehicleType === veh.type;
                const isSystemPick = 
                  (weightKg <= 5 && veh.type === 'bike_express') ||
                  (weightKg > 5 && weightKg <= 20 && veh.type === 'auto_cargo') ||
                  (weightKg > 20 && weightKg <= 100 && veh.type === 'van_tempo') ||
                  (weightKg > 100 && veh.type === 'heavy_truck');

                const fare = Math.round(veh.baseFare + Math.max(1, distanceKm) * veh.ratePerKm);

                return (
                  <div
                    key={veh.type}
                    onClick={() => setSelectedVehicleType(veh.type)}
                    className={`cursor-pointer rounded-2xl p-3 border transition-all duration-200 flex items-start justify-between gap-3 relative ${
                      isSelected
                        ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/30 shadow-sm'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isSystemPick && (
                      <div className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-teal-600 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                        ★ Best Match
                      </div>
                    )}

                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {veh.type === 'bike_express' && <Bike className="w-5 h-5" />}
                        {veh.type === 'auto_cargo' && <Boxes className="w-5 h-5" />}
                        {veh.type === 'van_tempo' && <Truck className="w-5 h-5" />}
                        {veh.type === 'heavy_truck' && <Container className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{veh.name}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">{veh.description}</p>
                        <div className="text-[10px] text-teal-700 font-bold mt-1">
                          Max: {veh.maxWeightKg} kg • {veh.etaMins}m arrival
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-black text-slate-900">₹{fare}</div>
                      <div className="text-[9px] text-slate-400">Total Fare</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. RECIPIENT & DELIVERY DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Recipient Full Name
              </label>
              <input
                type="text"
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Receiver name"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Recipient Contact Phone
              </label>
              <input
                type="tel"
                required
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Delivery Notes / Instructions
            </label>
            <input
              type="text"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              placeholder="e.g. Ring bell, handle with care, leave at gate"
              className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Summary & Book Courier Button */}
          <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Courier Fare</div>
              <div className="text-lg font-black text-teal-700">₹{calculatedFare}</div>
            </div>

            <button
              id="confirm-courier-booking-btn"
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md shadow-teal-600/20 flex items-center gap-2 transition-transform active:scale-95"
            >
              <Package className="w-4 h-4" />
              <span>Book Courier ({activeVehicle.name} - ₹{calculatedFare})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
