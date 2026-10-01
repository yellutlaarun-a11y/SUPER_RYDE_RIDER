import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationPoint, RideType } from '../types';
import { Star, Zap } from 'lucide-react';

export interface NearbyVehicle {
  id: string;
  type: RideType;
  name: string;
  vehicleModel: string;
  plateNumber: string;
  driverName: string;
  driverRating: number;
  tripsCount: number;
  etaMins: number;
  lat: number;
  lng: number;
  heading: number; // 0 - 360 degrees
  fareEst: number;
  isHighDemand?: boolean;
}

interface NearbyVehiclesMapLayerProps {
  map: google.maps.Map | null;
  pickup: LocationPoint;
  selectedRideType: RideType;
  isTrackingMode?: boolean;
}

// Generate realistic nearby available vehicles around pickup based on selected category
function generateNearbyVehicles(center: { lat: number; lng: number }, rideType: RideType): NearbyVehicle[] {
  const seed = Math.abs(Math.sin(center.lat * 100 + center.lng * 100));
  
  const bikeModels = [
    { model: 'Hero Splendor Plus', driver: 'Ramesh K.', plate: 'AP27 AB 4812', rating: 4.9, trips: 1420 },
    { model: 'Honda Activa 6G', driver: 'Suresh V.', plate: 'AP27 CM 9102', rating: 4.8, trips: 890 },
    { model: 'Bajaj Pulsar 150', driver: 'Venkatesh P.', plate: 'AP27 DF 3421', rating: 4.9, trips: 2150 },
    { model: 'TVS Jupiter 125', driver: 'Anand R.', plate: 'AP27 ER 7819', rating: 4.8, trips: 640 },
    { model: 'Royal Enfield Classic', driver: 'Kiran M.', plate: 'AP27 HK 2045', rating: 5.0, trips: 3100 },
    { model: 'Yamaha FZ-S', driver: 'Praveen T.', plate: 'AP27 JK 5612', rating: 4.9, trips: 1120 },
  ];

  const autoModels = [
    { model: 'Bajaj Compact RE 4S', driver: 'Subba Rao G.', plate: 'AP27 TA 8831', rating: 4.8, trips: 3400 },
    { model: 'Piaggio Ape City Plus', driver: 'Narayana M.', plate: 'AP27 TB 4920', rating: 4.9, trips: 2890 },
    { model: 'Mahindra Treo EV Auto', driver: 'Krishna Chaitanya', plate: 'AP27 TC 1104', rating: 5.0, trips: 950 },
    { model: 'TVS King Deluxe Auto', driver: 'Srinivasulu B.', plate: 'AP27 TD 7741', rating: 4.8, trips: 1980 },
    { model: 'Bajaj Maxima Z CNG', driver: 'Appa Rao K.', plate: 'AP27 TE 3389', rating: 4.9, trips: 4120 },
  ];

  const cabModels = [
    { model: 'Maruti Swift Dzire (Sedan)', driver: 'Mallikarjuna V.', plate: 'AP27 CA 2319', rating: 4.9, trips: 1850 },
    { model: 'Hyundai Aura Prime', driver: 'Laxman Prasad', plate: 'AP27 CB 7842', rating: 4.9, trips: 2400 },
    { model: 'Toyota Etios Platinum', driver: 'Gopala Krishna', plate: 'AP27 CC 5510', rating: 4.8, trips: 3200 },
    { model: 'Tata Tigor EV Express', driver: 'Ravi Teja S.', plate: 'AP27 CD 9014', rating: 5.0, trips: 1100 },
    { model: 'Maruti Ertiga XL (6-Seater)', driver: 'Brahmaiah N.', plate: 'AP27 CE 6623', rating: 4.9, trips: 4600 },
  ];

  const selfDriveModels = [
    { model: 'Tata Nexon EV (Automatic)', driver: 'Self-Drive Hub • Station Rd', plate: 'AP27 SD 1029', rating: 4.9, trips: 320 },
    { model: 'Maruti Swift ZXi+', driver: 'Self-Drive Hub • Lawyerpet', plate: 'AP27 SD 4452', rating: 4.8, trips: 410 },
    { model: 'Hyundai Creta SX (Sunroof)', driver: 'Self-Drive Hub • Kurnool Rd', plate: 'AP27 SD 8831', rating: 5.0, trips: 590 },
    { model: 'Mahindra Thar 4x4', driver: 'Self-Drive Hub • Bypass Rd', plate: 'AP27 SD 9912', rating: 4.9, trips: 280 },
  ];

  const carpoolModels = [
    { model: 'Honda City (AC) • 2 Seats Left', driver: 'Dr. Sai Praneeth', plate: 'AP27 CP 4109', rating: 5.0, trips: 98 },
    { model: 'Hyundai Verna • 3 Seats Left', driver: 'Sowmya Reddy (Tech Lead)', plate: 'AP27 CP 7712', rating: 4.9, trips: 142 },
    { model: 'Kia Seltos • 2 Seats Left', driver: 'Raghavendra K. (Manager)', plate: 'AP27 CP 3341', rating: 4.9, trips: 86 },
    { model: 'Tata Altroz • 1 Seat Left', driver: 'Deepak V. (Architect)', plate: 'AP27 CP 9920', rating: 4.8, trips: 64 },
  ];

  const courierModels = [
    { model: 'Rapido Express Delivery Box', driver: 'Gopi Krishna (Fast Courier)', plate: 'AP27 EX 1102', rating: 4.9, trips: 2400 },
    { model: 'SpeedParcel Bike 15-Min', driver: 'Prasad N. (Priority Rider)', plate: 'AP27 EX 8841', rating: 5.0, trips: 3100 },
    { model: 'SecureDoc Express Runner', driver: 'Manoj Kumar', plate: 'AP27 EX 6632', rating: 4.9, trips: 1800 },
    { model: 'Heavy Parcel Cargo Scooter', driver: 'Veera Swamy', plate: 'AP27 EX 4429', rating: 4.8, trips: 1250 },
    { model: 'HyperLocal 10-Min Delivery', driver: 'Ashok Vardhan', plate: 'AP27 EX 9051', rating: 4.9, trips: 2900 },
  ];

  let activeList = bikeModels;
  let count = 6;
  let basePrice = 29;

  if (rideType === 'auto') {
    activeList = autoModels;
    count = 5;
    basePrice = 45;
  } else if (rideType === 'cab') {
    activeList = cabModels;
    count = 5;
    basePrice = 99;
  } else if (rideType === 'self_drive') {
    activeList = selfDriveModels;
    count = 4;
    basePrice = 149;
  } else if (rideType === 'carpooling') {
    activeList = carpoolModels;
    count = 4;
    basePrice = 35;
  } else if (rideType === 'courier') {
    activeList = courierModels;
    count = 5;
    basePrice = 39;
  }

  // Land-safe radial distribution (keeping vehicles on roads, biased inland away from oceans/water bodies)
  // For Indian East Coast coordinates (like Ongole/Chennai/Kothapatnam), water is to the East (lng > 80.08)
  const isEastCoast = center.lng > 80.08 || (center.lat > 12 && center.lat < 18 && center.lng > 80.1);
  const isWestCoast = center.lng < 73.0;

  // Safe angles biased towards city road corridors
  const baseAngles = isEastCoast 
    ? [190, 230, 270, 305, 335, 250] // Strictly West / North-West (Inland)
    : isWestCoast
    ? [10, 45, 90, 135, 170, 75]    // Strictly East / North-East (Inland)
    : [25, 75, 140, 205, 260, 320]; // 360 inland city distribution

  const distOffsets = [0.0018, 0.0026, 0.0022, 0.0031, 0.0020, 0.0028];

  return activeList.slice(0, count).map((item, idx) => {
    const angle = baseAngles[idx % baseAngles.length];
    const angleRad = (angle * Math.PI) / 180;
    const distance = distOffsets[idx % distOffsets.length] * (0.8 + 0.3 * ((idx * 3) % 4) / 4);
    
    // Compute exact latitude / longitude offset along land roads
    const lat = center.lat + distance * Math.cos(angleRad);
    const lng = center.lng + (distance / Math.cos((center.lat * Math.PI) / 180)) * Math.sin(angleRad);
    
    // Heading aligned along road direction
    const heading = (Math.round((angle + 90 + idx * 30) % 360));
    const etaMins = Math.max(1, Math.min(5, Math.round(distance * 900) + 1));

    return {
      id: `vh_${rideType}_${idx}`,
      type: rideType,
      name: item.model,
      vehicleModel: item.model,
      plateNumber: item.plate,
      driverName: item.driver,
      driverRating: item.rating,
      tripsCount: item.trips,
      etaMins,
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      heading,
      fareEst: basePrice + idx * 4,
      isHighDemand: idx === 0,
    };
  });
}

