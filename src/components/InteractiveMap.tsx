/// <reference types="@types/google.maps" />
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LocationPoint, RideType, CaptainDetails, BookingStatus, DeviceGpsState } from '../types';
import { 
  reverseGeocodeLatLng, 
  saveDestinationToHistory, 
  forwardGeocodeAddress,
  searchCityLandmarks,
  extractCityName,
  calculateStraightLineDistanceKm
} from '../utils/geoUtils';
import { getLandmarksForCity } from '../data/mockData';
import { fetchExactRoadRoute, RoadRouteResult, normalizeLatLng } from '../utils/routingService';
import { NearbyVehiclesMapLayer } from './NearbyVehiclesMapLayer';
import { 
  Navigation, 
  MapPin, 
  Compass, 
  Layers, 
  Plus, 
  Minus, 
  Crosshair, 
  Car, 
  Bike, 
  Package, 
  Radio,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  LocateFixed,
  ShieldCheck,
  Move,
  GripHorizontal,
  Hand,
  Route,
  Sparkles,
  Search,
  X,
  Building2,
  ChevronRight,
  ArrowRight,
  Clock,
  ShoppingBag,
  Hotel,
  Trees,
  Film,
  Hospital,
  Train,
  Tag,
  Map as MapIcon,
  Navigation2,
  Mic
} from 'lucide-react';

declare global {
  interface Window {
    google: typeof google;
  }
}

interface InteractiveMapProps {
  pickup: LocationPoint;
  destination: LocationPoint | null;
  selectedRideType: RideType;
  onSelectMapLocation?: (point: LocationPoint, type: 'pickup' | 'destination') => void;
  onUpdatePickupPoint?: (point: LocationPoint) => void;
  onUpdateDestinationPoint?: (point: LocationPoint | null) => void;
  onRouteCalculated?: (distanceKm: number, durationMins: number, summary?: string) => void;
  activeBookingStatus?: BookingStatus;
  captain?: CaptainDetails;
  isTrackingMode?: boolean;
  onRecenterGps?: () => void;
  interactiveSelectionMode?: 'pickup' | 'destination' | null;
  deviceGps?: DeviceGpsState | null;
  onRequestGps?: () => void;
  onSetGpsAsPickup?: (point: LocationPoint) => void;
  onOpenVoiceAssistant?: () => void;
}

// Singleton promise to ensure Google Maps script is strictly loaded only once
let googleMapsLoadingPromise: Promise<typeof google> | null = null;

function loadGoogleMaps(apiKey: string): Promise<typeof google> {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }

  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  const scriptId = 'google-maps-js-sdk';
  const existingScript = typeof document !== 'undefined' ? document.getElementById(scriptId) as HTMLScriptElement | null : null;

  if (existingScript) {
    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google);
        return;
      }
      existingScript.addEventListener('load', () => {
        if (window.google && window.google.maps) {
          resolve(window.google);
        } else {
          googleMapsLoadingPromise = null;
          reject(new Error('Google Maps SDK loaded but window.google.maps is undefined'));
        }
      });
      existingScript.addEventListener('error', (err) => {
        googleMapsLoadingPromise = null;
        reject(err);
      });
    });
    return googleMapsLoadingPromise;
  }

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        googleMapsLoadingPromise = null;
        reject(new Error('Google Maps SDK loaded but window.google.maps is undefined'));
      }
    };
    script.onerror = (e) => {
      googleMapsLoadingPromise = null;
      reject(e);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
}

// Trigger brief subtle bounce animation on Google Maps marker when dropped or updated
function triggerMarkerBounce(marker: google.maps.Marker | null) {
  if (!marker || !window.google?.maps?.Animation) return;
  marker.setAnimation(window.google.maps.Animation.BOUNCE);
  setTimeout(() => {
    marker.setAnimation(null);
  }, 750);
}

// Convert LocationPoint coordinates to valid Google Maps LatLng
function getGoogleLatLng(point: LocationPoint): google.maps.LatLngLiteral {
  return normalizeLatLng({ lat: point.lat, lng: point.lng });
}

