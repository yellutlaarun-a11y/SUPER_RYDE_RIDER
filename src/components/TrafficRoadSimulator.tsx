import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RideType, CabCategory } from '../types';
import { 
  Zap, 
  ShieldCheck, 
  Navigation, 
  Radio, 
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface TrafficRoadSimulatorProps {
  selectedRideType: RideType;
  selectedCabTier?: CabCategory;
  etaMins: number;
  fare: number | string;
  distanceKm?: number;
  onBookRide?: () => void;
}

export const TrafficRoadSimulator: React.FC<TrafficRoadSimulatorProps> = ({
  selectedRideType,
  selectedCabTier = 'sedan',
  etaMins,
  fare,
  distanceKm = 4.2,
  onBookRide
}) => {
  const [lanePosition, setLanePosition] = useState<0 | 1>(0); // 0: Main Lane, 1: Fast Lane

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-white text-slate-900 select-none">
      
      {/* 1. TOP LIVE TRAFFIC TELEMETRY HEADER */}
      <div className="px-3.5 py-2.5 bg-white border-b border-slate-100 backdrop-blur-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Live Recording Pulsing Dot */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[10px] font-black text-rose-600 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            <span className="uppercase">Live Traffic</span>
          </div>

          <span className="text-[11px] font-bold text-slate-700 hidden sm:inline-block">
            {selectedRideType === 'cab' 
              ? `${selectedCabTier.toUpperCase()} Cab in Transit` 
              : `${selectedRideType.replace('_', ' ').toUpperCase()} on Road`}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px]">
          {/* Nearest ETA */}
          <div className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs">
            {etaMins}m Pickup
          </div>
        </div>
      </div>

      {/* 2. REALISTIC ROAD & VEHICLE TRAFFIC ANIMATION SCENE */}
      <div className="relative w-full h-36 sm:h-44 overflow-hidden bg-gradient-to-b from-sky-50/60 via-slate-100 to-slate-200">
        
        {/* PARALLAX BACKGROUND: City Skyline Silhouettes & Distant Streetlights */}
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none opacity-20">
          <svg viewBox="0 0 800 60" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 60 L0 35 L30 35 L30 20 L50 20 L50 35 L80 35 L90 15 L120 15 L120 35 L160 35 L170 10 L200 10 L210 35 L260 35 L270 25 L300 25 L310 35 L360 35 L370 18 L400 18 L410 35 L470 35 L480 8 L520 8 L530 35 L590 35 L600 22 L640 22 L650 35 L710 35 L720 15 L760 15 L770 35 L800 35 L800 60 Z" fill="#475569" />
          </svg>
        </div>

        {/* DISTANT MOVING HIGHWAY LAMPS */}
        <div className="absolute inset-x-0 top-3 h-8 pointer-events-none overflow-hidden">
          <motion.div 
            className="flex gap-28 w-[200%]"
            animate={{ x: [0, -320] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
          >
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex flex-col items-center opacity-50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)]" />
                <div className="w-0.5 h-6 bg-slate-400" />
              </div>
            ))}
          </motion.div>
        </div>

        {/* REALISTIC MULTI-LANE ASPHALT HIGHWAY */}
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-[#171c26] border-t-2 border-slate-600 shadow-inner">
          {/* Asphalt Texture Grain Overlay */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />

          {/* Road Upper Shoulder Guardrail */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-500 border-b border-slate-400 flex justify-between px-2">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="w-1 h-full bg-slate-300 opacity-60" />
            ))}
          </div>

          {/* LANE 1 (TOP / FAST LANE) DASHED DIVIDER */}
          <div className="absolute top-10 sm:top-12 inset-x-0 h-1 overflow-hidden pointer-events-none">
            <motion.div 
              className="flex gap-6 w-[200%]"
              animate={{ x: [0, -96] }}
              transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }}
            >
              {[...Array(36)].map((_, i) => (
                <div key={i} className="w-8 h-1 bg-amber-400/90 rounded-full shadow-[0_0_4px_rgba(251,191,36,0.6)] flex-shrink-0" />
              ))}
            </motion.div>
          </div>

          {/* LANE 2 (BOTTOM / SLOW LANE) DASHED DIVIDER */}
          <div className="absolute top-20 sm:top-23 inset-x-0 h-1 overflow-hidden pointer-events-none">
            <motion.div 
              className="flex gap-6 w-[200%]"
              animate={{ x: [0, -96] }}
              transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }}
            >
              {[...Array(36)].map((_, i) => (
                <div key={i} className="w-8 h-1 bg-white/70 rounded-full flex-shrink-0" />
              ))}
            </motion.div>
          </div>

          {/* ROAD CAT-EYE REFLECTORS */}
          <div className="absolute bottom-1 inset-x-0 h-1 flex justify-around pointer-events-none opacity-70">
            {[...Array(16)].map((_, i) => (
              <div key={i} className="w-1.5 h-1 bg-amber-400 rounded-xs shadow-[0_0_4px_#f59e0b]" />
            ))}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* SURROUNDING TRAFFIC VEHICLES (MOVING REALISTICALLY ON ADJACENT LANES) */}
          {/* ----------------------------------------------------------------- */}
          
          {/* Traffic Vehicle 1: Distant White Hatchback passing in Lane 1 */}
          <motion.div
            className="absolute top-2.5 pointer-events-none z-10"
            animate={{ x: ['120%', '-40%'] }}
            transition={{ repeat: Infinity, duration: 7.2, ease: "linear", delay: 1 }}
          >
            <div className="scale-75 opacity-70">
              <svg viewBox="0 0 90 36" className="w-20 h-8 drop-shadow-md">
                <rect x="10" y="14" width="70" height="16" rx="4" fill="#E2E8F0" />
                <path d="M22 14 L34 4 L62 4 L72 14 Z" fill="#CBD5E1" />
                <rect x="36" y="6" width="12" height="7" rx="1" fill="#1E293B" opacity="0.8" />
                <rect x="50" y="6" width="12" height="7" rx="1" fill="#1E293B" opacity="0.8" />
                {/* Wheels */}
                <circle cx="26" cy="30" r="5.5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="68" cy="30" r="5.5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
                {/* Red Tail & Yellow Headlight */}
                <rect x="8" y="18" width="3" height="4" rx="1" fill="#EF4444" />
                <polygon points="80,18 92,14 92,24" fill="#FEF08A" opacity="0.6" />
              </svg>
            </div>
          </motion.div>

          {/* Traffic Vehicle 2: City Auto Rickshaw cruising in Lane 2 */}
          <motion.div
            className="absolute top-13 pointer-events-none z-10"
            animate={{ x: ['140%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 9.8, ease: "linear", delay: 3.5 }}
          >
            <div className="scale-75 opacity-80">
              <svg viewBox="0 0 80 44" className="w-18 h-10 drop-shadow-md">
                <path d="M14 20 C14 12 20 8 40 8 C54 8 62 12 62 20 L60 36 L12 36 Z" fill="#059669" />
                <path d="M14 20 C14 12 20 8 40 8 C54 8 62 12 62 20 Z" fill="#FBBF24" />
                <rect x="42" y="12" width="14" height="10" rx="2" fill="#E0F2FE" opacity="0.9" />
                <circle cx="22" cy="36" r="6" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.5" />
                <circle cx="56" cy="36" r="6" fill="#0F172A" stroke="#FBBF24" strokeWidth="1.5" />
                <polygon points="62,24 74,20 74,30" fill="#FEF08A" opacity="0.6" />
              </svg>
            </div>
          </motion.div>

          {/* ----------------------------------------------------------------- */}
          {/* PRIMARY SELECTED REALISTIC VEHICLE (HERO ACTOR ON HIGHWAY) */}
          {/* ----------------------------------------------------------------- */}
          <motion.div
            className={`absolute z-20 transition-all duration-500 ${
              lanePosition === 0 ? 'top-11 sm:top-13 left-16 sm:left-24' : 'top-3 sm:top-4 left-24 sm:left-36'
            }`}
            animate={{ 
              y: [0, -1.8, 0.4, -1.2, 0],
              x: [-1, 2, -1.5, 1, 0]
            }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
          >
            {/* REALISTIC AMBIENT GROUND ROAD SHADOW */}
            <div className="absolute -bottom-2 left-3 right-3 h-4 bg-black/75 blur-md rounded-full pointer-events-none" />

            {/* REALISTIC VEHICLE HEADLIGHT BEAM CASTING ON ASPHALT */}
            <div 
              className="absolute top-4 -right-28 sm:-right-40 w-32 sm:w-44 h-16 pointer-events-none opacity-60"
              style={{
                background: 'radial-gradient(ellipse at 0% 50%, rgba(254, 240, 138, 0.85) 0%, rgba(254, 240, 138, 0.3) 45%, transparent 75%)',
                clipPath: 'polygon(0% 40%, 100% 0%, 100% 100%, 0% 60%)',
              }}
            />

            {/* REALISTIC EXHAUST SMOKE PUFFS */}
            <div className="absolute bottom-2 -left-4 pointer-events-none">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-slate-400/40 blur-xs"
                animate={{ x: [-4, -18], y: [0, -6], scale: [0.6, 2.2], opacity: [0.7, 0] }}
                transition={{ repeat: Infinity, duration: 0.7 }}
              />
            </div>

            {/* ------------------------------------------------------------- */}
            {/* REALISTIC VEHICLE MODEL RENDERING (HIGH-FIDELITY SIDE VIEW) */}
            {/* ------------------------------------------------------------- */}
            {selectedRideType === 'bike' && (
              <div className="relative w-36 sm:w-44 h-20">
                <svg viewBox="0 0 160 80" className="w-full h-full drop-shadow-2xl">
                  {/* Motorcycle Chassis & Chrome Exhaust */}
                  <path d="M45 54 L90 54 L105 42 L80 42 Z" fill="#0F172A" />
                  <line x1="45" y1="56" x2="85" y2="56" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
                  
                  {/* Sporty Golden/Yellow Body Frame */}
                  <path d="M40 52 L68 34 L108 34 L120 52" stroke="#D97706" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M68 34 L92 24 L114 24" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Fuel Tank & Padded Seat */}
                  <path d="M56 32 C56 26 72 24 88 26 L98 32 L60 34 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                  <path d="M40 32 C46 26 58 28 62 32 L58 36 Z" fill="#1E293B" />

                  {/* Rider in Helmet & Riding Jacket */}
                  <circle cx="78" cy="14" r="9" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
                  <path d="M83" />
                  {/* Visor Glint */}
                  <path d="M82 12 L87 14 L82 17 Z" fill="#38BDF8" />
                  {/* Rider Torso & Arms holding handlebar */}
                  <path d="M72 22 L86 24 L96 34 L108 28" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Rear Wheel with Rotating Alloy Spokes */}
                  <g transform="translate(40, 52)">
                    <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#F59E0B" strokeWidth="3" />
                    <circle cx="0" cy="0" r="10" fill="#334155" />
                    <circle cx="0" cy="0" r="4.5" fill="#E2E8F0" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.55, ease: "linear" }}
                    >
                      <line x1="-14" y1="0" x2="14" y2="0" stroke="#CBD5E1" strokeWidth="2" />
                      <line x1="0" y1="-14" x2="0" y2="14" stroke="#CBD5E1" strokeWidth="2" />
                      <line x1="-10" y1="-10" x2="10" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
                      <line x1="-10" y1="10" x2="10" y2="-10" stroke="#CBD5E1" strokeWidth="1.5" />
                    </motion.g>
                  </g>

                  {/* Front Wheel with Rotating Alloy Spokes */}
                  <g transform="translate(120, 52)">
                    <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#F59E0B" strokeWidth="3" />
                    <circle cx="0" cy="0" r="10" fill="#334155" />
                    <circle cx="0" cy="0" r="4.5" fill="#E2E8F0" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.55, ease: "linear" }}
                    >
                      <line x1="-14" y1="0" x2="14" y2="0" stroke="#CBD5E1" strokeWidth="2" />
                      <line x1="0" y1="-14" x2="0" y2="14" stroke="#CBD5E1" strokeWidth="2" />
                      <line x1="-10" y1="-10" x2="10" y2="10" stroke="#CBD5E1" strokeWidth="1.5" />
                      <line x1="-10" y1="10" x2="10" y2="-10" stroke="#CBD5E1" strokeWidth="1.5" />
                    </motion.g>
                  </g>

                  {/* Xenon Headlamp Unit with Lens Glow */}
                  <polygon points="122,30 130,28 130,34" fill="#FEF08A" />
                  <circle cx="128" cy="31" r="3.5" fill="#FEF08A" />
                  {/* Red LED Taillight */}
                  <rect x="29" y="32" width="5" height="4" rx="1.5" fill="#EF4444" className="animate-pulse" />
                </svg>
              </div>
            )}

            {selectedRideType === 'auto' && (
              <div className="relative w-38 sm:w-46 h-22">
                <svg viewBox="0 0 160 84" className="w-full h-full drop-shadow-2xl">
                  {/* Yellow Hood / Roof Canopy */}
                  <path d="M26 36 C26 20 36 12 84 12 C116 12 134 20 134 36 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="2" />
                  {/* Green Bottom Body Chassis */}
                  <path d="M22 36 L134 36 L130 62 L24 62 Z" fill="#059669" stroke="#047857" strokeWidth="2" />
                  
                  {/* Big Panoramic Windshield Glass & Side Window */}
                  <path d="M92 18 L124 22 L120 36 L86 36 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" opacity="0.95" />
                  <rect x="42" y="24" width="36" height="24" rx="3" fill="#065F46" />
                  
                  {/* Driver in khaki uniform with steering handlebar */}
                  <circle cx="102" cy="28" r="6" fill="#D97706" />
                  <line x1="104" y1="34" x2="114" y2="40" stroke="#1E293B" strokeWidth="3" />

                  {/* Rear Big Wheel with Spinning Spoke */}
                  <g transform="translate(42, 60)">
                    <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#FBBF24" strokeWidth="3" />
                    <circle cx="0" cy="0" r="6" fill="#E2E8F0" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                    >
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#64748B" strokeWidth="2.5" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#64748B" strokeWidth="2.5" />
                    </motion.g>
                  </g>

                  {/* Front Single Wheel */}
                  <g transform="translate(122, 60)">
                    <circle cx="0" cy="0" r="13" fill="#0F172A" stroke="#FBBF24" strokeWidth="3" />
                    <circle cx="0" cy="0" r="5" fill="#E2E8F0" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                    >
                      <line x1="-10" y1="0" x2="10" y2="0" stroke="#64748B" strokeWidth="2" />
                    </motion.g>
                  </g>

                  {/* Front Golden Headlamp */}
                  <circle cx="132" cy="42" r="4.5" fill="#FEF08A" />
                  {/* Red Tail Lamp */}
                  <rect x="20" y="44" width="4" height="6" rx="1.5" fill="#EF4444" />
                </svg>
              </div>
            )}

            {selectedRideType === 'cab' && (
              <div className="relative w-44 sm:w-56 h-22">
                <svg viewBox="0 0 180 80" className="w-full h-full drop-shadow-2xl">
                  {/* TAXI Illuminated Rooftop Sign */}
                  <g transform="translate(80, 10)">
                    <rect x="0" y="0" width="24" height="9" rx="3" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                    <text x="3" y="7" fill="#78350F" fontSize="6" fontWeight="900">TAXI</text>
                    <circle cx="12" cy="4.5" r="1.5" fill="#FFF" className="animate-ping" />
                  </g>

                  {/* Sleek Aerodynamic Sedan Body (Indigo / Metallic Blue with Gloss highlights) */}
                  <path
                    d="M18 48 C18 40 28 32 46 26 C64 20 114 20 134 30 L158 38 C168 42 168 50 168 58 L18 58 Z"
                    fill="#3730A3"
                    stroke="#4338CA"
                    strokeWidth="2"
                  />
                  {/* Metallic Specular Highlight Gradient Stroke */}
                  <path
                    d="M48 28 C70 22 110 22 130 30 L154 38"
                    stroke="#A5B4FC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  {/* Tinted Front & Rear Glass Windows */}
                  <path d="M50 28 C64 22 84 22 92 28 L92 40 L44 40 Z" fill="#E0E7FF" opacity="0.9" />
                  <path d="M96 28 C108 22 126 26 134 32 L142 40 L96 40 Z" fill="#E0E7FF" opacity="0.9" />
                  <line x1="94" y1="23" x2="94" y2="40" stroke="#1E1B4B" strokeWidth="2.5" />

                  {/* Passenger & Driver Silhouettes */}
                  <circle cx="68" cy="34" r="4.5" fill="#312E81" />
                  <circle cx="112" cy="34" r="4.5" fill="#312E81" />

                  {/* Rear Alloy Wheel */}
                  <g transform="translate(46, 58)">
                    <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#6366F1" strokeWidth="3" />
                    <circle cx="0" cy="0" r="8" fill="#1E293B" />
                    <circle cx="0" cy="0" r="3" fill="#E0E7FF" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    >
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="-8" y1="-8" x2="8" y2="8" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="-8" y1="8" x2="8" y2="-8" stroke="#94A3B8" strokeWidth="2" />
                    </motion.g>
                  </g>

                  {/* Front Alloy Wheel */}
                  <g transform="translate(138, 58)">
                    <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#6366F1" strokeWidth="3" />
                    <circle cx="0" cy="0" r="8" fill="#1E293B" />
                    <circle cx="0" cy="0" r="3" fill="#E0E7FF" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    >
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="-8" y1="-8" x2="8" y2="8" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="-8" y1="8" x2="8" y2="-8" stroke="#94A3B8" strokeWidth="2" />
                    </motion.g>
                  </g>

                  {/* Xenon LED Projector Headlights */}
                  <polygon points="160,42 168,40 168,46" fill="#93C5FD" />
                  <circle cx="165" cy="43" r="3" fill="#93C5FD" />
                  {/* Red Taillight Bar */}
                  <rect x="16" y="44" width="6" height="5" rx="2" fill="#EF4444" />
                </svg>
              </div>
            )}

            {selectedRideType === 'self_drive' && (
              <div className="relative w-44 sm:w-56 h-22">
                <svg viewBox="0 0 180 80" className="w-full h-full drop-shadow-2xl">
                  {/* Digital Key Wireless Pulse Wave */}
                  <g transform="translate(90, 8)">
                    <motion.path
                      d="M-12 -2 C-8 -8 8 -8 12 -2"
                      stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none"
                      animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                    <circle cx="0" cy="2" r="3.5" fill="#EA580C" stroke="#FFF" strokeWidth="1" />
                  </g>

                  {/* Muscular SUV Body (Orange / Copper Sport Look) */}
                  <path
                    d="M18 50 C18 42 24 30 46 26 C64 22 120 22 136 28 L160 38 C168 42 168 52 168 58 L18 58 Z"
                    fill="#C2410C"
                    stroke="#9A3412"
                    strokeWidth="2"
                  />
                  {/* Roof Rails */}
                  <line x1="50" y1="24" x2="128" y2="24" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

                  {/* SUV Panoramic Windows */}
                  <path d="M50 28 L86 28 L86 40 L46 40 Z" fill="#FFEDD5" opacity="0.9" />
                  <path d="M90 28 L126 28 L142 40 L90 40 Z" fill="#FFEDD5" opacity="0.9" />

                  {/* Chunky SUV Wheels */}
                  <g transform="translate(48, 58)">
                    <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#F97316" strokeWidth="3" />
                    <circle cx="0" cy="0" r="8" fill="#1E293B" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    >
                      <line x1="-13" y1="0" x2="13" y2="0" stroke="#CBD5E1" strokeWidth="2.5" />
                      <line x1="0" y1="-13" x2="0" y2="13" stroke="#CBD5E1" strokeWidth="2.5" />
                    </motion.g>
                  </g>

                  <g transform="translate(136, 58)">
                    <circle cx="0" cy="0" r="16" fill="#0F172A" stroke="#F97316" strokeWidth="3" />
                    <circle cx="0" cy="0" r="8" fill="#1E293B" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                    >
                      <line x1="-13" y1="0" x2="13" y2="0" stroke="#CBD5E1" strokeWidth="2.5" />
                      <line x1="0" y1="-13" x2="0" y2="13" stroke="#CBD5E1" strokeWidth="2.5" />
                    </motion.g>
                  </g>

                  <circle cx="164" cy="44" r="3.5" fill="#FEF08A" />
                  <rect x="16" y="44" width="6" height="5" rx="2" fill="#EF4444" />
                </svg>
              </div>
            )}

            {selectedRideType === 'carpooling' && (
              <div className="relative w-44 sm:w-56 h-22">
                <svg viewBox="0 0 180 80" className="w-full h-full drop-shadow-2xl">
                  {/* Eco Green Carpool Van / Hybrid */}
                  <path
                    d="M18 50 C18 42 26 28 48 24 C68 20 124 20 140 28 L160 38 C168 42 168 52 168 58 L18 58 Z"
                    fill="#0F766E"
                    stroke="#115E59"
                    strokeWidth="2"
                  />

                  {/* Multi Passenger Avatars inside */}
                  <g transform="translate(60, 32)">
                    <circle cx="0" cy="0" r="5" fill="#2DD4BF" stroke="#FFF" strokeWidth="1" />
                  </g>
                  <g transform="translate(80, 30)">
                    <circle cx="0" cy="0" r="5.5" fill="#34D399" stroke="#FFF" strokeWidth="1" />
                  </g>
                  <g transform="translate(100, 32)">
                    <circle cx="0" cy="0" r="5" fill="#2DD4BF" stroke="#FFF" strokeWidth="1" />
                  </g>

                  {/* Windows */}
                  <path d="M48 26 L140 26 L148 40 L42 40 Z" fill="#CCFBF1" opacity="0.8" />

                  {/* Eco Wheels */}
                  <g transform="translate(48, 58)">
                    <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#2DD4BF" strokeWidth="3" />
                    <circle cx="0" cy="0" r="7" fill="#134E4A" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.52, ease: "linear" }}
                    >
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#99F6E4" strokeWidth="2" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#99F6E4" strokeWidth="2" />
                    </motion.g>
                  </g>

                  <g transform="translate(136, 58)">
                    <circle cx="0" cy="0" r="15" fill="#0F172A" stroke="#2DD4BF" strokeWidth="3" />
                    <circle cx="0" cy="0" r="7" fill="#134E4A" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.52, ease: "linear" }}
                    >
                      <line x1="-12" y1="0" x2="12" y2="0" stroke="#99F6E4" strokeWidth="2" />
                      <line x1="0" y1="-12" x2="0" y2="12" stroke="#99F6E4" strokeWidth="2" />
                    </motion.g>
                  </g>
                </svg>
              </div>
            )}

            {selectedRideType === 'courier' && (
              <div className="relative w-36 sm:w-44 h-20">
                <svg viewBox="0 0 160 80" className="w-full h-full drop-shadow-2xl">
                  {/* Courier Scooter with Insulated Delivery Box */}
                  <g transform="translate(30, 24)">
                    <rect x="0" y="0" width="30" height="26" rx="3" fill="#0284C7" stroke="#0369A1" strokeWidth="2" />
                    <line x1="15" y1="0" x2="15" y2="26" stroke="#38BDF8" strokeWidth="2" />
                    <line x1="0" y1="13" x2="30" y2="13" stroke="#38BDF8" strokeWidth="2" />
                    <circle cx="15" cy="13" r="4" fill="#FFF" />
                  </g>

                  {/* Scooter Body & Frame */}
                  <path d="M58 50 L76 50 L88 34 L110 34" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />
                  <path d="M68 50 L104 54" stroke="#0369A1" strokeWidth="5" strokeLinecap="round" />

                  {/* Rider with Delivery Cap */}
                  <circle cx="82" cy="22" r="7.5" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />
                  <path d="M86 18 L94 20 L86 22 Z" fill="#BAE6FD" />
                  <path d="M78 30 L88 34 L98 42 L106 36" stroke="#0F172A" strokeWidth="5" strokeLinecap="round" />

                  {/* Wheels */}
                  <g transform="translate(42, 54)">
                    <circle cx="0" cy="0" r="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="5" fill="#E0F2FE" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.55, ease: "linear" }}
                    >
                      <line x1="-11" y1="0" x2="11" y2="0" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1="-11" x2="0" y2="11" stroke="#94A3B8" strokeWidth="2" />
                    </motion.g>
                  </g>

                  <g transform="translate(112, 54)">
                    <circle cx="0" cy="0" r="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="5" fill="#E0F2FE" />
                    <motion.g
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.55, ease: "linear" }}
                    >
                      <line x1="-11" y1="0" x2="11" y2="0" stroke="#94A3B8" strokeWidth="2" />
                      <line x1="0" y1="-11" x2="0" y2="11" stroke="#94A3B8" strokeWidth="2" />
                    </motion.g>
                  </g>
                </svg>
              </div>
            )}

          </motion.div>

        </div>

        {/* 3. INTERACTIVE LANE SWITCHING & REAL-TIME DRIVING CONTROLS */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setLanePosition(lanePosition === 0 ? 1 : 0)}
            className="px-2.5 py-1 rounded-xl bg-white/95 hover:bg-white border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer backdrop-blur-xs"
            title="Switch Driving Lane in Traffic"
          >
            <Navigation className="w-3 h-3 text-emerald-600 rotate-45" />
            <span>Lane: {lanePosition === 0 ? 'Main Lane' : 'Fast Lane'}</span>
          </button>
        </div>

      </div>

      {/* 4. BOTTOM ACTION STRIP */}
      <div className="px-3.5 py-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium text-[11px]">Est. Fare:</span>
          <span className="font-black text-slate-900 text-sm">
            {typeof fare === 'number' ? `₹${fare}` : fare}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {distanceKm} km trip
          </span>
        </div>

        {onBookRide && (
          <button
            type="button"
            onClick={onBookRide}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <span>Book Now</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
