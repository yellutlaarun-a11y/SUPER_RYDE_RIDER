import { LocationPoint } from '../types';
import { POPULAR_LOCATIONS, ALL_CITY_LANDMARKS, getLandmarksForCity } from '../data/mockData';

// Local Storage Key for saved destinations
export const SAVED_DESTINATIONS_KEY = 'ridepulse_saved_destinations_history';

/**
 * Retrieve saved destination history from localStorage
 */
export function getSavedDestinations(): LocationPoint[] {
  try {
    const raw = localStorage.getItem(SAVED_DESTINATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load saved destinations from storage:', e);
    return [];
  }
}

/**
 * Save a destination address to history (avoids duplicates, keeps up to 20 most recent)
 */
export function saveDestinationToHistory(dest: LocationPoint): LocationPoint[] {
  if (!dest || !dest.name || !dest.address) return getSavedDestinations();
  
  try {
    const existing = getSavedDestinations();
    // Filter out existing with matching name or coordinates
    const filtered = existing.filter(
      (item) => 
        item.name.toLowerCase().trim() !== dest.name.toLowerCase().trim() &&
        !(Math.abs(item.lat - dest.lat) < 0.0005 && Math.abs(item.lng - dest.lng) < 0.0005)
    );
    
    const updated = [
      {
        ...dest,
        id: dest.id || `saved_dest_${Date.now()}`,
        type: dest.type || 'custom',
      },
      ...filtered,
    ].slice(0, 20); // Keep last 20
    
    localStorage.setItem(SAVED_DESTINATIONS_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save destination to storage:', e);
    return [];
  }
}

/**
 * Clear saved destination history
 */
export function clearSavedDestinations(): void {
  try {
    localStorage.removeItem(SAVED_DESTINATIONS_KEY);
  } catch (e) {
    console.error('Failed to clear saved destinations:', e);
  }
}

/**
 * Extract city name accurately from coordinates or address string
 */
export function extractCityName(lat: number, lng: number, address?: string): string {
  if (address) {
    const lower = address.toLowerCase();
    if (
      lower.includes('ongole') || 
      lower.includes('ongole urban') || 
      lower.includes('prakasam') || 
      lower.includes('chimakurthy') || 
      lower.includes('singarayakonda') || 
      lower.includes('kothapatnam') ||
      lower.includes('santhanuthalapadu') ||
      lower.includes('tanguturu') ||
      lower.includes('vengamukkapalem') ||
      lower.includes('santhapeta') ||
      lower.includes('lawyerpet') ||
      lower.includes('bhagyanagar')
    ) {
      return 'Ongole Urban';
    }
    if (lower.includes('hyderabad') || lower.includes('secunderabad') || lower.includes('telangana') || lower.includes('cyberabad') || lower.includes('gachibowli') || lower.includes('hitec city') || lower.includes('madhapur') || lower.includes('kondapur')) {
      return 'Hyderabad';
    }
    if (lower.includes('mumbai') || lower.includes('bombay') || lower.includes('navi mumbai') || lower.includes('thane') || (lower.includes('maharashtra') && (lat > 18.5 && lat < 19.5 && lng > 72.5 && lng < 73.5))) {
      return 'Mumbai';
    }
    if (lower.includes('delhi') || lower.includes('new delhi') || lower.includes('gurugram') || lower.includes('gurgaon') || lower.includes('noida') || lower.includes('ghaziabad') || lower.includes('faridabad')) {
      return 'Delhi NCR';
    }
    if (lower.includes('chennai') || lower.includes('madras') || lower.includes('tamil nadu')) {
      return 'Chennai';
    }
    if (lower.includes('pune') || lower.includes('hinjawadi') || lower.includes('pcmc')) {
      return 'Pune';
    }
    if (lower.includes('kolkata') || lower.includes('calcutta') || lower.includes('west bengal') || lower.includes('howrah')) {
      return 'Kolkata';
    }
    if (lower.includes('bengaluru') || lower.includes('bangalore') || lower.includes('karnataka') || lower.includes('koramangala') || lower.includes('indiranagar') || lower.includes('whitefield')) {
      return 'Bengaluru';
    }
    if (lower.includes('ahmedabad') || lower.includes('gandhinagar') || lower.includes('gujarat')) {
      return 'Ahmedabad';
    }
    if (lower.includes('jaipur') || lower.includes('rajasthan')) {
      return 'Jaipur';
    }
    if (lower.includes('chandigarh') || lower.includes('mohali') || lower.includes('panchkula')) {
      return 'Chandigarh';
    }
    if (lower.includes('kochi') || lower.includes('cochin') || lower.includes('kerala')) {
      return 'Kochi';
    }
    if (lower.includes('visakhapatnam') || lower.includes('vizag')) {
      return 'Visakhapatnam';
    }
    if (lower.includes('vijayawada') || lower.includes('amaravati') || lower.includes('guntur')) {
      return 'Vijayawada';
    }
  }

  // Geographic boundary fallback based on coordinate boxes
  if (lat >= 15.2 && lat <= 15.8 && lng >= 79.8 && lng <= 80.3) return 'Ongole Urban';
  if (lat >= 17.1 && lat <= 17.7 && lng >= 78.1 && lng <= 78.7) return 'Hyderabad';
  if (lat >= 18.8 && lat <= 19.4 && lng >= 72.7 && lng <= 73.2) return 'Mumbai';
  if (lat >= 28.3 && lat <= 28.9 && lng >= 76.9 && lng <= 77.5) return 'Delhi NCR';
  if (lat >= 12.8 && lat <= 13.3 && lng >= 80.0 && lng <= 80.4) return 'Chennai';
  if (lat >= 18.4 && lat <= 18.7 && lng >= 73.7 && lng <= 74.0) return 'Pune';
  if (lat >= 22.4 && lat <= 22.7 && lng >= 88.2 && lng <= 88.5) return 'Kolkata';
  if (lat >= 12.7 && lat <= 13.3 && lng >= 77.3 && lng <= 77.9) return 'Bengaluru';

  // If in another region, extract the suburb/city from address if available
  if (address) {
    const parts = address.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) {
      const candidate = parts[parts.length - 2];
      if (candidate && !/^\d+$/.test(candidate) && candidate.length > 2) {
        return candidate;
      }
    }
  }

  return 'Ongole Urban';
}

/**
 * Reverse geocode latitude & longitude to human-readable address string
 */
export async function reverseGeocodeLatLng(lat: number, lng: number): Promise<{ name: string; fullAddress: string }> {
  const city = extractCityName(lat, lng);
  const cityLandmarks = getLandmarksForCity(city, { lat, lng });

  // 1. Check if coordinates are near any known city landmarks in this specific city
  const nearbyLandmark = cityLandmarks.find((loc) => {
    const dLat = Math.abs(loc.lat - lat);
    const dLng = Math.abs(loc.lng - lng);
    return dLat < 0.003 && dLng < 0.003;
  });

  if (nearbyLandmark) {
    return {
      name: nearbyLandmark.name,
      fullAddress: nearbyLandmark.address,
    };
  }

  // 2. Try OpenStreetMap Nominatim Reverse Geocoding
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        const shortName = 
          data.name || 
          data.address?.road || 
          data.address?.suburb || 
          data.address?.neighbourhood || 
          data.display_name.split(',')[0];
        return {
          name: shortName || 'Pinpoint Location',
          fullAddress: data.display_name,
        };
      }
    }
  } catch (e) {
    // Continue to fallback
  }

  // 3. Fallback to clean coordinate format
  return {
    name: `Exact Pinpoint (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    fullAddress: `Selected Pinpoint in ${city} (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
  };
}

