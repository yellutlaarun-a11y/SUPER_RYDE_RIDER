import React from 'react';
import { motion } from 'motion/react';

interface AnimatedIconProps {
  className?: string;
  isActive?: boolean;
}

// 1. CLASSIC BIKE ICON (Vintage Roadster / Cafe Racer with spoked wheels, teardrop tank & round headlamp)
export const AnimatedBikeIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={isActive ? { y: [0, -1.2, 0.4, -0.8, 0] } : { y: [0, -0.6, 0] }}
        transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.4, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Rear Spoked Wheel */}
          <g transform="translate(17, 41)">
            <circle cx="0" cy="0" r="10" fill="#1E293B" stroke="#D97706" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="7" fill="#334155" />
            <circle cx="0" cy="0" r="3" fill="#F1F5F9" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#E2E8F0" strokeWidth="1.2" />
              <line x1="0" y1="-7" x2="0" y2="7" stroke="#E2E8F0" strokeWidth="1.2" />
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="-5" y1="5" x2="5" y2="-5" stroke="#E2E8F0" strokeWidth="1" />
            </motion.g>
          </g>

          {/* Front Spoked Wheel */}
          <g transform="translate(47, 41)">
            <circle cx="0" cy="0" r="10" fill="#1E293B" stroke="#D97706" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="7" fill="#334155" />
            <circle cx="0" cy="0" r="3" fill="#F1F5F9" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-7" y1="0" x2="7" y2="0" stroke="#E2E8F0" strokeWidth="1.2" />
              <line x1="0" y1="-7" x2="0" y2="7" stroke="#E2E8F0" strokeWidth="1.2" />
              <line x1="-5" y1="-5" x2="5" y2="5" stroke="#E2E8F0" strokeWidth="1" />
              <line x1="-5" y1="5" x2="5" y2="-5" stroke="#E2E8F0" strokeWidth="1" />
            </motion.g>
          </g>

          {/* Classic Chrome Exhaust Pipe */}
          <path d="M22 43 L36 43 L42 41" stroke="#E2E8F0" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 43 L22 43" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Vintage Tubular Frame */}
          <path d="M17 41 L30 28 L43 28 L47 41" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M30 41 L30 28 L37 41" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

          {/* Classic Teardrop Gas Tank (Amber/Gold with Chrome Pinstripe) */}
          <path d="M27 26 C27 22 36 21 41 24 C43 25 43 28 39 29 C34 30 28 29 27 26 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
          <path d="M30 25 C32 23 37 23 39 25" stroke="#FEF3C7" strokeWidth="1" strokeLinecap="round" />

          {/* Classic Ribbed Leather Saddle */}
          <path d="M17 27 C18 24 26 24 28 27 L18 29 Z" fill="#78350F" stroke="#451A03" strokeWidth="1" />

          {/* Front Chrome Fork & Handlebars */}
          <line x1="47" y1="41" x2="42" y2="19" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M40 19 L44 19 L46 16" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Classic Round Chrome Headlamp */}
          <circle cx="46" cy="22" r="3.2" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1.2" />
          {/* Headlamp Glow Beam */}
          <polygon points="49,20 60,15 60,29 49,24" fill="#FEF08A" opacity={isActive ? "0.6" : "0.3"} />
          
          {/* Rear Vintage Tail Lamp */}
          <rect x="13" y="27" width="2.5" height="3" rx="1" fill="#EF4444" />
        </svg>
      </motion.div>
    </div>
  );
};

