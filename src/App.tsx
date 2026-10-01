import React, { useState, useEffect, useCallback } from 'react';
import { 
  LocationPoint, 
  RideType, 
  CabCategory, 
  TripMode,
  UserProfile, 
  ActiveBooking, 
  ScheduledBooking,
  CarpoolRide,
  SelfDriveCar,
  CourierVehicleType,
  CaptainDetails
} from './types';
import { 
  calculateRideFares, 
  CAPTAIN_PROFILES, 
  INITIAL_CARPOOLS,
  getLandmarksForCity
} from './data/mockData';
import { saveDestinationToHistory, extractCityName } from './utils/geoUtils';

// Components
import { HeaderNav } from './components/HeaderNav';
import { InteractiveMap } from './components/InteractiveMap';
import { PickupDestinationPanel } from './components/PickupDestinationPanel';
import { RideCategoryRow } from './components/RideCategoryRow';
import { CabInfoModal } from './components/CabInfoModal';
import { SelfDriveModal } from './components/SelfDriveModal';
import { SelfDriveTripView } from './components/SelfDriveTripView';
import { CarpoolingView } from './components/CarpoolingView';
import { CourierServiceModal } from './components/CourierServiceModal';
import { ActiveRideTracking } from './components/ActiveRideTracking';
import { BottomStaticNav, BottomNavTab } from './components/BottomStaticNav';
import { RiderAuthModal } from './components/RiderAuthModal';
import { AdvanceBookingModal } from './components/AdvanceBookingModal';
import { UserAccountModal } from './components/UserAccountModal';
import { VoiceAssistantModal } from './components/VoiceAssistantModal';
import { TripSummaryModal } from './components/TripSummaryModal';
import { CompletedTripsModal } from './components/CompletedTripsModal';
import { GoogleMusicModal } from './components/GoogleMusicModal';
import { GoogleMusicMiniPlayer } from './components/GoogleMusicMiniPlayer';
import { SelfieCameraModal } from './components/SelfieCameraModal';
import { CURATED_MUSIC_TRACKS } from './data/musicTracks';
import { musicAudioEngine } from './utils/audioEngine';
import { MusicTrack } from './types';
import { useDeviceGps } from './hooks/useDeviceGps';
import confetti from 'canvas-confetti';
import { AlertCircle } from 'lucide-react';
import { auth, onAuthStateChanged } from './lib/firebase';
import { 
  syncUserProfileToFirestore, 
  getUserProfileFromFirestore, 
  subscribeToUserProfile,
  syncActiveBookingToFirestore,
  removeActiveBookingFromFirestore,
  saveCompletedTripToFirestore,
  buildUserProfileFromFirebase
} from './services/firebaseDb';

