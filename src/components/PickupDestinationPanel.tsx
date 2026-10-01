import React, { useState, useEffect, useRef } from 'react';
import { LocationPoint, DeviceGpsState, TripMode } from '../types';
import { POPULAR_LOCATIONS } from '../data/mockData';
import { 
  getSavedDestinations, 
  saveDestinationToHistory, 
  clearSavedDestinations, 
  forwardGeocodeAddress,
  searchCityLandmarks,
  extractCityName
} from '../utils/geoUtils';
import { 
  MapPin, 
  Navigation, 
  Crosshair, 
  Edit3, 
  Check, 
  ChevronDown, 
  Clock, 
  Route, 
  Search, 
  Compass, 
  LocateFixed, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  History, 
  X, 
  Loader2, 
  Move, 
  AlertCircle, 
  AlertTriangle,
  Radio,
  Building2, 
  Train, 
  Plane, 
  Briefcase, 
  HeartPulse, 
  ShoppingBag, 
  Star,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Timer,
  Percent,
  Plus,
  PlusCircle,
  Waypoints,
  Milestone,
  CircleDot
} from 'lucide-react';

interface PickupDestinationPanelProps {
  pickup: LocationPoint;
  destination: LocationPoint | null;
  onUpdatePickup: (point: LocationPoint) => void;
  onUpdateDestination: (point: LocationPoint | null) => void;
  onTriggerGpsPickup: () => void;
  onEnableMapPinMode: (mode: 'pickup' | 'destination') => void;
  distanceKm: number;
  durationMins: number;
  deviceGps?: DeviceGpsState | null;
  onRequestDeviceGps?: () => void;
  destinationError?: string | null;
  onClearDestinationError?: () => void;
  tripMode?: TripMode;
  onChangeTripMode?: (mode: TripMode) => void;
  returnWaitMinutes?: number;
  onChangeReturnWaitMinutes?: (mins: number) => void;
  stops?: LocationPoint[];
  onUpdateStops?: (stops: LocationPoint[]) => void;
}