// 2. CLASSIC AUTO RICKSHAW ICON (Heritage Tuk-Tuk with traditional green & yellow livery, curved canopy & chrome grille)
export const AnimatedAutoIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={isActive ? { y: [0, -1.2, 0.4, -0.8, 0] } : { y: [0, -0.5, 0] }}
        transition={{ repeat: Infinity, duration: isActive ? 0.55 : 1.3, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Classic Yellow Canopy Top */}
          <path d="M12 26 C12 16 18 13 36 13 C47 13 53 16 53 26 Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
          <path d="M14 19 C18 15 28 14 36 14 C44 14 50 15 51 19" stroke="#FEF3C7" strokeWidth="1" strokeLinecap="round" />

          {/* Classic Heritage Green Lower Body */}
          <path d="M10 26 L53 26 L51 42 L11 42 Z" fill="#047857" stroke="#064E3B" strokeWidth="1.5" />
          
          {/* Chrome Trim Dividing Strip */}
          <line x1="10" y1="26" x2="53" y2="26" stroke="#FEF08A" strokeWidth="1.5" />

          {/* Front Curved Windshield & Glass */}
          <path d="M37 17 L49 19 L47 26 L36 26 Z" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1" opacity="0.95" />
          <line x1="39" y1="18" x2="45" y2="24" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />

          {/* Open Cabin Door / Side Entrance */}
          <path d="M22 22 L34 22 L34 38 L22 38 Z" fill="#064E3B" rx="2" />
          <rect x="23" y="27" width="10" height="9" rx="1.5" fill="#022C22" />

          {/* Rear Classic Wheel */}
          <g transform="translate(18, 43)">
            <circle cx="0" cy="0" r="8.5" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3" fill="#E2E8F0" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-6" y1="0" x2="6" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-6" x2="0" y2="6" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>

          {/* Front Single Steer Wheel */}
          <g transform="translate(48, 43)">
            <circle cx="0" cy="0" r="7" fill="#1E293B" stroke="#FBBF24" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="2.5" fill="#E2E8F0" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-5" y1="0" x2="5" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-5" x2="0" y2="5" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>

          {/* Front Chrome Bumper & Single Headlamp */}
          <path d="M51 36 L55 36 L54 41" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="52" cy="30" r="2.8" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1" />
          <polygon points="54,28 62,23 62,37 54,32" fill="#FEF08A" opacity={isActive ? "0.6" : "0.3"} />
        </svg>
      </motion.div>
    </div>
  );
};