/**
 * Search and filter landmarks STRICTLY for the current GPS city.
 * Erases other cities' locations (e.g. Bangalore) when in another city.
 */
export function searchCityLandmarks(
  query: string,
  categoryFilter?: string,
  savedList?: LocationPoint[],
  currentCityName?: string,
  currentCoords?: { lat: number; lng: number }
): LocationPoint[] {
  const cleanQ = query.trim().toLowerCase();
  const activeCity = currentCityName || (currentCoords ? extractCityName(currentCoords.lat, currentCoords.lng) : 'Hyderabad');

  // ONLY get landmarks strictly belonging to the current GPS city!
  const citySpecificLandmarks = getLandmarksForCity(activeCity, currentCoords);

  // Filter saved destinations so only those matching the current city or active area are included
  const relevantSaved = (savedList || getSavedDestinations()).filter((item) => {
    if (!item || !item.name) return false;
    if (item.city && item.city.toLowerCase() !== activeCity.toLowerCase()) {
      return false;
    }
    return true;
  });

  const allPool: LocationPoint[] = [
    ...relevantSaved,
    ...citySpecificLandmarks,
  ];

  // Remove duplicate items by id or name
  const seenNames = new Set<string>();
  const uniquePool = allPool.filter((item) => {
    const key = item.name.toLowerCase().trim();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });

  return uniquePool.filter((item) => {
    // Check category filter
    if (categoryFilter && categoryFilter !== 'All') {
      if (categoryFilter === 'Saved') {
        const isSaved = relevantSaved.some(
          (s) => s.name.toLowerCase() === item.name.toLowerCase()
        );
        if (!isSaved) return false;
      } else if (categoryFilter === 'Mall' && item.type !== 'mall' && item.category !== 'Mall') {
        return false;
      } else if (
        categoryFilter === 'Station' &&
        item.type !== 'station' &&
        item.type !== 'metro' &&
        item.category !== 'Station' &&
        item.category !== 'Metro'
      ) {
        return false;
      } else if (
        categoryFilter === 'Tech Park' &&
        item.type !== 'tech_park' &&
        item.category !== 'Tech Park'
      ) {
        return false;
      } else if (
        categoryFilter === 'Airport' &&
        item.type !== 'airport' &&
        item.category !== 'Airport'
      ) {
        return false;
      } else if (
        categoryFilter === 'Hospital' &&
        item.type !== 'hospital' &&
        item.category !== 'Hospital'
      ) {
        return false;
      } else if (
        categoryFilter === 'Hotel' &&
        item.type !== 'hotel' &&
        item.category !== 'Hotel'
      ) {
        return false;
      } else if (
        categoryFilter === 'Park' &&
        item.type !== 'park' &&
        item.category !== 'Park'
      ) {
        return false;
      } else if (
        categoryFilter === 'Theatre' &&
        item.type !== 'theatre' &&
        item.category !== 'Theatre'
      ) {
        return false;
      }
    }

    if (!cleanQ) return true;

    const nameMatch = item.name.toLowerCase().includes(cleanQ);
    const addressMatch = item.address.toLowerCase().includes(cleanQ);
    const catMatch = item.category?.toLowerCase().includes(cleanQ);
    const typeMatch = item.type?.toLowerCase().includes(cleanQ);

    return nameMatch || addressMatch || catMatch || typeMatch;
  }).sort((a, b) => {
    if (!cleanQ) return (a.popularRank || 99) - (b.popularRank || 99);
    const aNameStarts = a.name.toLowerCase().startsWith(cleanQ);
    const bNameStarts = b.name.toLowerCase().startsWith(cleanQ);
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;
    return (a.popularRank || 99) - (b.popularRank || 99);
  });
}

