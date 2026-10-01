import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  User, 
  Phone, 
  KeyRound, 
  X, 
  CheckCircle2, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Send, 
  RotateCcw,
  Star,
  Wallet,
  Clock,
  LogIn,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth, googleProvider, signInWithPopup, signInAnonymously, signOut } from '../lib/firebase';
import { syncUserProfileToFirestore, buildUserProfileFromFirebase } from '../services/firebaseDb';

interface RiderAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const RiderAuthModal: React.FC<RiderAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [riderName, setRiderName] = useState('Rahul Sharma');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let interval: any;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  if (!isOpen) return null;

  // Firebase Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setErrorMessage('');
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const userProfile = buildUserProfileFromFirebase(res.user, currentUser);
      await syncUserProfileToFirestore(userProfile);
      onLoginSuccess(userProfile);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        setErrorMessage('Popup was blocked by browser. You can sign in using Phone OTP or Guest.');
      } else if (err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
        setErrorMessage(
          'Firebase Web API Key needs to be updated for project super-ryde-production-61e7e. Please copy your Web API Key from Firebase Console > Project Settings. You can also sign in directly via Phone OTP or Guest session below.'
        );
      } else {
        setErrorMessage(err.message || 'Failed to sign in with Google. You can use Phone OTP.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Firebase Guest / Anonymous Sign-In Handler
  const handleGuestSignIn = async () => {
    setIsAuthLoading(true);
    setErrorMessage('');
    
    const fallbackGuestId = `guest_${Date.now()}`;
    const guestProfile: UserProfile = {
      id: fallbackGuestId,
      name: 'Guest Explorer',
      phone: '+91 99887 76655',
      email: 'guest@ridepulse.in',
      rating: 5.0,
      walletBalance: 500.0,
      savedPlaces: {
        home: {
          id: 'saved_home',
          name: 'Home Apartment',
          address: '42 Pine Crest Avenue, Koramangala',
          lat: 12.9352,
          lng: 77.6245,
          type: 'custom',
        },
        work: {
          id: 'saved_work',
          name: 'Tech Innovation Hub',
          address: 'Gate 2, Cyber Heights, Outer Ring Road',
          lat: 12.9279,
          lng: 77.6821,
          type: 'tech_park',
        },
        favorites: [],
      },
      emergencyContact: {
        name: 'Support Helpdesk',
        phone: '1800-123-9999',
      },
    };

    try {
      const res = await signInAnonymously(auth);
      guestProfile.id = res.user.uid;
      await syncUserProfileToFirestore(guestProfile);
      onLoginSuccess(guestProfile);
      try {
        confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      onClose();
    } catch (err: any) {
      console.warn('Guest Auth Notice:', err?.message || err);
      // Seamless fallback so the user is never locked out of testing the app
      if (err.code === 'auth/api-key-not-valid' || err.message?.includes('api-key-not-valid')) {
        onLoginSuccess(guestProfile);
        try {
          confetti({ particleCount: 60, spread: 50, origin: { y: 0.6 } });
        } catch {
          // ignore
        }
        onClose();
      } else {
        setErrorMessage(err.message || 'Failed to initialize guest session.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits)');
      return;
    }

    setErrorMessage('');
    // Generate 4-digit random OTP
    const newOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(newOtp);
    setOtpSent(true);
    setResendTimer(30);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp && enteredOtp !== '1234') {
      setErrorMessage(`Invalid OTP. Please enter ${generatedOtp} (or 1234).`);
      return;
    }

    setIsAuthLoading(true);
    try {
      // Success login with Firestore persistence
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: riderName || 'Rahul Sharma',
        phone: phoneNumber.startsWith('+') ? phoneNumber : `+91 ${phoneNumber}`,
        email: `${(riderName || 'rider').toLowerCase().replace(/\s+/g, '.')}@ridepulse.in`,
        rating: 4.95,
        walletBalance: 850.0,
        savedPlaces: {
          home: {
            id: 'saved_home',
            name: 'Home Apartment',
            address: '42 Pine Crest Avenue, Koramangala',
            lat: 12.9352,
            lng: 77.6245,
            type: 'custom',
          },
          work: {
            id: 'saved_work',
            name: 'Tech Innovation Hub',
            address: 'Gate 2, Cyber Heights, Outer Ring Road',
            lat: 12.9279,
            lng: 77.6821,
            type: 'tech_park',
          },
          favorites: [],
        },
        emergencyContact: {
          name: 'Family Support',
          phone: '+91 98765 43210',
        },
      };

      await syncUserProfileToFirestore(newUser);
      onLoginSuccess(newUser);
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } catch {
        // ignore
      }
      onClose();
    } catch (err: any) {
      console.error('Error during OTP verification:', err);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('SignOut error:', err);
    }
    onLogout();
    setOtpSent(false);
    setEnteredOtp('');
    setPhoneNumber('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LOGGED IN USER PROFILE VIEW */}
        {currentUser ? (
          <div>
            <div className="flex items-center gap-3.5 mb-5 border-b border-slate-100 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-black text-slate-900">{currentUser.name}</h3>
                  <span className="flex items-center gap-0.5 text-xs text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    {currentUser.rating}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">{currentUser.phone}</p>
                <div className="flex items-center gap-1 text-[11px] text-emerald-700 mt-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cloud Synced with Firebase</span>
                </div>
              </div>
            </div>

            {/* Account Quick Stats */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  Wallet Balance
                </span>
                <div className="text-lg font-black text-emerald-700 mt-1">
                  ₹{currentUser.walletBalance.toFixed(2)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  Firestore Sync
                </span>
                <div className="text-xs font-black text-emerald-700 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                </div>
              </div>
            </div>

            {/* Logout Option Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>

              <button
                id="rider-logout-btn"
                onClick={handleLogoutClick}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout Rider Session</span>
              </button>
            </div>
          </div>
        ) : (
          /* LOGIN / REGISTRATION WITH PHONE NUMBER & GOOGLE AUTH FLOW */
          <div>
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">Rider Login & Registration</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                    Firebase Auth
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Cloud account sync & instant verification</p>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-medium mb-4">
                {errorMessage}
              </div>
            )}

            {/* 1-CLICK SOCIAL / GOOGLE SIGN IN */}
            <div className="flex flex-col gap-2 mb-4">
              <button
                id="google-firebase-signin-btn"
                type="button"
                disabled={isAuthLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google Account</span>
              </button>

              <button
                id="guest-firebase-signin-btn"
                type="button"
                disabled={isAuthLoading}
                onClick={handleGuestSignIn}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Guest Access (Pre-loaded ₹500 Wallet)</span>
              </button>
            </div>

            <div className="flex items-center gap-3 my-3.5 text-slate-400 text-xs">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="font-semibold text-[11px] text-slate-400 uppercase tracking-wider">Or with Mobile Number</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {!otpSent ? (
              /* STEP 1: ENTER PHONE NUMBER */
              <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700 flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="9876543210"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-900 text-xs border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <button
                  id="send-otp-login-btn"
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Send OTP Verification Code</span>
                </button>
              </form>
            ) : (
              /* STEP 2: VERIFY OTP */
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
                <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 text-center">
                  <span className="font-semibold">SMS Code sent: </span>
                  <strong className="font-mono text-sm font-black text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-300">
                    {generatedOtp}
                  </strong>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1 text-center">
                    Enter 4-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    autoFocus
                    required
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value)}
                    placeholder="••••"
                    className="w-full text-center tracking-[1em] text-xl font-mono font-black py-2.5 rounded-xl bg-slate-50 text-slate-900 border-2 border-emerald-400 focus:outline-none shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Didn't receive code?</span>
                  {resendTimer > 0 ? (
                    <span className="text-slate-400 font-mono">Resend in {resendTimer}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Resend OTP
                    </button>
                  )}
                </div>

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Verify OTP & Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-center text-xs text-slate-500 hover:text-slate-800 font-medium mt-0.5"
                >
                  Change Phone Number
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