// 3. CLASSIC CAB / TAXI ICON (Vintage Ambassador / Heritage Taxi with checkered band & lighted taxi roof sign)
export const AnimatedCabIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={isActive ? { y: [0, -1, 0, -0.6, 0] } : { y: [0, -0.4, 0] }}
        transition={{ repeat: Infinity, duration: isActive ? 0.65 : 1.6, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Vintage Illuminated Roof TAXI Sign */}
          <rect x="26" y="13" width="13" height="5.5" rx="1.5" fill="#FBBF24" stroke="#B45309" strokeWidth="1" />
          <text x="28" y="17.2" fill="#78350F" fontSize="3.8" fontWeight="900" fontFamily="sans-serif">TAXI</text>

          {/* Classic Sedan Roof & Pillars */}
          <path
            d="M9 35 C9 30 15 24 23 20 C31 16 43 16 49 22 L57 28 C61 31 61 36 61 40 L9 40 Z"
            fill="#3730A3"
            stroke="#1E1B4B"
            strokeWidth="1.5"
          />

          {/* Classic Curved Windows with Chrome Frames */}
          <path d="M23 22 C29 18 39 18 45 22 L50 27 L20 27 Z" fill="#E0E7FF" stroke="#312E81" strokeWidth="1" opacity="0.95" />
          <line x1="34" y1="18" x2="34" y2="27" stroke="#312E81" strokeWidth="1.5" />

          {/* Heritage Yellow-Black Checkered Beltline Strip */}
          <g transform="translate(10, 31)">
            <rect x="0" y="0" width="48" height="3" fill="#FBBF24" />
            <rect x="4" y="0" width="4" height="3" fill="#1E293B" />
            <rect x="12" y="0" width="4" height="3" fill="#1E293B" />
            <rect x="20" y="0" width="4" height="3" fill="#1E293B" />
            <rect x="28" y="0" width="4" height="3" fill="#1E293B" />
            <rect x="36" y="0" width="4" height="3" fill="#1E293B" />
            <rect x="44" y="0" width="4" height="3" fill="#1E293B" />
          </g>

          {/* Classic Chrome Bumpers & Round Headlight */}
          <path d="M6 39 L10 39" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 39 L62 39" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="58" cy="33" r="2.8" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1" />
          <polygon points="60,31 64,26 64,40 60,35" fill="#FEF08A" opacity={isActive ? "0.6" : "0.3"} />

          {/* Classic Hubcap Wheels (Rear) */}
          <g transform="translate(18, 42)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#6366F1" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="4.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.5" fill="#312E81" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#94A3B8" strokeWidth="1" />
            </motion.g>
          </g>

          {/* Classic Hubcap Wheels (Front) */}
          <g transform="translate(48, 42)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#6366F1" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="4.5" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />
            <circle cx="0" cy="0" r="1.5" fill="#312E81" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="#94A3B8" strokeWidth="1" />
            </motion.g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

// 4. CLASSIC SELF DRIVE ICON (Vintage Sports Coupe / Roadster with Chrome Luggage Rack & Key Emblem)
export const AnimatedSelfDriveIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Classic Digital Key Wireless Radiance */}
          <g transform="translate(32, 12)">
            <motion.path
              d="M-7 -2 C-4 -6 4 -6 7 -2"
              stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" fill="none"
              animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.3 }}
            />
            <circle cx="0" cy="0" r="2.8" fill="#EA580C" stroke="#FFF" strokeWidth="1" />
          </g>

          {/* Classic Curved Roadster Coupe Body */}
          <path
            d="M9 37 C9 31 15 24 24 22 C32 20 44 20 48 24 L57 30 C60 33 60 37 60 41 L9 41 Z"
            fill="#C2410C"
            stroke="#9A3412"
            strokeWidth="1.5"
          />

          {/* Classic Curved Quarter Windows */}
          <path d="M24 23 C29 21 39 21 45 24 L49 29 L21 29 Z" fill="#FFEDD5" opacity="0.95" />
          <line x1="35" y1="21" x2="35" y2="29" stroke="#9A3412" strokeWidth="1.2" />

          {/* Side Chrome Trim & Door Handle */}
          <line x1="18" y1="33" x2="52" y2="33" stroke="#FED7AA" strokeWidth="1.2" strokeLinecap="round" />
          <rect x="30" y="31" width="3.5" height="1.2" rx="0.6" fill="#F8FAFC" />

          {/* Classic Spoke Wheels (Rear) */}
          <g transform="translate(18, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#F97316" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3.5" fill="#F8FAFC" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>

          {/* Classic Spoke Wheels (Front) */}
          <g transform="translate(48, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#F97316" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3.5" fill="#F8FAFC" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>

          {/* Chrome Bullet Headlight */}
          <circle cx="58" cy="34" r="2.5" fill="#FEF08A" stroke="#F8FAFC" strokeWidth="1" />
        </svg>
      </motion.div>
    </div>
  );
};

