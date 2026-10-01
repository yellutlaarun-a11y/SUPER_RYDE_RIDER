import React, { useState } from 'react';
import { SelfDriveCar } from '../types';
import { SELF_DRIVE_CARS } from '../data/mockData';
import { 
  Key, 
  X, 
  ShieldCheck, 
  Fuel, 
  Gauge, 
  Users, 
  Star, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  Car,
  Lock,
  ArrowRight,
  CreditCard,
  Wallet,
  Smartphone,
  Check,
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronRight,
  FileCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SelfDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSelfDrive: (
    car: SelfDriveCar, 
    durationHours: number, 
    securityOtp: string,
    advanceDetails?: {
      advancePaidAmount: number;
      remainingBalance: number;
      totalFare: number;
      advancePaymentMethod: string;
      advanceTransactionId: string;
    }
  ) => void;
}

type ModalStep = 'selection' | 'advance_payment' | 'confirmed';

export const SelfDriveModal: React.FC<SelfDriveModalProps> = ({
  isOpen,
  onClose,
  onBookSelfDrive,
}) => {
  const [selectedCar, setSelectedCar] = useState<SelfDriveCar>(SELF_DRIVE_CARS[0]);
  const [durationHours, setDurationHours] = useState(4);
  const [step, setStep] = useState<ModalStep>('selection');

  // 25% Advance Payment options state
  const [paymentType, setPaymentType] = useState<'UPI' | 'Card' | 'Wallet' | 'NetBanking'>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 9210');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('782');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Confirmed details
  const [confirmedBooking, setConfirmedBooking] = useState<{
    car: SelfDriveCar;
    securityOtp: string;
    totalAmount: number;
    advanceAmount: number;
    remainingAmount: number;
    deposit: number;
    transactionId: string;
    paymentMethod: string;
  } | null>(null);

  if (!isOpen) return null;

  // Calculation Math
  const totalAmount = selectedCar.hourlyRate * durationHours;
  const advanceAmount = Math.round(totalAmount * 0.25); // Exactly 25% advance
  const remainingAmount = totalAmount - advanceAmount; // 75% remaining balance

  // Step 1 -> Step 2: Proceed to 25% Advance Payment
  const handleProceedToAdvancePayment = () => {
    setStep('advance_payment');
  };

  // Step 2 -> Step 3: Pay 25% Advance
  const handlePayAdvance = () => {
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      const securityOtp = Math.floor(1000 + Math.random() * 9000).toString();
      const transactionId = `TXN-ADV-${Math.floor(100000 + Math.random() * 900000)}`;
      const paymentMethodName = 
        paymentType === 'UPI' 
          ? `UPI (${selectedUpiApp === 'gpay' ? 'Google Pay' : selectedUpiApp === 'phonepe' ? 'PhonePe' : selectedUpiApp === 'paytm' ? 'Paytm' : customUpiId || 'UPI'})`
          : paymentType === 'Card' 
          ? 'Credit / Debit Card'
          : paymentType === 'Wallet'
          ? 'RidePulse Wallet'
          : 'Net Banking';

      setConfirmedBooking({
        car: selectedCar,
        securityOtp,
        totalAmount,
        advanceAmount,
        remainingAmount,
        deposit: selectedCar.securityDeposit,
        transactionId,
        paymentMethod: paymentMethodName,
      });

      setStep('confirmed');

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.55 },
        });
      } catch {
        // ignore
      }
    }, 1200);
  };

  const handleFinalDone = () => {
    if (confirmedBooking) {
      onBookSelfDrive(
        confirmedBooking.car, 
        durationHours, 
        confirmedBooking.securityOtp,
        {
          advancePaidAmount: confirmedBooking.advanceAmount,
          remainingBalance: confirmedBooking.remainingAmount,
          totalFare: confirmedBooking.totalAmount,
          advancePaymentMethod: confirmedBooking.paymentMethod,
          advanceTransactionId: confirmedBooking.transactionId,
        }
      );
    }
    // reset state
    setConfirmedBooking(null);
    setStep('selection');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ================= STEP 1: CAR SELECTION & 25% ADVANCE BREAKDOWN ================= */}
        {step === 'selection' && (
          <div className="flex flex-col h-full min-h-0">
            {/* Modal Header */}
            <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                <Key className="w-6 h-6" />
              </div>
              <div className="pr-8">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Self-Drive Car Rental Reservation</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    25% Advance • 100% Refundable Guarantee
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Pay only 25% advance to reserve your car. 100% refundable if the car condition does not match the app listing.
                </p>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Cars Selection Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {SELF_DRIVE_CARS.map((car) => {
                  const isSelected = selectedCar.id === car.id;
                  const carTotal = car.hourlyRate * durationHours;
                  const carAdvance = Math.round(carTotal * 0.25);

                  return (
                    <div
                      key={car.id}
                      onClick={() => setSelectedCar(car)}
                      className={`cursor-pointer rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-400/30 shadow-md'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div>
                        {/* Car Image Banner */}
                        <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                          <img 
                            src={car.image} 
                            alt={car.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-900 border border-slate-200">
                            {car.category}
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow-xs">
                            ★ {car.rating}
                          </div>
                        </div>

                        {/* Car Name & Specs */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{car.name}</h4>
                            <span className="text-[11px] text-slate-500 font-medium">{car.brand} • {car.transmission}</span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Rate</span>
                            <div className="text-sm font-black text-amber-700">₹{car.hourlyRate}<span className="text-[10px] text-slate-500">/hr</span></div>
                          </div>
                        </div>

                        {/* Quick Specs Badges */}
                        <div className="grid grid-cols-3 gap-1.5 my-2.5 text-[10px] text-slate-600 font-medium">
                          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <Users className="w-3 h-3 text-slate-500" />
                            <span>{car.seats} Seats</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <Fuel className="w-3 h-3 text-slate-500" />
                            <span>{car.fuelType}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <Gauge className="w-3 h-3 text-slate-500" />
                            <span>{car.freeKmIncluded}km free</span>
                          </div>
                        </div>

                        {/* Location Badge */}
                        <p className="text-[10px] text-emerald-700 font-bold truncate">
                          📍 {car.availableLocation}
                        </p>
                      </div>

                      {/* Advance breakdown footer in card */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">{durationHours} hrs total: <strong>₹{carTotal}</strong></span>
                        <span className="font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                          25% Advance: ₹{carAdvance}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rental Duration Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Select Rental Duration (Hours):
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[2, 4, 8, 12, 24, 48].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() => setDurationHours(hrs)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            durationHours === hrs
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {hrs} hrs
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                    <div className="text-[11px] text-slate-500 font-medium">Total Estimated Fare</div>
                    <div className="text-xl font-black text-slate-900">
                      ₹{totalAmount}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      ({durationHours} hrs @ ₹{selectedCar.hourlyRate}/hr)
                    </div>
                  </div>
                </div>
              </div>

              {/* 25% ADVANCE & 100% REFUNDABLE GUARANTEE HIGHLIGHT CARD */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                        100% Fully Refundable 25% Advance Guarantee
                      </h4>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 text-[10px] font-black uppercase">
                        Zero Risk Policy
                      </span>
                    </div>

                    <p className="text-xs text-emerald-900/90 mt-1 font-medium leading-relaxed">
                      To lock your reservation, you only pay a <strong>25% advance token of ₹{advanceAmount}</strong> today. 
                      When you meet owner <strong className="text-emerald-950">{selectedCar.owner?.name || 'Ramesh Varma'}</strong> at the parking hub, if the car condition, cleanliness, exterior scratches, fuel level, or odometer is <strong>not as mentioned in the app</strong>, you will receive an <strong>instant 100% full refund of ₹{advanceAmount}</strong> with zero cancellation deductions.
                    </p>

                    {/* Quick Breakdown Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 text-xs">
                      <div className="p-2 bg-white/90 rounded-xl border border-emerald-300">
                        <span className="text-[10px] text-slate-500 block">1. Pay Now (25% Advance)</span>
                        <strong className="text-amber-700 text-sm font-black">₹{advanceAmount}</strong>
                        <span className="text-[9px] text-emerald-700 block font-bold">100% Refundable</span>
                      </div>
                      <div className="p-2 bg-white/90 rounded-xl border border-emerald-300">
                        <span className="text-[10px] text-slate-500 block">2. Pay on Ride End (75%)</span>
                        <strong className="text-slate-900 text-sm font-black">₹{remainingAmount}</strong>
                        <span className="text-[9px] text-slate-500 block">Due after return</span>
                      </div>
                      <div className="p-2 bg-white/90 rounded-xl border border-emerald-300">
                        <span className="text-[10px] text-slate-500 block">3. Total Rental Fare</span>
                        <strong className="text-emerald-800 text-sm font-black">₹{totalAmount}</strong>
                        <span className="text-[9px] text-slate-500 block">For {durationHours} hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex-shrink-0 p-4 sm:px-6 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Advance Due Now (25%)</span>
                <div className="text-lg font-black text-amber-700">
                  ₹{advanceAmount} <span className="text-xs font-normal text-slate-500">(Total: ₹{totalAmount})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="proceed-to-advance-payment-btn"
                  onClick={handleProceedToAdvancePayment}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Pay 25% Advance (₹{advanceAmount})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: PAY 25% ADVANCE PAYMENT ================= */}
        {step === 'advance_payment' && (
          <div className="flex flex-col h-full min-h-0 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center flex-shrink-0 font-black shadow-xs">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">Pay 25% Advance Token (₹{advanceAmount})</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Reserving {selectedCar.name} • 100% Refundable Condition Guarantee
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="text-xs font-bold text-amber-800 hover:underline cursor-pointer"
              >
                Change Car
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Payment Summary Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">{selectedCar.name}</span>
                    <span className="text-xs text-slate-500 font-medium">({durationHours} Hours Rental)</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hub: <strong className="text-slate-700">{selectedCar.availableLocation}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">25% Advance To Pay</span>
                  <div className="text-xl font-black text-amber-700">₹{advanceAmount}</div>
                  <span className="text-[10px] text-emerald-700 font-bold block">100% Refundable at Hub</span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Select Payment Method for 25% Advance:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'UPI', label: 'UPI (GPay/PhonePe)', icon: Smartphone },
                    { id: 'Card', label: 'Debit / Credit Card', icon: CreditCard },
                    { id: 'Wallet', label: 'RidePulse Wallet', icon: Wallet },
                    { id: 'NetBanking', label: 'Net Banking', icon: FileCheck },
                  ].map((method) => {
                    const IconComp = method.icon;
                    const isSel = paymentType === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentType(method.id as any)}
                        className={`p-3 rounded-xl border text-left flex flex-col items-start gap-1 transition-all cursor-pointer ${
                          isSel
                            ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-400/30 font-bold text-amber-950 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <IconComp className={`w-4 h-4 ${isSel ? 'text-amber-700' : 'text-slate-500'}`} />
                        <span className="text-xs">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* UPI Option Controls */}
              {paymentType === 'UPI' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="text-xs font-bold text-slate-800">Choose UPI App:</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'gpay', name: 'Google Pay', badge: 'Popular' },
                      { id: 'phonepe', name: 'PhonePe', badge: 'Fast' },
                      { id: 'paytm', name: 'Paytm UPI', badge: 'Instant' },
                    ].map((app) => (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUpiApp(app.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                          selectedUpiApp === app.id
                            ? 'bg-amber-50 border-amber-500 font-black text-amber-950'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 text-xs font-bold'
                        }`}
                      >
                        <div className="text-xs font-bold">{app.name}</div>
                        <span className="text-[9px] text-emerald-700 font-extrabold">{app.badge}</span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="text-[11px] text-slate-500 font-medium block mb-1">
                      Or Enter UPI ID / VPA:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={customUpiId}
                      onChange={(e) => setCustomUpiId(e.target.value)}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Card Option Controls */}
              {paymentType === 'Card' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-xs">
                  <div>
                    <label className="text-slate-500 font-medium block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-500 font-medium block mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 font-medium block mb-1">CVV</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wallet Option */}
              {paymentType === 'Wallet' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">RidePulse Wallet Balance</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Available: ₹2,450</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    Sufficient Balance
                  </span>
                </div>
              )}

              {/* NetBanking Option */}
              {paymentType === 'NetBanking' && (
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Popular Banks:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                    {['HDFC Bank', 'SBI Bank', 'ICICI Bank', 'Axis Bank'].map((b, i) => (
                      <div key={i} className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-center hover:bg-amber-50 hover:border-amber-400 cursor-pointer">
                        {b}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assurance Box */}
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                <span>
                  <strong>100% Refund Protection:</strong> If vehicle condition differs upon arrival at the hub, claim an instant 100% refund on the spot.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 sm:px-6 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('selection')}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Back
              </button>

              <button
                type="button"
                id="pay-25-advance-submit-btn"
                disabled={isProcessingPayment}
                onClick={handlePayAdvance}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isProcessingPayment ? 'Processing Advance...' : `Pay ₹${advanceAmount} (25% Advance) & Reserve`}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: CONFIRMED RESERVATION & GUARANTEE CERTIFICATE ================= */}
        {step === 'confirmed' && confirmedBooking && (
          <div className="flex-1 overflow-y-auto p-6 text-center flex flex-col justify-center items-center animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto mb-3 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-slate-900">Self-Drive Car Reserved!</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto font-medium">
              Your 25% advance of <strong>₹{confirmedBooking.advanceAmount}</strong> has been received. Your vehicle <strong className="text-slate-900">{confirmedBooking.car.name}</strong> is reserved at {confirmedBooking.car.availableLocation}.
            </p>

            {/* 100% MONEY-BACK CONDITION GUARANTEE CERTIFICATE CARD */}
            <div className="my-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 max-w-md w-full mx-auto text-left shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Condition Money-Back Guarantee Active</span>
                </div>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-md">
                  100% Refundable
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white/90 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Advance Paid (25%)</span>
                  <strong className="text-emerald-700 text-sm font-black">₹{confirmedBooking.advanceAmount}</strong>
                </div>
                <div className="p-2 bg-white/90 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block font-medium">Balance at Return (75%)</span>
                  <strong className="text-slate-900 text-sm font-black">₹{confirmedBooking.remainingAmount}</strong>
                </div>
              </div>

              <div className="p-2 bg-white/90 rounded-xl border border-emerald-200 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Transaction ID:</span>
                  <strong className="font-mono text-slate-800">{confirmedBooking.transactionId}</strong>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span>Owner Contact:</span>
                  <strong className="text-slate-800">{confirmedBooking.car.owner?.name || 'Ramesh Varma'} ({confirmedBooking.car.owner?.phone || '+91 98480 22334'})</strong>
                </div>
              </div>

              <p className="text-[10px] text-emerald-900 font-medium italic">
                * When you arrive at the bay, inspect the vehicle. If any scratches, cleanliness, or fuel discrepancy exists compared to the app listing, you can cancel in the app for an immediate 100% refund of your advance.
              </p>
            </div>

            <button
              type="button"
              id="self-drive-final-continue-btn"
              onClick={handleFinalDone}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Navigate to Car Owner & Inspect Vehicle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