/**
 * Forward geocode an address text string into geographical coordinates
 */
export async function forwardGeocodeAddress(
  addressText: string,
  referenceCoords?: { lat: number; lng: number },
  currentCityName?: string
): Promise<LocationPoint> {
  const cleanQuery = addressText.trim();
  if (!cleanQuery) {
    throw new Error('Address query cannot be empty');
  }

  const activeCity = currentCityName || (referenceCoords ? extractCityName(referenceCoords.lat, referenceCoords.lng) : 'Ongole Urban');
  const cityLandmarks = getLandmarksForCity(activeCity, referenceCoords);

  // 1. Check current city predefined locations for exact or strong match
  const lowerQuery = cleanQuery.toLowerCase();
  const localMatch = cityLandmarks.find((loc) => {
    const locName = loc.name.toLowerCase();
    const locAddr = loc.address.toLowerCase();
    return (
      locName === lowerQuery ||
      locName.includes(lowerQuery) ||
      lowerQuery.includes(locName) ||
      locAddr.includes(lowerQuery) ||
      (lowerQuery.includes('railway') && loc.type === 'station') ||
      (lowerQuery.includes('bus stand') && loc.name.toLowerCase().includes('bus')) ||
      (lowerQuery.includes('mgm') && loc.name.toLowerCase().includes('mgm')) ||
      (lowerQuery.includes('rims') && loc.name.toLowerCase().includes('rims')) ||
      (lowerQuery.includes('kims') && loc.name.toLowerCase().includes('kims')) ||
      (lowerQuery.includes('lawyerpet') && loc.address.toLowerCase().includes('lawyerpet')) ||
      (lowerQuery.includes('santhapeta') && loc.address.toLowerCase().includes('santhapeta'))
    );
  });

  if (localMatch) {
    return {
      ...localMatch,
      id: `loc_${Date.now()}`,
    };
  }

  // 2. Try OpenStreetMap Nominatim Search
  try {
    const contextualQuery = lowerQuery.includes(activeCity.toLowerCase())
      ? cleanQuery
      : `${cleanQuery}, ${activeCity}, Andhra Pradesh, India`;

    const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(contextualQuery)}&limit=1&addressdetails=1`;
    const res = await fetch(searchUrl, { 
      headers: { 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);
        if (!isNaN(lat) && !isNaN(lng)) {
          return {
            id: `loc_nom_${Date.now()}`,
            name: cleanQuery.split(',')[0].trim(),
            address: top.display_name || cleanQuery,
            lat: Math.round(lat * 100000) / 100000,
            lng: Math.round(lng * 100000) / 100000,
            type: 'custom',
            city: activeCity,
          };
        }
      }
    }
  } catch {
    // Continue to next resolution step
  }

  // 4. Reliable deterministic city coordinate generation offset
  let baseLat = 15.5057; // Ongole Urban Central
  let baseLng = 80.0499;

  if (referenceCoords) {
    baseLat = referenceCoords.lat;
    baseLng = referenceCoords.lng;
  } else if (activeCity === 'Hyderabad') {
    baseLat = 17.3850;
    baseLng = 78.4867;
  } else if (activeCity === 'Bangalore') {
    baseLat = 12.9716;
    baseLng = 77.5946;
  } else if (activeCity === 'Vijayawada') {
    baseLat = 16.5062;
    baseLng = 80.6480;
  }
  
  let hash = 0;
  for (let i = 0; i < cleanQuery.length; i++) {
    hash = (hash << 5) - hash + cleanQuery.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((Math.abs(hash) % 100) - 50) * 0.0006;
  const lngOffset = ((Math.abs(hash >> 2) % 100) - 50) * 0.0006;

  const generatedLat = Math.round((baseLat + latOffset) * 100000) / 100000;
  const generatedLng = Math.round((baseLng + lngOffset) * 100000) / 100000;

  return {
    id: `loc_custom_${Date.now()}`,
    name: cleanQuery.split(',')[0].trim(),
    address: `${cleanQuery}, ${activeCity}`,
    lat: generatedLat,
    lng: generatedLng,
    type: 'custom',
    city: activeCity,
  };
}

/**
 * Calculate straight-line Haversine distance in kilometers between two coords
 */
export function calculateStraightLineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