// 5. CLASSIC CARPOOLING ICON (Vintage Heritage Microbus / Passenger Minivan with Split Windows & Avatars)
export const AnimatedCarpoolIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={{ y: [0, -1, 0] }}
        transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Classic Passenger Avatars */}
          <g transform="translate(23, 17)">
            <motion.circle
              cx="0" cy="0" r="4" fill="#0D9488" stroke="#FFF" strokeWidth="1"
              animate={{ y: [0, -1.2, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0 }}
            />
          </g>
          <g transform="translate(34, 15)">
            <motion.circle
              cx="0" cy="0" r="4.5" fill="#059669" stroke="#FFF" strokeWidth="1"
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }}
            />
          </g>
          <g transform="translate(44, 17)">
            <motion.circle
              cx="0" cy="0" r="4" fill="#0D9488" stroke="#FFF" strokeWidth="1"
              animate={{ y: [0, -1.2, 0] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }}
            />
          </g>

          {/* Classic Microbus / Van Upper Roof (Cream Vintage) */}
          <path d="M10 24 C10 18 16 16 34 16 C50 16 56 18 56 25 Z" fill="#F0FDFA" stroke="#0F766E" strokeWidth="1.2" />

          {/* Classic Microbus Lower Body (Teal Two-Tone) */}
          <path
            d="M8 25 L58 25 C60 30 60 38 58 42 L8 42 Z"
            fill="#0F766E"
            stroke="#115E59"
            strokeWidth="1.5"
          />

          {/* Classic Multi-Pane Windows */}
          <rect x="14" y="20" width="8" height="7" rx="1" fill="#CCFBF1" />
          <rect x="25" y="20" width="8" height="7" rx="1" fill="#CCFBF1" />
          <rect x="36" y="20" width="8" height="7" rx="1" fill="#CCFBF1" />
          <path d="M47 20 L53 21 L53 27 L47 27 Z" fill="#CCFBF1" />

          {/* Vintage V-Chevrons & Chrome Badge */}
          <path d="M53 30 L48 35 L53 40" stroke="#F0FDFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="48" cy="35" r="2" fill="#F8FAFC" />

          {/* Classic Solid Hub Wheels */}
          <g transform="translate(18, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#2DD4BF" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="4" fill="#F0FDFA" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#0F766E" strokeWidth="1.2" />
            </motion.g>
          </g>

          <g transform="translate(48, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#2DD4BF" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="4" fill="#F0FDFA" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-3" y1="0" x2="3" y2="0" stroke="#0F766E" strokeWidth="1.2" />
            </motion.g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};

// 6. CLASSIC COURIER DELIVERY ICON (Vintage Italian Vespa / Delivery Scooter with Chrome Parcel Carrier)
export const AnimatedCourierIcon: React.FC<AnimatedIconProps> = ({ className = "w-8 h-8", isActive = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={isActive ? { y: [0, -1.2, 0, -0.8, 0] } : { y: [0, -0.6, 0] }}
        transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.4, ease: "easeInOut" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
          {/* Ground Line */}
          <line x1="6" y1="52" x2="58" y2="52" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Classic Vintage Luggage Trunk / Parcel Box */}
          <g transform="translate(13, 20)">
            <motion.g
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
            >
              <rect x="0" y="0" width="16" height="13" rx="2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" />
              <line x1="8" y1="0" x2="8" y2="13" stroke="#0284C7" strokeWidth="1.2" />
              <line x1="0" y1="6.5" x2="16" y2="6.5" stroke="#0284C7" strokeWidth="1.2" />
              <circle cx="8" cy="6.5" r="2" fill="#0284C7" />
            </motion.g>
          </g>

          {/* Classic Curved Vespa Scooter Fairing & Body */}
          <path d="M26 35 C26 28 32 26 38 26 L44 26" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M30 35 L44 43" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M44 26 L48 43" stroke="#0369A1" strokeWidth="2.5" strokeLinecap="round" />

          {/* Classic Leg Shield */}
          <path d="M43 24 C45 28 47 34 46 41" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />

          {/* Classic Handlebar & Headlight */}
          <line x1="41" y1="20" x2="47" y2="20" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="46" cy="20" r="2.8" fill="#FEF08A" stroke="#E2E8F0" strokeWidth="1" />

          {/* Spoked Wheels (Rear) */}
          <g transform="translate(19, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3" fill="#F0F9FF" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>

          {/* Spoked Wheels (Front) */}
          <g transform="translate(48, 43)">
            <circle cx="0" cy="0" r="8" fill="#1E293B" stroke="#38BDF8" strokeWidth="1.8" />
            <circle cx="0" cy="0" r="3" fill="#F0F9FF" />
            <motion.g
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: isActive ? 0.6 : 1.6, ease: "linear" }}
            >
              <line x1="-5.5" y1="0" x2="5.5" y2="0" stroke="#94A3B8" strokeWidth="1.2" />
              <line x1="0" y1="-5.5" x2="0" y2="5.5" stroke="#94A3B8" strokeWidth="1.2" />
            </motion.g>
          </g>
        </svg>
      </motion.div>
    </div>
  );
};
