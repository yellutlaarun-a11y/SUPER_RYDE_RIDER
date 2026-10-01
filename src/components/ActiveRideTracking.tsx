import React, { useState, useEffect, useRef } from 'react';
import { ActiveBooking, BookingStatus } from '../types';
import { InteractiveMap } from './InteractiveMap';
import { 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Key, 
  Clock, 
  MapPin, 
  Star, 
  Car, 
  Bike, 
  Package, 
  AlertTriangle, 
  Share2, 
  CheckCircle2, 
  X,
  Navigation,
  Sparkles,
  Lock,
  Send,
  CheckCheck,
  Headphones
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ActiveRideTrackingProps {
  booking: ActiveBooking;
  onCancelRide: () => void;
  onCompleteTrip: () => void;
  onOpenMusicPlayer?: () => void;
}

const PREDEFINED_QUICK_MESSAGES = [
  'I am at the gate',
  'Coming soon',
  'Coming down in 2 mins',
  'I am waiting near the main entrance',
  'Which color is your vehicle?',
  'I am wearing a blue shirt',
  'Reached the pickup spot'
];

export const ActiveRideTracking: React.FC<ActiveRideTrackingProps> = ({
  booking,
  onCancelRide,
  onCompleteTrip,
  onOpenMusicPlayer,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(180);
  const [tripStatus, setTripStatus] = useState<BookingStatus>('captain_arriving');
  const [showSosAlert, setShowSosAlert] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isCaptainTyping, setIsCaptainTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'captain' | 'rider'; text: string; time: string }>>([
    { sender: 'captain', text: 'Hi! I am on my way to your pickup location.', time: 'Just now' },
  ]);
  const [inputChatText, setInputChatText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest chat message
  useEffect(() => {
    if (showChatModal) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isCaptainTyping, showChatModal]);

  // Live countdown timer for captain arrival
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 10 && tripStatus === 'captain_arriving') {
          setTripStatus('captain_arrived');
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [tripStatus]);

  // Send a message (either typed or from quick-defined buttons)
  const sendRiderMessage = (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setChatMessages((prev) => [
      ...prev,
      { sender: 'rider', text: trimmed, time: currentTime },
    ]);
    setInputChatText('');

    // Simulate captain typing and tailored response
    setIsCaptainTyping(true);

    setTimeout(() => {
      setIsCaptainTyping(false);
      let reply = 'Understood! Reaching your exact spot now.';
      const lower = trimmed.toLowerCase();

      if (lower.includes('gate') || lower.includes('entrance')) {
        reply = 'Got it! I am pulling up right next to the main gate now.';
      } else if (lower.includes('coming') || lower.includes('min') || lower.includes('soon')) {
        reply = 'Sure, take your time! I am parked safely with hazard lights on.';
      } else if (lower.includes('color') || lower.includes('vehicle')) {
        reply = `I am driving a ${booking.captain.vehicleModel} (${booking.captain.vehicleNumber}).`;
      } else if (lower.includes('wearing') || lower.includes('shirt') || lower.includes('jacket')) {
        reply = 'Noted! I will keep an eye out for you.';
      } else if (lower.includes('reached') || lower.includes('pickup')) {
        reply = 'Great! Looking out for you now. Please verify start OTP ' + booking.otp + ' upon boarding.';
      }

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [
        ...prev,
        { sender: 'captain', text: reply, time: replyTime },
      ]);
    }, 1200);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendRiderMessage(inputChatText);
  };

  const handleFinishRide = () => {
    try {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
    } catch {
      // ignore
    }
    onCompleteTrip();
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col pb-28 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-900">Live Ride Tracking</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{tripStatus === 'captain_arrived' ? 'Captain Arrived' : 'Captain Arriving'}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Booking ID: #{booking.bookingCode}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* SOS Emergency Button */}
          <button
            onClick={() => setShowSosAlert(true)}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>SOS</span>
          </button>

          {/* Share trip button */}
          <button
            onClick={() => alert(`Live ride tracking link copied for ${booking.destination.name}`)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-colors"
            title="Share Live Trip"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. TOP GOOGLE MAPS */}
      <div className="w-full h-[40vh] sm:h-[45vh] relative border-b border-slate-200 shadow-md">
        <InteractiveMap
          pickup={booking.pickup}
          destination={booking.destination}
          selectedRideType={booking.rideType}
          activeBookingStatus={tripStatus}
          captain={booking.captain}
          isTrackingMode={true}
        />
      </div>

      {/* 2. COMPONENT BELOW GOOGLE MAPS (OTP, Captain Info, Arrival Estimation) */}
      <div className="max-w-2xl mx-auto w-full p-4 flex flex-col gap-4">
        
        {/* A. OTP INFORMATION COMPONENT */}
        <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-400 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Ride Start OTP Code
              </span>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                Share this PIN with Captain <strong className="text-slate-900">{booking.captain.name.split(' ')[0]}</strong> before boarding
              </p>
            </div>
          </div>

          <div className="text-center bg-white px-4 py-2 rounded-xl border border-emerald-300 shadow-sm">
            <div className="text-2xl font-black font-mono tracking-widest text-emerald-700">
              {booking.otp}
            </div>
            <span className="text-[9px] text-slate-500 uppercase font-bold">Start OTP</span>
          </div>
        </div>

        {/* B. CAPTAIN INFORMATION COMPONENT */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Captain & Vehicle Details
            </span>
            <div className="flex items-center gap-1 text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{booking.captain.rating} ({booking.captain.totalTrips}+ trips)</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Captain Avatar and Vehicle */}
            <div className="flex items-center gap-3.5">
              <img
                src={booking.captain.photo}
                alt={booking.captain.name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-300 shadow-sm flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{booking.captain.name}</h3>
                <div className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-0.5">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span>{booking.captain.vehicleModel}</span>
                </div>
                <div className="mt-1 inline-block font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {booking.captain.vehicleNumber}
                </div>
              </div>
            </div>

            {/* Quick Contact Action Buttons */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {onOpenMusicPlayer && (
                <button
                  type="button"
                  onClick={onOpenMusicPlayer}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-2xs"
                  title="Play Google Music on In-Cab Speakers"
                >
                  <Headphones className="w-4 h-4 text-rose-600" />
                  <span>In-Cab Music</span>
                </button>
              )}

              <a
                href={`tel:${booking.captain.phone}`}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Call Captain</span>
              </a>

              <button
                onClick={() => setShowChatModal(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* C. TRIP ROUTE & FARE BREAKDOWN */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 uppercase tracking-wider">Trip Itinerary</span>
              {booking.tripMode === 'round_trip' && (
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Round Trip (Two-Way)
                </span>
              )}
            </div>
            <span className="font-bold text-emerald-700">Total Fare: ₹{booking.fare} ({booking.paymentMethod})</span>
          </div>

          <div className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-400 flex items-center justify-center mt-0.5 text-[9px] font-bold">
                P
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">{booking.pickup.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{booking.pickup.address}</div>
              </div>
            </div>

            <div className="ml-2 w-0.5 h-3 bg-slate-200 border-l border-dashed" />

            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-800 border border-rose-400 flex items-center justify-center mt-0.5 text-[9px] font-bold">
                D
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">{booking.destination.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{booking.destination.address}</div>
              </div>
            </div>

            {booking.tripMode === 'round_trip' && (
              <>
                <div className="ml-2 w-0.5 h-3 bg-indigo-200 border-l border-dashed" />
                <div className="flex items-start gap-2.5 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                  <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-400 flex items-center justify-center mt-0.5 text-[9px] font-bold">
                    R
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-indigo-950 flex items-center gap-1">
                      <span>Return: {booking.pickup.name}</span>
                      <span className="text-[9px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.2 rounded font-bold">
                        {booking.roundTripDetails?.returnWaitMinutes || 30}m driver wait
                      </span>
                    </div>
                    <div className="text-[11px] text-indigo-700">Driver will wait and return back to origin</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* TRIP ACTIONS */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancelRide}
            className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 border border-slate-200 text-xs font-bold transition-colors"
          >
            Cancel Ride
          </button>

          <button
            id="finish-trip-simulation-btn"
            onClick={handleFinishRide}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Ride & Return</span>
          </button>
        </div>
      </div>

      {/* CHAT WITH CAPTAIN MODAL */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col h-[520px]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={booking.captain.photo}
                    alt={booking.captain.name}
                    className="w-10 h-10 rounded-2xl object-cover border border-emerald-300 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900">{booking.captain.name}</h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-600 border border-slate-200">
                      {booking.captain.vehicleNumber}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Driving to pickup ({booking.captain.vehicleModel})</span>
                  </p>
                </div>
              </div>
              <button 
                id="close-chat-modal-btn"
                onClick={() => setShowChatModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto py-3 px-1 flex flex-col gap-2.5">
              <div className="text-center my-1">
                <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  Chatting securely with Captain
                </span>
              </div>

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[82%] p-3 rounded-2xl text-xs shadow-2xs ${
                    msg.sender === 'rider'
                      ? 'ml-auto bg-emerald-600 text-white rounded-br-xs'
                      : 'mr-auto bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  <p className="leading-relaxed font-medium">{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                    <span>{msg.time}</span>
                    {msg.sender === 'rider' && (
                      <CheckCheck className="w-3 h-3 text-emerald-200" />
                    )}
                  </div>
                </div>
              ))}

              {/* Captain Typing Indicator */}
              {isCaptainTyping && (
                <div className="mr-auto bg-slate-100 text-slate-700 rounded-2xl rounded-bl-xs border border-slate-200 px-3.5 py-2 flex items-center gap-1.5 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500">Captain is typing</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Pre-defined Quick Messages Carousel */}
            <div className="pt-2 pb-1 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Quick replies to Captain
                </span>
                <span className="text-[9px] text-slate-500">Tap to send</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                {PREDEFINED_QUICK_MESSAGES.map((msg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendRiderMessage(msg)}
                    className="flex-shrink-0 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 hover:border-emerald-300 text-[11px] font-bold transition-all active:scale-95 shadow-2xs"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Message Input Bar */}
            <form onSubmit={handleSendMessage} className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <input
                id="captain-chat-text-input"
                type="text"
                value={inputChatText}
                onChange={(e) => setInputChatText(e.target.value)}
                placeholder="Type a message to Captain..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium transition-all shadow-inner"
              />
              <button
                id="send-captain-chat-btn"
                type="submit"
                disabled={!inputChatText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOS EMERGENCY DIALOG */}
      {showSosAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white border-2 border-rose-500 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">Emergency Safety SOS</h3>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Triggering SOS immediately alerts the 24/7 RidePulse Safety Control Desk and sends your live GPS coordinates to local emergency services.
            </p>

            <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-left">
              <div className="text-slate-500 font-semibold">National Emergency Helpline:</div>
              <div className="font-bold text-slate-900">112 / +91 1800-112-911</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSosAlert(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Emergency alert dispatched to RidePulse Safety Control and Emergency Services.');
                  setShowSosAlert(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md"
              >
                Confirm SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
