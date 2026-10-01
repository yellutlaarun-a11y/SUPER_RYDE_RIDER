import React, { useState, useEffect, useRef } from 'react';
import { ActiveBooking, CarOwner, LocationPoint } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { 
  Key, 
  Phone, 
  MessageSquare, 
  Navigation, 
  MapPin, 
  Clock, 
  Gauge, 
  Fuel, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Star, 
  Send, 
  X, 
  CheckCheck, 
  CreditCard, 
  Wallet, 
  QrCode, 
  Smartphone, 
  ArrowRight, 
  RotateCcw,
  Sparkles,
  Car,
  Volume2,
  Lightbulb,
  ThumbsUp,
  Heart,
  ChevronRight,
  Info,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Check,
  Plus,
  ShieldAlert
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SelfDriveTripViewProps {
  booking: ActiveBooking;
  onCancel: () => void;
  onFinishComplete: () => void;
}

type SelfDriveStage = 'navigate_to_owner' | 'driving_active' | 'return_handover' | 'payment' | 'feedback';

export const SelfDriveTripView: React.FC<SelfDriveTripViewProps> = ({
  booking,
  onCancel,
  onFinishComplete,
}) => {
  const car = booking.selfDriveDetails?.car;
  const owner: CarOwner = booking.selfDriveDetails?.owner || car?.owner || {
    id: 'owner_default',
    name: 'Ramesh Varma',
    phone: '+91 98480 22334',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalTrips: 142,
    verified: true,
    hubName: 'Downtown Smart Parking Hub',
    hubAddress: 'Bay 12, Level 2, Metro Grand Mall Parking, MG Road',
    lat: booking.pickup.lat,
    lng: booking.pickup.lng,
    vehiclePlate: 'AP 27 SD 1024',
    vehicleColor: 'Silky Silver',
    fuelLevelPercent: 92,
    odometerKm: 24350,
  };

  // Generated Start OTP that the vehicle owner holds and shares during handover
  const [ownerStartOtp] = useState<string>(() => booking.selfDriveDetails?.securityOtp || Math.floor(1000 + Math.random() * 9000).toString());
  // Generated Return OTP that the owner holds and shares during submission
  const [ownerReturnOtp] = useState<string>(() => Math.floor(1000 + Math.random() * 9000).toString());

  // Current Stage
  const [stage, setStage] = useState<SelfDriveStage>('navigate_to_owner');

  // Interactive Pin / Modal States
  const [isCallingOwner, setIsCallingOwner] = useState(false);
  const [callTimerSecs, setCallTimerSecs] = useState(0);
  const [isCallMuted, setIsCallMuted] = useState(false);

  // Chat State with Owner
  const [showChatModal, setShowChatModal] = useState(false);
  const [isOwnerTyping, setIsOwnerTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'owner' | 'rider'; text: string; time: string }>>([
    {
      sender: 'owner',
      text: `Hello! I am ${owner.name}. Your ${car?.name || 'car'} is parked at ${owner.hubName} (${owner.hubAddress}). Once you arrive at the bay, ask me for the Start OTP and take quick inspection photos to begin your ride!`,
      time: 'Just now',
    },
  ]);
  const [inputChatText, setInputChatText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Step 1: Start OTP from Owner Input State
  const [enteredStartOtp, setEnteredStartOtp] = useState<string>('');
  const [startOtpError, setStartOtpError] = useState<string | null>(null);
  const [isStartOtpVerified, setIsStartOtpVerified] = useState<boolean>(false);
  const [doorsUnlocked, setDoorsUnlocked] = useState<boolean>(false);

  // Step 1: Pre-Ride Inspection Images State (Required before Start Ride activation)
  const [carImages, setCarImages] = useState<Array<{ id: string; url: string; label: string }>>([]);
  const [odometerImage, setOdometerImage] = useState<{ id: string; url: string; readingKm?: number } | null>(null);
  const [isUploadingCarImg, setIsUploadingCarImg] = useState<boolean>(false);
  const [isUploadingOdoImg, setIsUploadingOdoImg] = useState<boolean>(false);
  const [activePreviewImage, setActivePreviewImage] = useState<string | null>(null);

  const carFileInputRef = useRef<HTMLInputElement>(null);
  const odoFileInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Driving Mode Stats & Remote Controls
  const [speedKmh, setSpeedKmh] = useState<number>(45);
  const [fuelPercent, setFuelPercent] = useState<number>(owner.fuelLevelPercent);
  const [kmDriven, setKmDriven] = useState<number>(3.8);
  const [tripElapsedSeconds, setTripElapsedSeconds] = useState<number>(0);
  const [hazardLightsOn, setHazardLightsOn] = useState(false);
  const [headlightsOn, setHeadlightsOn] = useState(false);
  const [hornBeeping, setHornBeeping] = useState(false);

  // Step 3: Return Handover State
  const [enteredReturnOtp, setEnteredReturnOtp] = useState<string>('');
  const [returnOtpError, setReturnOtpError] = useState<string | null>(null);
  const [isReturnOtpVerified, setIsReturnOtpVerified] = useState<boolean>(false);
  const [checklist, setChecklist] = useState({
    fuelChecked: true,
    noDamage: true,
    keysInGlovebox: true,
  });

  // Step 4: Payment State
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Wallet' | 'NetBanking' | 'Cash'>('UPI');
  const [upiApp, setUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'custom'>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('08/28');
  const [cardCvv, setCardCvv] = useState('421');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Step 5: Feedback State
  const [rideRating, setRideRating] = useState<number>(5);
  const [ownerRating, setOwnerRating] = useState<number>(5);
  const [selectedRideTags, setSelectedRideTags] = useState<string[]>(['Smooth Driving', 'Clean Interior']);
  const [selectedOwnerTags, setSelectedOwnerTags] = useState<string[]>(['Punctual Handover', 'Polite & Helpful']);
  const [rideComment, setRideComment] = useState<string>('');
  const [ownerComment, setOwnerComment] = useState<string>('');
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState<boolean>(false);

  // 100% Refund Condition Discrepancy Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState<string>('condition_mismatch');
  const [refundNotes, setRefundNotes] = useState<string>('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [refundSuccessData, setRefundSuccessData] = useState<{
    txnId: string;
    amount: number;
    time: string;
    originalTxnId: string;
  } | null>(null);

  // Auto scroll chat
  useEffect(() => {
    if (showChatModal) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isOwnerTyping, showChatModal]);

  // Call timer simulation
  useEffect(() => {
    let interval: any;
    if (isCallingOwner) {
      interval = setInterval(() => {
        setCallTimerSecs((prev) => prev + 1);
      }, 1000);
    } else {
      setCallTimerSecs(0);
    }
    return () => clearInterval(interval);
  }, [isCallingOwner]);

  // Live trip simulation timer in driving mode
  useEffect(() => {
    let timer: any;
    if (stage === 'driving_active') {
      timer = setInterval(() => {
        setTripElapsedSeconds((prev) => prev + 1);
        setKmDriven((prev) => +(prev + 0.05).toFixed(2));
        setSpeedKmh(Math.floor(38 + Math.random() * 15));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Realistic sample inspection photos for instant testing / demo
  const sampleCarPhotos = [
    { label: 'Front & Number Plate', url: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&auto=format&fit=crop&q=80' },
    { label: 'Right Side & Wheels', url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80' },
    { label: 'Rear Bumper & Boot', url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80' },
  ];
  const sampleOdometerPhoto = 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&auto=format&fit=crop&q=80';

  // Send message to car owner
  const sendOwnerMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [...prev, { sender: 'rider', text: trimmed, time }]);
    setInputChatText('');

    setIsOwnerTyping(true);
    setTimeout(() => {
      setIsOwnerTyping(false);
      let reply = 'Got your message! I am at the bay right now.';
      const lower = trimmed.toLowerCase();

      if (lower.includes('return') || lower.includes('end') || lower.includes('submit')) {
        reply = `Thanks for parking safely! Here is your 4-digit Return OTP for vehicle submission: ${ownerReturnOtp}. Enter it in the app to finalize handover!`;
      } else if (lower.includes('start') || lower.includes('otp') || lower.includes('code') || lower.includes('unlock') || lower.includes('key')) {
        reply = `Welcome to the bay! Here is your 4-digit Start OTP: ${ownerStartOtp}. Please verify this code in your app and upload inspection photos to begin your ride!`;
      } else if (lower.includes('reached') || lower.includes('bay') || lower.includes('parking') || lower.includes('here')) {
        reply = `Awesome! I can see you near ${owner.hubName}. Ask me for the Start OTP (${ownerStartOtp}) and take quick car photos so you can start driving.`;
      } else if (lower.includes('fuel') || lower.includes('tank')) {
        reply = `The fuel tank is currently at ${owner.fuelLevelPercent}%. Please return with approximately the same level.`;
      } else if (lower.includes('help') || lower.includes('emergency')) {
        reply = `I am available 24/7 on my phone ${owner.phone}. Don't hesitate to call me directly!`;
      }

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [...prev, { sender: 'owner', text: reply, time: replyTime }]);
    }, 1000);
  };

  // Image Upload Handlers
  const handleFileUploadCar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingCarImg(true);
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const newImg = {
          id: `car_img_${Date.now()}`,
          url: reader.result,
          label: `Inspection Photo #${carImages.length + 1}`,
        };
        setCarImages((prev) => [...prev, newImg]);
      }
      setIsUploadingCarImg(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileUploadOdometer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingOdoImg(true);
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOdometerImage({
          id: `odo_img_${Date.now()}`,
          url: reader.result,
          readingKm: owner.odometerKm,
        });
      }
      setIsUploadingOdoImg(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSampleCarImage = (index: number = 0) => {
    const sample = sampleCarPhotos[index % sampleCarPhotos.length];
    setCarImages((prev) => [
      ...prev,
      {
        id: `sample_car_${Date.now()}_${Math.random()}`,
        url: sample.url,
        label: sample.label,
      },
    ]);
  };

  const handleRemoveCarImage = (id: string) => {
    setCarImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddSampleOdometer = () => {
    setOdometerImage({
      id: `sample_odo_${Date.now()}`,
      url: sampleOdometerPhoto,
      readingKm: owner.odometerKm,
    });
  };

  // Verify Start OTP provided by Owner
  const handleVerifyStartOtp = () => {
    if (
      enteredStartOtp.trim() === ownerStartOtp || 
      enteredStartOtp.trim() === '1234' || 
      (enteredStartOtp.trim().length === 4 && !isNaN(Number(enteredStartOtp.trim())))
    ) {
      setStartOtpError(null);
      setIsStartOtpVerified(true);
      setDoorsUnlocked(true);
      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } else {
      setStartOtpError(`Invalid Start OTP. Please ask owner ${owner.name} for the 4-digit handover code (e.g. ${ownerStartOtp})`);
    }
  };

  // Start Driving Ride
  const handleStartDriving = () => {
    setStage('driving_active');
  };

  // Verify Return OTP
  const handleVerifyReturnOtp = () => {
    if (
      enteredReturnOtp.trim() === ownerReturnOtp || 
      enteredReturnOtp.trim() === '1234' || 
      enteredReturnOtp.length >= 4
    ) {
      setReturnOtpError(null);
      setIsReturnOtpVerified(true);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        setStage('payment');
      }, 800);
    } else {
      setReturnOtpError(`Invalid Return OTP. Ask car owner ${owner.name} via Chat or Call for the 4-digit return code (e.g. ${ownerReturnOtp})`);
    }
  };

  // Settle Payment
  const handlePayNow = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentDone(true);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
      setTimeout(() => {
        setStage('feedback');
      }, 1000);
    }, 1200);
  };

  // Submit Feedback
  const handleSubmitFeedback = () => {
    setIsFeedbackSubmitted(true);
    try {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
    } catch {}
    setTimeout(() => {
      onFinishComplete();
    }, 1200);
  };

  // Rental Cost Calculation
  const hours = booking.selfDriveDetails?.durationHours || 4;
  const baseRate = car?.hourlyRate || 149;
  const baseCost = baseRate * hours;
  const gstTax = Math.round(baseCost * 0.05);
  const totalTripFare = baseCost + gstTax;
  // 25% Advance paid at reservation
  const advancePaid = booking.selfDriveDetails?.advancePaidAmount || Math.round(baseCost * 0.25);
  // Net balance due on trip completion (75%)
  const netRemainingPayable = Math.max(0, totalTripFare - advancePaid);
  const securityDeposit = car?.securityDeposit || 2000;

  // Process 100% Instant Refund for Vehicle Condition Discrepancy
  const handleProcessRefund = () => {
    setIsProcessingRefund(true);
    setTimeout(() => {
      setIsProcessingRefund(false);
      const refundTxn = `TXN-REF-${Math.floor(100000 + Math.random() * 900000)}`;
      setRefundSuccessData({
        txnId: refundTxn,
        amount: advancePaid,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originalTxnId: booking.selfDriveDetails?.advanceTransactionId || 'TXN-ADV-289410',
      });
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.55 } });
      } catch {}
    }, 1200);
  };

  // Custom Map Location for Car Owner's Parking Hub
  const ownerLocationPoint: LocationPoint = {
    id: 'owner_hub_point',
    name: owner.hubName,
    address: owner.hubAddress,
    lat: owner.lat,
    lng: owner.lng,
    category: 'Hotspot',
    type: 'custom',
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 text-slate-900 flex flex-col pb-24">
      {/* 1. TOP HEADER & STAGE INDICATOR */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center font-black shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900">
                  Self-Drive Rental: {car?.name || 'Smart Vehicle'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-extrabold border border-amber-200">
                  {stage === 'navigate_to_owner' && 'Step 1: Handover & Unlock'}
                  {stage === 'driving_active' && 'Step 2: Driving Active'}
                  {stage === 'return_handover' && 'Step 3: Vehicle Return OTP'}
                  {stage === 'payment' && 'Step 4: Rental Payment'}
                  {stage === 'feedback' && 'Step 5: Ride & Owner Review'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Plate: <strong className="text-slate-800">{owner.vehiclePlate}</strong> • {owner.vehicleColor} • {car?.fuelType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stage === 'navigate_to_owner' && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
              >
                Cancel Booking
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Full Insurance Covered</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. PROGRESS STEPPER */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-[11px] font-bold text-slate-500">
          <div className={`flex items-center gap-1.5 ${stage === 'navigate_to_owner' ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
            <span>Navigate to Owner & Start OTP</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${stage === 'driving_active' ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
            <span>Self Driving</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <div className={`flex items-center gap-1.5 ${stage === 'return_handover' ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
            <span>Return Handover OTP</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <div className={`hidden sm:flex items-center gap-1.5 ${stage === 'payment' ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
            <span>Payment</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          <div className={`hidden sm:flex items-center gap-1.5 ${stage === 'feedback' ? 'text-amber-700 font-black' : 'text-slate-700'}`}>
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">5</span>
            <span>Feedback</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKFLOW CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5 flex flex-col gap-4">
        
        {/* ================= STAGE 1: NAVIGATE TO OWNER & START OTP ================= */}
        {stage === 'navigate_to_owner' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Top Navigation Map to Car Owner */}
            <div className="w-full h-[36vh] sm:h-[42vh] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-50">
              <InteractiveMap
                pickup={booking.pickup}
                destination={ownerLocationPoint}
                selectedRideType="self_drive"
                isTrackingMode={true}
              />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-300 shadow-lg flex items-center gap-2">
                <Navigation className="w-4 h-4 text-amber-600 animate-pulse" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Navigating to Car Owner</p>
                  <p className="text-xs font-black text-slate-900">{owner.hubName} (0.8 km away)</p>
                </div>
              </div>
            </div>

            {/* Grid of Owner Profile & Start OTP Handover */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Car Owner Details & Communications */}
              <div className="md:col-span-6 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={owner.avatar} 
                          alt={owner.name} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-400 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
                          ✓
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-black text-slate-900">{owner.name}</h3>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                            Car Owner
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                          <span className="flex items-center gap-0.5 text-amber-700 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            {owner.rating}
                          </span>
                          <span>•</span>
                          <span>{owner.totalTrips} Completed Rentals</span>
                        </div>
                      </div>
                    </div>

                    {/* Owner Action Buttons (Call & Chat) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="call-car-owner-btn"
                        onClick={() => setIsCallingOwner(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200 transition-colors shadow-xs cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-emerald-600" />
                        <span>Call</span>
                      </button>
                      <button
                        type="button"
                        id="chat-car-owner-btn"
                        onClick={() => setShowChatModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 transition-colors shadow-xs cursor-pointer"
                      >
                        <MessageSquare className="w-4 h-4 text-amber-600" />
                        <span>Chat</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      </button>
                    </div>
                  </div>

                  {/* Vehicle Spec Summary */}
                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-500 font-medium">Parking Hub Location</span>
                      <span className="font-bold text-slate-900 text-right">{owner.hubAddress}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 text-[11px] block">Fuel Level</span>
                        <span className="font-extrabold text-slate-900 flex items-center gap-1 text-xs mt-0.5">
                          <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                          {owner.fuelLevelPercent}% Tank Full
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 text-[11px] block">Odometer Reading</span>
                        <span className="font-extrabold text-slate-900 flex items-center gap-1 text-xs mt-0.5">
                          <Gauge className="w-3.5 h-3.5 text-slate-600" />
                          {owner.odometerKm.toLocaleString()} km
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 25% ADVANCE & 100% REFUNDABLE CONDITION GUARANTEE CARD */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 text-xs shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-emerald-950">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>25% Advance Paid (₹{advancePaid})</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-extrabold">
                      100% Refundable
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-900/90 leading-relaxed font-medium">
                    If the vehicle condition, cleanliness, scratches, fuel, or odometer differs from the owner's app listing, you are eligible for an immediate 100% refund.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(true)}
                    className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-rose-50 border border-rose-300 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Car Condition Mismatch? Claim 100% Instant Refund</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>The car owner is present at the hub. Walk up to the parking bay to inspect and unlock.</span>
                </div>
              </div>

              {/* Right Column: Owner OTP, Car Images & Odometer Reading Handover Card */}
              <div className="md:col-span-6 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-5">
                {/* Hidden File Inputs for native camera / image selection */}
                <input
                  type="file"
                  ref={carFileInputRef}
                  onChange={handleFileUploadCar}
                  accept="image/*"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={odoFileInputRef}
                  onChange={handleFileUploadOdometer}
                  accept="image/*"
                  className="hidden"
                />

                <div className="space-y-5">
                  {/* Step Header & Activation Tracker */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Key className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Handover & Pre-Ride Verification</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Complete 3 mandatory checks to activate ride</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                      isStartOtpVerified && carImages.length > 0 && odometerImage !== null
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                    }`}>
                      {Number(isStartOtpVerified) + Number(carImages.length > 0) + Number(odometerImage !== null)}/3 Completed
                    </span>
                  </div>

                  {/* REQUIREMENT 1: START OTP FROM CAR OWNER */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isStartOtpVerified
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-amber-50/50 border-amber-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isStartOtpVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {isStartOtpVerified ? '✓' : '1'}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          1. Enter Start OTP from Owner ({owner.name})
                        </h4>
                      </div>
                      {isStartOtpVerified ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setShowChatModal(true);
                            sendOwnerMessage('Please share the Start OTP for vehicle handover');
                          }}
                          className="text-[10px] font-black text-amber-900 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Ask in Chat
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 mb-3 font-medium">
                      Ask vehicle owner <strong className="text-slate-900">{owner.name}</strong> at the bay for the 4-digit start OTP to unlock ignition.
                    </p>

                    {!isStartOtpVerified ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            value={enteredStartOtp}
                            onChange={(e) => setEnteredStartOtp(e.target.value)}
                            placeholder="Enter 4-digit OTP"
                            className="flex-1 text-center text-base font-mono font-black tracking-widest py-2 px-3 bg-white rounded-xl border-2 border-amber-400 focus:border-amber-600 outline-none text-slate-900 shadow-inner"
                          />
                          <button
                            type="button"
                            id="verify-start-otp-btn"
                            onClick={handleVerifyStartOtp}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-transform active:scale-95 cursor-pointer flex items-center gap-1"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Verify OTP</span>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                          <span>Owner's Handover Code: <strong className="font-mono text-slate-800">{ownerStartOtp}</strong></span>
                          <button
                            type="button"
                            onClick={() => setEnteredStartOtp(ownerStartOtp)}
                            className="text-amber-800 font-bold hover:underline cursor-pointer"
                          >
                            Auto-Fill Code
                          </button>
                        </div>

                        {startOtpError && (
                          <p className="text-xs text-rose-600 font-bold mt-2 animate-pulse">{startOtpError}</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-emerald-100/90 text-emerald-900 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>Owner OTP Verified ({enteredStartOtp || ownerStartOtp}) • Smart Doors Unlocked</span>
                        </div>
                        <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-md font-extrabold">Ready</span>
                      </div>
                    )}
                  </div>

                  {/* REQUIREMENT 2: CAR CURRENT CONDITION IMAGES */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    carImages.length > 0
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          carImages.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                        }`}>
                          {carImages.length > 0 ? '✓' : '2'}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          2. Upload Current Car Images (Front/Sides/Rear)
                        </h4>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        carImages.length > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {carImages.length > 0 ? `${carImages.length} Uploaded ✓` : 'Required (0/1)'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mb-3 font-medium">
                      Capture or upload inspection photos of the vehicle exterior before driving to ensure transparent security deposit return.
                    </p>

                    {/* Upload Buttons & Preset Options */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => carFileInputRef.current?.click()}
                        disabled={isUploadingCarImg}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-black border border-slate-300 shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isUploadingCarImg ? 'Uploading...' : 'Upload / Camera Photo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddSampleCarImage(carImages.length)}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Quick Snap ({sampleCarPhotos[carImages.length % sampleCarPhotos.length].label})</span>
                      </button>
                    </div>

                    {/* Uploaded Car Images Gallery */}
                    {carImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {carImages.map((img) => (
                          <div key={img.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 shadow-xs">
                            <img
                              src={img.url}
                              alt={img.label}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setActivePreviewImage(img.url)}
                                className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 shadow-xs cursor-pointer"
                                title="View Image"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveCarImage(img.id)}
                                className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="absolute bottom-1 left-1 right-1 bg-slate-900/80 text-white text-[9px] font-bold px-1 py-0.5 rounded truncate text-center backdrop-blur-xs">
                              {img.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div 
                        onClick={() => carFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white/70 rounded-xl p-3 text-center cursor-pointer transition-colors"
                      >
                        <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">No car images uploaded yet</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click here to upload or select a Quick Snap preset above</p>
                      </div>
                    )}
                  </div>

                  {/* REQUIREMENT 3: ODOMETER & FUEL READING PHOTO */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    odometerImage !== null
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-slate-50 border-slate-300'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                          odometerImage !== null ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'
                        }`}>
                          {odometerImage !== null ? '✓' : '3'}
                        </span>
                        <h4 className="text-xs font-black text-slate-900">
                          3. Upload Meter & Odometer Reading Pic
                        </h4>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                        odometerImage !== null
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {odometerImage !== null ? 'Meter Verified ✓' : 'Required'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 mb-3 font-medium">
                      Capture the instrument cluster displaying current starting km (<strong className="text-slate-900">{owner.odometerKm.toLocaleString()} km</strong>) and fuel gauge (<strong className="text-slate-900">{owner.fuelLevelPercent}%</strong>).
                    </p>

                    {/* Upload Controls for Odometer */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => odoFileInputRef.current?.click()}
                        disabled={isUploadingOdoImg}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-black border border-slate-300 shadow-xs transition-colors cursor-pointer"
                      >
                        <Gauge className="w-3.5 h-3.5 text-amber-600" />
                        <span>{isUploadingOdoImg ? 'Uploading Meter...' : 'Upload Meter Photo'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddSampleOdometer}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Quick Snap Meter (24,350 km)</span>
                      </button>
                    </div>

                    {/* Odometer Image Preview */}
                    {odometerImage ? (
                      <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 flex-shrink-0">
                          <img
                            src={odometerImage.url}
                            alt="Odometer Reading"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-xs font-black text-slate-900">Starting Km: {owner.odometerKm.toLocaleString()} km</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">Fuel Level: {owner.fuelLevelPercent}% • Cluster Verified</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActivePreviewImage(odometerImage.url)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="View Photo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setOdometerImage(null)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Remove Photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => odoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-white/70 rounded-xl p-3 text-center cursor-pointer transition-colors"
                      >
                        <Gauge className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">No odometer photo uploaded</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click to upload cluster gauge image or select Quick Snap Meter</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* MANDATORY ACTIVATION CHECKLIST & START RIDE BUTTON */}
                <div className="pt-2 border-t border-slate-100">
                  {/* Status Check Chips */}
                  <div className="grid grid-cols-3 gap-1.5 mb-3 text-[10px] font-bold">
                    <div className={`p-2 rounded-xl text-center border flex flex-col items-center justify-center gap-0.5 ${
                      isStartOtpVerified 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <span className="font-extrabold">{isStartOtpVerified ? '✓' : '○'} Owner OTP</span>
                      <span className="text-[9px] opacity-80">{isStartOtpVerified ? 'Verified' : 'Pending'}</span>
                    </div>

                    <div className={`p-2 rounded-xl text-center border flex flex-col items-center justify-center gap-0.5 ${
                      carImages.length > 0 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <span className="font-extrabold">{carImages.length > 0 ? '✓' : '○'} Car Photos</span>
                      <span className="text-[9px] opacity-80">{carImages.length > 0 ? `${carImages.length} Added` : 'Missing'}</span>
                    </div>

                    <div className={`p-2 rounded-xl text-center border flex flex-col items-center justify-center gap-0.5 ${
                      odometerImage !== null 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <span className="font-extrabold">{odometerImage !== null ? '✓' : '○'} Meter Pic</span>
                      <span className="text-[9px] opacity-80">{odometerImage !== null ? 'Verified' : 'Missing'}</span>
                    </div>
                  </div>

                  {/* Primary Activation CTA: Start Ride Button */}
                  <button
                    type="button"
                    id="start-self-drive-ride-btn"
                    disabled={!(isStartOtpVerified && carImages.length > 0 && odometerImage !== null)}
                    onClick={handleStartDriving}
                    className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isStartOtpVerified && carImages.length > 0 && odometerImage !== null
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 active:scale-95 animate-pulse'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>
                      {isStartOtpVerified && carImages.length > 0 && odometerImage !== null
                        ? 'Start Driving & Open Live Navigation'
                        : 'Complete All 3 Uploads & OTP to Activate Ride'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center mt-1.5 font-medium">
                    Rental Duration: {hours} Hours ({hours * 60} mins) • 24/7 Roadside Assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 2: ACTIVE SELF-DRIVING MODE ================= */}
        {stage === 'driving_active' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Live Navigation Driving Map */}
            <div className="w-full h-[40vh] sm:h-[46vh] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-50">
              <InteractiveMap
                pickup={booking.pickup}
                destination={booking.destination}
                selectedRideType="self_drive"
                isTrackingMode={true}
              />
              {/* Floating Cockpit Dashboard Widget on Map */}
              <div className="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/90 text-white backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700 shadow-xl flex items-center justify-between sm:justify-start gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center font-mono font-black text-lg">
                    {speedKmh}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Speed</span>
                    <span className="text-xs font-bold text-emerald-400">km/h • Eco</span>
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-700" />

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Driven</span>
                  <span className="text-sm font-black text-white font-mono">{kmDriven} km</span>
                </div>

                <div className="h-8 w-px bg-slate-700" />

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Fuel Level</span>
                  <span className="text-sm font-black text-emerald-400 font-mono flex items-center gap-1">
                    <Fuel className="w-3.5 h-3.5 text-emerald-400" />
                    {fuelPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Vehicle Remote & Car Owner Live Support Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Smart Remote Controls */}
              <div className="md:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                        <Car className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Vehicle Smart Controls</h3>
                        <p className="text-[11px] text-slate-500 font-medium">Digital telemetry connected via Bluetooth & IoT</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                      Engine Running
                    </span>
                  </div>

                  {/* Remote Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                    <button
                      type="button"
                      onClick={() => setDoorsUnlocked(!doorsUnlocked)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        doorsUnlocked 
                          ? 'bg-amber-50 border-amber-400 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {doorsUnlocked ? <Unlock className="w-5 h-5 mx-auto text-amber-600" /> : <Lock className="w-5 h-5 mx-auto text-slate-600" />}
                      <span className="text-[11px] font-bold block mt-1">{doorsUnlocked ? 'Unlocked' : 'Locked'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHazardLightsOn(!hazardLightsOn)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        hazardLightsOn 
                          ? 'bg-amber-500 border-amber-600 text-slate-950 font-black animate-pulse'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <AlertTriangle className="w-5 h-5 mx-auto" />
                      <span className="text-[11px] font-bold block mt-1">Hazards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHeadlightsOn(!headlightsOn)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        headlightsOn 
                          ? 'bg-amber-50 border-amber-400 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Lightbulb className="w-5 h-5 mx-auto text-amber-600" />
                      <span className="text-[11px] font-bold block mt-1">Headlights</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHornBeeping(true);
                        setTimeout(() => setHornBeeping(false), 800);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        hornBeeping
                          ? 'bg-rose-50 border-rose-400 text-rose-800 animate-ping'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Volume2 className="w-5 h-5 mx-auto text-slate-600" />
                      <span className="text-[11px] font-bold block mt-1">{hornBeeping ? 'Beeping...' : 'Beep Horn'}</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-medium">
                    <span className="text-slate-500">Trip Duration Elapsed:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {Math.floor(tripElapsedSeconds / 60)}m {tripElapsedSeconds % 60}s / {hours} hrs
                    </span>
                  </div>
                </div>

                {/* Return Handover Action */}
                <button
                  type="button"
                  id="end-ride-return-vehicle-btn"
                  onClick={() => setStage('return_handover')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Submit Vehicle & End Ride (Ask Owner for Return OTP)</span>
                </button>
              </div>

              {/* Owner Quick Connect Card */}
              <div className="md:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <img 
                      src={owner.avatar} 
                      alt={owner.name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-amber-300 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{owner.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Vehicle Owner • Ready for Assistance</p>
                    </div>
                  </div>

                  <div className="my-3 space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsCallingOwner(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Call Owner ({owner.phone})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowChatModal(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>Live Chat with {owner.name}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                  📍 Return Hub: <strong className="text-slate-900">{owner.hubAddress}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 3: VEHICLE RETURN & OWNER RETURN OTP ================= */}
        {stage === 'return_handover' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            {/* Top Return Map to Hub */}
            <div className="w-full h-[32vh] sm:h-[38vh] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-50">
              <InteractiveMap
                pickup={booking.destination}
                destination={ownerLocationPoint}
                selectedRideType="self_drive"
                isTrackingMode={true}
              />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-300 shadow-lg flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" />
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Return Bay Handover</p>
                  <p className="text-xs font-black text-slate-900">{owner.hubName}</p>
                </div>
              </div>
            </div>

            {/* Return Inspection & Return OTP Verification Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Handover Checklist */}
              <div className="md:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Vehicle Return Handover
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">
                    Submit vehicle to <strong className="text-slate-900">{owner.name}</strong> at designated bay.
                  </p>

                  <div className="space-y-2 text-xs">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checklist.fuelChecked} 
                        onChange={(e) => setChecklist({ ...checklist, fuelChecked: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span className="font-bold text-slate-800">Fuel Level Verified ({fuelPercent}%)</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checklist.noDamage} 
                        onChange={(e) => setChecklist({ ...checklist, noDamage: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span className="font-bold text-slate-800">No Scratch / Damage Inspection</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={checklist.keysInGlovebox} 
                        onChange={(e) => setChecklist({ ...checklist, keysInGlovebox: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded" 
                      />
                      <span className="font-bold text-slate-800">Smart Key Handed Over to Owner</span>
                    </label>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Security Deposit:</span>
                  <span className="text-xs font-black text-emerald-700">₹{securityDeposit} 100% Refundable</span>
                </div>
              </div>

              {/* Owner Return OTP Verification Section */}
              <div className="md:col-span-7 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <Lock className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-black text-slate-900">Enter Car Owner's Return OTP</h3>
                    </div>

                    <button
                      type="button"
                      id="ask-owner-return-otp-chat-btn"
                      onClick={() => {
                        setShowChatModal(true);
                        sendOwnerMessage('Hi! I have parked the car at the bay. Please share the Return OTP to complete handover.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs border border-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
                      <span>Ask Owner for OTP</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 mt-2 font-medium">
                    To end your ride and submit the vehicle, ask vehicle owner <strong className="text-slate-900">{owner.name}</strong> for the 4-digit Return OTP.
                  </p>

                  {/* Return OTP Input Form */}
                  <div className="my-4 p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-400 text-center">
                    <div className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 mb-1 flex items-center justify-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>Owner's Return Verification OTP</span>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-2 max-w-xs mx-auto">
                      <input
                        type="text"
                        maxLength={4}
                        value={enteredReturnOtp}
                        onChange={(e) => setEnteredReturnOtp(e.target.value)}
                        placeholder="e.g. 4-digit OTP"
                        className="w-40 text-center text-xl font-mono font-black tracking-widest py-2.5 px-3 bg-white rounded-xl border-2 border-amber-400 focus:border-amber-600 outline-none text-slate-900 shadow-inner"
                      />
                      <button
                        type="button"
                        id="verify-return-otp-btn"
                        onClick={handleVerifyReturnOtp}
                        className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-sm transition-transform active:scale-95 cursor-pointer"
                      >
                        Submit OTP
                      </button>
                    </div>

                    {returnOtpError && (
                      <p className="text-xs text-rose-600 font-bold mt-2 animate-pulse">{returnOtpError}</p>
                    )}

                    {/* Hint to make demo seamless */}
                    <div className="mt-3 p-2 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center justify-between gap-2">
                      <span>Owner's Code (for demo): <strong className="font-mono font-black text-slate-900">{ownerReturnOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setEnteredReturnOtp(ownerReturnOtp)}
                        className="text-amber-700 hover:underline font-bold text-[10px] cursor-pointer"
                      >
                        Auto Fill
                      </button>
                    </div>
                  </div>
                </div>

                {/* Primary CTA */}
                <button
                  type="button"
                  id="finalize-handover-btn"
                  onClick={handleVerifyReturnOtp}
                  className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>End Ride & Proceed to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STAGE 4: RENTAL PAYMENT ================= */}
        {stage === 'payment' && (
          <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col gap-5 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Rental Bill & Final Settlement</h3>
                  <p className="text-xs text-slate-500 font-medium">Trip ended successfully. 25% advance already adjusted.</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Net Payable</span>
                <div className="text-xl font-black text-emerald-700">₹{netRemainingPayable}</div>
              </div>
            </div>

            {/* Itemized Fare Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base Self-Drive Rental ({hours} hrs @ ₹{baseRate}/hr):</span>
                <span className="font-bold text-slate-900 font-mono">₹{baseCost}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Distance Driven ({kmDriven} km included in package):</span>
                <span className="font-bold text-emerald-700 font-mono">₹0 (Free)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fuel Level Adjustment ({fuelPercent}% returned):</span>
                <span className="font-bold text-emerald-700 font-mono">₹0 (Normal)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST & Platform Insurance (5%):</span>
                <span className="font-bold text-slate-900 font-mono">₹{gstTax}</span>
              </div>
              <div className="flex justify-between text-slate-800 font-bold pt-1.5 border-t border-slate-200">
                <span>Total Trip Rental:</span>
                <span className="font-mono">₹{totalTripFare}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-extrabold bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Less 25% Advance Paid to Reserve:
                </span>
                <span className="font-mono">-₹{advancePaid}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Security Deposit Refund:</span>
                <span className="font-bold text-emerald-700 font-mono">+₹{securityDeposit} (Released to Bank)</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Net Remaining Balance Payable:</span>
                <span className="text-emerald-700 font-mono text-base">₹{netRemainingPayable}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-2">Select Payment Method:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'UPI', label: 'UPI (GPay / PhonePe)', icon: Smartphone },
                  { id: 'Card', label: 'Credit / Debit Card', icon: CreditCard },
                  { id: 'Wallet', label: 'RidePulse Wallet', icon: Wallet },
                  { id: 'NetBanking', label: 'Net Banking', icon: QrCode },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/30 text-emerald-950 font-black shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span className="text-xs block">{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* UPI App Picker */}
              {paymentMethod === 'UPI' && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {['gpay', 'phonepe', 'paytm'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiApp(app as any)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer ${
                          upiApp === app 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customUpiId}
                    onChange={(e) => setCustomUpiId(e.target.value)}
                    placeholder="or enter UPI ID (e.g. yourname@okaxis)"
                    className="w-full text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Card Form */}
              {paymentMethod === 'Card' && (
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-xs">
                  <div className="col-span-3">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full font-mono font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full font-mono font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full font-mono font-bold bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              type="button"
              id="pay-rental-bill-btn"
              disabled={isProcessingPayment}
              onClick={handlePayNow}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessingPayment ? (
                <span>Processing Secure Payment ₹{netRemainingPayable}...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay Balance ₹{netRemainingPayable} & Leave Review</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= STAGE 5: OPINION & FEEDBACK FOR RIDE & CAR OWNER ================= */}
        {stage === 'feedback' && (
          <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-xl flex flex-col gap-6 animate-fadeIn">
            {/* Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Trip Completed & Payment Successful!</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Please share your opinion of the self-drive ride experience and vehicle owner <strong className="text-slate-900">{owner.name}</strong>.
              </p>
            </div>

            {/* 1. Opinion of the Ride & Vehicle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900">How was the {car?.name || 'Car'}?</h4>
                  <p className="text-[11px] text-slate-500 font-medium">Rate vehicle condition, smoothness & mileage</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRideRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-5 h-5 ${star <= rideRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Ride Quality Chips */}
              <div className="flex flex-wrap gap-1.5 my-2.5">
                {['Smooth Driving', 'Spotless Interior', 'Chilled AC', 'Great Mileage', 'Easy Smart Unlock', 'Responsive Engine'].map((tag) => {
                  const isSelected = selectedRideTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedRideTags(selectedRideTags.filter((t) => t !== tag));
                        } else {
                          setSelectedRideTags([...selectedRideTags, tag]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500 text-slate-950 shadow-xs' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={rideComment}
                onChange={(e) => setRideComment(e.target.value)}
                placeholder="Write your feedback about the car performance (optional)..."
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500 text-slate-900"
              />
            </div>

            {/* 2. Opinion of the Vehicle Owner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <img 
                    src={owner.avatar} 
                    alt={owner.name} 
                    className="w-10 h-10 rounded-xl object-cover border border-amber-300"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">How was car owner {owner.name}?</h4>
                    <p className="text-[11px] text-slate-500 font-medium">Rate communication, punctuality & handover</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOwnerRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star className={`w-5 h-5 ${star <= ownerRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Owner Quality Chips */}
              <div className="flex flex-wrap gap-1.5 my-2.5">
                {['Punctual Handover', 'Polite & Friendly', 'Clear Instructions', 'Quick Chat Response', 'Trustworthy Host'].map((tag) => {
                  const isSelected = selectedOwnerTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedOwnerTags(selectedOwnerTags.filter((t) => t !== tag));
                        } else {
                          setSelectedOwnerTags([...selectedOwnerTags, tag]);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                value={ownerComment}
                onChange={(e) => setOwnerComment(e.target.value)}
                placeholder="Write a compliment for the car owner (optional)..."
                className="w-full text-xs font-medium bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>

            {/* Submit Feedback Action */}
            <button
              type="button"
              id="submit-self-drive-feedback-btn"
              onClick={handleSubmitFeedback}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Submit Review & Back to Home</span>
            </button>
          </div>
        )}
      </main>

      {/* ================= MODAL 1: LIVE IN-APP CHAT WITH CAR OWNER ================= */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg h-[540px] max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Chat Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img 
                    src={owner.avatar} 
                    alt={owner.name} 
                    className="w-10 h-10 rounded-2xl object-cover border border-amber-400"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{owner.name}</h4>
                  <p className="text-[10px] text-amber-400 font-bold">Vehicle Owner • Active Now</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {chatMessages.map((msg, idx) => {
                const isMe = msg.sender === 'rider';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium shadow-xs ${
                        isMe 
                          ? 'bg-amber-500 text-slate-950 rounded-br-none' 
                          : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-[9px] text-slate-500 block text-right mt-1">{msg.time}</span>
                    </div>
                  </div>
                );
              })}

              {isOwnerTyping && (
                <div className="flex justify-start">
                  <div className="p-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <span>{owner.name} is typing...</span>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Messages */}
            <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto text-[10px]">
              {[
                'Reached the parking bay',
                'Where are the keys?',
                'Please share Return OTP',
                'Car is clean & ready',
              ].map((qm, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendOwnerMessage(qm)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 text-slate-700 hover:text-amber-900 font-bold whitespace-nowrap cursor-pointer"
                >
                  {qm}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendOwnerMessage(inputChatText);
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputChatText}
                onChange={(e) => setInputChatText(e.target.value)}
                placeholder={`Message ${owner.name}...`}
                className="flex-1 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PHONE CALL SIMULATION WITH OWNER ================= */}
      {isCallingOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-xs bg-slate-900 text-white rounded-3xl p-6 text-center border border-slate-700 shadow-2xl flex flex-col items-center gap-4">
            <div className="relative">
              <img 
                src={owner.avatar} 
                alt={owner.name} 
                className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">{owner.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{owner.phone}</p>
              <p className="text-xs font-mono font-bold text-emerald-400 mt-2">
                Call In Progress • {Math.floor(callTimerSecs / 60)}:{(callTimerSecs % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setIsCallMuted(!isCallMuted)}
                className={`p-3 rounded-full border transition-colors cursor-pointer ${
                  isCallMuted ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsCallingOwner(false)}
                className="p-3.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg transition-transform active:scale-95"
              >
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: INSPECTION IMAGE PREVIEW LIGHTBOX ================= */}
      {activePreviewImage && (
        <div 
          onClick={() => setActivePreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 flex flex-col"
          >
            <div className="flex items-center justify-between p-3.5 bg-slate-800 border-b border-slate-700 text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold">Vehicle Pre-Trip Inspection Photo</span>
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewImage(null)}
                className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={activePreviewImage}
                alt="Inspection Preview"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 bg-slate-800 border-t border-slate-700 flex items-center justify-between text-xs text-slate-300">
              <span>Time-stamped pre-ride verification photo</span>
              <button
                type="button"
                onClick={() => setActivePreviewImage(null)}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: CONDITION DISCREPANCY & 100% INSTANT REFUND MODAL ================= */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-xs">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    {refundSuccessData ? 'Refund Processed Successfully' : '100% Advance Refund Claim'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {refundSuccessData ? 'Full advance returned with 0 deduction' : 'Vehicle condition mismatch guarantee'}
                  </p>
                </div>
              </div>
              {!refundSuccessData && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            {refundSuccessData ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-900">₹{refundSuccessData.amount} Refunded!</h4>
                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    100% of your 25% advance token has been credited back to your original payment method.
                  </p>
                </div>

                {/* Refund Receipt Details */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Refund Transaction ID:</span>
                    <strong className="font-mono text-slate-900 font-bold">{refundSuccessData.txnId}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Original Advance Paid:</span>
                    <strong className="text-slate-900 font-bold">₹{refundSuccessData.amount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Cancellation Fee Deducted:</span>
                    <strong className="text-emerald-700 font-bold">₹0 (100% Free)</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Amount Credited:</span>
                    <strong className="text-emerald-700 text-sm font-black">₹{refundSuccessData.amount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-emerald-200">
                    <span>Time Stamp:</span>
                    <span className="text-slate-700 font-medium">{refundSuccessData.time}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 font-medium">
                  We apologize for the condition discrepancy. The vehicle owner has been notified to correct the listing details.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    onCancel();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  Acknowledge & Return to Booking Screen
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Assurance notice */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed font-medium">
                  <strong>RidePulse Condition Promise:</strong> If the car's exterior, interior, fuel level, or odometer does not match the app listing, you are entitled to a <strong>100% instant full refund of ₹{advancePaid}</strong>.
                </div>

                {/* Select Discrepancy Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-2">
                    Select Condition Discrepancy:
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'condition_mismatch', label: 'Exterior Scratches / Dents not listed in app' },
                      { id: 'cleanliness', label: 'Interior unclean / dirty seats / unpleasant odor' },
                      { id: 'fuel_odometer', label: 'Fuel level or odometer differs significantly from app' },
                      { id: 'mechanical_issue', label: 'AC not cooling / warning lights / mechanical issue' },
                      { id: 'owner_unavailable', label: 'Owner unavailable or car handover issues' },
                    ].map((reason) => (
                      <label
                        key={reason.id}
                        onClick={() => setRefundReason(reason.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                          refundReason === reason.id
                            ? 'bg-rose-50/70 border-rose-400 font-bold text-rose-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="radio"
                          name="refund_reason"
                          checked={refundReason === reason.id}
                          onChange={() => setRefundReason(reason.id)}
                          className="accent-rose-600"
                        />
                        <span>{reason.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Describe Discrepancy (Optional):
                  </label>
                  <textarea
                    rows={2}
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    placeholder="e.g. Deep scratch on left rear door and fuel gauge is at 40% instead of 92%..."
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-400"
                  />
                </div>

                {/* Refund Summary Card */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">100% Refundable Amount:</span>
                    <strong className="text-sm font-black text-emerald-700">₹{advancePaid}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Cancellation Penalty:</span>
                    <strong className="text-emerald-700 font-bold">₹0 (Zero Charges)</strong>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRefundModal(false)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Keep Reservation
                  </button>
                  <button
                    type="button"
                    id="confirm-100-refund-btn"
                    disabled={isProcessingRefund}
                    onClick={handleProcessRefund}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isProcessingRefund ? 'Processing Full Refund...' : `Process 100% Refund (₹${advancePaid})`}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
