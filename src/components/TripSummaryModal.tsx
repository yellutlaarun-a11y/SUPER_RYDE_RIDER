import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveBooking } from '../types';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Route, 
  Leaf, 
  Zap, 
  Star, 
  Share2, 
  Download, 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Bike, 
  ThumbsUp, 
  Heart,
  TrendingDown,
  Award,
  Coins,
  Percent,
  Smile,
  Meh,
  Frown,
  Check,
  Send,
  X,
  CreditCard,
  Wallet,
  Banknote,
  QrCode,
  Smartphone,
  Lock,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import confetti from 'canvas-confetti';

interface TripSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: ActiveBooking | null;
  onRateCaptain?: (rating: number, feedback: string[]) => void;
  onTipAdded?: (tipAmount: number, totalFare: number) => void;
  walletBalance?: number;
  onPaymentSettled?: (method: 'Cash' | 'Card' | 'RidePulse Wallet' | 'UPI', totalAmount: number) => void;
}

export const TripSummaryModal: React.FC<TripSummaryModalProps> = ({
  isOpen,
  onClose,
  booking,
  onRateCaptain,
  onTipAdded,
  walletBalance = 850,
  onPaymentSettled,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Smooth Driving', 'Polite Captain']);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [isCustomTipActive, setIsCustomTipActive] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>('');
  const [tipConfirmedMessage, setTipConfirmedMessage] = useState<string | null>(null);
  const [isRatingSubmitted, setIsRatingSubmitted] = useState<boolean>(false);
  const [customComment, setCustomComment] = useState<string>('');
  const [showCommentInput, setShowCommentInput] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState(false);

  // Payment Options State
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'Cash' | 'Card' | 'RidePulse Wallet' | 'UPI'>('RidePulse Wallet');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'other_upi'>('gpay');
  const [customUpiId, setCustomUpiId] = useState<string>('');
  const [isPaymentSettled, setIsPaymentSettled] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [settlementTxnId, setSettlementTxnId] = useState<string>(() => `RP-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
  const [paymentTimestamp, setPaymentTimestamp] = useState<string>('Just now');

  useEffect(() => {
    if (booking?.paymentMethod) {
      setSelectedPaymentMethod(booking.paymentMethod);
    }
  }, [booking?.paymentMethod]);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#34D399', '#6EE7B7', '#F59E0B'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const distanceKm = booking.distanceKm || 5.2;
  const durationMins = booking.durationMins || 15;

  // Calculate Time Saved compared to average peak city traffic (estimated 35-50% slower in unoptimized private traffic)
  const averageTrafficDuration = Math.round(durationMins * 1.45);
  const timeSavedMins = Math.max(3, averageTrafficDuration - durationMins);

  // Calculate Carbon Emissions Savings Stat (g of CO2 saved compared to average single-occupancy petrol car ~170g CO2/km)
  const computeCarbonSavings = () => {
    let factorPerKm = 85; // baseline EV / efficient fleet savings
    if (booking.rideType === 'bike') factorPerKm = 110;
    else if (booking.rideType === 'auto') factorPerKm = 95;
    else if (booking.rideType === 'carpooling') factorPerKm = 140;
    else if (booking.captain?.vehicleModel?.toLowerCase().includes('ev')) factorPerKm = 160;

    const gramsSaved = Math.round(distanceKm * factorPerKm);
    if (gramsSaved >= 1000) {
      return `${(gramsSaved / 1000).toFixed(2)} kg`;
    }
    return `${gramsSaved} g`;
  };

  const carbonSaved = computeCarbonSavings();
  const treesEquivalent = ((distanceKm * 0.09) / 2).toFixed(1);

  // Market Fare Comparison & Breakdown Calculations
  const actualFare = Number(booking.fare) || 120;
  const totalFareWithTip = actualFare + (Number(tipAmount) || 0);
  const standardMarketFare = Math.round(actualFare * 1.28);
  const peakSurgeFare = Math.round(actualFare * 1.55);
  const totalSavings = Math.max(15, standardMarketFare - actualFare);
  const percentSaved = Math.round((totalSavings / standardMarketFare) * 100);

  const fareComparisonData = [
    {
      name: 'RidePulse',
      label: 'RidePulse (Fare)',
      fare: actualFare,
      fill: '#059669',
      highlight: true,
    },
    {
      name: 'Market Avg',
      label: 'Standard Market',
      fare: standardMarketFare,
      fill: '#94A3B8',
      highlight: false,
    },
    {
      name: 'Peak / Surge',
      label: 'Surge Rates',
      fare: peakSurgeFare,
      fill: '#F59E0B',
      highlight: false,
    },
  ];

  // Specific Fare Breakdown Components
  const baseFarePart = Math.max(25, Math.round(actualFare * 0.45));
  const distanceFarePart = Math.max(20, Math.round(actualFare * 0.37));
  const taxesAndTollsPart = Math.max(5, actualFare - baseFarePart - distanceFarePart);

  const feedbackTags = [
    'Smooth Driving',
    'Polite Captain',
    'Clean Vehicle',
    'AC Working Well',
    'On-Time Arrival',
    'Safe Route',
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSelectPresetTip = (amount: number) => {
    setIsCustomTipActive(false);
    setTipAmount(amount);
    setCustomTipInput('');
    if (amount > 0) {
      setTipConfirmedMessage(`₹${amount} tip added for Captain ${booking.captain.name}!`);
      try {
        confetti({
          particleCount: 45,
          spread: 50,
          origin: { y: 0.65 },
          colors: ['#F59E0B', '#10B981', '#EC4899', '#3B82F6'],
        });
      } catch {}
    } else {
      setTipConfirmedMessage(null);
    }
    if (onTipAdded) {
      onTipAdded(amount, actualFare + amount);
    }
  };

  const handleCustomTipChange = (value: string) => {
    const numericStr = value.replace(/\D/g, '');
    setCustomTipInput(numericStr);
    const parsed = parseInt(numericStr, 10);
    const validAmount = !isNaN(parsed) && parsed > 0 ? Math.min(parsed, 5000) : 0;
    setTipAmount(validAmount);
    if (validAmount > 0) {
      setTipConfirmedMessage(`Custom tip of ₹${validAmount} added for Captain ${booking.captain.name}!`);
    } else {
      setTipConfirmedMessage(null);
    }
    if (onTipAdded) {
      onTipAdded(validAmount, actualFare + validAmount);
    }
  };

  const handleAddCustomDelta = (delta: number) => {
    const current = tipAmount || 0;
    const nextVal = Math.min(current + delta, 5000);
    setTipAmount(nextVal);
    setCustomTipInput(nextVal.toString());
    setTipConfirmedMessage(`₹${nextVal} tip added for Captain ${booking.captain.name}!`);
    try {
      confetti({
        particleCount: 35,
        spread: 45,
        origin: { y: 0.65 },
        colors: ['#F59E0B', '#10B981', '#EC4899'],
      });
    } catch {}
    if (onTipAdded) {
      onTipAdded(nextVal, actualFare + nextVal);
    }
  };

  const handleSelectPaymentMethod = (method: 'Cash' | 'Card' | 'RidePulse Wallet' | 'UPI') => {
    setSelectedPaymentMethod(method);
  };

  const handleSettlePayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentSettled(true);
      const newTxn = `RP-TXN-${Math.floor(100000 + Math.random() * 900000)}`;
      setSettlementTxnId(newTxn);
      setPaymentTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#3B82F6', '#F59E0B'],
        });
      } catch {}

      if (onPaymentSettled) {
        onPaymentSettled(selectedPaymentMethod, totalFareWithTip);
      }
    }, 600);
  };

  const handleDone = () => {
    if (onPaymentSettled && isPaymentSettled) {
      onPaymentSettled(selectedPaymentMethod, totalFareWithTip);
    }
    if (onRateCaptain) {
      onRateCaptain(rating, [
        ...selectedTags,
        ...(tipAmount > 0 ? [`Tipped ₹${tipAmount}`] : []),
        ...(customComment ? [customComment] : []),
      ]);
    }
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-lg bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header Banner with Emerald Gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between overflow-hidden">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

          <div className="relative flex items-center gap-3 z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-inner">
              <CheckCircle2 className="w-7 h-7 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">Trip Completed!</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 text-[10px] font-bold border border-emerald-400/30">
                  {booking.bookingCode}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">Thank you for riding with RidePulse</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* 1. KEY TRIP HIGHLIGHTS CARDS (Distance, Time Saved, Eco Carbon Savings) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            
            {/* Total Distance */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Distance</span>
                <Route className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-slate-900 leading-none">
                  {distanceKm} <span className="text-xs font-semibold text-slate-500">km</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1 font-medium truncate">{durationMins} mins total</p>
              </div>
            </div>

            {/* Time Saved */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Time Saved</span>
                <Zap className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-amber-900 leading-none">
                  {timeSavedMins} <span className="text-xs font-semibold text-amber-700">mins</span>
                </p>
                <p className="text-[10px] text-amber-700/90 mt-1 font-semibold flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3 inline" />
                  <span>vs. Peak Traffic</span>
                </p>
              </div>
            </div>

            {/* Eco Carbon Savings */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-emerald-800 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Eco Impact</span>
                <Leaf className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              </div>
              <div>
                <p className="text-lg sm:text-xl font-black text-emerald-800 leading-none">
                  {carbonSaved}
                </p>
                <p className="text-[10px] text-emerald-700 mt-1 font-semibold truncate">
                  CO₂ emissions saved 🌱
                </p>
              </div>
            </div>

          </div>

          {/* Eco Tree-Planting Equivalence Badge */}
          <div className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-100/70 via-teal-50 to-emerald-100/70 border border-emerald-300/80 flex items-center gap-2.5 text-xs text-emerald-900 font-medium shadow-xs">
            <Award className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <p className="text-[11px] leading-tight">
              <span className="font-bold text-emerald-950">Green Mobility Impact: </span>
              Your eco-friendly routing saved equivalent to <strong>{treesEquivalent} tree-days</strong> of carbon absorption.
            </p>
          </div>

          {/* 2. ROUTE & DESTINATION BREAKDOWN */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Trip Route Details</h4>
            
            <div className="space-y-2 text-xs">
              {/* Pickup */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mt-0.5 text-[10px] font-black">
                  P
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">{booking.pickup.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{booking.pickup.address}</p>
                </div>
              </div>

              {/* Connecting Dashed Line */}
              <div className="ml-2.5 w-0.5 h-3 bg-slate-300 border-l border-dashed" />

              {/* Destination */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center mt-0.5 text-[10px] font-black">
                  D
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs">{booking.destination.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{booking.destination.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. CAPTAIN & VEHICLE HIGHLIGHTS */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={booking.captain.photo}
                alt={booking.captain.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs"
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="text-xs font-black text-slate-900">{booking.captain.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {booking.captain.vehicleModel} • <span className="font-mono font-bold text-slate-700">{booking.captain.vehicleNumber}</span>
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{booking.captain.rating} Rating</span>
                  <span className="text-slate-400 font-normal">({booking.captain.totalTrips}+ trips)</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Paid</p>
              <p className="text-lg font-black text-emerald-700 leading-tight">₹{totalFareWithTip}</p>
              {tipAmount > 0 ? (
                <p className="text-[10px] text-amber-700 font-bold flex items-center justify-end gap-0.5">
                  <Heart className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Incl. ₹{tipAmount} Tip</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 font-medium capitalize">{booking.paymentMethod}</p>
              )}
            </div>
          </div>

          {/* 4. DYNAMIC FARE BREAKDOWN & MARKET RATES RECHARTS VISUALIZATION */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Fare vs. Market Comparison
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-300">
                <TrendingDown className="w-3 h-3" />
                Saved ₹{totalSavings} ({percentSaved}%)
              </span>
            </div>

            {/* Recharts Bar Chart Container */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={fareComparisonData}
                  layout="vertical"
                  margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
                >
                  <XAxis 
                    type="number" 
                    domain={[0, 'dataMax + 25']}
                    tick={{ fontSize: 10, fill: '#64748B' }} 
                    tickFormatter={(val) => `₹${val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#1E293B', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={75}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-lg text-xs border border-slate-700">
                            <p className="font-bold text-emerald-300">{data.label}</p>
                            <p className="text-sm font-black mt-0.5">₹{data.fare}</p>
                            {data.highlight ? (
                              <p className="text-[10px] text-emerald-400 font-medium">✨ Your locked rate with 0% surge</p>
                            ) : (
                              <p className="text-[10px] text-slate-400 font-medium">Standard estimated provider fare</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="fare" 
                    radius={[0, 8, 8, 0]} 
                    barSize={20}
                    label={{
                      position: 'right',
                      formatter: (val: any) => `₹${val}`,
                      fontSize: 11,
                      fontWeight: 700,
                      fill: '#334155',
                    }}
                  >
                    {fareComparisonData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.highlight ? '#059669' : entry.name.includes('Peak') ? '#F59E0B' : '#94A3B8'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Granular Itemized Fare Breakdown Chips */}
            <div className={`pt-2 border-t border-slate-200/80 grid ${tipAmount > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-2 text-center text-[10.5px]`}>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                <p className="text-slate-500 font-medium">Base Fare</p>
                <p className="font-bold text-slate-800">₹{baseFarePart}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                <p className="text-slate-500 font-medium">Distance/Fuel</p>
                <p className="font-bold text-slate-800">₹{distanceFarePart}</p>
              </div>
              <div className="p-1.5 rounded-lg bg-white border border-slate-200">
                <p className="text-slate-500 font-medium">Tolls & Taxes</p>
                <p className="font-bold text-slate-800">₹{taxesAndTollsPart}</p>
              </div>
              {tipAmount > 0 && (
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 animate-in fade-in">
                  <p className="text-amber-800 font-medium">Driver Tip</p>
                  <p className="font-black text-amber-700">+₹{tipAmount}</p>
                </div>
              )}
            </div>

            {tipAmount > 0 && (
              <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium text-[11px]">
                  Base Fare (₹{actualFare}) + Driver Tip (₹{tipAmount})
                </span>
                <span className="font-bold text-emerald-800 text-xs">
                  Updated Total: ₹{totalFareWithTip}
                </span>
              </div>
            )}

            <p className="text-[10px] text-center text-slate-500 italic">
              *Comparison benchmarked against live aggregated city taxi & auto aggregator baseline rates for this {distanceKm}km route.
            </p>
          </div>

          {/* 5. TIP THE DRIVER SECTION */}
          <div id="tip-the-driver-section" className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/90 via-orange-50/60 to-amber-100/70 border border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Heart className="w-4 h-4 fill-slate-950 text-slate-950" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>Tip the Driver</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-amber-200 text-amber-900 uppercase">Optional</span>
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">
                    100% of your tip goes directly to Captain <strong className="text-slate-900">{booking.captain.name}</strong>
                  </p>
                </div>
              </div>

              {tipAmount > 0 && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">Added Tip</span>
                  <span className="text-xs font-black text-amber-800 bg-white/90 px-2 py-0.5 rounded-lg border border-amber-300 inline-block shadow-2xs">
                    +₹{tipAmount}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Preset Buttons + Custom Toggle */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { amount: 0, label: 'None' },
                { amount: 20, label: '₹20' },
                { amount: 50, label: '₹50' },
                { amount: 100, label: '₹100' },
                { amount: 150, label: '₹150' },
              ].map((preset) => {
                const isSelected = !isCustomTipActive && tipAmount === preset.amount;
                return (
                  <button
                    key={preset.amount}
                    type="button"
                    id={`preset-tip-btn-${preset.amount}`}
                    onClick={() => handleSelectPresetTip(preset.amount)}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center border shadow-2xs ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs scale-[1.02]'
                        : 'bg-white border-amber-200/80 hover:bg-amber-100/60 text-slate-800'
                    }`}
                  >
                    <span>{preset.label}</span>
                    {preset.amount === 50 && (
                      <span className="text-[8.5px] text-amber-950 font-bold mt-0.5">Popular</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Tip Input Section */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <button
                  type="button"
                  id="toggle-custom-tip-btn"
                  onClick={() => {
                    const nextActive = !isCustomTipActive;
                    setIsCustomTipActive(nextActive);
                    if (nextActive && customTipInput === '') {
                      setCustomTipInput(tipAmount > 0 && ![20, 50, 100, 150].includes(tipAmount) ? String(tipAmount) : '');
                    }
                  }}
                  className={`text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                    isCustomTipActive ? 'text-amber-800 underline' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>{isCustomTipActive ? 'Close Custom Amount' : 'Enter Custom Tip Amount (₹)'}</span>
                </button>

                {isCustomTipActive && (
                  <div className="flex items-center gap-1">
                    {[10, 25, 50].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => handleAddCustomDelta(delta)}
                        className="px-1.5 py-0.5 bg-white border border-amber-300 hover:bg-amber-100 rounded-md text-[10px] font-bold text-amber-900 cursor-pointer"
                      >
                        +₹{delta}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isCustomTipActive && (
                <div className="flex items-center gap-2 animate-in fade-in">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">₹</span>
                    <input
                      type="text"
                      id="custom-tip-input-field"
                      value={customTipInput}
                      onChange={(e) => handleCustomTipChange(e.target.value)}
                      placeholder="e.g. 75"
                      maxLength={4}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-white border border-amber-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                  {customTipInput && (
                    <button
                      type="button"
                      onClick={() => handleSelectPresetTip(0)}
                      className="px-2.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Real-time Total Fare Impact Bar */}
            <div className="p-2.5 rounded-xl bg-white/90 border border-amber-200/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-slate-700 font-medium text-[11.5px]">
                  Ride: <strong className="text-slate-900">₹{actualFare}</strong>
                  {tipAmount > 0 && <> + Tip: <strong className="text-amber-700">₹{tipAmount}</strong></>}
                </span>
              </div>
              <div className="text-right flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Updated Total:</span>
                <span className="text-sm font-black text-emerald-700 font-mono">₹{totalFareWithTip}</span>
              </div>
            </div>

            {/* Captain Gratitude Confirmation Note */}
            {tipAmount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600 flex-shrink-0" />
                <span>{tipConfirmedMessage || `₹${tipAmount} tip added for Captain ${booking.captain.name}!`}</span>
              </motion.div>
            )}
          </div>

          {/* 6. PAYMENT OPTIONS & SETTLEMENT SECTION */}
          <div id="trip-payment-options-section" className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Payment Options
                  </h4>
                  <p className="text-[10px] text-slate-500 font-medium">Select method to complete or adjust trip payment</p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Encrypted</span>
              </div>
            </div>

            {/* Payment Method Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              
              {/* Option 1: RidePulse Wallet */}
              <button
                type="button"
                id="trip-payment-method-wallet-btn"
                onClick={() => handleSelectPaymentMethod('RidePulse Wallet')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs ${
                  selectedPaymentMethod === 'RidePulse Wallet'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">RidePulse Wallet</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Bal: ₹{walletBalance.toFixed(2)}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Fast 1-Tap
                  </span>
                </div>
              </button>

              {/* Option 2: UPI Apps & QR */}
              <button
                type="button"
                id="trip-payment-method-upi-btn"
                onClick={() => handleSelectPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs ${
                  selectedPaymentMethod === 'UPI'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">UPI / QR Payment</span>
                      <span className="text-[10px] text-slate-500 font-semibold">GPay, PhonePe, Paytm</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    0% Fee
                  </span>
                </div>
              </button>

              {/* Option 3: Credit / Debit Card */}
              <button
                type="button"
                id="trip-payment-method-card-btn"
                onClick={() => handleSelectPaymentMethod('Card')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs ${
                  selectedPaymentMethod === 'Card'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Credit / Debit Card</span>
                      <span className="text-[10px] text-slate-500 font-mono">•••• 4242 (Visa)</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                    Auto-Pay
                  </span>
                </div>
              </button>

              {/* Option 4: Cash to Driver */}
              <button
                type="button"
                id="trip-payment-method-cash-btn"
                onClick={() => handleSelectPaymentMethod('Cash')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 shadow-2xs ${
                  selectedPaymentMethod === 'Cash'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 block">Cash to Driver</span>
                      <span className="text-[10px] text-slate-500 font-semibold">Pay physical cash</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    Direct
                  </span>
                </div>
              </button>

            </div>

            {/* UPI Sub-Options when UPI is selected */}
            {selectedPaymentMethod === 'UPI' && (
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-blue-700" />
                    Select UPI App or ID:
                  </span>
                  <span className="text-[10px] font-semibold text-blue-700">Instant UPI Intent</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'gpay', label: 'Google Pay' },
                    { id: 'phonepe', label: 'PhonePe' },
                    { id: 'paytm', label: 'Paytm' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id as any)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition-colors cursor-pointer border ${
                        selectedUpiApp === app.id
                          ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                          : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-100/60'
                      }`}
                    >
                      {app.label}
                    </button>
                  ))}
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder="or enter VPA / UPI ID (e.g. mobile@upi)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-900 text-xs focus:outline-none focus:border-blue-500 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => alert(`Scan QR Code displayed to pay ₹${totalFareWithTip} to RidePulse Captain`)}
                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100 border border-blue-300 text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Settlement Status Bar / Action */}
            <div className="pt-1">
              {isPaymentSettled ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <span>Paid ₹{totalFareWithTip} via {selectedPaymentMethod}</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-extrabold uppercase">
                          Settled
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        Txn #{settlementTxnId} • {paymentTimestamp}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaymentSettled(false)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100/60 border border-emerald-300 text-[10.5px] font-bold text-emerald-800 transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">
                      Total Payable for {booking.rideType.toUpperCase()} Ride:
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      ₹{totalFareWithTip}
                    </span>
                  </div>

                  <button
                    type="button"
                    id="settle-trip-payment-btn"
                    onClick={handleSettlePayment}
                    disabled={isProcessingPayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {isProcessingPayment
                        ? 'Processing Payment...'
                        : `Pay & Settle ₹${totalFareWithTip} via ${selectedPaymentMethod}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 7. DRIVER RATING & ANIMATED FEEDBACK SYSTEM */}
          <div id="trip-driver-rating-system" className="p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 text-center space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs">
                  {booking.captain.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-black text-slate-800">Rate your experience</p>
                  <p className="text-[10px] text-slate-500">with Captain {booking.captain.name} • {booking.captain.vehicleModel}</p>
                </div>
              </div>

              {/* Dynamic Animated Status Badge */}
              <motion.div
                key={hoveredRating || rating}
                initial={{ opacity: 0, scale: 0.8, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-black tracking-wide border flex items-center gap-1 shadow-2xs ${
                  (hoveredRating || rating) === 5
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : (hoveredRating || rating) === 4
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : (hoveredRating || rating) === 3
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : (hoveredRating || rating) === 2
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {(hoveredRating || rating) === 5 && '🌟 Outstanding'}
                {(hoveredRating || rating) === 4 && '✨ Great Ride'}
                {(hoveredRating || rating) === 3 && '👍 Good Trip'}
                {(hoveredRating || rating) === 2 && '😐 Needs Improvement'}
                {(hoveredRating || rating) === 1 && '⚠️ Poor Experience'}
              </motion.div>
            </div>

            {/* Interactive Animated 5-Star Rating Buttons */}
            <div className="flex items-center justify-center gap-2.5 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = star <= (hoveredRating !== null ? hoveredRating : rating);
                const isSelected = star === rating;
                return (
                  <motion.button
                    key={star}
                    type="button"
                    id={`star-rating-btn-${star}`}
                    whileHover={{ scale: 1.25, rotate: [0, -10, 10, 0] }}
                    whileTap={{ scale: 0.85 }}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => {
                      setRating(star);
                      if (star === 5) {
                        try {
                          confetti({
                            particleCount: 50,
                            spread: 50,
                            origin: { y: 0.7 },
                            colors: ['#F59E0B', '#10B981', '#3B82F6'],
                          });
                        } catch {}
                      }
                    }}
                    className="relative p-1.5 focus:outline-none cursor-pointer transition-transform group"
                    title={`Rate ${star} Star${star > 1 ? 's' : ''}`}
                  >
                    {/* Pulsing glow background for lit stars */}
                    {isLit && (
                      <motion.div
                        layoutId="star-glow"
                        className="absolute inset-0 rounded-full bg-amber-400/20 blur-xs"
                      />
                    )}

                    <motion.div
                      animate={{
                        scale: isSelected ? [1, 1.3, 1] : 1,
                        rotate: isSelected ? [0, -15, 15, 0] : 0,
                      }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors duration-150 ${
                          isLit
                            ? 'fill-amber-400 text-amber-400 drop-shadow-xs'
                            : 'text-slate-300 stroke-[1.5]'
                        }`}
                      />
                    </motion.div>

                    {/* Star number indicator below */}
                    <span className="block text-[9.5px] font-bold text-slate-400 group-hover:text-amber-600 transition-colors mt-0.5">
                      {star}★
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Feedback Compliment Tags */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-500">What went well?</p>
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {feedbackTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <motion.button
                      key={tag}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100/80 shadow-2xs'
                      }`}
                    >
                      {isSelected ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                      )}
                      <span>{tag}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Optional Custom Note toggle */}
            {!showCommentInput ? (
              <button
                type="button"
                onClick={() => setShowCommentInput(true)}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                + Add a note for Captain {booking.captain.name}
              </button>
            ) : (
              <div className="pt-1 text-left space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Personal Note (Optional):</label>
                <textarea
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder="Share any special compliments or feedback..."
                  rows={2}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-emerald-500 resize-none shadow-2xs"
                />
              </div>
            )}

            {/* Rating Submit / Confirmation Action */}
            <div className="pt-1">
              <AnimatePresence mode="wait">
                {isRatingSubmitted ? (
                  <motion.div
                    key="submitted"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Feedback, {tipAmount > 0 ? `₹${tipAmount} Tip, ` : ''}& {rating}★ Rating Shared!</span>
                  </motion.div>
                ) : (
                  <motion.button
                    key="submit-btn"
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsRatingSubmitted(true);
                      if (onRateCaptain) {
                        onRateCaptain(rating, [
                          ...selectedTags,
                          ...(tipAmount > 0 ? [`Tipped ₹${tipAmount}`] : []),
                          ...(customComment ? [customComment] : []),
                        ]);
                      }
                      try {
                        confetti({
                          particleCount: 70,
                          spread: 60,
                          origin: { y: 0.65 },
                          colors: ['#10B981', '#059669', '#34D399', '#F59E0B'],
                        });
                      } catch {}
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Submit Rating & Feedback</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              alert(
                `Trip Receipt #${booking.bookingCode}\n` +
                `---------------------------------\n` +
                `Route: ${booking.pickup.name} -> ${booking.destination.name}\n` +
                `Distance: ${distanceKm} km\n` +
                `Base Ride Fare: ₹${actualFare}\n` +
                (tipAmount > 0 ? `Driver Tip: ₹${tipAmount}\n` : '') +
                `Total Paid: ₹${totalFareWithTip}\n` +
                `Captain: ${booking.captain.name} (${booking.captain.vehicleNumber})\n` +
                `Payment: ${booking.paymentMethod.toUpperCase()}`
              );
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const shareText = `Completed a ${distanceKm}km trip with RidePulse! Base Fare: ₹${actualFare}${tipAmount > 0 ? `, Driver Tip: ₹${tipAmount}` : ''} (Total: ₹${totalFareWithTip}). Saved ${timeSavedMins} mins and ${carbonSaved} CO2!`;
              if (navigator.share) {
                navigator.share({
                  title: 'My RidePulse Trip Highlights',
                  text: shareText,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareText);
                alert('Trip summary copied to clipboard!');
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            type="button"
            id="done-trip-summary-btn"
            onClick={handleDone}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Done & Back to Home</span>
          </button>
        </div>

      </div>
    </div>
  );
};
