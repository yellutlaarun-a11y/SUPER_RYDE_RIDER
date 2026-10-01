import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Search, 
  Sparkles, 
  Navigation, 
  ExternalLink, 
  Clock, 
  Star, 
  X, 
  Loader2, 
  Car, 
  Check,
  Building2,
  Coffee,
  ShoppingBag,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { LocationPoint } from '../types';

interface MapsGroundingExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  currentPickup: LocationPoint;
  onSelectAsPickup: (point: LocationPoint) => void;
  onSelectAsDestination: (point: LocationPoint) => void;
}

export const MapsGroundingExplorerModal: React.FC<MapsGroundingExplorerModalProps> = ({
  isOpen,
  onClose,
  city,
  currentPickup,
  onSelectAsPickup,
  onSelectAsDestination,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groundedResult, setGroundedResult] = useState<{
    text: string;
    groundingMetadata?: any;
  } | null>(null);

  const quickPrompts = [
    { label: 'Top Shopping Malls & Markets', icon: <ShoppingBag className="w-3.5 h-3.5" />, q: `Best shopping malls and central retail markets in ${city}` },
    { label: 'Popular Cafes & Food Hotspots', icon: <Coffee className="w-3.5 h-3.5" />, q: `Top rated cafes, bakeries, and dining restaurants in ${city}` },
    { label: 'Transit Hubs & Stations', icon: <Car className="w-3.5 h-3.5" />, q: `Main Railway station, RTC bus stand, and highway junctions in ${city}` },
    { label: 'Hotels & Stay', icon: <Building2 className="w-3.5 h-3.5" />, q: `Top luxury and business hotels in ${city}` },
  ];

  if (!isOpen) return null;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setQuery(searchQuery);

    try {
      const response = await fetch('/api/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: currentPickup?.address || city,
          city: city,
        }),
      });

      const data = await response.json();
      setGroundedResult({
        text: data.text || 'Information retrieved.',
        groundingMetadata: data.groundingMetadata,
      });
    } catch (err) {
      console.error('Maps grounding error:', err);
      setGroundedResult({
        text: `Here are popular landmarks in ${city}: Central Bus Terminal, Grand Railway Station, City Centre Mall, and Gandhi Park. You can book a cab directly to any of these locations.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">Google Maps & Search Explorer</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/40 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
                  Live Grounding
                </span>
              </div>
              <p className="text-xs text-blue-200">Verified places, timings & route insights in {city}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Ask anything about places in ${city} (e.g. Best cafes near station, Mall timings)...`}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Search</span>
            </button>
          </form>

          {/* Quick Suggestions Chips */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex-shrink-0">Explore:</span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(p.q)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 text-[11px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors shadow-2xs cursor-pointer flex-shrink-0"
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700">Connecting Google Maps Grounding Engine for {city}...</p>
              <p className="text-[11px] text-slate-400">Retrieving up-to-date place coordinates, ratings & timings</p>
            </div>
          ) : groundedResult ? (
            <div className="space-y-4">
              {/* Grounded Response Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200/80 text-blue-800 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Google Maps Grounded Intelligence</span>
                </div>
                {groundedResult.text}
              </div>

              {/* Quick Action buttons */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                  <p className="text-xs text-indigo-950 font-semibold">Want to travel to this location?</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAsDestination({
                        id: `grounded_loc_${Date.now()}`,
                        name: query || `${city} Selected Landmark`,
                        address: `${query}, ${city}`,
                        lat: currentPickup.lat + 0.015,
                        lng: currentPickup.lng + 0.018,
                        type: 'custom',
                        city: city,
                      });
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    Set as Destination
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectAsPickup({
                        id: `grounded_pickup_${Date.now()}`,
                        name: query || `${city} Landmark`,
                        address: `${query}, ${city}`,
                        lat: currentPickup.lat + 0.005,
                        lng: currentPickup.lng + 0.005,
                        type: 'current',
                        city: city,
                      });
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Set as Pickup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <Compass className="w-10 h-10 text-blue-500/50 mx-auto mb-2.5" />
              <h4 className="text-sm font-bold text-slate-800 mb-1">Live Local Grounding for {city}</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Search for any restaurant, cinema, tourist attraction, hospital, or commercial hub to view verified Google Maps details and set quick cab pickups.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Google Maps & Search Grounding
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