export const PickupDestinationPanel: React.FC<PickupDestinationPanelProps> = ({
  pickup,
  destination,
  onUpdatePickup,
  onUpdateDestination,
  onTriggerGpsPickup,
  onEnableMapPinMode,
  distanceKm,
  durationMins,
  deviceGps,
  onRequestDeviceGps,
  destinationError,
  onClearDestinationError,
  tripMode = 'direct',
  onChangeTripMode,
  returnWaitMinutes = 30,
  onChangeReturnWaitMinutes,
  stops: propStops,
  onUpdateStops,
}) => {
  // Intermediate Stops State
  const [stops, setStops] = useState<LocationPoint[]>(propStops || []);
  const [activeStopDropdownIndex, setActiveStopDropdownIndex] = useState<number | null>(null);
  const [fetchingStopIndex, setFetchingStopIndex] = useState<number | null>(null);
  const [stopGeocodeErrors, setStopGeocodeErrors] = useState<Record<number, string | null>>({});
  const [stopCategoryTabs, setStopCategoryTabs] = useState<Record<number, string>>({});

  // Synchronize internal stops with external props if passed
  useEffect(() => {
    if (propStops) {
      setStops(propStops);
    }
  }, [propStops]);

  const handleAddStop = () => {
    if (stops.length >= 3) return;
    const newStop: LocationPoint = {
      id: `stop_${Date.now()}`,
      name: ``,
      address: '',
      lat: ((pickup?.lat || 12.9716) + (destination?.lat || 12.9352)) / 2 + (Math.random() * 0.01 - 0.005),
      lng: ((pickup?.lng || 77.5946) + (destination?.lng || 77.6245)) / 2 + (Math.random() * 0.01 - 0.005),
    };
    const updated = [...stops, newStop];
    setStops(updated);
    setActiveStopDropdownIndex(updated.length - 1);
    if (onUpdateStops) onUpdateStops(updated);
  };

  const handleRemoveStop = (index: number) => {
    const updated = stops.filter((_, i) => i !== index);
    setStops(updated);
    if (activeStopDropdownIndex === index) {
      setActiveStopDropdownIndex(null);
    }
    if (onUpdateStops) onUpdateStops(updated);
  };

  const handleStopInputChange = (index: number, newName: string) => {
    const updated = stops.map((s, i) => (i === index ? { ...s, name: newName } : s));
    setStops(updated);
    setActiveStopDropdownIndex(index);
    setStopGeocodeErrors(prev => ({ ...prev, [index]: null }));
    if (onUpdateStops) onUpdateStops(updated);
  };

  const handleFetchStopAddress = async (index: number, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetStop = stops[index];
    const query = targetStop?.name?.trim();
    if (!query) return;

    setFetchingStopIndex(index);
    setStopGeocodeErrors(prev => ({ ...prev, [index]: null }));

    try {
      const resolvedPoint = await forwardGeocodeAddress(
        query,
        { lat: pickup.lat, lng: pickup.lng },
        currentCity
      );

      const updated = stops.map((s, i) =>
        i === index
          ? {
              ...s,
              name: resolvedPoint.name,
              address: resolvedPoint.address,
              lat: resolvedPoint.lat,
              lng: resolvedPoint.lng,
            }
          : s
      );
      setStops(updated);
      if (onUpdateStops) onUpdateStops(updated);

      // Save to history
      const updatedHistory = saveDestinationToHistory(resolvedPoint);
      setSavedHistory(updatedHistory);
      setActiveStopDropdownIndex(null);
    } catch (err) {
      console.error(`Failed to geocode address for stop ${index + 1}:`, err);
      setStopGeocodeErrors(prev => ({
        ...prev,
        [index]: 'Could not locate address. Try another landmark or area name.',
      }));
    } finally {
      setFetchingStopIndex(null);
    }
  };

  const handleSelectStopLandmark = (index: number, item: LocationPoint) => {
    const updated = stops.map((s, i) =>
      i === index
        ? {
            ...s,
            name: item.name,
            address: item.address,
            lat: item.lat,
            lng: item.lng,
          }
        : s
    );
    setStops(updated);
    if (onUpdateStops) onUpdateStops(updated);

    const updatedHistory = saveDestinationToHistory(item);
    setSavedHistory(updatedHistory);
    setActiveStopDropdownIndex(null);
  };

  const handleClearStopInput = (index: number) => {
    const updated = stops.map((s, i) =>
      i === index ? { ...s, name: '', address: '' } : s
    );
    setStops(updated);
    if (onUpdateStops) onUpdateStops(updated);
  };
  // Pickup Input State
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [pickupInputText, setPickupInputText] = useState(pickup.name || '');
  const [isGeocodingPickup, setIsGeocodingPickup] = useState(false);
  const [pickupGeocodeError, setPickupGeocodeError] = useState<string | null>(null);

  // Destination Input State (ALWAYS empty initially if destination is null)
  const [destinationInputText, setDestinationInputText] = useState(destination ? destination.name : '');
  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const [isGeocodingDestination, setIsGeocodingDestination] = useState(false);
  const [destinationGeocodeError, setDestinationGeocodeError] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  // Saved & Recent Destinations History
  const [savedHistory, setSavedHistory] = useState<LocationPoint[]>([]);

  // Load saved destinations on mount
  useEffect(() => {
    setSavedHistory(getSavedDestinations());
  }, []);

  // Synchronize internal input values when external props change (e.g. from map dragging or GPS)
  useEffect(() => {
    if (!isEditingPickup) {
      setPickupInputText(pickup.name || '');
    }
  }, [pickup, isEditingPickup]);

  useEffect(() => {
    if (destination) {
      setDestinationInputText(destination.name || destination.address || '');
    } else {
      setDestinationInputText('');
    }
  }, [destination]);

  // Current GPS City Info Only
  const currentCity = extractCityName(pickup.lat, pickup.lng, pickup.address || deviceGps?.address);

  // Filtered landmarks based on text search and category filter strictly for current GPS city
  const filteredLandmarks = searchCityLandmarks(
    destinationInputText,
    selectedCategoryTab,
    savedHistory,
    currentCity,
    { lat: pickup.lat, lng: pickup.lng }
  );

  // Helper to render Landmark Category Icon
  const renderCategoryIcon = (item: LocationPoint) => {
    const isSaved = savedHistory.some((s) => s.name.toLowerCase() === item.name.toLowerCase());
    if (isSaved) {
      return <Clock className="w-3.5 h-3.5 text-indigo-600" />;
    }
    if (item.type === 'mall' || item.category === 'Mall') {
      return <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />;
    }
    if (item.type === 'station' || item.type === 'metro' || item.category === 'Station' || item.category === 'Metro') {
      return <Train className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (item.type === 'tech_park' || item.category === 'Tech Park') {
      return <Briefcase className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (item.type === 'airport' || item.category === 'Airport') {
      return <Plane className="w-3.5 h-3.5 text-sky-600" />;
    }
    if (item.type === 'hospital' || item.category === 'Hospital') {
      return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
    }
    return <MapPin className="w-3.5 h-3.5 text-amber-600" />;
  };

  // Handle Pickup Address Change / Submission (Moves the point on the map!)
  const handlePickupSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = pickupInputText.trim();
    if (!query) return;

    setIsGeocodingPickup(true);
    setPickupGeocodeError(null);

    try {
      const resolvedPoint = await forwardGeocodeAddress(
        query, 
        { lat: pickup.lat, lng: pickup.lng },
        currentCity
      );
      onUpdatePickup(resolvedPoint);
      setPickupInputText(resolvedPoint.name);
      setIsEditingPickup(false);
    } catch (err) {
      console.error('Failed to geocode pickup address:', err);
      setPickupGeocodeError('Could not locate address. Try another landmark or drag pin on map.');
    } finally {
      setIsGeocodingPickup(false);
    }
  };

  // Handle Destination Address Change / Submission (Moves the destination point on map & saves address!)
  const handleDestinationSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = destinationInputText.trim();
    if (!query) return;

    setIsGeocodingDestination(true);
    setDestinationGeocodeError(null);

    try {
      const resolvedPoint = await forwardGeocodeAddress(
        query, 
        { lat: pickup.lat, lng: pickup.lng },
        currentCity
      );
      
      // Update destination in parent state
      onUpdateDestination(resolvedPoint);
      setDestinationInputText(resolvedPoint.name);
      
      // Save EVERY entered address into persistent history
      const updatedHistory = saveDestinationToHistory(resolvedPoint);
      setSavedHistory(updatedHistory);
      
      setIsDestinationDropdownOpen(false);
    } catch (err) {
      console.error('Failed to geocode destination address:', err);
      setDestinationGeocodeError('Could not locate address. Try landmark name or drag pin on map.');
    } finally {
      setIsGeocodingDestination(false);
    }
  };

  // Select a Destination from Saved History or Landmark list
  const handleSelectDestinationItem = (loc: LocationPoint) => {
    onUpdateDestination(loc);
    setDestinationInputText(loc.name);
    
    // Save to history to bump to top of list
    const updatedHistory = saveDestinationToHistory(loc);
    setSavedHistory(updatedHistory);
    
    setIsDestinationDropdownOpen(false);
  };

  // Clear Destination input & state
  const handleClearDestination = () => {
    onUpdateDestination(null);
    setDestinationInputText('');
  };

  // Clear all saved destination history
  const handleClearAllHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSavedDestinations();
    setSavedHistory([]);
  };

  // Swap Pickup and Destination
  const handleSwapLocations = () => {
    if (destination) {
      const oldPickup = { ...pickup };
      const oldDest = { ...destination };
      onUpdatePickup(oldDest);
      onUpdateDestination(oldPickup);
      setPickupInputText(oldDest.name);
      setDestinationInputText(oldPickup.name);
    }
  };

  // Use Device GPS Button Click
  const handleUseDeviceGps = () => {
    if (deviceGps && deviceGps.status === 'granted') {
      const shortName = deviceGps.address?.split(',')[0] || 'Current Device Location';
      const gpsPoint: LocationPoint = {
        id: `gps_device_${Date.now()}`,
        name: shortName,
        address: deviceGps.address || `GPS (${deviceGps.lat.toFixed(5)}, ${deviceGps.lng.toFixed(5)})`,
        lat: deviceGps.lat,
        lng: deviceGps.lng,
        type: 'current',
      };
      onUpdatePickup(gpsPoint);
      setPickupInputText(shortName);
    } else if (onRequestDeviceGps) {
      onRequestDeviceGps();
    } else {
      onTriggerGpsPickup();
    }
  };

  const CATEGORY_TABS = [
    { id: 'All', label: 'All Places' },
    { id: 'Mall', label: '🏬 Malls' },
    { id: 'Station', label: '🚆 Stations & Metro' },
    { id: 'Tech Park', label: '🏢 Tech Parks' },
    { id: 'Airport', label: '✈️ Airport' },
    { id: 'Hospital', label: '🏥 Hospitals' },
    ...(savedHistory.length > 0 ? [{ id: 'Saved', label: `⭐ Saved (${savedHistory.length})` }] : []),
  ];

  const WAIT_TIME_OPTIONS = [
    { mins: 15, label: '15 mins', desc: 'Quick errand' },
    { mins: 30, label: '30 mins', desc: 'Standard turnaround (Free)' },
    { mins: 60, label: '1 hour', desc: 'Shopping / Doctor visit' },
    { mins: 120, label: '2 hours', desc: 'Client meeting / Dinner' },
    { mins: 240, label: '4 hours', desc: 'Extended trip' },
  ];

  const isRound = tripMode === 'round_trip';
  const totalKm = isRound ? (distanceKm * 2).toFixed(1) : distanceKm.toFixed(1);
  const totalDuration = isRound ? durationMins * 2 + returnWaitMinutes : durationMins;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-sm text-slate-800 flex flex-col gap-2">
      
      {/* 0. TRIP MODE SELECTOR (Direct Trip vs. Round Trip) */}
      <div className="flex flex-col gap-1 pb-0.5 border-b border-slate-100">
        {/* Segmented Control for Direct Trip vs Round Trip - 50% width */}
        <div className="w-full sm:w-1/2 max-w-[50%] min-w-[220px] grid grid-cols-2 p-0.5 bg-slate-100/90 rounded-lg gap-1 border border-slate-200/80">
          <button
            type="button"
            id="trip-mode-direct-btn"
            onClick={() => onChangeTripMode && onChangeTripMode('direct')}
            className={`flex items-center justify-center gap-1 py-0.5 px-2 rounded-md font-bold text-[10px] sm:text-[11px] transition-all leading-tight ${
              !isRound
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ArrowRight className={`w-2.5 h-2.5 ${!isRound ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Direct</span>
          </button>

          <button
            type="button"
            id="trip-mode-round-btn"
            onClick={() => onChangeTripMode && onChangeTripMode('round_trip')}
            className={`relative flex items-center justify-center gap-1 py-0.5 px-2 rounded-md font-bold text-[10px] sm:text-[11px] transition-all leading-tight ${
              isRound
                ? 'bg-white text-indigo-900 shadow-2xs border border-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <RotateCcw className={`w-2.5 h-2.5 ${isRound ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Round Trip</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-0.5 right-0.5" />
          </button>
        </div>

        {/* Round Trip Return Wait Configuration */}
        {isRound && (
          <div className="w-full sm:w-1/2 max-w-[50%] min-w-[240px] p-1.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-indigo-900 flex items-center gap-1">
                <Timer className="w-3 h-3 text-indigo-600" />
                Driver Waiting:
              </span>
              <span className="font-black text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-indigo-200 text-[9px]">
                {returnWaitMinutes} mins included
              </span>
            </div>

            {/* Wait time chip selector */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {WAIT_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => onChangeReturnWaitMinutes && onChangeReturnWaitMinutes(opt.mins)}
                  className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    returnWaitMinutes === opt.mins
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-indigo-100/60 border border-indigo-100'
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 1. PICKUP POINT ROW */}
      <div className="relative">
        <div className="flex items-center gap-2">
          
          {/* GPS Locator Auto-Pickup Button */}
          <button
            id="gps-locator-pickup-icon-btn"
            title={`GPS location: ${currentCity}`}
            onClick={handleUseDeviceGps}
            className="flex-shrink-0 relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 shadow-2xs transition-all active:scale-95 group"
          >
            <LocateFixed className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </button>

            {/* Pickup Content & Input Form */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black tracking-wider text-emerald-700 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Pickup point
              </span>

              {/* Live GPS Accuracy Visual Indicator (Green / Yellow / Red / Loading) */}
              {deviceGps?.status === 'requesting' ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-600" />
                  <span>Locking GPS (&le;50m)...</span>
                </span>
              ) : !deviceGps || deviceGps.status === 'denied' || deviceGps.status === 'error' ? (
                <span 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 cursor-pointer"
                  onClick={handleUseDeviceGps}
                  title="GPS permission blocked or unavailable. Click to retry."
                >
                  <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
                  <span>No GPS Fix</span>
                </span>
              ) : deviceGps.accuracy <= 50 && !deviceGps.isAccuracyPoor && deviceGps.status === 'granted' ? (
                <span 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 cursor-pointer"
                  onClick={handleUseDeviceGps}
                  title="High-precision satellite GPS lock (accuracy within 50m threshold)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>High Precision (±{deviceGps.accuracy}m)</span>
                </span>
              ) : deviceGps.accuracy <= 150 ? (
                <span 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 cursor-pointer"
                  onClick={handleUseDeviceGps}
                  title="Moderate GPS accuracy. Coordinates >50m are filtered from setting pickup."
                >
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  <span>Moderate Signal (±{deviceGps.accuracy}m)</span>
                </span>
              ) : (
                <span 
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 cursor-pointer"
                  onClick={handleUseDeviceGps}
                  title="Weak GPS signal / IP approximate area (>150m accuracy). Click to retry."
                >
                  <Radio className="w-2.5 h-2.5 text-rose-600" />
                  <span>Weak Signal (±{deviceGps.accuracy > 999 ? `${(deviceGps.accuracy / 1000).toFixed(1)}k` : deviceGps.accuracy}m)</span>
                </span>
              )}
            </div>

            {/* Editable Pickup Address Input */}
            <form onSubmit={handlePickupSubmit} className="relative flex items-center">
              <input
                id="pickup-address-input"
                type="text"
                value={pickupInputText}
                onChange={(e) => {
                  setPickupInputText(e.target.value);
                  setIsEditingPickup(true);
                }}
                onBlur={() => {
                  if (pickupInputText !== pickup.name) {
                    handlePickupSubmit();
                  } else {
                    setIsEditingPickup(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePickupSubmit();
                  }
                }}
                placeholder="Enter pickup address or landmark..."
                className="w-full text-xs font-semibold text-slate-900 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-lg px-2.5 py-1 pr-14 outline-none transition-all shadow-inner"
              />

              <div className="absolute right-1 flex items-center gap-0.5">
                {isGeocodingPickup ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 mr-1" />
                ) : isEditingPickup ? (
                  <button
                    type="submit"
                    title="Move Pickup Point on Map"
                    className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black shadow-2xs transition-colors"
                  >
                    Set
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEnableMapPinMode('pickup')}
                    title="Drag pickup pin on map"
                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Move className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            <p className="text-[9px] text-slate-500 truncate mt-0.5">
              {pickup.address || 'Accurate live location detected'}
            </p>

            {/* Poor Signal / Accuracy > 50m Filter Warning Alert */}
            {deviceGps && (deviceGps.isAccuracyPoor || deviceGps.status === 'poor_signal' || (deviceGps.accuracy && deviceGps.accuracy > 50)) && (
              <div className="mt-1 flex items-center justify-between gap-1.5 p-1.5 bg-amber-50/90 border border-amber-200 rounded-lg text-amber-900 text-[10px] leading-tight animate-fadeIn">
                <div className="flex items-center gap-1.5 min-w-0">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span className="truncate">
                    <strong className="font-bold">GPS Accuracy (±{deviceGps.accuracy}m &gt; 50m):</strong> Position filtered to avoid incorrect pickup.
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleUseDeviceGps}
                    className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-[9px] rounded shadow-2xs transition-all"
                    title="Retry High Accuracy GPS Lock"
                  >
                    Refine
                  </button>
                  <button
                    type="button"
                    onClick={() => onEnableMapPinMode('pickup')}
                    className="px-1.5 py-0.5 bg-white hover:bg-amber-100/80 border border-amber-300 text-amber-800 font-bold text-[9px] rounded transition-all"
                    title="Manually drag pickup pin on map"
                  >
                    Drag Pin
                  </button>
                </div>
              </div>
            )}

            {pickupGeocodeError && (
              <p className="text-[9px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>{pickupGeocodeError}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ROUTE CONNECTOR & ADD STOPS TRIGGER */}
      <div className="relative flex items-center justify-between my-0">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 w-7 sm:w-8 flex justify-center items-center">
            <button
              type="button"
              id="add-stop-icon-btn"
              onClick={handleAddStop}
              disabled={stops.length >= 3}
              title={stops.length >= 3 ? 'Maximum 3 stops reached' : 'Add intermediate stop (+)'}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 hover:bg-amber-100 border border-slate-300 hover:border-amber-400 text-slate-700 hover:text-amber-800 shadow-2xs transition-all active:scale-90 hover:scale-110 group disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3 text-slate-700 group-hover:text-amber-700 transition-transform duration-200 stroke-[2.5]" />
            </button>
          </div>
          {stops.length > 0 && (
            <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
              {stops.length}/3 stops
            </span>
          )}
        </div>

        {destination && (
          <button
            type="button"
            onClick={handleSwapLocations}
            title="Swap Pickup and Destination"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100 text-[9px] font-bold transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Swap</span>
          </button>
        )}
      </div>

      {/* INTERMEDIATE STOPS LIST */}
      {stops.map((stop, idx) => {
        const isStopDropdownOpen = activeStopDropdownIndex === idx;
        const isFetchingThisStop = fetchingStopIndex === idx;
        const stopCatTab = stopCategoryTabs[idx] || 'All';
        const stopLandmarks = searchCityLandmarks(
          stop.name || '',
          stopCatTab,
          savedHistory,
          currentCity,
          { lat: pickup.lat, lng: pickup.lng }
        );
        const hasFetchedAddress = Boolean(stop.address && stop.address.trim() && stop.address !== 'Intermediate stop point');

        return (
          <div key={stop.id} className="relative pt-1 border-t border-dashed border-amber-200/80 animate-fadeIn">
            <div className="flex items-start gap-2">
              {/* Stop Icon Badge */}
              <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 border border-amber-300 text-amber-700 shadow-2xs mt-0.5">
                <Milestone className="w-3.5 h-3.5 text-amber-600" />
              </div>

              {/* Stop Input Form & Dropdown */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black tracking-wider text-amber-800 uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Stop {idx + 1}
                    </span>
                    {hasFetchedAddress && (
                      <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Address Fetched</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStop(idx)}
                    className="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove this stop"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Stop Input Box */}
                <form onSubmit={(e) => handleFetchStopAddress(idx, e)} className="relative flex items-center">
                  <input
                    type="text"
                    value={stop.name}
                    onChange={(e) => handleStopInputChange(idx, e.target.value)}
                    onFocus={() => setActiveStopDropdownIndex(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleFetchStopAddress(idx, e);
                      }
                    }}
                    placeholder={`Where to stop in ${currentCity}? (e.g. Bus Stand, Mall, Hospital)...`}
                    className="w-full text-xs font-semibold text-slate-900 bg-amber-50/40 hover:bg-amber-50/70 focus:bg-white border border-amber-200 focus:border-amber-500 rounded-lg px-2.5 py-1 pr-14 outline-none transition-all shadow-inner"
                  />

                  {/* Actions inside Stop Input Box */}
                  <div className="absolute right-1 flex items-center gap-1">
                    {isFetchingThisStop ? (
                      <div className="flex items-center px-1 text-amber-600 animate-spin">
                        <Loader2 className="w-3 h-3" />
                      </div>
                    ) : stop.name?.trim() ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleClearStopInput(idx)}
                          title="Clear stop address input"
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <button
                          type="submit"
                          title="Fetch exact address & coordinates for this stop"
                          className="px-2 py-0.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[9px] font-black shadow-2xs transition-colors cursor-pointer"
                        >
                          Fetch
                        </button>
                      </>
                    ) : null}
                  </div>
                </form>

                {/* Stop Address Display */}
                {hasFetchedAddress ? (
                  <div className="flex items-center gap-1.5 mt-0.5 text-[9.5px] text-amber-950/80 font-medium">
                    <MapPin className="w-2.5 h-2.5 text-amber-600 flex-shrink-0" />
                    <p className="truncate" title={stop.address}>{stop.address}</p>
                  </div>
                ) : isFetchingThisStop ? (
                  <p className="text-[9px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-600" />
                    <span>Resolving address & coordinates...</span>
                  </p>
                ) : (
                  <p className="text-[9px] text-slate-400 truncate mt-0.5">
                    Type address or select landmark below to fetch stop coordinates
                  </p>
                )}

                {/* Geocode Error Display */}
                {stopGeocodeErrors[idx] && (
                  <p className="text-[9px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                    <span>{stopGeocodeErrors[idx]}</span>
                  </p>
                )}

                {/* Stop Autocomplete Dropdown */}
                {isStopDropdownOpen && (
                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-amber-200 shadow-xl max-h-56 overflow-y-auto z-30 animate-fadeIn flex flex-col gap-1.5">
                    {/* Category Filter Chips for Stop */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                      {CATEGORY_TABS.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setStopCategoryTabs((prev) => ({ ...prev, [idx]: tab.id }))}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                            stopCatTab === tab.id
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Landmarks Results Header */}
                    <div className="flex items-center justify-between pb-0.5 border-b border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>
                        {stop.name?.trim()
                          ? `Stop Locations (${stopLandmarks.length})`
                          : `${stopCatTab === 'All' ? `Popular Stops in ${currentCity}` : stopCatTab} (${stopLandmarks.length})`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveStopDropdownIndex(null)}
                        className="text-slate-400 hover:text-slate-600 text-[9px] font-bold cursor-pointer"
                      >
                        Close
                      </button>
                    </div>

                    {/* Landmarks List for Stop */}
                    {stopLandmarks.length > 0 ? (
                      <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto pr-1">
                        {stopLandmarks.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelectStopLandmark(idx, item)}
                            className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-amber-50/80 hover:border-amber-200 border border-transparent text-left transition-all group cursor-pointer"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 group-hover:border-amber-300 transition-colors text-amber-700">
                                {renderCategoryIcon(item)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-amber-800 transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[9px] text-slate-500 truncate">{item.address}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                              {item.category && (
                                <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-50 text-amber-800 group-hover:bg-amber-100">
                                  {item.category}
                                </span>
                              )}
                              <span className="text-[9px] text-amber-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                Select
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-2 text-center">
                        <p className="text-xs text-slate-500 font-medium">
                          No predefined landmarks found for &ldquo;{stop.name}&rdquo;
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Press &ldquo;Fetch&rdquo; or Enter to geocode this exact address.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* 2. DESTINATION POINT ROW */}
      <div className="relative pt-0.5 border-t border-slate-100">
        <div className="flex items-center gap-2">
          
          {/* Destination Icon Indicator */}
          <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shadow-2xs">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600" />
          </div>

          {/* Destination Search Form & Dropdown */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-black tracking-wider text-rose-700 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Destination
              </span>
              {stops.length === 0 && (
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="flex items-center gap-0.5 text-[9px] font-black text-amber-700 hover:text-amber-800 hover:bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 transition-colors"
                >
                  <Waypoints className="w-2.5 h-2.5 text-amber-600" />
                  <span>+ Stop</span>
                </button>
              )}
            </div>

            {/* Destination Input Box */}
            <form onSubmit={handleDestinationSubmit} className="relative flex items-center">
              <input
                id="destination-address-input"
                type="text"
                value={destinationInputText}
                onChange={(e) => {
                  setDestinationInputText(e.target.value);
                  setIsDestinationDropdownOpen(true);
                  if (destinationError && onClearDestinationError) {
                    onClearDestinationError();
                  }
                }}
                onFocus={() => {
                  setIsDestinationDropdownOpen(true);
                  if (destinationError && onClearDestinationError) {
                    onClearDestinationError();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleDestinationSubmit();
                  }
                }}
                placeholder={`Where to in ${currentCity}? (Airport, Mall, Station)...`}
                className={`w-full text-xs font-semibold text-slate-900 rounded-lg px-2.5 py-1 pr-14 outline-none transition-all shadow-inner ${
                  destinationError && !destination
                    ? 'bg-rose-50/60 border border-rose-400 focus:border-rose-500'
                    : 'bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-rose-500'
                }`}
              />

              <div className="absolute right-1 flex items-center gap-0.5">
                {isGeocodingDestination ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600 mr-1" />
                ) : destination ? (
                  <button
                    type="button"
                    onClick={handleClearDestination}
                    title="Clear destination"
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : null}

                {destinationInputText.trim() && !isGeocodingDestination ? (
                  <button
                    type="submit"
                    title="Move Destination Point on Map & Save Address"
                    className="px-2 py-0.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black shadow-2xs transition-colors"
                  >
                    Set
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEnableMapPinMode('destination')}
                    title="Drag or drop destination pin on map"
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Move className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>

            <p className="text-[9px] text-slate-500 truncate mt-0.5">
              {destination ? destination.address : 'Type mall/station name or drag red pin on the map'}
            </p>

            {destinationGeocodeError && (
              <p className="text-[9px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                <span>{destinationGeocodeError}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3. RICH LANDMARKS & SAVED DESTINATIONS DROPDOWN */}
        {isDestinationDropdownOpen && (
          <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xl max-h-60 overflow-y-auto z-30 animate-fadeIn flex flex-col gap-1.5">
            
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap transition-all ${
                    selectedCategoryTab === tab.id
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Landmarks Results Header */}
            <div className="flex items-center justify-between pb-0.5 border-b border-slate-100 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <span>
                {destinationInputText.trim()
                  ? `Locations (${filteredLandmarks.length})`
                  : `${selectedCategoryTab === 'All' ? `Popular Landmarks` : selectedCategoryTab} (${filteredLandmarks.length})`}
              </span>

              {savedHistory.length > 0 && selectedCategoryTab === 'Saved' && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-rose-600 hover:text-rose-800 flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Landmarks List */}
            {filteredLandmarks.length > 0 ? (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto pr-1">
                {filteredLandmarks.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectDestinationItem(item)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-rose-50/80 hover:border-rose-200 border border-transparent text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 group-hover:border-rose-300 transition-colors">
                        {renderCategoryIcon(item)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate group-hover:text-rose-700 transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500 truncate">{item.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 ml-1.5">
                      {item.category && (
                        <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600 group-hover:bg-rose-100 group-hover:text-rose-700">
                          {item.category}
                        </span>
                      )}
                      <span className="text-[9px] text-rose-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        Select
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2.5 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  No predefined landmarks found for &ldquo;{destinationInputText}&rdquo;
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Press &ldquo;Set&rdquo; or Enter to geocode this exact address.
                </p>
              </div>
            )}

            {/* Close Dropdown Bar */}
            <div className="flex justify-between items-center pt-1 mt-0.5 border-t border-slate-100">
              <span className="text-[9px] text-slate-400 font-medium">
                Tip: Click any place or drag pin 🎯
              </span>
              <button
                type="button"
                onClick={() => setIsDestinationDropdownOpen(false)}
                className="text-[10px] text-slate-600 hover:text-slate-900 font-bold px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. TRIP DISTANCE & ESTIMATE FOOTER */}
      {destination && (
        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-slate-900 flex items-center gap-1">
              <Route className="w-3 h-3 text-indigo-600" />
              {isRound ? `${totalKm} km (Round Trip)` : `${totalKm} km (One-Way)`}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-medium text-slate-700 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              ~{totalDuration} mins {isRound ? `(incl. ${returnWaitMinutes}m wait)` : 'drive'}
            </span>
            {stops.length > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-amber-800 flex items-center gap-1 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 text-[9px]">
                  <Waypoints className="w-2.5 h-2.5 text-amber-600" />
                  {stops.length} {stops.length === 1 ? 'Stop' : 'Stops'}
                </span>
              </>
            )}
          </div>
          {isRound && (
            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Same Driver
            </span>
          )}
        </div>
      )}
    </div>
  );
};
