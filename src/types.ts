export type RideType = 'bike' | 'auto' | 'cab' | 'self_drive' | 'carpooling' | 'courier';

export type TripMode = 'direct' | 'round_trip';

export type CabCategory = 'mini' | 'hatchback' | 'sedan' | 'suv';

export interface DeviceGpsState {
  lat: number;
  lng: number;
  accuracy: number;
  address?: string;
  timestamp: number;
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'error' | 'poor_signal';
  errorMessage?: string;
  isAccuracyPoor?: boolean;
  accuracyLevel?: 'high' | 'medium' | 'low' | 'ip' | 'default';
}

export interface LocationPoint {
  id: string;
  name: string;
  address: string;
  lat: number; // Real GPS latitude
  lng: number; // Real GPS longitude
  type?: 'current' | 'metro' | 'airport' | 'mall' | 'hotel' | 'park' | 'theatre' | 'tech_park' | 'station' | 'hospital' | 'shopping' | 'custom';
  category?: 'Mall' | 'Hotel' | 'Park' | 'Theatre' | 'Station' | 'Metro' | 'Tech Park' | 'Airport' | 'Hospital' | 'Hotspot' | 'Saved' | 'Custom';
  city?: string;
  popularRank?: number;
}

export interface CarOwner {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  verified: boolean;
  hubName: string;
  hubAddress: string;
  lat: number;
  lng: number;
  vehiclePlate: string;
  vehicleColor: string;
  fuelLevelPercent: number;
  odometerKm: number;
}

export interface SelfDriveCar {
  id: string;
  name: string;
  brand: string;
  category: 'Hatchback' | 'Sedan' | 'Compact SUV' | 'Luxury SUV' | 'Electric';
  image: string;
  transmission: 'Manual' | 'Automatic';
  fuelType: 'Petrol' | 'Diesel' | 'Electric';
  seats: number;
  hourlyRate: number;
  dailyRate: number;
  rating: number;
  tripsCompleted: number;
  freeKmIncluded: number;
  securityDeposit: number;
  availableLocation: string;
  features: string[];
  owner?: CarOwner;
}

export interface CarpoolRide {
  id: string;
  hostName: string;
  hostAvatar: string;
  hostRating: number;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  origin: string;
  destination: string;
  departureTime: string;
  totalSeats: number;
  availableSeats: number;
  baseFarePerSeat: number;
  features: string[];
  instantBooking: boolean;
}

export type CourierVehicleType = 'bike_express' | 'auto_cargo' | 'van_tempo' | 'heavy_truck';

export interface CourierVehicleOption {
  type: CourierVehicleType;
  name: string;
  maxWeightKg: number;
  baseFare: number;
  ratePerKm: number;
  description: string;
  icon: string;
  etaMins: number;
  recommendedFor: string;
}

export interface CaptainDetails {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalTrips: number;
  photo: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleNumber: string;
  vehicleType: RideType;
  cabSubtype?: CabCategory;
  currentProgress: number; // 0 to 1 along path to pickup
}

export type BookingStatus = 
  | 'searching'
  | 'captain_assigned'
  | 'captain_arriving'
  | 'captain_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ActiveBooking {
  id: string;
  bookingCode: string;
  rideType: RideType;
  tripMode?: TripMode; // 'direct' (one-way) or 'round_trip' (return included)
  cabCategory?: CabCategory;
  pickup: LocationPoint;
  destination: LocationPoint;
  fare: number;
  distanceKm: number;
  durationMins: number;
  otp: string; // 4-digit start OTP
  captain: CaptainDetails;
  status: BookingStatus;
  statusMessage: string;
  estimatedArrivalMins: number;
  createdAt: string;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'RidePulse Wallet';
  roundTripDetails?: {
    returnWaitMinutes: number;
    returnFareDiscount: number;
    returnPickup: LocationPoint;
    returnDestination: LocationPoint;
    currentLeg: 1 | 2; // 1 = outward to destination, 2 = return to pickup
    isWaitingPeriod?: boolean;
  };
  // Specific metadata
  selfDriveDetails?: {
    car: SelfDriveCar;
    durationHours: number;
    securityOtp: string; // 4-digit start OTP
    returnOtp?: string; // 4-digit return OTP provided by vehicle owner
    pickupLocation: string;
    owner: CarOwner;
    fuelLevelPercent?: number;
    kmDriven?: number;
    totalEstimatedFare?: number;
    advancePaidAmount?: number; // 25% advance booking fee
    remainingBalance?: number; // 75% remaining balance
    advancePaymentMethod?: string;
    advanceTransactionId?: string;
    conditionGuaranteeActive?: boolean;
  };
  carpoolDetails?: {
    passengers: number;
    carpool: CarpoolRide;
    totalFare: number;
  };
  courierDetails?: {
    weightKg: number;
    vehicleType: CourierVehicleType;
    packageType: string;
    receiverName: string;
    receiverPhone: string;
    deliveryInstructions?: string;
  };
}

export interface ScheduledBooking {
  id: string;
  rideType: RideType;
  tripMode?: TripMode;
  roundTripDetails?: {
    returnWaitMinutes: number;
    returnFareDiscount: number;
    returnPickup: LocationPoint;
    returnDestination: LocationPoint;
    currentLeg: 1 | 2;
    isWaitingPeriod?: boolean;
  };
  pickup: LocationPoint;
  destination: LocationPoint;
  scheduledDate: string;
  scheduledTime: string;
  estimatedFare: number;
  status: 'Scheduled' | 'Confirmed';
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  rating: number;
  walletBalance: number;
  savedPlaces: {
    home?: LocationPoint;
    work?: LocationPoint;
    favorites: LocationPoint[];
  };
  emergencyContact: {
    name: string;
    phone: string;
  };
}

export interface RideHistoryItem {
  id: string;
  bookingCode: string;
  date: string;
  timestamp: string;
  rideType: RideType;
  cabCategory?: CabCategory;
  pickup: {
    name: string;
    address: string;
  };
  destination: {
    name: string;
    address: string;
  };
  fare: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'RidePulse Wallet';
  status: 'Completed' | 'Cancelled' | 'Delivered';
  rating: number;
  distanceKm: number;
  durationMins: number;
  captain: {
    name: string;
    phone: string;
    photo: string;
    vehicleModel: string;
    vehicleNumber: string;
    rating: number;
    totalTrips: number;
  };
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
  coverUrl: string;
  genre: 'Bollywood' | 'Telugu/South' | 'Pop' | 'Lofi/Chill' | 'EDM/Dance' | 'Acoustic';
  frequencyBase: number;
  lyrics?: string[];
  tempoBpm: number;
  energy: 'Chill' | 'Upbeat' | 'Party' | 'Drive';
}

export interface MusicPlaylist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  curator: string;
  tracks: MusicTrack[];
}

