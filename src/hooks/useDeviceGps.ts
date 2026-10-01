import { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceGpsState, LocationPoint } from '../types';
import { extractCityName } from '../utils/geoUtils';

// Default fallback location when all geolocation services are blocked
const DEFAULT_FALLBACK_LOCATION = {
  lat: 15.4985,
  lng: 80.0573,
  address: 'Station Road, Santhapeta, Ongole Urban, Andhra Pradesh',
  city: 'Ongole Urban',
};

// High accuracy threshold in meters for Green signal status
export const HIGH_ACCURACY_THRESHOLD_METERS = 50;

export interface UseDeviceGpsOptions {
  accuracyThresholdMeters?: number; // Threshold for green high accuracy badge (default: 50m)
  highAccuracyTimeoutMs?: number;   // Timeout for satellite GPS lock (default: 10000ms)
  maximumAgeMs?: number;            // Freshness requirement (default: 0ms for live hardware GPS)
  enableRefinementWatch?: boolean;  // Watch GPS stream to continually refine precision (default: true)
}

export function useDeviceGps(
  onLocationObtained?: (point: LocationPoint) => void,
  options: UseDeviceGpsOptions = {}
) {
  const {
    accuracyThresholdMeters = HIGH_ACCURACY_THRESHOLD_METERS,
    highAccuracyTimeoutMs = 10000,
    maximumAgeMs = 0,
    enableRefinementWatch = true,
  } = options;

  const [deviceGps, setDeviceGps] = useState<DeviceGpsState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [accuracyLevel, setAccuracyLevel] = useState<'high' | 'medium' | 'low' | 'ip' | 'default'>('default');
  const [isRefining, setIsRefining] = useState<boolean>(false);

  // Active watch ID reference for cleanup
  const activeWatchIdRef = useRef<number | null>(null);
  const watchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep ref to avoid recreating callbacks or triggering useEffect loops
  const onLocationObtainedRef = useRef(onLocationObtained);
  useEffect(() => {
    onLocationObtainedRef.current = onLocationObtained;
  }, [onLocationObtained]);

  // Clean up active watch listeners
  const clearActiveWatch = useCallback(() => {
    if (activeWatchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeWatchIdRef.current);
      activeWatchIdRef.current = null;
    }
    if (watchTimeoutRef.current !== null) {
      clearTimeout(watchTimeoutRef.current);
      watchTimeoutRef.current = null;
    }
    setIsRefining(false);
  }, []);

  useEffect(() => {
    return () => {
      clearActiveWatch();
    };
  }, [clearActiveWatch]);

  // Fast Reverse Geocoding with OpenStreetMap Nominatim and City Area Extraction
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ address: string; shortName: string; city: string }> => {
    const regionalCity = extractCityName(lat, lng);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'en' },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          const address = data.display_name;
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || data.address?.amenity || '';
          const cityFromDetails = data.address?.city || data.address?.town || data.address?.county || data.address?.state_district || regionalCity;
          const shortName = road 
            ? `${road}, ${cityFromDetails}`.trim() 
            : (address.split(',')[0] ? `${address.split(',')[0]}, ${cityFromDetails}` : `Location near ${cityFromDetails}`);
          return { address, shortName, city: cityFromDetails || regionalCity };
        }
      }
    } catch {
      // Ignore network errors or timeouts on reverse geocoding
    }

    const coordStr = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    return {
      address: `Pinpoint in ${regionalCity} (${coordStr})`,
      shortName: `Location near ${regionalCity}`,
      city: regionalCity,
    };
  }, []);

  // IP Geolocation fallback when browser GPS is blocked, denied or unavailable
  const fetchIpGeolocation = useCallback(async (): Promise<{ lat: number; lng: number; city: string; address: string } | null> => {
    try {
      // Service 1: geojs.io (Fast, CORS friendly, free)
      const res1 = await fetch('https://get.geojs.io/v1/ip/geo.json', { cache: 'no-store' });
      if (res1.ok) {
        const data1 = await res1.json();
        const lat = parseFloat(data1.latitude);
        const lng = parseFloat(data1.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const city = data1.city || data1.region || 'Current Area';
          const address = `${city}, ${data1.country || ''}`.trim();
          return { lat, lng, city, address };
        }
      }
    } catch {
      // Try next service
    }

    try {
      // Service 2: ipapi.co
      const res2 = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if (res2.ok) {
        const data2 = await res2.json();
        const lat = parseFloat(data2.latitude);
        const lng = parseFloat(data2.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          const city = data2.city || data2.region || 'Current Area';
          const address = `${city}, ${data2.country_name || ''}`.trim();
          return { lat, lng, city, address };
        }
      }
    } catch {
      // Service failed
    }

    return null;
  }, []);

  const requestGpsLocation = useCallback((autoSetPickup = false) => {
    clearActiveWatch();
    setIsLoading(true);
    setDeviceGps((prev) => (prev ? { ...prev, status: 'requesting' } : null));

    // High Accuracy GPS Geolocation configuration
    const highAccuracyOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: highAccuracyTimeoutMs,
      maximumAge: maximumAgeMs,
    };

    if (typeof window !== 'undefined' && navigator.geolocation) {
      const applyGpsCoordinates = async (
        coords: GeolocationCoordinates, 
        timestamp: number
      ) => {
        const { latitude: lat, longitude: lng, accuracy } = coords;
        const geoResult = await reverseGeocode(lat, lng);
        const roundedAccuracy = Math.round(accuracy || 15);
        const isHighPrecision = roundedAccuracy <= accuracyThresholdMeters;
        const isModerate = roundedAccuracy <= 150;

        const calculatedLevel = isHighPrecision ? 'high' : isModerate ? 'medium' : 'low';

        const gpsState: DeviceGpsState = {
          lat,
          lng,
          accuracy: roundedAccuracy,
          address: geoResult.address,
          timestamp: timestamp || Date.now(),
          status: isHighPrecision || isModerate ? 'granted' : 'poor_signal',
          isAccuracyPoor: !isHighPrecision && !isModerate,
          accuracyLevel: calculatedLevel,
          errorMessage: isHighPrecision
            ? undefined
            : `GPS accuracy (±${roundedAccuracy}m). Showing live device position.`,
        };

        setDeviceGps(gpsState);
        setAccuracyLevel(calculatedLevel);
        setIsLoading(false);

        // Always update the pickup with the rider's actual physical coordinates
        if (autoSetPickup && onLocationObtainedRef.current) {
          onLocationObtainedRef.current({
            id: `gps_device_${Date.now()}`,
            name: geoResult.shortName,
            address: geoResult.address,
            city: geoResult.city,
            lat,
            lng,
            type: 'current',
          });
        }
      };

      const handleFallbackAfterGpsFailure = async (error?: GeolocationPositionError) => {
        const ipLoc = await fetchIpGeolocation();
        
        if (ipLoc) {
          const gpsState: DeviceGpsState = {
            lat: ipLoc.lat,
            lng: ipLoc.lng,
            accuracy: 2500, // IP accuracy is city-level
            address: ipLoc.address,
            timestamp: Date.now(),
            status: 'poor_signal',
            isAccuracyPoor: true,
            accuracyLevel: 'ip',
            errorMessage: 'GPS hardware unavailable. Using approximate IP area. Please drag pin to exact location.',
          };
          setDeviceGps(gpsState);
          setAccuracyLevel('ip');
          setIsLoading(false);

          if (autoSetPickup && onLocationObtainedRef.current) {
            onLocationObtainedRef.current({
              id: `gps_ip_${Date.now()}`,
              name: ipLoc.city,
              address: ipLoc.address,
              city: ipLoc.city,
              lat: ipLoc.lat,
              lng: ipLoc.lng,
              type: 'current',
            });
          }
          return;
        }

        let msg = 'Unable to retrieve exact device GPS location.';
        let status: DeviceGpsState['status'] = 'error';

        if (error) {
          if (error.code === error.PERMISSION_DENIED) {
            msg = 'Location permission was denied or blocked. Click to retry and allow location access.';
            status = 'denied';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = 'Device GPS position is temporarily unavailable.';
          } else if (error.code === error.TIMEOUT) {
            msg = 'High accuracy GPS request timed out. Retrying or drag pin on map.';
          }
        }

        setDeviceGps({
          lat: DEFAULT_FALLBACK_LOCATION.lat,
          lng: DEFAULT_FALLBACK_LOCATION.lng,
          accuracy: 500,
          address: DEFAULT_FALLBACK_LOCATION.address,
          timestamp: Date.now(),
          status,
          isAccuracyPoor: true,
          accuracyLevel: 'default',
          errorMessage: msg,
        });
        setAccuracyLevel('default');
        setIsLoading(false);
      };

      // 1. Initial High Accuracy GPS Request
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await applyGpsCoordinates(position.coords, position.timestamp);

          // If refinement watch is enabled, actively watch for tighter satellite locks
          if (enableRefinementWatch) {
            setIsRefining(true);
            let currentBestAccuracy = position.coords.accuracy;

            const watchId = navigator.geolocation.watchPosition(
              async (refinedPosition) => {
                const refinedAccuracy = refinedPosition.coords.accuracy;
                
                // If a more accurate reading arrives, update instantly
                if (refinedAccuracy < currentBestAccuracy) {
                  currentBestAccuracy = refinedAccuracy;
                  await applyGpsCoordinates(refinedPosition.coords, refinedPosition.timestamp);
                  
                  // If accuracy reached <= 20m, clear watch as optimal lock achieved
                  if (refinedAccuracy <= 20) {
                    clearActiveWatch();
                  }
                }
              },
              (err) => {
                console.warn('GPS refinement stream notice:', err.message);
              },
              {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 0,
              }
            );

            activeWatchIdRef.current = watchId;

            // Stop refinement watch after 8 seconds
            watchTimeoutRef.current = setTimeout(() => {
              clearActiveWatch();
            }, 8000);
          }
        },
        (error) => {
          console.warn('High accuracy GPS error:', error.message);
          handleFallbackAfterGpsFailure(error);
        },
        highAccuracyOptions
      );
    } else {
      // Browser does not support HTML5 Geolocation API
      fetchIpGeolocation().then((ipLoc) => {
        if (ipLoc) {
          const gpsState: DeviceGpsState = {
            lat: ipLoc.lat,
            lng: ipLoc.lng,
            accuracy: 2500,
            address: ipLoc.address,
            timestamp: Date.now(),
            status: 'poor_signal',
            isAccuracyPoor: true,
            accuracyLevel: 'ip',
            errorMessage: 'GPS hardware unavailable on browser. Using regional IP area.',
          };
          setDeviceGps(gpsState);
          setAccuracyLevel('ip');
          if (autoSetPickup && onLocationObtainedRef.current) {
            onLocationObtainedRef.current({
              id: `gps_ip_${Date.now()}`,
              name: ipLoc.city,
              address: ipLoc.address,
              city: ipLoc.city,
              lat: ipLoc.lat,
              lng: ipLoc.lng,
              type: 'current',
            });
          }
        } else {
          setDeviceGps({
            lat: DEFAULT_FALLBACK_LOCATION.lat,
            lng: DEFAULT_FALLBACK_LOCATION.lng,
            accuracy: 500,
            address: DEFAULT_FALLBACK_LOCATION.address,
            status: 'error',
            isAccuracyPoor: true,
            accuracyLevel: 'default',
            errorMessage: 'Geolocation is not supported by your browser.',
            timestamp: Date.now(),
          });
          setAccuracyLevel('default');
        }
        setIsLoading(false);
      });
    }
  }, [
    accuracyThresholdMeters,
    highAccuracyTimeoutMs,
    maximumAgeMs,
    enableRefinementWatch,
    clearActiveWatch,
    fetchIpGeolocation,
    reverseGeocode,
  ]);

  // Request once on initial mount
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      requestGpsLocation(true);
    }
  }, [requestGpsLocation]);

  return {
    deviceGps,
    isLoading,
    accuracyLevel,
    isRefining,
    accuracyThresholdMeters,
    requestGpsLocation,
  };
}
