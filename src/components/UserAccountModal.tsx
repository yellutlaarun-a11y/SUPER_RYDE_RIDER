import React, { useState, useEffect } from 'react';
import { UserProfile, LocationPoint, RideHistoryItem, RideType } from '../types';
import { 
  User, 
  Wallet, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  Plus, 
  LogOut, 
  Star, 
  ChevronRight, 
  Phone, 
  Mail, 
  X,
  Sparkles,
  CheckCircle2,
  Car,
  Bike,
  Package,
  Users,
  Search,
  RotateCw,
  Download,
  ArrowRight,
  TrendingUp,
  Receipt,
  Route,
  PhoneCall,
  Gift,
  Copy,
  Check,
  Share2,
  Award,
  Coins,
  MessageSquareShare,
  PartyPopper
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferralItem {
  id: string;
  name: string;
  avatar: string;
  status: 'completed' | 'claimable' | 'pending';
  rewardAmount: number;
  date: string;
  note: string;
}

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSelectSavedPlace?: (place: LocationPoint) => void;
  onRebookRoute?: (pickupText: string, destinationText: string, rideType: RideType) => void;
  onUpdateWalletBalance?: (newBalance: number) => void;
  onOpenCompletedTrips?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onOpenAuth,
  onLogout,
  onSelectSavedPlace,
  onRebookRoute,
  onUpdateWalletBalance,
  onOpenCompletedTrips,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'referral' | 'history'>('profile');
  const [walletBalance, setWalletBalance] = useState(user ? user.walletBalance : 850.0);
  const [showTopUpFeedback, setShowTopUpFeedback] = useState(false);
  const [topUpFeedbackMessage, setTopUpFeedbackMessage] = useState('Funds added successfully!');

  // Unique Referral Program State
  const referralCode = user 
    ? `RP-${user.name.split(' ')[0].toUpperCase()}100` 
    : 'RP-RIDER100';

  const [isCopied, setIsCopied] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [isFriendCodeApplied, setIsFriendCodeApplied] = useState(false);
  const [friendCodeStatus, setFriendCodeStatus] = useState<{ message: string; isError?: boolean } | null>(null);

  const [referrals, setReferrals] = useState<ReferralItem[]>([
    {
      id: 'ref_1',
      name: 'Priya Verma',
      avatar: 'PV',
      status: 'completed',
      rewardAmount: 100,
      date: '18 Sep 2026',
      note: 'Completed 1st Sedan Cab Ride'
    },
    {
      id: 'ref_2',
      name: 'Amit Patel',
      avatar: 'AP',
      status: 'completed',
      rewardAmount: 100,
      date: '12 Sep 2026',
      note: 'Completed 1st Bike Express Ride'
    },
    {
      id: 'ref_3',
      name: 'Sneha Reddy',
      avatar: 'SR',
      status: 'claimable',
      rewardAmount: 100,
      date: 'Today, 01:20 PM',
      note: 'Completed 1st Airport Trip (Ready to Claim)'
    },
    {
      id: 'ref_4',
      name: 'Karthik Rao',
      avatar: 'KR',
      status: 'pending',
      rewardAmount: 100,
      date: 'Yesterday',
      note: 'Registered • First Ride in Progress'
    }
  ]);

  // Sync internal balance when user changes
  useEffect(() => {
    if (user) {
      setWalletBalance(user.walletBalance);
    }
  }, [user]);

  // Ride History State
  const [rideHistory, setRideHistory] = useState<RideHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback initial dataset
  const fallbackRides: RideHistoryItem[] = [
    {
      id: "hist_101",
      bookingCode: "RP-8842",
      date: "Today, 02:40 PM",
      timestamp: "2026-09-21T14:40:00Z",
      rideType: "cab",
      cabCategory: "sedan",
      pickup: {
        name: "Cyber Heights Tech Park",
        address: "Gate 2, Outer Ring Road, Silicon Sector"
      },
      destination: {
        name: "Metropolis Grand Mall",
        address: "South Concourse, City Center Road"
      },
      fare: 280,
      paymentMethod: "RidePulse Wallet",
      status: "Completed",
      rating: 5,
      distanceKm: 8.4,
      durationMins: 18,
      captain: {
        name: "Ramesh Babu",
        phone: "+91 98450 11223",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        vehicleModel: "Hyundai Aura EV",
        vehicleNumber: "AP 27 AX 4092",
        rating: 4.96,
        totalTrips: 1840
      }
    },
    {
      id: "hist_102",
      bookingCode: "RP-8210",
      date: "Yesterday, 09:15 AM",
      timestamp: "2026-09-20T09:15:00Z",
      rideType: "bike",
      pickup: {
        name: "Grand Central Plaza",
        address: "Sector 4, Main Highway Junction"
      },
      destination: {
        name: "Greenwood Metro Interchange",
        address: "Platform Concourse B, Station Road"
      },
      fare: 75,
      paymentMethod: "UPI",
      status: "Completed",
      rating: 5,
      distanceKm: 4.2,
      durationMins: 9,
      captain: {
        name: "Kalyan Kumar",
        phone: "+91 97000 88991",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        vehicleModel: "TVS Apache RTR",
        vehicleNumber: "AP 27 BB 1002",
        rating: 4.92,
        totalTrips: 2150
      }
    },
    {
      id: "hist_103",
      bookingCode: "RP-7901",
      date: "18 Sep, 07:30 PM",
      timestamp: "2026-09-18T19:30:00Z",
      rideType: "auto",
      pickup: {
        name: "RIMS Multi-Speciality Hospital",
        address: "Emergency Gate 1, Santhapeta"
      },
      destination: {
        name: "Home Apartment",
        address: "42 Pine Crest Avenue, Koramangala 4th Block"
      },
      fare: 110,
      paymentMethod: "Cash",
      status: "Completed",
      rating: 5,
      distanceKm: 3.8,
      durationMins: 11,
      captain: {
        name: "Srinivas Rao",
        phone: "+91 94401 22334",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        vehicleModel: "Bajaj RE Green CNG",
        vehicleNumber: "AP 27 TA 8841",
        rating: 4.88,
        totalTrips: 3420
      }
    },
    {
      id: "hist_104",
      bookingCode: "RP-7412",
      date: "15 Sep, 03:10 PM",
      timestamp: "2026-09-15T15:10:00Z",
      rideType: "courier",
      pickup: {
        name: "Silicon Avenue Warehouse",
        address: "Dock 4, Industrial Zone"
      },
      destination: {
        name: "World Trade Towers",
        address: "Tower 2, Floor 14, Client Office"
      },
      fare: 160,
      paymentMethod: "Card",
      status: "Delivered",
      rating: 5,
      distanceKm: 6.9,
      durationMins: 16,
      captain: {
        name: "Venkat Reddy",
        phone: "+91 99887 76655",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
        vehicleModel: "Tata Ace Delivery Van",
        vehicleNumber: "AP 27 D 5590",
        rating: 4.95,
        totalTrips: 980
      }
    },
    {
      id: "hist_105",
      bookingCode: "RP-6890",
      date: "10 Sep, 08:00 AM",
      timestamp: "2026-09-10T08:00:00Z",
      rideType: "carpooling",
      pickup: {
        name: "Santhapeta Clock Tower",
        address: "Main Circle Bus Bay"
      },
      destination: {
        name: "Tech Hub Innovation Park",
        address: "Main Gate, High-Tech Campus"
      },
      fare: 80,
      paymentMethod: "RidePulse Wallet",
      status: "Completed",
      rating: 5,
      distanceKm: 9.1,
      durationMins: 20,
      captain: {
        name: "Vikram Mehta",
        phone: "+91 98112 33445",
        photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
        vehicleModel: "Maruti Suzuki Ertiga",
        vehicleNumber: "AP 27 CP 7711",
        rating: 4.97,
        totalTrips: 410
      }
    }
  ];

  // Fetch Ride History from Server
  const fetchRideHistory = async (filterKey: string = selectedFilter) => {
    setIsLoadingHistory(true);
    try {
      const url = filterKey === 'all' 
        ? '/api/ride-history' 
        : `/api/ride-history?filter=${filterKey}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.rides)) {
          setRideHistory(data.rides);
          return;
        }
      }
      // Fallback
      if (filterKey === 'all') {
        setRideHistory(fallbackRides);
      } else {
        setRideHistory(fallbackRides.filter((r) => r.rideType === filterKey));
      }
    } catch {
      if (filterKey === 'all') {
        setRideHistory(fallbackRides);
      } else {
        setRideHistory(fallbackRides.filter((r) => r.rideType === filterKey));
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRideHistory(selectedFilter);
    }
  }, [isOpen, selectedFilter]);

  if (!isOpen) return null;

  const handleAddFunds = (amount: number) => {
    const newBal = walletBalance + amount;
    setWalletBalance(newBal);
    if (onUpdateWalletBalance) onUpdateWalletBalance(newBal);
    setTopUpFeedbackMessage(`₹${amount} added successfully to your wallet!`);
    setShowTopUpFeedback(true);
    setTimeout(() => setShowTopUpFeedback(false), 2500);
    try {
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
    } catch {
      // ignore
    }
  };

  // Referral Calculations
  const completedReferrals = referrals.filter(r => r.status === 'completed');
  const claimableReferrals = referrals.filter(r => r.status === 'claimable');
  const pendingReferrals = referrals.filter(r => r.status === 'pending');
  const totalEarnedCash = completedReferrals.reduce((sum, r) => sum + r.rewardAmount, 0);
  const totalClaimableCash = claimableReferrals.reduce((sum, r) => sum + r.rewardAmount, 0);

  // Referral Actions
  const handleCopyReferralCode = () => {
    try {
      navigator.clipboard.writeText(referralCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleShareReferralCode = async () => {
    const shareText = `🚀 Join me on RidePulse! Use my referral code ${referralCode} to get flat ₹50 OFF on your first ride, and earn cash rewards! Download & Ride: ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RidePulse - Invite & Earn',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {}
    }
    // WhatsApp direct share fallback
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleClaimReward = (referralId?: string) => {
    let rewardToClaim = 0;
    if (referralId) {
      const item = referrals.find(r => r.id === referralId);
      if (item && item.status === 'claimable') {
        rewardToClaim = item.rewardAmount;
        setReferrals(referrals.map(r => r.id === referralId ? { ...r, status: 'completed', note: 'Reward Claimed to Wallet Balance' } : r));
      }
    } else {
      rewardToClaim = totalClaimableCash;
      setReferrals(referrals.map(r => r.status === 'claimable' ? { ...r, status: 'completed', note: 'Reward Claimed to Wallet Balance' } : r));
    }

    if (rewardToClaim > 0) {
      const newBal = walletBalance + rewardToClaim;
      setWalletBalance(newBal);
      if (onUpdateWalletBalance) onUpdateWalletBalance(newBal);
      setTopUpFeedbackMessage(`🎉 ₹${rewardToClaim} Referral Reward credited directly to your Wallet!`);
      setShowTopUpFeedback(true);
      setTimeout(() => setShowTopUpFeedback(false), 3500);
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
        });
      } catch {}
    }
  };

  const handleApplyFriendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;
    const cleaned = friendCodeInput.trim().toUpperCase();
    if (cleaned === referralCode) {
      setFriendCodeStatus({ message: 'You cannot use your own referral code.', isError: true });
      return;
    }
    if (isFriendCodeApplied) {
      setFriendCodeStatus({ message: 'You have already redeemed a referral code for this account.', isError: true });
      return;
    }
    
    // Award ₹50 welcome discount reward
    setIsFriendCodeApplied(true);
    const bonus = 50;
    const newBal = walletBalance + bonus;
    setWalletBalance(newBal);
    if (onUpdateWalletBalance) onUpdateWalletBalance(newBal);
    setFriendCodeStatus({ message: `Success! Code '${cleaned}' applied. ₹${bonus} credited to your Wallet! 🎉` });
    try {
      confetti({
        particleCount: 75,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#10B981', '#059669', '#34D399']
      });
    } catch {}
  };

  // Filtered rides by search query
  const displayedRides = rideHistory.filter((ride) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      ride.bookingCode.toLowerCase().includes(query) ||
      ride.pickup.name.toLowerCase().includes(query) ||
      ride.destination.name.toLowerCase().includes(query) ||
      ride.captain.name.toLowerCase().includes(query) ||
      ride.captain.vehicleModel.toLowerCase().includes(query)
    );
  });

  const getRideTypeIcon = (type: RideType) => {
    switch (type) {
      case 'bike':
        return <Bike className="w-4 h-4 text-amber-600" />;
      case 'courier':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'carpooling':
        return <Users className="w-4 h-4 text-teal-600" />;
      case 'auto':
        return <Car className="w-4 h-4 text-emerald-600" />;
      case 'cab':
      default:
        return <Car className="w-4 h-4 text-blue-600" />;
    }
  };

  const getRideTypeLabel = (ride: RideHistoryItem) => {
    if (ride.rideType === 'cab') {
      return `Cab ${ride.cabCategory ? ride.cabCategory.toUpperCase() : 'Sedan'}`;
    }
    if (ride.rideType === 'bike') return 'Bike Express';
    if (ride.rideType === 'auto') return 'Auto CNG';
    if (ride.rideType === 'courier') return 'Courier Van';
    if (ride.rideType === 'carpooling') return 'Carpool Share';
    return 'Ride';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header & Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 pr-8 overflow-x-auto">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <button
              id="user-account-profile-tab"
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Profile & Wallet
            </button>
            <button
              id="user-account-referral-tab"
              onClick={() => setActiveTab('referral')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'referral'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-950" />
              <span>Refer & Earn</span>
              {totalClaimableCash > 0 ? (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-600 text-white animate-pulse">
                  +₹{totalClaimableCash}
                </span>
              ) : (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                  ₹100
                </span>
              )}
            </button>
            <button
              id="user-account-ride-history-tab"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ride History</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
                {rideHistory.length}
              </span>
            </button>
          </div>
        </div>

        {/* User Card Content */}
        {user ? (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            
            {/* TAB 1: PROFILE & WALLET VIEW */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* User Summary Header */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900">{user.name}</h3>
                      <span className="flex items-center gap-0.5 text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{user.rating}</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">{user.phone} • {user.email}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 mt-1 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Gold Level Tier • {rideHistory.length || 28} Verified Rides Completed</span>
                    </div>
                  </div>
                </div>

                {/* RidePulse Wallet Section */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-300 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">RidePulse Cash Wallet (₹)</span>
                    </div>
                    <span className="text-lg font-black text-emerald-800">₹{walletBalance.toFixed(2)}</span>
                  </div>

                  {showTopUpFeedback && (
                    <div className="text-[11px] text-emerald-700 font-bold mb-2 flex items-center gap-1 bg-emerald-100/70 p-1.5 rounded-lg border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{topUpFeedbackMessage}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Quick Recharge:</span>
                    {[100, 250, 500, 1000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => handleAddFunds(amt)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-emerald-700 text-xs font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        +₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Refer & Earn Promo Banner in Profile */}
                <div 
                  onClick={() => setActiveTab('referral')}
                  className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/60 to-orange-50 border border-amber-300 flex items-center justify-between cursor-pointer hover:shadow-xs transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-slate-900">Refer & Earn ₹100 per Friend</p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {completedReferrals.length} Earned (₹{totalEarnedCash})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Your code: <strong className="font-mono text-amber-900 font-black">{referralCode}</strong> • Tap to share & claim rewards
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Saved Favorite Places */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Saved Locations
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div 
                      onClick={() => {
                        if (user.savedPlaces.home && onSelectSavedPlace) {
                          onSelectSavedPlace(user.savedPlaces.home);
                          onClose();
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Home</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {user.savedPlaces.home?.address || 'Grand Central Plaza, Sector 4'}
                      </p>
                    </div>

                    <div 
                      onClick={() => {
                        if (user.savedPlaces.work && onSelectSavedPlace) {
                          onSelectSavedPlace(user.savedPlaces.work);
                          onClose();
                        }
                      }}
                      className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <MapPin className="w-3.5 h-3.5 text-rose-600" />
                        <span>Work</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                        {user.savedPlaces.work?.address || 'Cyber Heights Tech Park, Gate 2'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Switch to Ride History */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>View all recent trips, captain receipts and logs</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    View History
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: REFER & EARN SECTION */}
            {activeTab === 'referral' && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* 1. Referral Hero Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600 text-slate-950 shadow-sm relative overflow-hidden">
                  <div className="relative z-10 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/15 backdrop-blur-md text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-yellow-200" />
                      <span>RidePulse Rewards Club</span>
                    </div>
                    <h3 className="text-lg font-black tracking-tight text-slate-950">
                      Invite Friends & Earn ₹100 Cash!
                    </h3>
                    <p className="text-xs font-medium text-slate-900/90 max-w-md">
                      Share your unique code. When your friend completes their first ride, they get <strong className="font-bold">₹50 OFF</strong> and you earn <strong className="font-bold">₹100 credited directly to your Wallet</strong>.
                    </p>
                  </div>
                  <Gift className="w-24 h-24 absolute -bottom-4 -right-4 text-amber-600/30 pointer-events-none" />
                </div>

                {/* 2. Unique Referral Code & One-Click Sharing Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Your Unique Referral Code:</span>
                    <span className="text-[10.5px] text-emerald-700 font-bold">Unlimited Shares Allowed</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border-2 border-dashed border-amber-400 rounded-xl px-4 py-2.5 text-center font-mono font-black text-slate-900 tracking-wider text-base shadow-2xs">
                      {referralCode}
                    </div>

                    <button
                      type="button"
                      id="copy-referral-code-btn"
                      onClick={handleCopyReferralCode}
                      className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-black text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-white stroke-[3]" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      id="share-referral-code-btn"
                      onClick={handleShareReferralCode}
                      className="px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-xs"
                      title="Share code with friends"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>

                  {isCopied && (
                    <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Referral link and code copied to clipboard!
                    </p>
                  )}
                </div>

                {/* 3. Real-Time Rewards Stats & Wallet Balance Tracker */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Earned</span>
                    <span className="text-base font-black text-emerald-700">₹{totalEarnedCash}</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">from referrals</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Friends Joined</span>
                    <span className="text-base font-black text-amber-800">{referrals.length}</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">{completedReferrals.length} completed</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Wallet Balance</span>
                    <span className="text-base font-black text-teal-800">₹{walletBalance.toFixed(0)}</span>
                    <span className="text-[9.5px] text-slate-500 block font-medium">available in ₹</span>
                  </div>
                </div>

                {/* 4. Claimable Rewards Action (if any pending rewards ready) */}
                {totalClaimableCash > 0 && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shadow-sm animate-pulse">
                    <div className="flex items-center gap-2.5">
                      <PartyPopper className="w-6 h-6 text-yellow-200 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black">₹{totalClaimableCash} Reward Ready to Claim!</p>
                        <p className="text-[10.5px] text-emerald-100 font-medium">
                          Your friend completed their first trip. Claim reward into your cash wallet.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="claim-referral-reward-btn"
                      onClick={() => handleClaimReward()}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-emerald-900 font-black text-xs shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
                    >
                      Claim ₹{totalClaimableCash}
                    </button>
                  </div>
                )}

                {/* 5. Referrals Activity List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Referral Activity Tracker ({referrals.length})
                    </h4>
                    <span className="text-[10px] text-slate-500 font-medium">Updates in real-time</span>
                  </div>

                  <div className="space-y-2">
                    {referrals.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                            {item.avatar}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900">{item.name}</span>
                              <span className="text-[10px] text-slate-400">• {item.date}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 font-medium">{item.note}</p>
                          </div>
                        </div>

                        <div>
                          {item.status === 'completed' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[10px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>+₹{item.rewardAmount} Credited</span>
                            </span>
                          )}
                          {item.status === 'claimable' && (
                            <button
                              type="button"
                              onClick={() => handleClaimReward(item.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10.5px] shadow-2xs transition-colors cursor-pointer"
                            >
                              Claim ₹{item.rewardAmount}
                            </button>
                          )}
                          {item.status === 'pending' && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px]">
                              ⏳ Ride Pending
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6. Redeem a Friend's Referral Code */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-amber-600" />
                      Have a Friend's Invite Code?
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">Get Instant ₹50 Wallet Bonus</span>
                  </div>

                  <form onSubmit={handleApplyFriendCode} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={friendCodeInput}
                      onChange={(e) => setFriendCodeInput(e.target.value)}
                      disabled={isFriendCodeApplied}
                      placeholder={isFriendCodeApplied ? 'Referral Bonus Already Claimed' : 'Enter code e.g. RP-FRIEND50'}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:border-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={isFriendCodeApplied || !friendCodeInput.trim()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isFriendCodeApplied ? 'Applied' : 'Apply'}
                    </button>
                  </form>

                  {friendCodeStatus && (
                    <p className={`text-[11px] font-bold ${friendCodeStatus.isError ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {friendCodeStatus.message}
                    </p>
                  )}
                </div>

                {/* 7. 3-Step How It Works Guide */}
                <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2 text-slate-700">
                  <p className="text-xs font-bold text-slate-800">How Refer & Earn Works:</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10.5px]">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center mx-auto mb-1">1</div>
                      <p className="font-bold text-slate-900">Share Code</p>
                      <p className="text-slate-500 text-[9.5px]">Send invite to friends</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto mb-1">2</div>
                      <p className="font-bold text-slate-900">Friend Rides</p>
                      <p className="text-slate-500 text-[9.5px]">They get ₹50 off</p>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <div className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center mx-auto mb-1">3</div>
                      <p className="font-bold text-slate-900">Get ₹100</p>
                      <p className="text-slate-500 text-[9.5px]">Credited to your wallet</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: DETAILED RIDE HISTORY SECTION */}
            {activeTab === 'history' && (
              <div className="space-y-3.5 animate-in fade-in">
                
                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  {/* Search Bar */}
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search routes, locations or captain..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Refresh Button */}
                  <div className="flex items-center gap-1.5">
                    {onOpenCompletedTrips && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCompletedTrips();
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Open full completed trips & tax invoice receipts"
                      >
                        <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Receipts Panel</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchRideHistory(selectedFilter)}
                      disabled={isLoadingHistory}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Refresh history"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-emerald-600' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Ride Type Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { key: 'all', label: 'All Rides' },
                    { key: 'cab', label: 'Cabs' },
                    { key: 'bike', label: 'Bikes' },
                    { key: 'auto', label: 'Autos' },
                    { key: 'courier', label: 'Couriers' },
                    { key: 'carpooling', label: 'Carpools' },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => {
                        setSelectedFilter(filter.key);
                        fetchRideHistory(filter.key);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedFilter === filter.key
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Ride History Cards List */}
                {isLoadingHistory ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse space-y-2.5">
                        <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                        <div className="h-3 bg-slate-200 rounded-md w-3/4" />
                        <div className="h-10 bg-slate-200 rounded-xl w-full" />
                      </div>
                    ))}
                  </div>
                ) : displayedRides.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200">
                    <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No rides found matching your search</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Try changing the filter or search query.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {displayedRides.map((ride) => (
                      <div
                        key={ride.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all space-y-3"
                      >
                        {/* Top Line: Badge, Date, Code & Status */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              {getRideTypeIcon(ride.rideType)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-xs text-slate-900 truncate">
                                  {getRideTypeLabel(ride)}
                                </span>
                                <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.2 rounded-md bg-slate-100">
                                  #{ride.bookingCode}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium">{ride.date}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700">₹{ride.fare}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ride.status}
                            </span>
                          </div>
                        </div>

                        {/* Route Details: Pickup & Destination */}
                        <div className="space-y-1.5 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                          {/* Pickup */}
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center mt-0.5 text-[9px] font-black flex-shrink-0">
                              P
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-[11px] truncate">{ride.pickup.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{ride.pickup.address}</p>
                            </div>
                          </div>

                          {/* Destination */}
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center mt-0.5 text-[9px] font-black flex-shrink-0">
                              D
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 text-[11px] truncate">{ride.destination.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">{ride.destination.address}</p>
                            </div>
                          </div>

                          {/* Distance & Time Badge */}
                          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-600 font-semibold border-t border-slate-200/60">
                            <span className="flex items-center gap-1">
                              <Route className="w-3 h-3 text-blue-600" />
                              {ride.distanceKm} km total
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {ride.durationMins} mins duration
                            </span>
                            <span>•</span>
                            <span className="capitalize text-slate-700">Paid via {ride.paymentMethod}</span>
                          </div>
                        </div>

                        {/* Captain Details & Action Buttons */}
                        <div className="flex items-center justify-between pt-0.5">
                          {/* Captain Info */}
                          <div className="flex items-center gap-2">
                            <img
                              src={ride.captain.photo}
                              alt={ride.captain.name}
                              className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-tight">{ride.captain.name}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {ride.captain.vehicleModel} • <span className="font-mono text-slate-700 font-bold">{ride.captain.vehicleNumber}</span>
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                alert(`Tax Invoice & Trip Receipt for #${ride.bookingCode} downloaded.`);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Download Receipt"
                            >
                              <Receipt className="w-3 h-3" />
                              <span className="hidden sm:inline">Receipt</span>
                            </button>

                            {onRebookRoute && (
                              <button
                                type="button"
                                onClick={() => {
                                  onRebookRoute(ride.pickup.name, ride.destination.name, ride.rideType);
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Rebook this route"
                              >
                                <span>Rebook</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* Logout / Close Bottom Bar */}
            <div className="pt-3 border-t border-slate-200 flex justify-between gap-3 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Close
              </button>

              <button
                id="user-account-logout-btn"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2 transition-colors active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Rider Signed In</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium">
              Sign in with your phone number and OTP to view wallet balance in ₹, ride history, and saved addresses.
            </p>
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="mt-4 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              Sign In / Register with OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