export default function App() {
  // Navigation & View States
  const [currentView, setCurrentView] = useState<'main_booking' | 'carpooling' | 'active_tracking'>('main_booking');
  const [activeBottomTab, setActiveBottomTab] = useState<BottomNavTab>('book');

  // Modal Open States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
  const [isCabInfoModalOpen, setIsCabInfoModalOpen] = useState(false);
  const [isSelfDriveModalOpen, setIsSelfDriveModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isAdvanceBookingModalOpen, setIsAdvanceBookingModalOpen] = useState(false);
  const [isUserAccountModalOpen, setIsUserAccountModalOpen] = useState(false);
  const [isTripSummaryOpen, setIsTripSummaryOpen] = useState(false);
  const [isCompletedTripsModalOpen, setIsCompletedTripsModalOpen] = useState(false);
  const [isGoogleMusicModalOpen, setIsGoogleMusicModalOpen] = useState(false);
  const [isSelfieCameraModalOpen, setIsSelfieCameraModalOpen] = useState(false);
  const [isMapsQuotaExceeded, setIsMapsQuotaExceeded] = useState(false);

  // Active Session User (with INR balance)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: 'usr_default',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@ridepulse.in',
    rating: 4.95,
    walletBalance: 850.0,
    savedPlaces: {
      home: {
        id: 'loc_home',
        name: 'Home Apartment',
        address: '42 Pine Crest Avenue, Koramangala 4th Block',
        lat: 12.9352,
        lng: 77.6245,
        type: 'custom',
      },
      work: {
        id: 'loc_work',
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
      phone: '+91 91100 22000',
    },
  });

  const [currentMusicTrack, setCurrentMusicTrack] = useState<MusicTrack>(CURATED_MUSIC_TRACKS[0]);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMiniPlayerDismissed, setIsMiniPlayerDismissed] = useState(false);
  const [completedBooking, setCompletedBooking] = useState<ActiveBooking | null>(null);

  // Locations State: Pickup starts with Ongole Urban / Live GPS; Destination starts strictly EMPTY (null)
  const [pickup, setPickup] = useState<LocationPoint>(() => {
    const defaultCityLandmarks = getLandmarksForCity('Ongole Urban');
    return defaultCityLandmarks[0] || {
      id: 'loc_current_default',
      name: 'Ongole Urban Central',
      address: 'Station Road, Santhapeta, Ongole Urban',
      lat: 15.4985,
      lng: 80.0573,
      type: 'current',
      city: 'Ongole Urban',
    };
  });
  const [destination, setDestination] = useState<LocationPoint | null>(null);
  const [stops, setStops] = useState<LocationPoint[]>([]);
  const [interactivePinMode, setInteractivePinMode] = useState<'pickup' | 'destination' | null>(null);

  // Device GPS Location Hook - Automatically sets pickup point to live GPS
  const handleDeviceGpsObtained = useCallback((point: LocationPoint) => {
    setPickup(point);
  }, []);

  const { deviceGps, isLoading: isGpsLoading, requestGpsLocation } = useDeviceGps(handleDeviceGpsObtained);

  // Manual GPS detection trigger
  const handleAutoGpsDetect = useCallback(() => {
    requestGpsLocation(true);
  }, [requestGpsLocation]);

  // Ride Selection State
  const [selectedRideType, setSelectedRideType] = useState<RideType>('cab');
  const [selectedCabTier, setSelectedCabTier] = useState<CabCategory>('sedan');
  const [tripMode, setTripMode] = useState<TripMode>('direct');
  const [returnWaitMinutes, setReturnWaitMinutes] = useState<number>(30);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'RidePulse Wallet' | 'UPI'>('RidePulse Wallet');

  const [activeBooking, setActiveBooking] = useState<ActiveBooking | null>(null);
  const [scheduledBookings, setScheduledBookings] = useState<ScheduledBooking[]>([]);
  const [destinationError, setDestinationError] = useState<string | null>(null);

  // Listen for global Maps Quota Exceeded event
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setIsMapsQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Firebase Auth State Listener & Firestore Profile Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const existingFirestoreProfile = await getUserProfileFromFirestore(fbUser.uid);
        if (existingFirestoreProfile) {
          setCurrentUser(existingFirestoreProfile);
        } else {
          const newProfile = buildUserProfileFromFirebase(fbUser, currentUser);
          await syncUserProfileToFirestore(newProfile);
          setCurrentUser(newProfile);
        }
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore synchronization for currentUser changes (savedPlaces, emergency contacts, profile info)
  useEffect(() => {
    // Only attempt Firestore cloud sync if the user is authenticated in Firebase
    if (auth.currentUser && currentUser && currentUser.id === auth.currentUser.uid) {
      syncUserProfileToFirestore(currentUser);
    }
  }, [currentUser?.savedPlaces, currentUser?.emergencyContact, currentUser?.name, currentUser?.phone, currentUser?.email]);

  // Distance & Fares calculation in INR (₹)
  const hasDestination = Boolean(destination);
  const distanceKm = destination
    ? Math.max(
        1.5,
        Math.round(
          Math.sqrt(
            Math.pow((destination.lat - pickup.lat) * 0.1, 2) +
            Math.pow((destination.lng - pickup.lng) * 0.1, 2)
          ) * 10
        ) / 10
      )
    : 0; // 0 when destination is not chosen yet

  const durationMins = destination ? Math.round(distanceKm * 2.5) : 0;
  const fares = calculateRideFares(distanceKm > 0 ? distanceKm : 1, tripMode, returnWaitMinutes);

  // Switch Bottom Tab handler - Resets to initial stage on 'home' click
  const handleBottomTabChange = (tab: BottomNavTab) => {
    setActiveBottomTab(tab);
    if (tab === 'advance') {
      setIsAdvanceBookingModalOpen(true);
    } else if (tab === 'home') {
      // Complete reset to initial stage
      setCurrentView('main_booking');
      setDestination(null);
      setSelectedRideType('cab');
      setSelectedCabTier('sedan');
      setTripMode('direct');
      setReturnWaitMinutes(30);
      setActiveBooking(null);
      setInteractivePinMode(null);
      setIsAdvanceBookingModalOpen(false);
      setIsUserAccountModalOpen(false);
      setIsAuthModalOpen(false);
      setIsCabInfoModalOpen(false);
      setIsSelfDriveModalOpen(false);
      setIsCourierModalOpen(false);
      setIsVoiceAssistantOpen(false);

      // Restore pickup to device live GPS if granted, else default city origin
      if (deviceGps && deviceGps.status === 'granted') {
        setPickup({
          id: `gps_home_reset_${Date.now()}`,
          name: deviceGps.address?.split(',')[0] || 'My GPS Location',
          address: deviceGps.address || `GPS (${deviceGps.lat.toFixed(5)}, ${deviceGps.lng.toFixed(5)})`,
          lat: deviceGps.lat,
          lng: deviceGps.lng,
          type: 'current',
        });
      } else {
        const defaultCityLandmarks = getLandmarksForCity('Ongole Urban');
        setPickup(defaultCityLandmarks[0] || {
          id: 'loc_current_default',
          name: 'Ongole Urban Central',
          address: 'Station Road, Santhapeta, Ongole Urban',
          lat: 15.4985,
          lng: 80.0573,
          type: 'current',
          city: 'Ongole Urban',
        });
      }
    } else if (tab === 'book') {
      setCurrentView('main_booking');
      setIsAdvanceBookingModalOpen(false);
      setIsUserAccountModalOpen(false);
      setIsAuthModalOpen(false);
      setIsCabInfoModalOpen(false);
      setIsSelfDriveModalOpen(false);
      setIsCourierModalOpen(false);
      setIsVoiceAssistantOpen(false);
    } else if (tab === 'account') {
      setIsUserAccountModalOpen(true);
    }
  };

  // Build Captain Object
  const getAssignedCaptain = (rideType: RideType, cabTier?: CabCategory): CaptainDetails => {
    const raw = CAPTAIN_PROFILES[0];
    let vehicleModel = raw.sedanModel;
    let vehicleType: any = rideType;

    if (rideType === 'bike') {
      vehicleModel = raw.bikeModel;
      vehicleType = 'bike';
    } else if (rideType === 'auto') {
      vehicleModel = raw.autoModel;
      vehicleType = 'auto';
    } else if (rideType === 'cab') {
      if (cabTier === 'mini') vehicleModel = raw.miniModel || raw.hatchbackModel;
      else if (cabTier === 'hatchback') vehicleModel = raw.hatchbackModel;
      else if (cabTier === 'suv') vehicleModel = raw.suvModel;
      else vehicleModel = raw.sedanModel;
      vehicleType = 'cab';
    }

    return {
      id: `cap_${Date.now()}`,
      name: raw.name,
      phone: raw.phone,
      rating: raw.rating,
      totalTrips: raw.totalTrips,
      photo: raw.photo,
      vehicleModel,
      vehicleColor: 'Silver Metallic',
      vehicleNumber: raw.vehiclePlate,
      vehicleType,
      currentProgress: 0.1,
    };
  };

  // Direct Booking Handler
  const handleBookDirect = (type: RideType, cabTier?: CabCategory, customFare?: number) => {
    // STRICT VALIDATION: Without entering or selecting the destination, DO NOT book the ride!
    if (!destination) {
      setDestinationError('Please enter the destination before booking your ride');
      const input = document.getElementById('destination-address-input');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setDestinationError(null);
    const activeDestination = destination;

    // Save destination to history upon booking
    saveDestinationToHistory(activeDestination);

    const calcDistanceKm = Math.max(
      1.5,
      Math.round(
        Math.sqrt(
          Math.pow((activeDestination.lat - pickup.lat) * 0.1, 2) +
          Math.pow((activeDestination.lng - pickup.lng) * 0.1, 2)
        ) * 10
      ) / 10
    );
    const calcDurationMins = Math.round(calcDistanceKm * 2.5);
    const calculatedFares = calculateRideFares(calcDistanceKm, tripMode, returnWaitMinutes);

    const calculatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const assignedCaptain = getAssignedCaptain(type, cabTier);
    
    let totalFare = 0;
    if (customFare) {
      totalFare = customFare;
    } else if (type === 'bike') {
      totalFare = calculatedFares.bike.fare;
    } else if (type === 'auto') {
      totalFare = calculatedFares.auto.fare;
    } else if (type === 'cab') {
      const tier = cabTier || selectedCabTier;
      totalFare = calculatedFares.cab[tier].fare;
    }

    const finalDistanceKm = tripMode === 'round_trip' ? calcDistanceKm * 2 : calcDistanceKm;
    const finalDurationMins = tripMode === 'round_trip' ? calcDurationMins * 2 + returnWaitMinutes : calcDurationMins;

    const newBooking: ActiveBooking = {
      id: `bk_${Date.now()}`,
      bookingCode: `RP-${Math.floor(10000 + Math.random() * 90000)}`,
      rideType: type,
      cabCategory: cabTier || selectedCabTier,
      tripMode,
      roundTripDetails: tripMode === 'round_trip' ? {
        returnWaitMinutes,
        returnPickup: activeDestination,
        returnDestination: pickup,
        returnFareDiscount: 15,
        currentLeg: 1,
      } : undefined,
      pickup,
      destination: activeDestination,
      captain: assignedCaptain,
      fare: totalFare,
      distanceKm: finalDistanceKm,
      durationMins: finalDurationMins,
      paymentMethod,
      otp: calculatedOtp,
      status: 'captain_arriving',
      statusMessage: `${assignedCaptain.name} is on the way in ${assignedCaptain.vehicleModel}`,
      estimatedArrivalMins: type === 'bike' ? calculatedFares.bike.etaMins : type === 'auto' ? calculatedFares.auto.etaMins : calculatedFares.cab.sedan.etaMins,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setActiveBooking(newBooking);
    setCurrentView('active_tracking');
    syncActiveBookingToFirestore(newBooking);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    } catch {
      // ignore
    }
  };

  // Self Drive Booking
  const handleBookSelfDrive = (
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
  ) => {
    const targetDest = destination || pickup;
    const carOwner = car.owner || {
      id: `owner_${car.id}`,
      name: 'Ramesh Varma',
      phone: '+91 98480 22334',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.92,
      totalTrips: car.tripsCompleted || 142,
      verified: true,
      hubName: 'Downtown Smart Parking Hub',
      hubAddress: car.availableLocation || 'Bay 12, Level 2, Metro Grand Mall Parking, MG Road',
      lat: pickup.lat,
      lng: pickup.lng,
      vehiclePlate: 'AP 27 SD 1024',
      vehicleColor: 'Silky Silver',
      fuelLevelPercent: 92,
      odometerKm: 24350,
    };

    const rentalCaptain: CaptainDetails = {
      id: `self_drive_${car.id}`,
      name: carOwner.name,
      phone: carOwner.phone,
      rating: carOwner.rating,
      totalTrips: carOwner.totalTrips,
      photo: carOwner.avatar,
      vehicleModel: car.name,
      vehicleColor: carOwner.vehicleColor,
      vehicleNumber: carOwner.vehiclePlate,
      vehicleType: 'self_drive',
      currentProgress: 1.0,
    };

    const totalFare = advanceDetails?.totalFare || (car.hourlyRate * durationHours);
    const advancePaid = advanceDetails?.advancePaidAmount || Math.round(totalFare * 0.25);
    const remaining = advanceDetails?.remainingBalance || (totalFare - advancePaid);

    const newBooking: ActiveBooking = {
      id: `bk_self_${Date.now()}`,
      bookingCode: `SD-${Math.floor(10000 + Math.random() * 90000)}`,
      rideType: 'self_drive',
      pickup: {
        id: 'self_hub',
        name: carOwner.hubName,
        address: carOwner.hubAddress,
        lat: carOwner.lat,
        lng: carOwner.lng,
      },
      destination: targetDest,
      captain: rentalCaptain,
      fare: totalFare,
      distanceKm,
      durationMins: durationHours * 60,
      paymentMethod,
      otp: securityOtp,
      status: 'captain_arrived',
      statusMessage: 'Vehicle is ready at designated parking bay. 25% Advance paid with 100% condition refund guarantee.',
      estimatedArrivalMins: 0,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      selfDriveDetails: {
        durationHours,
        car,
        securityOtp,
        pickupLocation: carOwner.hubAddress,
        owner: carOwner,
        fuelLevelPercent: carOwner.fuelLevelPercent,
        kmDriven: 0,
        totalEstimatedFare: totalFare,
        advancePaidAmount: advancePaid,
        remainingBalance: remaining,
        advancePaymentMethod: advanceDetails?.advancePaymentMethod || 'UPI (Google Pay)',
        advanceTransactionId: advanceDetails?.advanceTransactionId || `TXN-ADV-${Math.floor(100000 + Math.random() * 900000)}`,
        conditionGuaranteeActive: true,
      },
    };

    setActiveBooking(newBooking);
    setCurrentView('active_tracking');
    syncActiveBookingToFirestore(newBooking);
  };

  // Carpool Booking
  const handleBookCarpool = (carpool: CarpoolRide, passengers: number, totalFare: number) => {
    const poolOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const poolCaptain: CaptainDetails = {
      id: `host_${carpool.id}`,
      name: `${carpool.hostName} (Carpool Host)`,
      phone: '+91 98765 12345',
      rating: carpool.hostRating,
      totalTrips: 45,
      photo: carpool.hostAvatar,
      vehicleModel: carpool.vehicleModel,
      vehicleColor: carpool.vehicleColor,
      vehicleNumber: carpool.vehiclePlate,
      vehicleType: 'carpooling',
      currentProgress: 0.2,
    };

    const targetDest = destination || {
      id: 'dest_pool',
      name: carpool.destination,
      address: `${carpool.destination} Main Corridor`,
      lat: 12.9716,
      lng: 77.5946,
    };

    const newBooking: ActiveBooking = {
      id: `bk_pool_${Date.now()}`,
      bookingCode: `CP-${Math.floor(10000 + Math.random() * 90000)}`,
      rideType: 'carpooling',
      pickup,
      destination: targetDest,
      captain: poolCaptain,
      fare: totalFare,
      distanceKm,
      durationMins,
      paymentMethod,
      otp: poolOtp,
      status: 'captain_arriving',
      statusMessage: 'Carpool host is on scheduled route to your stop',
      estimatedArrivalMins: 4,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      carpoolDetails: {
        passengers,
        carpool,
        totalFare,
      },
    };

    setActiveBooking(newBooking);
    setCurrentView('active_tracking');
    syncActiveBookingToFirestore(newBooking);
  };

  // Courier Booking
  const handleBookCourier = (details: {
    weightKg: number;
    vehicleType: CourierVehicleType;
    packageType: string;
    receiverName: string;
    receiverPhone: string;
    deliveryInstructions: string;
    fare: number;
  }) => {
    const courierOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const raw = CAPTAIN_PROFILES[0];
    const courierCaptain: CaptainDetails = {
      id: `courier_cap_${Date.now()}`,
      name: `${raw.name} (Express Delivery Agent)`,
      phone: raw.phone,
      rating: raw.rating,
      totalTrips: raw.totalTrips,
      photo: raw.photo,
      vehicleModel: 'Delivery Cargo Box / Van',
      vehicleColor: 'Teal Blue',
      vehicleNumber: raw.vehiclePlate,
      vehicleType: 'courier',
      currentProgress: 0.1,
    };

    const targetDest = destination || {
      id: 'dest_courier',
      name: `${details.receiverName}'s Address`,
      address: 'Receiver Dropoff Point',
      lat: 12.9800,
      lng: 77.6000,
    };

    const newBooking: ActiveBooking = {
      id: `bk_courier_${Date.now()}`,
      bookingCode: `CR-${Math.floor(10000 + Math.random() * 90000)}`,
      rideType: 'courier',
      pickup,
      destination: targetDest,
      captain: courierCaptain,
      fare: details.fare,
      distanceKm,
      durationMins,
      paymentMethod,
      otp: courierOtp,
      status: 'captain_arriving',
      statusMessage: 'Courier dispatch rider en route for parcel pickup',
      estimatedArrivalMins: 3,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      courierDetails: {
        weightKg: details.weightKg,
        vehicleType: details.vehicleType,
        packageType: details.packageType,
        receiverName: details.receiverName,
        receiverPhone: details.receiverPhone,
        deliveryInstructions: details.deliveryInstructions,
      },
    };

    setActiveBooking(newBooking);
    setCurrentView('active_tracking');
    syncActiveBookingToFirestore(newBooking);
  };


  // Apply AI Voice extracted booking
  const handleApplyAiVoiceBooking = (data: {
    pickupName?: string;
    destinationName?: string;
    rideType?: RideType;
  }) => {
    if (data.destinationName) {
      const city = extractCityName(pickup.lat, pickup.lng, pickup.address || deviceGps?.address);
      const cityLandmarks = getLandmarksForCity(city, { lat: pickup.lat, lng: pickup.lng });
      const match = cityLandmarks.find((l: LocationPoint) =>
        l.name.toLowerCase().includes(data.destinationName!.toLowerCase())
      );
      if (match) {
        setDestination(match);
        saveDestinationToHistory(match);
      } else {
        const customDest: LocationPoint = {
          id: `ai_dest_${Date.now()}`,
          name: data.destinationName,
          address: `${data.destinationName}, ${city}`,
          lat: pickup.lat + 0.02,
          lng: pickup.lng + 0.02,
          type: 'custom',
          city,
        };
        setDestination(customDest);
        saveDestinationToHistory(customDest);
      }
    }

    if (data.rideType) {
      setSelectedRideType(data.rideType);
      if (data.rideType === 'cab') {
        setIsCabInfoModalOpen(true);
      }
    }
  };

  // Google Music Playback Controller
  const handleToggleMusicPlay = () => {
    if (isMusicPlaying) {
      musicAudioEngine.stop();
      setIsMusicPlaying(false);
    } else {
      musicAudioEngine.playTrackMelody(currentMusicTrack.frequencyBase, currentMusicTrack.tempoBpm);
      setIsMusicPlaying(true);
      setIsMiniPlayerDismissed(false);
    }
  };

  const handleSelectMusicTrack = (track: MusicTrack) => {
    setCurrentMusicTrack(track);
    setIsMusicPlaying(true);
    setIsMiniPlayerDismissed(false);
    musicAudioEngine.playTrackMelody(track.frequencyBase, track.tempoBpm);
  };

  const handleNextMusicTrack = () => {
    const idx = CURATED_MUSIC_TRACKS.findIndex((t) => t.id === currentMusicTrack.id);
    const nextIdx = (idx + 1) % CURATED_MUSIC_TRACKS.length;
    const nextTrack = CURATED_MUSIC_TRACKS[nextIdx];
    handleSelectMusicTrack(nextTrack);
  };

  const handlePrevMusicTrack = () => {
    const idx = CURATED_MUSIC_TRACKS.findIndex((t) => t.id === currentMusicTrack.id);
    const prevIdx = (idx - 1 + CURATED_MUSIC_TRACKS.length) % CURATED_MUSIC_TRACKS.length;
    const prevTrack = CURATED_MUSIC_TRACKS[prevIdx];
    handleSelectMusicTrack(prevTrack);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* 1. TOP HEADER NAVIGATION BAR */}
      <HeaderNav
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenUserAccount={() => setIsUserAccountModalOpen(true)}
        onOpenCompletedTrips={() => setIsCompletedTripsModalOpen(true)}
        onOpenMusicPlayer={() => setIsGoogleMusicModalOpen(true)}
        isMusicPlaying={isMusicPlaying}
        onAutoGpsClick={handleAutoGpsDetect}
        gpsActive={isGpsLoading}
        deviceGps={deviceGps}
      />

      {/* MAPS DEMO KEY / QUOTA REACHED NOTIFICATION BANNER */}
      {isMapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMapsQuotaExceeded(false)}
            className="p-1 rounded-md text-amber-700 hover:text-amber-900 hover:bg-amber-100 transition-colors"
            title="Dismiss notice"
          >
            <span className="text-sm font-bold leading-none">✕</span>
          </button>
        </div>
      )}

      {/* 2. MAIN APP CONTENT SWITCHER */}
      {currentView === 'carpooling' ? (
        /* CARPOOLING VIEW */
        <CarpoolingView
          pickup={pickup}
          destination={destination}
          onBack={() => setCurrentView('main_booking')}
          onBookCarpool={handleBookCarpool}
        />
      ) : currentView === 'active_tracking' && activeBooking ? (
        activeBooking.rideType === 'self_drive' ? (
          /* SELF DRIVE COMPREHENSIVE WORKFLOW: NAV TO OWNER, START OTP, DRIVING, RETURN OTP, PAYMENT, FEEDBACK */
          <SelfDriveTripView
            booking={activeBooking}
            onCancel={() => {
              removeActiveBookingFromFirestore(activeBooking.id);
              setActiveBooking(null);
              setCurrentView('main_booking');
            }}
            onFinishComplete={() => {
              saveCompletedTripToFirestore(currentUser?.id || 'usr_default', activeBooking);
              removeActiveBookingFromFirestore(activeBooking.id);
              setCompletedBooking(activeBooking);
              setActiveBooking(null);
              setCurrentView('main_booking');
            }}
          />
        ) : (
          /* STANDARD TAXI & COURIER ACTIVE TRACKING */
          <ActiveRideTracking
            booking={activeBooking}
            onOpenMusicPlayer={() => setIsGoogleMusicModalOpen(true)}
            onCancelRide={() => {
              removeActiveBookingFromFirestore(activeBooking.id);
              setActiveBooking(null);
              setCurrentView('main_booking');
            }}
            onCompleteTrip={() => {
              saveCompletedTripToFirestore(currentUser?.id || 'usr_default', activeBooking);
              removeActiveBookingFromFirestore(activeBooking.id);
              setCompletedBooking(activeBooking);
              setIsTripSummaryOpen(true);
              setActiveBooking(null);
              setCurrentView('main_booking');
            }}
          />
        )
      ) : (
        /* STANDARD TAXI BOOKING MAIN VIEW */
        <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-5 flex flex-col gap-4 pb-24">
          
          {/* TOP GOOGLE MAPS COMPONENT WITH DRAGGABLE PICKUP & DESTINATION PINS */}
          <div className="w-full h-[28vh] sm:h-[35vh] min-h-[240px] rounded-3xl overflow-hidden border border-slate-200 shadow-md relative bg-slate-50">
            <InteractiveMap
              pickup={pickup}
              destination={destination}
              selectedRideType={selectedRideType}
              onUpdatePickupPoint={setPickup}
              onUpdateDestinationPoint={(point) => {
                setDestination(point);
                if (point) {
                  setDestinationError(null);
                  saveDestinationToHistory(point);
                }
              }}
              onSelectMapLocation={(point, type) => {
                if (type === 'pickup') {
                  setPickup(point);
                } else {
                  setDestination(point);
                  if (point) {
                    setDestinationError(null);
                    saveDestinationToHistory(point);
                  }
                }
                setInteractivePinMode(null);
              }}
              interactiveSelectionMode={interactivePinMode}
              onRecenterGps={handleAutoGpsDetect}
              deviceGps={deviceGps}
              onRequestGps={handleAutoGpsDetect}
              onSetGpsAsPickup={setPickup}
              onOpenVoiceAssistant={() => setIsVoiceAssistantOpen(true)}
            />
          </div>

          {/* PICKUP & DESTINATION LOCATION INPUT PANEL */}
          <PickupDestinationPanel
            pickup={pickup}
            destination={destination}
            onUpdatePickup={setPickup}
            onUpdateDestination={(point) => {
              setDestination(point);
              if (point) {
                setDestinationError(null);
                saveDestinationToHistory(point);
              }
            }}
            stops={stops}
            onUpdateStops={setStops}
            onTriggerGpsPickup={handleAutoGpsDetect}
            onEnableMapPinMode={(mode) => setInteractivePinMode(mode)}
            distanceKm={distanceKm}
            durationMins={durationMins}
            deviceGps={deviceGps}
            onRequestDeviceGps={handleAutoGpsDetect}
            destinationError={destinationError}
            onClearDestinationError={() => setDestinationError(null)}
            tripMode={tripMode}
            onChangeTripMode={setTripMode}
            returnWaitMinutes={returnWaitMinutes}
            onChangeReturnWaitMinutes={setReturnWaitMinutes}
          />

          {/* RIDE CATEGORY SELECTOR */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-4">
            <RideCategoryRow
              selectedRideType={selectedRideType}
              onSelectRideType={(type) => setSelectedRideType(type)}
              selectedCabTier={selectedCabTier}
              onSelectCabTier={(tier) => setSelectedCabTier(tier)}
              tripMode={tripMode}
              returnWaitMinutes={returnWaitMinutes}
              hasDestination={hasDestination}
              fares={fares}
              onBookDirectRide={(type) => handleBookDirect(type)}
              onBookCab={(tier, fare) => handleBookDirect('cab', tier, fare)}
              onOpenSelfDrive={() => setIsSelfDriveModalOpen(true)}
              onOpenCarpooling={() => setCurrentView('carpooling')}
              onOpenCourier={() => setIsCourierModalOpen(true)}
              onOpenCabInfo={() => setIsCabInfoModalOpen(true)}
            />
          </div>
        </main>
      )}

      {/* 3. STATIC BOTTOM COMPONENT */}
      {(() => {
        let currentVehicleFare: number | string = hasDestination ? (fares.cab[selectedCabTier]?.fare || 145) : 'Enter destination';
        let currentVehicleEta = `${fares.cab[selectedCabTier]?.etaMins || 3}m`;

        if (selectedRideType === 'bike') {
          currentVehicleFare = hasDestination ? fares.bike.fare : 'Enter destination';
          currentVehicleEta = `${fares.bike.etaMins}m`;
        } else if (selectedRideType === 'auto') {
          currentVehicleFare = hasDestination ? fares.auto.fare : 'Enter destination';
          currentVehicleEta = `${fares.auto.etaMins}m`;
        } else if (selectedRideType === 'cab') {
          currentVehicleFare = hasDestination ? (fares.cab[selectedCabTier]?.fare || 145) : 'Enter destination';
          currentVehicleEta = `${fares.cab[selectedCabTier]?.etaMins || 3}m`;
        } else if (selectedRideType === 'self_drive') {
          currentVehicleFare = `₹${fares.self_drive.hourlyStarting}/hr`;
          currentVehicleEta = 'Instant';
        } else if (selectedRideType === 'carpooling') {
          currentVehicleFare = hasDestination ? `₹${fares.carpooling.perSeatAvg}/seat` : 'Enter destination';
          currentVehicleEta = '4m';
        } else if (selectedRideType === 'courier') {
          currentVehicleFare = hasDestination ? `₹${fares.courier.startingFare}` : 'Enter destination';
          currentVehicleEta = '3m';
        }

        const handleBookSelectedVehicle = () => {
          if (selectedRideType === 'bike') {
            handleBookDirect('bike');
          } else if (selectedRideType === 'auto') {
            handleBookDirect('auto');
          } else if (selectedRideType === 'cab') {
            handleBookDirect('cab', selectedCabTier);
          } else if (selectedRideType === 'self_drive') {
            setIsSelfDriveModalOpen(true);
          } else if (selectedRideType === 'carpooling') {
            setCurrentView('carpooling');
          } else if (selectedRideType === 'courier') {
            setIsCourierModalOpen(true);
          }
        };

        return (
          <BottomStaticNav
            activeTab={activeBottomTab}
            onTabChange={handleBottomTabChange}
            advanceBookingsCount={scheduledBookings.length}
            selectedRideType={selectedRideType}
            selectedCabTier={selectedCabTier}
            selectedFare={currentVehicleFare}
            selectedEta={currentVehicleEta}
            hasDestination={hasDestination}
            onBookSelectedVehicle={handleBookSelectedVehicle}
            onOpenMusicPlayer={() => setIsGoogleMusicModalOpen(true)}
            isMusicPlaying={isMusicPlaying}
            onOpenSelfieCamera={() => setIsSelfieCameraModalOpen(true)}
          />
        );
      })()}

      {/* 4. MODALS & DIALOGS */}
      {/* Cab Available Car Types Fleet Info Modal */}
      <CabInfoModal
        isOpen={isCabInfoModalOpen}
        onClose={() => setIsCabInfoModalOpen(false)}
        selectedTier={selectedCabTier}
        onSelectTier={(tier) => {
          setSelectedCabTier(tier);
          setSelectedRideType('cab');
        }}
        fares={fares.cab}
        distanceKm={distanceKm}
        durationMins={durationMins}
        pickup={pickup}
        destination={destination}
        onBookCab={(tier, fare) => {
          setSelectedCabTier(tier);
          setSelectedRideType('cab');
          handleBookDirect('cab', tier, fare);
          setIsCabInfoModalOpen(false);
        }}
      />

      {/* Rider Phone Registration & OTP Auth Modal */}
      <RiderAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(user) => setCurrentUser(user)}
        onLogout={() => setCurrentUser(null)}
      />

      {/* AI Voice Assistant Modal */}
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
        pickup={pickup}
        destination={destination}
        onApplyAiBooking={handleApplyAiVoiceBooking}
      />

      {/* Self-Drive Modal & Key OTP Generator */}
      <SelfDriveModal
        isOpen={isSelfDriveModalOpen}
        onClose={() => setIsSelfDriveModalOpen(false)}
        onBookSelfDrive={handleBookSelfDrive}
      />

      {/* Courier Service Weight & Auto-Vehicle Selector Modal */}
      <CourierServiceModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        pickup={pickup}
        destination={destination}
        distanceKm={distanceKm}
        onBookCourier={handleBookCourier}
      />

      {/* Advance / Scheduled Bookings Modal */}
      <AdvanceBookingModal
        isOpen={isAdvanceBookingModalOpen}
        onClose={() => setIsAdvanceBookingModalOpen(false)}
        pickup={pickup}
        destination={destination}
        scheduledList={scheduledBookings}
        onAddSchedule={(sched) => setScheduledBookings([sched, ...scheduledBookings])}
        onDeleteSchedule={(id) => setScheduledBookings(scheduledBookings.filter((s) => s.id !== id))}
      />

      {/* Customer Account & Wallet / History Modal */}
      <UserAccountModal
        isOpen={isUserAccountModalOpen}
        onClose={() => setIsUserAccountModalOpen(false)}
        user={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => setCurrentUser(null)}
        onUpdateWalletBalance={(newBalance) => {
          if (currentUser) {
            setCurrentUser({ ...currentUser, walletBalance: newBalance });
          }
        }}
        onSelectSavedPlace={(place) => {
          setDestination(place);
          saveDestinationToHistory(place);
          setCurrentView('main_booking');
        }}
        onRebookRoute={(pickupName, destName, rideType) => {
          setSelectedRideType(rideType);
          setDestination({
            id: `rebook_dest_${Date.now()}`,
            name: destName,
            address: `${destName}, Ongole Urban`,
            lat: 15.5085,
            lng: 80.0473,
            type: 'custom',
          });
          setCurrentView('main_booking');
        }}
        onOpenCompletedTrips={() => setIsCompletedTripsModalOpen(true)}
      />

      {/* Trip Summary & Highlights Modal */}
      <TripSummaryModal
        isOpen={isTripSummaryOpen}
        onClose={() => setIsTripSummaryOpen(false)}
        booking={completedBooking}
        walletBalance={currentUser?.walletBalance ?? 850}
        onPaymentSettled={(method, totalAmount) => {
          if (method === 'RidePulse Wallet' && currentUser) {
            setCurrentUser({
              ...currentUser,
              walletBalance: Math.max(0, currentUser.walletBalance - totalAmount),
            });
          }
        }}
      />

      {/* Completed Trips, Fares & Tax Invoices Modal */}
      <CompletedTripsModal
        isOpen={isCompletedTripsModalOpen}
        onClose={() => setIsCompletedTripsModalOpen(false)}
        completedBooking={completedBooking}
        onRebookRoute={(p, d, rType) => {
          setPickup(p);
          setDestination(d);
          setSelectedRideType(rType);
          setCurrentView('main_booking');
        }}
      />

      {/* Google & YouTube Music In-Cab Audio Player Modal */}
      <GoogleMusicModal
        isOpen={isGoogleMusicModalOpen}
        onClose={() => setIsGoogleMusicModalOpen(false)}
        currentTrack={currentMusicTrack}
        isPlaying={isMusicPlaying}
        onSelectTrack={handleSelectMusicTrack}
        onTogglePlay={handleToggleMusicPlay}
        onNextTrack={handleNextMusicTrack}
        onPrevTrack={handlePrevMusicTrack}
      />

      {/* RideCam Selfie & In-Cab Safety Camera Modal */}
      <SelfieCameraModal
        isOpen={isSelfieCameraModalOpen}
        onClose={() => setIsSelfieCameraModalOpen(false)}
        pickupLocation={pickup.name}
        destinationLocation={destination?.name || 'Destination'}
        userName={currentUser?.name || 'Rider'}
      />

      {/* Persistent Floating Mini Music Player (when music active & full modal closed) */}
      {!isGoogleMusicModalOpen && !isMiniPlayerDismissed && (
        <GoogleMusicMiniPlayer
          currentTrack={currentMusicTrack}
          isPlaying={isMusicPlaying}
          onTogglePlay={handleToggleMusicPlay}
          onNextTrack={handleNextMusicTrack}
          onOpenFullPlayer={() => setIsGoogleMusicModalOpen(true)}
          onClosePlayer={() => {
            musicAudioEngine.stop();
            setIsMusicPlaying(false);
            setIsMiniPlayerDismissed(true);
          }}
        />
      )}
    </div>
  );
}