// -------------------------------------------------------------
// REALISTIC TOP-DOWN / ISOMETRIC ANIMATED VEHICLE SPRITE
// -------------------------------------------------------------
const RealisticVehicleSprite: React.FC<{
  vehicle: NearbyVehicle;
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ vehicle, isSelected = false, onClick }) => {
  const { type, heading } = vehicle;

  return (
    <div 
      onClick={onClick}
      className="relative cursor-pointer group select-none"
      style={{ transform: `rotate(${heading}deg)` }}
    >
      {/* 1. REALISTIC AMBIENT GROUND SHADOW */}
      <div className="absolute inset-0 -bottom-1 bg-black/35 blur-[1.5px] rounded-full transform scale-100 pointer-events-none" />

      {/* 2. REALISTIC HEADLIGHT THROW / FORWARD LIGHT CONE ON ROAD */}
      <div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-7 h-7 pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(254, 240, 138, 0.75) 0%, rgba(254, 240, 138, 0.25) 50%, transparent 80%)',
          clipPath: 'polygon(35% 100%, 65% 100%, 95% 0%, 5% 0%)',
        }}
      />

      {/* 3. SPRITE BODY BY VEHICLE CATEGORY (50% compact scale for realistic map streets) */}
      {type === 'bike' && (
        <div className="relative w-4 h-6 flex items-center justify-center">
          {/* Animated Motorcycle Frame (Top-Down Realistic) */}
          <svg viewBox="0 0 32 48" className="w-full h-full drop-shadow-xs">
            {/* Front Wheel with spinning rim tick */}
            <rect x="14" y="2" width="4" height="10" rx="2" fill="#0F172A" />
            <line x1="16" y1="3" x2="16" y2="11" stroke="#94A3B8" strokeWidth="1" />
            
            {/* Handlebars with mirror dots */}
            <path d="M6 12 L26 12" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="5" cy="12" r="1.5" fill="#CBD5E1" />
            <circle cx="27" cy="12" r="1.5" fill="#CBD5E1" />
            
            {/* Front Headlight Dual Lens */}
            <circle cx="16" cy="7" r="2.5" fill="#FEF08A" />
            <circle cx="16" cy="7" r="1" fill="#FFFFFF" />

            {/* Fuel Tank (Bright Sporty Yellow / Gold) */}
            <path d="M11 16 C11 14 21 14 21 16 L22 24 L10 24 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            
            {/* Rider Wearing Helmet (Top view with visor) */}
            <ellipse cx="16" cy="22" rx="5" ry="5.5" fill="#FBBF24" stroke="#78350F" strokeWidth="1.2" />
            <path d="M13 18.5 Q16 17 19 18.5" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />

            {/* Rider Shoulders in Jacket */}
            <path d="M9 25 C9 22 23 22 23 25 L22 30 L10 30 Z" fill="#1E293B" />

            {/* Seat & Rear Cowl */}
            <rect x="12" y="28" width="8" height="9" rx="2" fill="#0F172A" />
            <polygon points="12,37 20,37 16,42" fill="#F59E0B" />

            {/* Rear Wheel */}
            <rect x="14" y="38" width="4" height="8" rx="2" fill="#0F172A" />
            {/* Dual Red Tail Light */}
            <rect x="13" y="41" width="6" height="1.5" rx="0.5" fill="#EF4444" />
          </svg>
        </div>
      )}

      {type === 'auto' && (
        <div className="relative w-5 h-6.5 flex items-center justify-center">
          {/* Classic Indian Auto Rickshaw (Yellow & Emerald Green Canopy) */}
          <svg viewBox="0 0 36 48" className="w-full h-full drop-shadow-xs">
            {/* Auto Outer Contour / Body */}
            <path 
              d="M7 16 C7 10 13 4 18 4 C23 4 29 10 29 16 L31 38 C31 43 27 45 18 45 C9 45 5 43 5 38 Z" 
              fill="#047857" 
              stroke="#064E3B" 
              strokeWidth="1.2"
            />
            {/* Iconic Yellow Canopy Top */}
            <path 
              d="M8 17 C8 12 13 6 18 6 C23 6 28 12 28 17 L29 36 C29 40 26 42 18 42 C10 42 7 40 7 36 Z" 
              fill="#FBBF24" 
              stroke="#D97706" 
              strokeWidth="1"
            />
            
            {/* Front Windshield Glass */}
            <path d="M11 11 Q18 9 25 11 L26 15 Q18 13 10 15 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="0.8" opacity="0.9" />
            
            {/* Front Single Wheel */}
            <rect x="16.5" y="1" width="3" height="6" rx="1.5" fill="#0F172A" />
            
            {/* Dual Headlights */}
            <circle cx="13" cy="8" r="1.8" fill="#FEF08A" />
            <circle cx="23" cy="8" r="1.8" fill="#FEF08A" />

            {/* Rear Left & Right Wheels */}
            <rect x="3" y="32" width="3.5" height="8" rx="1.5" fill="#0F172A" />
            <rect x="29.5" y="32" width="3.5" height="8" rx="1.5" fill="#0F172A" />

            {/* Auto Passenger Bench Outline */}
            <rect x="11" y="24" width="14" height="11" rx="1.5" fill="#15803D" />
            <rect x="12" y="26" width="12" height="7" rx="1" fill="#166534" />
          </svg>
        </div>
      )}

      {type === 'cab' && (
        <div className="relative w-5 h-7.5 flex items-center justify-center">
          {/* Sleek Modern Sedan Cab */}
          <svg viewBox="0 0 36 54" className="w-full h-full drop-shadow-xs">
            {/* Car Wheels (4 corners) */}
            <rect x="2" y="8" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="30.5" y="8" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="2" y="37" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="30.5" y="37" width="3.5" height="9" rx="1.5" fill="#0F172A" />

            {/* Car Main Body (Crisp Indigo & White Taxi) */}
            <path 
              d="M6 14 C6 8 11 4 18 4 C25 4 30 8 30 14 L31 42 C31 48 26 50 18 50 C10 50 5 48 5 42 Z" 
              fill="#4338CA" 
              stroke="#312E81" 
              strokeWidth="1.2"
            />
            {/* Hood Curvature */}
            <path d="M8 12 Q18 9 28 12 L28 16 Q18 14 8 16 Z" fill="#4F46E5" />

            {/* Front Windshield */}
            <path d="M9 17 Q18 15 27 17 L25 24 Q18 22 11 24 Z" fill="#E0E7FF" stroke="#3730A3" strokeWidth="0.8" />

            {/* Roof Top */}
            <rect x="10" y="24" width="16" height="15" rx="2" fill="#3730A3" />
            
            {/* TAXI / CAB ROOF LIGHT SIGN (Illuminated Amber) */}
            <rect x="13" y="29" width="10" height="4" rx="1" fill="#F59E0B" stroke="#B45309" strokeWidth="0.8" />
            <text x="14" y="32.2" fill="#78350F" fontSize="2.8" fontWeight="900">CAB</text>

            {/* Rear Windshield */}
            <path d="M11 39 Q18 41 25 39 L27 44 Q18 46 9 44 Z" fill="#E0E7FF" stroke="#3730A3" strokeWidth="0.8" />

            {/* Front Headlights & Rear Red Lights */}
            <circle cx="9" cy="6" r="2" fill="#93C5FD" />
            <circle cx="27" cy="6" r="2" fill="#93C5FD" />
            <rect x="7" y="47" width="4" height="2" rx="0.5" fill="#EF4444" />
            <rect x="25" y="47" width="4" height="2" rx="0.5" fill="#EF4444" />
          </svg>
        </div>
      )}

      {type === 'self_drive' && (
        <div className="relative w-5.5 h-7.5 flex items-center justify-center">
          {/* Rugged Sport SUV / Self-Drive Vehicle */}
          <svg viewBox="0 0 38 54" className="w-full h-full drop-shadow-xs">
            {/* Broad SUV Wheels */}
            <rect x="2" y="7" width="4" height="10" rx="1.5" fill="#0F172A" />
            <rect x="32" y="7" width="4" height="10" rx="1.5" fill="#0F172A" />
            <rect x="2" y="37" width="4" height="10" rx="1.5" fill="#0F172A" />
            <rect x="32" y="37" width="4" height="10" rx="1.5" fill="#0F172A" />

            {/* SUV Body (Sport Sunset Orange) */}
            <path 
              d="M6 12 C6 7 11 4 19 4 C27 4 32 7 32 12 L33 43 C33 48 28 50 19 50 C10 50 5 48 5 43 Z" 
              fill="#EA580C" 
              stroke="#9A3412" 
              strokeWidth="1.2"
            />
            {/* Roof Rails */}
            <line x1="9" y1="21" x2="9" y2="39" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="29" y1="21" x2="29" y2="39" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />

            {/* Panoramic Sunroof */}
            <rect x="12" y="23" width="14" height="14" rx="2" fill="#1E293B" />
            <rect x="13.5" y="24.5" width="11" height="11" rx="1.5" fill="#FED7AA" opacity="0.8" />

            {/* Smart Key Beacon Pulse on Roof */}
            <circle cx="19" cy="30" r="2.5" fill="#F97316" />
            <circle cx="19" cy="30" r="1" fill="#FFFFFF" />

            {/* Front Quad LED Lights */}
            <circle cx="9" cy="6" r="2" fill="#FEF08A" />
            <circle cx="12" cy="6" r="1.5" fill="#FEF08A" />
            <circle cx="26" cy="6" r="1.5" fill="#FEF08A" />
            <circle cx="29" cy="6" r="2" fill="#FEF08A" />
          </svg>
        </div>
      )}

      {type === 'carpooling' && (
        <div className="relative w-5 h-7.5 flex items-center justify-center">
          {/* Shared Eco Green Carpool Vehicle */}
          <svg viewBox="0 0 36 54" className="w-full h-full drop-shadow-xs">
            <rect x="2" y="8" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="30.5" y="8" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="2" y="37" width="3.5" height="9" rx="1.5" fill="#0F172A" />
            <rect x="30.5" y="37" width="3.5" height="9" rx="1.5" fill="#0F172A" />

            {/* Teal Eco Body */}
            <path 
              d="M6 14 C6 8 11 4 18 4 C25 4 30 8 30 14 L31 42 C31 48 26 50 18 50 C10 50 5 48 5 42 Z" 
              fill="#0D9488" 
              stroke="#115E59" 
              strokeWidth="1.2"
            />
            {/* Windshield */}
            <path d="M9 17 Q18 15 27 17 L25 24 Q18 22 11 24 Z" fill="#CCFBF1" stroke="#0F766E" strokeWidth="0.8" />

            {/* Passenger Seating Avatars (Driver + 3 Seats) */}
            <circle cx="13" cy="27" r="2.2" fill="#14B8A6" stroke="#FFFFFF" strokeWidth="0.6" />
            <circle cx="23" cy="27" r="2.2" fill="#99F6E4" stroke="#0F766E" strokeWidth="0.6" />
            <circle cx="13" cy="34" r="2.2" fill="#99F6E4" stroke="#0F766E" strokeWidth="0.6" />
            <circle cx="23" cy="34" r="2.2" fill="#2DD4BF" stroke="#FFFFFF" strokeWidth="0.6" />
          </svg>
        </div>
      )}

      {type === 'courier' && (
        <div className="relative w-4.5 h-6.5 flex items-center justify-center">
          {/* Express Delivery Scooter with Parcel Box */}
          <svg viewBox="0 0 32 48" className="w-full h-full drop-shadow-xs">
            {/* Front Wheel */}
            <rect x="14" y="2" width="4" height="9" rx="2" fill="#0F172A" />
            <path d="M6 11 L26 11" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="6" r="2.5" fill="#38BDF8" />

            {/* Courier Rider with Blue Helmet */}
            <ellipse cx="16" cy="18" rx="5" ry="5.5" fill="#0284C7" stroke="#0369A1" strokeWidth="1.2" />

            {/* Large Branded Express Delivery Box on Back */}
            <rect x="9" y="26" width="14" height="13" rx="2" fill="#0284C7" stroke="#0369A1" strokeWidth="1.2" />
            <rect x="11" y="28" width="10" height="9" rx="1" fill="#38BDF8" />
            <path d="M13 32 L16 30 L19 32 L16 34 Z" fill="#FFFFFF" />

            {/* Rear Wheel */}
            <rect x="14" y="39" width="4" height="7" rx="1.5" fill="#0F172A" />
          </svg>
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// MAIN COMPONENT: NEARBY VEHICLES MAP LAYER
// -------------------------------------------------------------
export const NearbyVehiclesMapLayer: React.FC<NearbyVehiclesMapLayerProps> = ({
  map,
  pickup,
  selectedRideType,
  isTrackingMode = false,
}) => {
  const [vehicles, setVehicles] = useState<NearbyVehicle[]>([]);
  const [hoveredVehicle, setHoveredVehicle] = useState<NearbyVehicle | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<NearbyVehicle | null>(null);
  const [pixelPositions, setPixelPositions] = useState<Record<string, { x: number; y: number; visible: boolean }>>({});

  // Generate vehicles whenever pickup coordinates or selectedRideType change
  useEffect(() => {
    if (!pickup.lat || !pickup.lng) return;
    const list = generateNearbyVehicles({ lat: pickup.lat, lng: pickup.lng }, selectedRideType);
    setVehicles(list);
    setSelectedVehicle(null);
  }, [pickup.lat, pickup.lng, selectedRideType]);

  // Synchronize Google Maps projection to map screen container coordinates
  useEffect(() => {
    if (!map || !window.google || vehicles.length === 0) return;

    let overlay: google.maps.OverlayView | null = null;

    try {
      overlay = new window.google.maps.OverlayView();
      overlay.onAdd = () => {};
      overlay.draw = () => {
        const projection = overlay?.getProjection();
        if (!projection) return;

        const newPos: Record<string, { x: number; y: number; visible: boolean }> = {};
        vehicles.forEach((v) => {
          const latLng = new window.google.maps.LatLng(v.lat, v.lng);
          const px = projection.fromLatLngToContainerPixel(latLng);
          if (px) {
            newPos[v.id] = {
              x: px.x,
              y: px.y,
              visible: true,
            };
          }
        });
        setPixelPositions(newPos);
      };
      overlay.onRemove = () => {};
      overlay.setMap(map);

      // Listen to map pan, zoom, and bounds change events
      const listeners = [
        map.addListener('bounds_changed', () => overlay?.draw()),
        map.addListener('center_changed', () => overlay?.draw()),
        map.addListener('zoom_changed', () => overlay?.draw()),
        map.addListener('idle', () => overlay?.draw()),
      ];

      return () => {
        listeners.forEach((l) => window.google.maps.event.removeListener(l));
        if (overlay) overlay.setMap(null);
      };
    } catch (e) {
      console.warn('Could not initialize Google Maps vehicle projection overlay:', e);
    }
  }, [map, vehicles]);

  // Subtle cruising micro-drift animation for realistic street wandering
  useEffect(() => {
    if (vehicles.length === 0) return;

    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          // Micro step along heading vector
          const headingRad = (v.heading * Math.PI) / 180;
          const speed = 0.00003 + (Math.random() * 0.00002);
          const newLat = v.lat + speed * Math.cos(headingRad);
          const newLng = v.lng + speed * Math.sin(headingRad);
          // Slight steering adjustment
          const newHeading = (v.heading + (Math.random() * 8 - 4) + 360) % 360;

          return {
            ...v,
            lat: newLat,
            lng: newLng,
            heading: Math.round(newHeading),
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [vehicles.length]);

  if (isTrackingMode) return null; // In active tracking mode, we only show assigned captain

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. ANIMATED VEHICLES PINNED TO EXACT MAP GPS COORDINATES */}
      {/* ------------------------------------------------------------- */}
      {vehicles.map((vehicle) => {
        const pos = pixelPositions[vehicle.id];
        if (!pos || !pos.visible) return null;

        const isHovered = hoveredVehicle?.id === vehicle.id;
        const isSelected = selectedVehicle?.id === vehicle.id;

        return (
          <div
            key={vehicle.id}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute pointer-events-auto transition-all duration-700 ease-out z-20"
            onMouseEnter={() => setHoveredVehicle(vehicle)}
            onMouseLeave={() => setHoveredVehicle(null)}
            onClick={() => setSelectedVehicle(isSelected ? null : vehicle)}
          >
            {/* Live GPS Signal Proximity Wave (50% scale) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border border-emerald-400/40 animate-ping pointer-events-none opacity-40" />

            {/* Realistic Animated Vehicle Sprite */}
            <div className="relative">
              <RealisticVehicleSprite vehicle={vehicle} isSelected={isSelected} />
            </div>

            {/* Floating Live ETA Tag Badge Above Vehicle (Compact 50% size) */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
              <div className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black shadow-xs flex items-center gap-0.5 border transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-400 scale-105 ring-1 ring-emerald-400/50'
                  : 'bg-white/95 text-slate-800 border-slate-200 backdrop-blur-xs'
              }`}>
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                <span>{vehicle.etaMins}m</span>
              </div>
            </div>

            {/* Interactive Driver/Vehicle Hover & Click Popover Card */}
            <AnimatePresence>
              {(isHovered || isSelected) && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 3, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-slate-900/98 text-white rounded-xl p-2 shadow-xl border border-emerald-500/50 backdrop-blur-md z-30 pointer-events-auto"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[11px] font-black text-emerald-400 truncate">
                      {vehicle.driverName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      {vehicle.driverRating}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-300 truncate font-medium mb-1.5">
                    {vehicle.vehicleModel}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-800">
                    <span className="font-mono text-slate-300">{vehicle.plateNumber}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      {vehicle.etaMins} mins away
                    </span>
                  </div>

                  {/* Tiny arrow pointing to vehicle */}
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-emerald-500/50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