// Generate realistic route path coordinates with natural road curve geometry
function generateCurvedRoutePath(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  const steps = 30;

  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;

  // Realistic highway road detour / curvature
  const offsetLat = -dLng * 0.18;
  const offsetLng = dLat * 0.18;

  const controlLat = midLat + offsetLat;
  const controlLng = midLng + offsetLng;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lat = (1 - t) * (1 - t) * start.lat + 2 * (1 - t) * t * controlLat + t * t * end.lat;
    const lng = (1 - t) * (1 - t) * start.lng + 2 * (1 - t) * t * controlLng + t * t * end.lng;
    points.push({ lat, lng });
  }

  return points;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  pickup,
  destination,
  selectedRideType,
  onSelectMapLocation,
  onUpdatePickupPoint,
  onUpdateDestinationPoint,
  onRouteCalculated,
  activeBookingStatus,
  captain,
  isTrackingMode = false,
  onRecenterGps,
  interactiveSelectionMode = null,
  deviceGps,
  onRequestGps,
  onSetGpsAsPickup,
  onOpenVoiceAssistant,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const pickupMarkerRef = useRef<google.maps.Marker | null>(null);
  const destMarkerRef = useRef<google.maps.Marker | null>(null);
  const captainMarkerRef = useRef<google.maps.Marker | null>(null);
  const captainApproachingPolylineRef = useRef<google.maps.Polyline | null>(null);
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<google.maps.Polyline | null>(null);
  const deviceGpsMarkerRef = useRef<google.maps.Marker | null>(null);
  const deviceGpsCircleRef = useRef<google.maps.Circle | null>(null);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [captainPosition, setCaptainPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [captainEtaMins, setCaptainEtaMins] = useState(3);
  const [showGpsDetailsModal, setShowGpsDetailsModal] = useState(false);
  const [roadRouteResult, setRoadRouteResult] = useState<RoadRouteResult | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Drag & Drop State Feedback HUD
  const [draggingPin, setDraggingPin] = useState<{
    type: 'pickup' | 'destination';
    currentCoords: { lat: number; lng: number };
  } | null>(null);
  const [dragSuccessToast, setDragSuccessToast] = useState<string | null>(null);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);

  // Single-Click Manual Search & Double-Click Zoom GPS States
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showManualSearchOverlay, setShowManualSearchOverlay] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [isGeocodingManualPickup, setIsGeocodingManualPickup] = useState(false);
  const [gpsPromptVisible, setGpsPromptVisible] = useState(false);
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);

  // Rider-Needed City Landmarks (Shopping Malls, Hotels, Parks, Theatres, Hospitals, Stations)
  const [showLandmarksPanel, setShowLandmarksPanel] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);
  const [selectedLandmarkCategory, setSelectedLandmarkCategory] = useState<string>('All');
  const poiMarkersRef = useRef<google.maps.Marker[]>([]);

  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBgw6LviKPuUs218ed6MYPEv-3aq0hXu8A';

  // Refs for current callbacks to avoid stale closures in Google Maps marker listeners
  const callbacksRef = useRef({
    onUpdatePickupPoint,
    onUpdateDestinationPoint,
    onSelectMapLocation,
    onRouteCalculated,
    pickup,
    destination,
  });

  useEffect(() => {
    callbacksRef.current = {
      onUpdatePickupPoint,
      onUpdateDestinationPoint,
      onSelectMapLocation,
      onRouteCalculated,
      pickup,
      destination,
    };
  }, [onUpdatePickupPoint, onUpdateDestinationPoint, onSelectMapLocation, onRouteCalculated, pickup, destination]);

  // Handle Pickup Marker Drag End
  const handlePickupDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setDraggingPin(null);
    setIsGeocodingPin(true);

    try {
      const geoResult = await reverseGeocodeLatLng(lat, lng);
      const updatedPoint: LocationPoint = {
        id: `pickup_pin_${Date.now()}`,
        name: geoResult.name,
        address: geoResult.fullAddress,
        lat,
        lng,
        type: 'current',
      };

      if (callbacksRef.current.onUpdatePickupPoint) {
        callbacksRef.current.onUpdatePickupPoint(updatedPoint);
      } else if (callbacksRef.current.onSelectMapLocation) {
        callbacksRef.current.onSelectMapLocation(updatedPoint, 'pickup');
      }

      // Trigger subtle bounce feedback on drop
      triggerMarkerBounce(pickupMarkerRef.current);

      setDragSuccessToast(`Pickup moved to: ${geoResult.name}`);
      setTimeout(() => setDragSuccessToast(null), 4000);
    } catch (err) {
      console.error('Reverse geocode failed on pickup drag:', err);
    } finally {
      setIsGeocodingPin(false);
    }
  }, []);

  // Handle Destination Marker Drag End
  const handleDestDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setDraggingPin(null);
    setIsGeocodingPin(true);

    try {
      const geoResult = await reverseGeocodeLatLng(lat, lng);
      const updatedPoint: LocationPoint = {
        id: `dest_pin_${Date.now()}`,
        name: geoResult.name,
        address: geoResult.fullAddress,
        lat,
        lng,
        type: 'custom',
      };

      // Save to destination history automatically
      saveDestinationToHistory(updatedPoint);

      if (callbacksRef.current.onUpdateDestinationPoint) {
        callbacksRef.current.onUpdateDestinationPoint(updatedPoint);
      } else if (callbacksRef.current.onSelectMapLocation) {
        callbacksRef.current.onSelectMapLocation(updatedPoint, 'destination');
      }

      // Trigger subtle bounce feedback on drop
      triggerMarkerBounce(destMarkerRef.current);

      setDragSuccessToast(`Destination moved to: ${geoResult.name}`);
      setTimeout(() => setDragSuccessToast(null), 4000);
    } catch (err) {
      console.error('Reverse geocode failed on destination drag:', err);
    } finally {
      setIsGeocodingPin(false);
    }
  }, []);

  // 1. Initialize Google Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (!mapContainerRef.current) return;

        // Default initial center: device GPS if available, else pickup
        const initialCenter = deviceGps && deviceGps.status === 'granted'
          ? { lat: deviceGps.lat, lng: deviceGps.lng }
          : getGoogleLatLng(pickup);

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 15,
          mapTypeId: mapTypeId,
          disableDefaultUI: true,
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }],
            },
            {
              featureType: 'transit',
              elementType: 'geometry',
              stylers: [{ color: '#f2f2f2' }],
            },
          ],
        });

        // Initialize Traffic Layer
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
        trafficLayerRef.current = trafficLayer;

        // Handle Map Clicks for pin dropping / setting spot
        map.addListener('click', async (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          setIsGeocodingPin(true);
          const geo = await reverseGeocodeLatLng(lat, lng);
          setIsGeocodingPin(false);

          const customPoint: LocationPoint = {
            id: `gmap_loc_${Date.now()}`,
            name: geo.name,
            address: geo.fullAddress,
            lat,
            lng,
            type: 'custom',
          };

          const mode = interactiveSelectionMode || (callbacksRef.current.destination ? 'destination' : 'destination');
          
          if (mode === 'pickup' && callbacksRef.current.onUpdatePickupPoint) {
            callbacksRef.current.onUpdatePickupPoint(customPoint);
            setDragSuccessToast(`Pickup location set: ${geo.name}`);
            setTimeout(() => setDragSuccessToast(null), 3500);
          } else if (callbacksRef.current.onUpdateDestinationPoint) {
            callbacksRef.current.onUpdateDestinationPoint(customPoint);
            saveDestinationToHistory(customPoint);
            setDragSuccessToast(`Destination set: ${geo.name}`);
            setTimeout(() => setDragSuccessToast(null), 3500);
          } else if (callbacksRef.current.onSelectMapLocation) {
            callbacksRef.current.onSelectMapLocation(customPoint, mode);
          }
        });

        mapInstanceRef.current = map;
        setIsMapLoaded(true);
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps:', err);
        setLoadError('Unable to load Google Maps API.');
      });

    return () => {
      mapInstanceRef.current = null;
    };
  }, [apiKey]);

  // 2. Update Map Type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapTypeId);
    }
  }, [mapTypeId]);

  // 3. Update Traffic Layer visibility
  useEffect(() => {
    if (trafficLayerRef.current && mapInstanceRef.current) {
      trafficLayerRef.current.setMap(trafficEnabled ? mapInstanceRef.current : null);
    }
  }, [trafficEnabled]);

  // 4. Update Device GPS Marker & Accuracy Circle
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isMapLoaded) return;
    const google = window.google;
    const map = mapInstanceRef.current;

    if (deviceGps && deviceGps.status === 'granted') {
      const gpsPos = { lat: deviceGps.lat, lng: deviceGps.lng };

      // Device GPS Center Pulse Marker (Blue Navigation Dot)
      if (!deviceGpsMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: gpsPos,
          map,
          title: `My Current Device GPS: ${deviceGps.lat.toFixed(5)}, ${deviceGps.lng.toFixed(5)}`,
          zIndex: 999,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#2563eb', // Royal Blue
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        });
        deviceGpsMarkerRef.current = marker;
      } else {
        deviceGpsMarkerRef.current.setPosition(gpsPos);
        deviceGpsMarkerRef.current.setTitle(`My Current Device GPS: ${deviceGps.lat.toFixed(5)}, ${deviceGps.lng.toFixed(5)}`);
        deviceGpsMarkerRef.current.setMap(map);
      }

      // Device GPS Accuracy Circle
      const accuracyRadius = Math.max(15, Math.min(deviceGps.accuracy || 30, 200));
      if (!deviceGpsCircleRef.current) {
        const circle = new google.maps.Circle({
          map,
          center: gpsPos,
          radius: accuracyRadius,
          strokeColor: '#3b82f6',
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          fillColor: '#60a5fa',
          fillOpacity: 0.18,
          zIndex: 990,
        });
        deviceGpsCircleRef.current = circle;
      } else {
        deviceGpsCircleRef.current.setCenter(gpsPos);
        deviceGpsCircleRef.current.setRadius(accuracyRadius);
        deviceGpsCircleRef.current.setMap(map);
      }
    } else {
      if (deviceGpsMarkerRef.current) {
        deviceGpsMarkerRef.current.setMap(null);
      }
      if (deviceGpsCircleRef.current) {
        deviceGpsCircleRef.current.setMap(null);
      }
    }
  }, [deviceGps, isMapLoaded]);

  // 5. Update DRAGGABLE Markers and Route Polylines
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !isMapLoaded) return;

    const google = window.google;
    const map = mapInstanceRef.current;
    const pickupPos = getGoogleLatLng(pickup);

    // Update or create DRAGGABLE Pickup Marker (Green Pin)
    if (!pickupMarkerRef.current) {
      const marker = new google.maps.Marker({
        position: pickupPos,
        map,
        title: `📍 Pickup Spot: ${pickup.name} (Drag to reposition)`,
        draggable: true,
        animation: google.maps.Animation.DROP,
        cursor: 'grab',
        zIndex: 1000,
        icon: {
          path: 'M 12,2 C 8.13,2 5,5.13 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.87 -3.13,-7 -7,-7 z M 12,11.5 c -1.38,0 -2.5,-1.12 -2.5,-2.5 0,-1.38 1.12,-2.5 2.5,-2.5 1.38,0 2.5,1.12 2.5,2.5 0,1.38 -1.12,2.5 -2.5,2.5 z',
          fillColor: '#059669', // Emerald
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 1.8,
          anchor: new google.maps.Point(12, 22),
        },
      });

      marker.addListener('dragstart', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        setDraggingPin({
          type: 'pickup',
          currentCoords: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        });
      });

      marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        setDraggingPin({
          type: 'pickup',
          currentCoords: { lat: e.latLng.lat(), lng: e.latLng.lng() },
        });
      });

      marker.addListener('dragend', handlePickupDragEnd);

      pickupMarkerRef.current = marker;
    } else {
      pickupMarkerRef.current.setPosition(pickupPos);
      pickupMarkerRef.current.setTitle(`📍 Pickup Spot: ${pickup.name} (Drag to reposition)`);
      pickupMarkerRef.current.setDraggable(true);
      pickupMarkerRef.current.setMap(map);
      triggerMarkerBounce(pickupMarkerRef.current);
    }

    // Update or create DRAGGABLE Destination Marker (Red Pin) and Route
    if (destination) {
      const destPos = getGoogleLatLng(destination);
      if (!destMarkerRef.current) {
        const marker = new google.maps.Marker({
          position: destPos,
          map,
          title: `🎯 Destination: ${destination.name} (Drag to reposition)`,
          draggable: true,
          animation: google.maps.Animation.DROP,
          cursor: 'grab',
          zIndex: 1000,
          icon: {
            path: 'M 12,2 C 8.13,2 5,5.13 5,9 c 0,5.25 7,13 7,13 0,0 7,-7.75 7,-13 0,-3.87 -3.13,-7 -7,-7 z M 12,11.5 c -1.38,0 -2.5,-1.12 -2.5,-2.5 0,-1.38 1.12,-2.5 2.5,-2.5 1.38,0 2.5,1.12 2.5,2.5 0,1.38 -1.12,2.5 -2.5,2.5 z',
            fillColor: '#dc2626', // Red
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.8,
            anchor: new google.maps.Point(12, 22),
          },
        });

        marker.addListener('dragstart', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setDraggingPin({
            type: 'destination',
            currentCoords: { lat: e.latLng.lat(), lng: e.latLng.lng() },
          });
        });

        marker.addListener('drag', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          setDraggingPin({
            type: 'destination',
            currentCoords: { lat: e.latLng.lat(), lng: e.latLng.lng() },
          });
        });

        marker.addListener('dragend', handleDestDragEnd);

        destMarkerRef.current = marker;
      } else {
        destMarkerRef.current.setPosition(destPos);
        destMarkerRef.current.setTitle(`🎯 Destination: ${destination.name} (Drag to reposition)`);
        destMarkerRef.current.setDraggable(true);
        destMarkerRef.current.setMap(map);
        triggerMarkerBounce(destMarkerRef.current);
      }

      // Calculate and trace exact road-network path between pickup and destination
      setIsCalculatingRoute(true);
      let isCancelled = false;

      fetchExactRoadRoute(pickup, destination).then((routeRes) => {
        if (isCancelled || !mapInstanceRef.current) return;
        setRoadRouteResult(routeRes);
        setIsCalculatingRoute(false);

        const exactRoadPoints = routeRes.path;

        // Glow casing polyline for high road contrast
        if (!routeGlowPolylineRef.current) {
          routeGlowPolylineRef.current = new google.maps.Polyline({
            path: exactRoadPoints,
            geodesic: false,
            strokeColor: '#059669',
            strokeOpacity: 0.25,
            strokeWeight: 10,
            map,
          });
        } else {
          routeGlowPolylineRef.current.setPath(exactRoadPoints);
          routeGlowPolylineRef.current.setMap(map);
        }

        // Core crisp emerald road polyline
        if (!routePolylineRef.current) {
          routePolylineRef.current = new google.maps.Polyline({
            path: exactRoadPoints,
            geodesic: false,
            strokeColor: '#047857',
            strokeOpacity: 0.95,
            strokeWeight: 5,
            map,
          });
        } else {
          routePolylineRef.current.setPath(exactRoadPoints);
          routePolylineRef.current.setMap(map);
        }

        // Notify parent of accurate road distance and duration
        if (callbacksRef.current.onRouteCalculated) {
          callbacksRef.current.onRouteCalculated(routeRes.distanceKm, routeRes.durationMins, routeRes.summary);
        }

        // Auto fit bounds to encompass the full road route and exact markers
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(pickupPos);
        bounds.extend(destPos);
        exactRoadPoints.forEach((pt) => bounds.extend(pt));
        map.fitBounds(bounds, { top: 70, bottom: 70, left: 70, right: 70 });
      }).catch((err) => {
        console.error('Failed to compute exact road route:', err);
        setIsCalculatingRoute(false);
      });

      return () => {
        isCancelled = true;
      };
    } else {
      setRoadRouteResult(null);
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
      if (routeGlowPolylineRef.current) {
        routeGlowPolylineRef.current.setMap(null);
      }
      map.panTo(pickupPos);
      map.setZoom(15);
    }
  }, [pickup, destination, isMapLoaded, handlePickupDragEnd, handleDestDragEnd]);

  // 6. Captain Tracking Motion on Google Map (strictly along verified road networks)
  useEffect(() => {
    if (!isTrackingMode || !captain || !mapInstanceRef.current || !window.google || !isMapLoaded) {
      if (captainMarkerRef.current) {
        captainMarkerRef.current.setMap(null);
      }
      if (captainApproachingPolylineRef.current) {
        captainApproachingPolylineRef.current.setMap(null);
      }
      return;
    }

    const google = window.google;
    const map = mapInstanceRef.current;
    const pickupPos = getGoogleLatLng(pickup);

    // Inland Land Road Offset: avoids water bodies (Bay of Bengal / lakes / rivers) by placing origin along main road corridors inland
    const isEastCoast = pickupPos.lng > 80.08 || (pickupPos.lat > 12 && pickupPos.lat < 18 && pickupPos.lng > 80.1);
    const initialCaptainPos = {
      lat: isEastCoast ? pickupPos.lat + 0.005 : pickupPos.lat - 0.006,
      lng: isEastCoast ? pickupPos.lng - 0.012 : pickupPos.lng - 0.010, // Strictly inland / west
    };

    setCaptainPosition(initialCaptainPos);

    // Initialize captain vehicle marker
    if (!captainMarkerRef.current) {
      captainMarkerRef.current = new google.maps.Marker({
        position: initialCaptainPos,
        map,
        title: `Captain ${captain.name} (${captain.vehicleNumber})`,
        zIndex: 1200,
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 7,
          fillColor: '#2563eb', // Royal Blue
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: 45,
        },
      });
    } else {
      captainMarkerRef.current.setPosition(initialCaptainPos);
      captainMarkerRef.current.setMap(map);
    }

    let isSubscribed = true;
    let animationInterval: NodeJS.Timeout | null = null;

    // Fetch actual road route for captain approaching pickup
    const captainOriginPoint: LocationPoint = {
      id: 'capt_origin',
      name: 'Captain Current Road Location',
      address: 'Inland Street',
      lat: initialCaptainPos.lat,
      lng: initialCaptainPos.lng,
      type: 'current',
    };

    fetchExactRoadRoute(captainOriginPoint, pickup).then((res) => {
      if (!isSubscribed || !mapInstanceRef.current) return;

      const roadPath = res.path;
      if (roadPath.length < 2) return;

      // Draw approaching road polyline
      if (!captainApproachingPolylineRef.current) {
        captainApproachingPolylineRef.current = new google.maps.Polyline({
          path: roadPath,
          geodesic: false,
          strokeColor: '#2563eb',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
      } else {
        captainApproachingPolylineRef.current.setPath(roadPath);
        captainApproachingPolylineRef.current.setMap(map);
      }

      // Smooth step navigation along the exact road geometry points
      let pathIndex = 0;
      const totalPoints = roadPath.length;

      animationInterval = setInterval(() => {
        if (!isSubscribed) return;
        pathIndex++;
        
        if (pathIndex < totalPoints) {
          const currentPoint = roadPath[pathIndex];
          const nextPoint = roadPath[Math.min(pathIndex + 1, totalPoints - 1)];
          
          // Calculate heading angle
          const dLng = nextPoint.lng - currentPoint.lng;
          const dLat = nextPoint.lat - currentPoint.lat;
          const headingDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;

          setCaptainPosition(currentPoint);

          if (captainMarkerRef.current) {
            captainMarkerRef.current.setPosition(currentPoint);
            captainMarkerRef.current.setIcon({
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 7,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              rotation: Math.round((headingDeg + 360) % 360),
            });
          }

          const progress = pathIndex / totalPoints;
          setCaptainEtaMins(Math.max(1, Math.round(3 * (1 - progress))));
        } else {
          if (animationInterval) clearInterval(animationInterval);
        }
      }, 1200);
    });

    return () => {
      isSubscribed = false;
      if (animationInterval) clearInterval(animationInterval);
    };
  }, [isTrackingMode, captain, pickup, isMapLoaded]);

  // Active GPS City Name (Defaults to Ongole Urban if near Ongole coordinates)
  const activeCityName = extractCityName(pickup.lat, pickup.lng, pickup.address || deviceGps?.address);

  // Clean up any remaining POI markers
  useEffect(() => {
    poiMarkersRef.current.forEach((m) => m.setMap(null));
    poiMarkersRef.current = [];
  }, [isMapLoaded]);

  // Handle setting landmark as pickup
  const handleSetLandmarkAsPickup = (landmark: LocationPoint) => {
    if (callbacksRef.current.onUpdatePickupPoint) {
      callbacksRef.current.onUpdatePickupPoint(landmark);
    } else if (callbacksRef.current.onSelectMapLocation) {
      callbacksRef.current.onSelectMapLocation(landmark, 'pickup');
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: landmark.lat, lng: landmark.lng });
      mapInstanceRef.current.setZoom(16);
    }
    setDragSuccessToast(`📍 Pickup set to: ${landmark.name}`);
    setTimeout(() => setDragSuccessToast(null), 3500);
  };

  // Handle setting landmark as destination
  const handleSetLandmarkAsDestination = (landmark: LocationPoint) => {
    saveDestinationToHistory(landmark);
    if (callbacksRef.current.onUpdateDestinationPoint) {
      callbacksRef.current.onUpdateDestinationPoint(landmark);
    } else if (callbacksRef.current.onSelectMapLocation) {
      callbacksRef.current.onSelectMapLocation(landmark, 'destination');
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: landmark.lat, lng: landmark.lng });
      mapInstanceRef.current.setZoom(15);
    }
    setDragSuccessToast(`🎯 Destination set to: ${landmark.name}`);
    setTimeout(() => setDragSuccessToast(null), 3500);
  };

  // Direct Live GPS Handler: Immediately locate and center on exact device GPS
  const handleGpsClick = () => {
    if (onRequestGps) onRequestGps();
    if (onRecenterGps) onRecenterGps();

    if (mapInstanceRef.current) {
      if (deviceGps && deviceGps.lat && deviceGps.lng) {
        const gpsPos = { lat: deviceGps.lat, lng: deviceGps.lng };
        mapInstanceRef.current.panTo(gpsPos);
        mapInstanceRef.current.setZoom(17);

        if (onSetGpsAsPickup) {
          const shortName = deviceGps.address?.split(',')[0] || 'My GPS Location';
          onSetGpsAsPickup({
            id: `live_gps_${Date.now()}`,
            name: shortName,
            address: deviceGps.address || `GPS (${deviceGps.lat.toFixed(5)}, ${deviceGps.lng.toFixed(5)})`,
            lat: deviceGps.lat,
            lng: deviceGps.lng,
            type: 'current',
          });
        }
        setDragSuccessToast(`🎯 Centered on Live GPS (${deviceGps.lat.toFixed(4)}, ${deviceGps.lng.toFixed(4)})`);
      } else {
        const pos = getGoogleLatLng(pickup);
        mapInstanceRef.current.panTo(pos);
        mapInstanceRef.current.setZoom(17);
        setDragSuccessToast('📍 Centered on Pickup Location');
      }
    }
    setTimeout(() => setDragSuccessToast(null), 3500);
  };

  const handleOpenManualSearch = () => {
    setShowManualSearchOverlay(true);
    setManualSearchError(null);
  };

  // Handle selecting a manual search result landmark as pickup
  const handleSelectManualPickup = (item: LocationPoint) => {
    if (callbacksRef.current.onUpdatePickupPoint) {
      callbacksRef.current.onUpdatePickupPoint(item);
    } else if (callbacksRef.current.onSelectMapLocation) {
      callbacksRef.current.onSelectMapLocation(item, 'pickup');
    }

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: item.lat, lng: item.lng });
      mapInstanceRef.current.setZoom(16);
    }

    setShowManualSearchOverlay(false);
    setGpsPromptVisible(false);
    setManualSearchQuery('');
    setDragSuccessToast(`📍 Pickup set to: ${item.name}`);
    setTimeout(() => setDragSuccessToast(null), 3500);
  };

  // Handle submitting custom manual address
  const handleSubmitManualAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = manualSearchQuery.trim();
    if (!query) return;

    setIsGeocodingManualPickup(true);
    setManualSearchError(null);

    try {
      const resolved = await forwardGeocodeAddress(
        query,
        { lat: pickup.lat, lng: pickup.lng },
        activeCityName
      );

      if (callbacksRef.current.onUpdatePickupPoint) {
        callbacksRef.current.onUpdatePickupPoint(resolved);
      } else if (callbacksRef.current.onSelectMapLocation) {
        callbacksRef.current.onSelectMapLocation(resolved, 'pickup');
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: resolved.lat, lng: resolved.lng });
        mapInstanceRef.current.setZoom(16);
      }

      setShowManualSearchOverlay(false);
      setGpsPromptVisible(false);
      setManualSearchQuery('');
      setDragSuccessToast(`📍 Pickup set to: ${resolved.name}`);
      setTimeout(() => setDragSuccessToast(null), 3500);
    } catch (err) {
      console.error('Failed to geocode manual address:', err);
      setManualSearchError(`Could not find "${query}" in ${activeCityName}. Try another landmark.`);
    } finally {
      setIsGeocodingManualPickup(false);
    }
  };

  // Filter landmarks for manual search in the current city
  const citySearchResults = searchCityLandmarks(
    manualSearchQuery,
    'All',
    [],
    activeCityName,
    { lat: pickup.lat, lng: pickup.lng }
  );

  // All city landmarks for current GPS city (Shopping Malls, Hotels, Parks, Theatres, Hospitals, Stations)
  const cityLandmarksList = getLandmarksForCity(activeCityName, { lat: pickup.lat, lng: pickup.lng });
  const filteredCityLandmarks = cityLandmarksList.filter((item) => {
    if (selectedLandmarkCategory === 'All') return true;
    if (selectedLandmarkCategory === 'Mall') return item.type === 'mall' || item.category === 'Mall';
    if (selectedLandmarkCategory === 'Hotel') return item.type === 'hotel' || item.category === 'Hotel';
    if (selectedLandmarkCategory === 'Park') return item.type === 'park' || item.category === 'Park';
    if (selectedLandmarkCategory === 'Theatre') return item.type === 'theatre' || item.category === 'Theatre';
    if (selectedLandmarkCategory === 'Hospital') return item.type === 'hospital' || item.category === 'Hospital';
    if (selectedLandmarkCategory === 'Station') return item.type === 'station' || item.type === 'metro' || item.category === 'Station';
    return true;
  });

  const getCategoryEmoji = (type?: string, category?: string) => {
    const t = (type || '').toLowerCase();
    const c = (category || '').toLowerCase();
    if (t === 'mall' || c.includes('mall') || c.includes('shopping')) return '🛍️';
    if (t === 'hotel' || c.includes('hotel') || c.includes('lodge')) return '🏨';
    if (t === 'park' || c.includes('park') || c.includes('garden')) return '🌳';
    if (t === 'theatre' || c.includes('theatre') || c.includes('cinema') || c.includes('inox')) return '🎬';
    if (t === 'hospital' || c.includes('hospital') || c.includes('medical')) return '🏥';
    if (t === 'station' || t === 'metro' || c.includes('station') || c.includes('metro')) return '🚉';
    return '📍';
  };

  const LANDMARK_CATEGORY_TABS = [
    { id: 'All', label: 'All', icon: '🏷️' },
    { id: 'Mall', label: 'Shopping Malls', icon: '🛍️' },
    { id: 'Hotel', label: 'Hotels', icon: '🏨' },
    { id: 'Park', label: 'Parks', icon: '🌳' },
    { id: 'Theatre', label: 'Theatres', icon: '🎬' },
    { id: 'Hospital', label: 'Hospitals', icon: '🏥' },
    { id: 'Station', label: 'Stations', icon: '🚉' },
  ];

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || 14;
      mapInstanceRef.current.setZoom(z + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const z = mapInstanceRef.current.getZoom() || 14;
      mapInstanceRef.current.setZoom(z - 1);
    }
  };

  return (
    <div className="relative w-full h-full select-none">
      {/* Map Target Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-slate-100" />

      {/* REALISTIC ANIMATED NEARBY AVAILABLE VEHICLES LAYER */}
      {isMapLoaded && mapInstanceRef.current && (
        <NearbyVehiclesMapLayer
          map={mapInstanceRef.current}
          pickup={pickup}
          selectedRideType={selectedRideType}
          isTrackingMode={isTrackingMode}
        />
      )}

      {/* Loading & Error States */}
      {!isMapLoaded && !loadError && (
        <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-700">Connecting Google Maps Engine...</p>
        </div>
      )}

      {loadError && (
        <div className="absolute top-4 left-4 right-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl p-3 text-xs flex items-center gap-2 shadow-lg z-20">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">Google Maps Notice: </span>
            <span>{loadError} Using high-precision vector overlay fallback.</span>
          </div>
        </div>
      )}

      {/* DRAGGING PIN ACTIVE HUD BANNER */}
      {draggingPin && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[92%] sm:max-w-md w-full animate-bounce">
          <div className={`px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-3 backdrop-blur-md text-white ${
            draggingPin.type === 'pickup' 
              ? 'bg-emerald-800/95 border-emerald-400' 
              : 'bg-rose-800/95 border-rose-400'
          }`}>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Move className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wider">
                Dragging {draggingPin.type === 'pickup' ? 'Pickup Spot 📍' : 'Destination 🎯'}
              </p>
              <p className="text-[11px] text-white/90 truncate font-medium">
                Release anywhere on road/gate to lock exact coordinates ({draggingPin.currentCoords.lat.toFixed(4)}, {draggingPin.currentCoords.lng.toFixed(4)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI VOICE ASSISTANT FLOATING MAP BUTTON - REMOVED AS REQUESTED */}

      {/* DRAG SUCCESS TOAST */}
      {dragSuccessToast && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-[90%] sm:max-w-md w-full animate-fadeIn">
          <div className="px-3.5 py-2 rounded-xl shadow-lg border bg-slate-900/95 text-white border-emerald-500/50 flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs font-semibold truncate">{dragSuccessToast}</p>
          </div>
        </div>
      )}

      {/* REVERSE GEOCODING SPINNER */}
      {isGeocodingPin && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold flex items-center gap-2 shadow-md backdrop-blur-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
          <span>Pinpointing exact street address...</span>
        </div>
      )}

      {/* ROAD ROUTE DETAILS PILL (When route is active - showing only time on map) */}
      {roadRouteResult && destination && (
        <div className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-140px)] animate-fadeIn">
          <div className="bg-slate-900/95 text-white backdrop-blur-md border border-emerald-500/40 rounded-2xl px-3.5 py-2 shadow-xl flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider truncate flex items-center gap-1">
                <span>Estimated Time</span>
                <span className="text-white/60 font-normal lowercase">• {roadRouteResult.summary}</span>
              </p>
              <p className="text-xs font-black text-white leading-tight">
                {roadRouteResult.durationMins} mins driving
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL SEARCH BOX OVERLAY (Triggered on Single Click of GPS Icon - Reduced to 60% Size) */}
      {showManualSearchOverlay && (
        <div 
          id="manual-pickup-search-overlay"
          className="absolute top-3 left-1/2 -translate-x-1/2 z-40 w-[60%] max-w-xs sm:max-w-sm animate-fadeIn"
        >
          <div className="bg-white/98 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-md overflow-hidden flex flex-col text-[11px]">
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3 h-3 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[11px] font-black uppercase tracking-wider truncate">Enter Pickup</h3>
                  <p className="text-[9px] text-emerald-100/90 font-medium truncate">{activeCityName}</p>
                </div>
              </div>
              <button
                id="close-manual-search-overlay-btn"
                onClick={() => {
                  setShowManualSearchOverlay(false);
                  setGpsPromptVisible(false);
                }}
                className="w-5 h-5 rounded-md bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmitManualAddress} className="p-2 bg-slate-50/80 border-b border-slate-200">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  id="manual-pickup-address-input"
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  placeholder={`Search ${activeCityName}...`}
                  autoFocus
                  className="w-full pl-7 pr-14 py-1.5 bg-white border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 rounded-lg text-[11px] font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all shadow-inner"
                />
                {manualSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setManualSearchQuery('')}
                    className="absolute right-10 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!manualSearchQuery.trim() || isGeocodingManualPickup}
                  className="absolute right-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-md text-[10px] font-bold transition-all shadow-xs flex items-center gap-0.5"
                >
                  {isGeocodingManualPickup ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Set</span>
                  )}
                </button>
              </div>

              {manualSearchError && (
                <p className="mt-1 text-[10px] font-semibold text-rose-600 flex items-center gap-1 px-0.5">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span>{manualSearchError}</span>
                </p>
              )}
            </form>

            {/* Suggested Landmarks List strictly for active city (Ongole Urban) */}
            <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
              <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Popular {activeCityName} Spots</span>
                <span>Tap to Select</span>
              </div>

              {citySearchResults.slice(0, 6).map((item) => (
                <button
                  key={item.id || item.name}
                  onClick={() => handleSelectManualPickup(item)}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-emerald-50/80 transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-emerald-800">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {item.address}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}

              {manualSearchQuery.trim() && (
                <button
                  onClick={() => handleSubmitManualAddress()}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors flex items-center gap-2.5 text-left border-t border-slate-100"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-blue-700 truncate">
                      Search & Pin: &quot;{manualSearchQuery.trim()}&quot;
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Pinpoint coordinates in {activeCityName}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>
              )}
            </div>

            {/* Quick Actions Footer */}
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={handleGpsClick}
                className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Use Live GPS Location</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualSearchOverlay(false);
                  setGpsPromptVisible(false);
                }}
                className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIDER-NEEDED LANDMARKS & GPS HUB FLOATING DRAWER */}
      {showLandmarksPanel && (
        <div 
          id="rider-city-landmarks-modal"
          className="absolute bottom-16 right-3 sm:bottom-3 sm:right-16 z-30 w-[92vw] max-w-sm sm:max-w-md bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[82vh] sm:max-h-[520px] transition-all"
        >
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5 truncate">
                  <span>{activeCityName} Landmarks</span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold uppercase">
                    GPS City
                  </span>
                </h3>
                <p className="text-[9px] text-slate-300 truncate">
                  Malls • Hotels • Parks • Theatres • Stations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleGpsClick}
                title="Center on Live GPS"
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <LocateFixed className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={() => setShowLandmarksPanel(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Category Tabs */}
          <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
            {LANDMARK_CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedLandmarkCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                  selectedLandmarkCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200/80'
                }`}
              >
                <span className="text-[11px]">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Landmarks List with Small Letters */}
          <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[340px]">
            {filteredCityLandmarks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Building2 className="w-7 h-7 mx-auto mb-1.5 text-slate-400 opacity-60" />
                <p className="text-xs font-semibold text-slate-700">No {selectedLandmarkCategory} found in {activeCityName}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Switch categories or explore nearby locations</p>
              </div>
            ) : (
              filteredCityLandmarks.map((item) => {
                const distKm = calculateStraightLineDistanceKm(pickup.lat, pickup.lng, item.lat, item.lng);
                return (
                  <div
                    key={item.id}
                    className="py-2 px-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2 group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                      {getCategoryEmoji(item.type, item.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-800 truncate max-w-[190px]">
                          {item.name}
                        </span>
                        <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                          {item.category || item.type}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{item.address}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-blue-600 font-semibold">
                        <Clock className="w-2.5 h-2.5" />
                        <span>~{Math.max(1, Math.round(distKm * 2.5))} mins from current GPS</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          handleSetLandmarkAsDestination(item);
                          setShowLandmarksPanel(false);
                        }}
                        className="px-2 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold shadow-xs flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="Set as Ride Destination"
                      >
                        <span>Drop 🎯</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSetLandmarkAsPickup(item);
                          setShowLandmarksPanel(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors"
                        title="Set as Ride Pickup"
                      >
                        <span>Pickup 📍</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Quick Action */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[10px]">
            <button
              type="button"
              onClick={handleGpsClick}
              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>Center GPS ({pickup.lat.toFixed(3)}, {pickup.lng.toFixed(3)})</span>
            </button>
            <span className="text-slate-400 text-[9px] font-medium">{filteredCityLandmarks.length} Places Found</span>
          </div>
        </div>
      )}

      {/* MAP CONTROLS OVERLAY (Layer Menu, Traffic, GPS Locator, Landmarks at the bottom) */}
      <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1.5 z-20">
        
        {/* INTERACTIVE LAYER SELECTION POPOVER MENU */}
        {showLayersMenu && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-2 w-48 flex flex-col gap-1.5 mb-1 animate-fadeIn text-slate-800">
            <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1 border-b border-slate-100">
              <span className="text-[11px] font-black tracking-wider uppercase text-slate-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Map Layers
              </span>
              <button
                type="button"
                onClick={() => setShowLayersMenu(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md hover:bg-slate-100"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Base Layer 1: Standard (Roadmap) */}
            <button
              type="button"
              id="layer-switch-standard-btn"
              onClick={() => {
                setMapTypeId('roadmap');
              }}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-xl text-left text-xs font-bold transition-all ${
                mapTypeId === 'roadmap'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <MapIcon className="w-3 h-3" />
                </div>
                <span>Standard</span>
              </div>
              {mapTypeId === 'roadmap' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>

            {/* Base Layer 2: Satellite (Hybrid) */}
            <button
              type="button"
              id="layer-switch-satellite-btn"
              onClick={() => {
                setMapTypeId('hybrid');
              }}
              className={`flex items-center justify-between w-full px-2 py-1.5 rounded-xl text-left text-xs font-bold transition-all ${
                mapTypeId === 'hybrid' || mapTypeId === 'satellite'
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-800 text-emerald-300 flex items-center justify-center">
                  <Layers className="w-3 h-3" />
                </div>
                <span>Satellite</span>
              </div>
              {(mapTypeId === 'hybrid' || mapTypeId === 'satellite') && (
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              )}
            </button>

            {/* Overlay Layer: Live Traffic */}
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                id="layer-switch-traffic-btn"
                onClick={() => setTrafficEnabled(!trafficEnabled)}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-xl text-left text-xs font-bold transition-all ${
                  trafficEnabled
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${trafficEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Radio className="w-3 h-3" />
                  </div>
                  <span>Traffic View</span>
                </div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  trafficEnabled 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {trafficEnabled ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* CONTROLS BUTTON BAR */}
        <div className="flex flex-col items-center gap-1.5">
          {/* 1. Main Layer Toggle Button (Opens Layer Switcher Menu) */}
          <button
            type="button"
            id="toggle-map-layers-menu-btn"
            onClick={() => setShowLayersMenu(!showLayersMenu)}
            title="Toggle Map Layers (Standard, Satellite, Traffic)"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md relative ${
              showLayersMenu || mapTypeId !== 'roadmap' || trafficEnabled
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-indigo-500/30'
                : 'bg-white/95 hover:bg-white border-slate-200 text-slate-700 hover:text-indigo-600 hover:shadow-md'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {trafficEnabled && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* 2. Direct Quick Traffic View Layer Button */}
          <button
            type="button"
            id="toggle-traffic-layer-btn"
            onClick={() => setTrafficEnabled(!trafficEnabled)}
            title={`Traffic View Layer: ${trafficEnabled ? 'ON' : 'OFF'}`}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md relative ${
              trafficEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-white/95 hover:bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:shadow-md'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {trafficEnabled && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* 3. GPS locator with Live Accuracy Indicator */}
          <div className="relative group flex items-center">
            {deviceGps && (
              <span className={`hidden sm:group-hover:inline-flex absolute right-full mr-2 items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap shadow-md z-30 transition-all ${
                deviceGps.status === 'poor_signal' || deviceGps.accuracy > 50
                  ? 'bg-amber-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}>
                {deviceGps.status === 'poor_signal' || deviceGps.accuracy > 50
                  ? `⚠️ Weak Signal (±${deviceGps.accuracy}m)`
                  : `🎯 High Precision (±${deviceGps.accuracy}m)`}
              </span>
            )}
            <button
              type="button"
              id="recalibrate-gps-pinpoint-btn"
              onClick={handleGpsClick}
              title={
                deviceGps
                  ? `GPS: ±${deviceGps.accuracy}m (${deviceGps.status === 'poor_signal' || deviceGps.accuracy > 50 ? 'Low accuracy - drag pin' : 'High precision'})`
                  : 'GPS Locator (Recenter on Live GPS)'
              }
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md hover:shadow-md relative ${
                deviceGps?.status === 'poor_signal' || (deviceGps?.accuracy && deviceGps.accuracy > 50)
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-white/95 hover:bg-white border-slate-200 text-blue-600 hover:text-blue-700'
              }`}
            >
              <LocateFixed className="w-3.5 h-3.5" />
              {deviceGps && (
                <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                  deviceGps.status === 'poor_signal' || deviceGps.accuracy > 50
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`} />
              )}
            </button>
          </div>

          {/* 4. Landmarks icon */}
          <button
            type="button"
            id="recenter-map-gps-btn"
            onClick={() => setShowLandmarksPanel(!showLandmarksPanel)}
            title={`Landmarks Hub: ${activeCityName} (Malls, Hotels, Parks, Theatres, Stations)`}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border shadow-sm flex items-center justify-center transition-all active:scale-95 cursor-pointer backdrop-blur-md relative group ${
              showLandmarksPanel
                ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/30'
                : 'bg-white/95 hover:bg-white border-slate-200 text-slate-700 hover:text-blue-600 hover:shadow-md'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
          </button>
        </div>
      </div>

      {/* CAPTAIN TRACKING STATUS FLOATING OVERLAY (When booking is active) */}
      {isTrackingMode && captain && (
        <div className="absolute bottom-3 left-3 z-10 max-w-xs bg-slate-900/95 text-white backdrop-blur-md border border-slate-700 rounded-2xl p-3 shadow-xl">
          <div className="flex items-center gap-2.5 mb-1.5">
            <img
              src={captain.photo}
              alt={captain.name}
              className="w-8 h-8 rounded-full border border-emerald-400 object-cover flex-shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{captain.name}</p>
              <p className="text-[10px] text-slate-300 truncate">{captain.vehicleModel} • {captain.vehicleNumber}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/30">
              {captainEtaMins}m away
            </span>
          </div>
          <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${Math.min(100, (1 - captainEtaMins / 5) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
