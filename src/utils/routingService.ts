import { LocationPoint } from '../types';

export interface RoadRouteResult {
  path: { lat: number; lng: number }[];
  distanceKm: number;
  durationMins: number;
  summary?: string;
  source: 'google' | 'osrm' | 'fallback';
}

/**
 * Normalizes coordinates to valid real-world LatLng
 */
export function normalizeLatLng(point: { lat: number; lng: number }): { lat: number; lng: number } {
  // If coordinates are in valid standard GPS range
  if (Math.abs(point.lat) <= 90 && Math.abs(point.lng) <= 180) {
    // If it's standard real-world lat/lng (e.g. 12.97, 77.59)
    if (point.lat > 5 && point.lat < 40 && point.lng > 65 && point.lng < 100) {
      return { lat: point.lat, lng: point.lng };
    }
    // If coordinates are reasonable global lat/lng
    if (Math.abs(point.lat) > 0.5 && Math.abs(point.lng) > 0.5) {
      return { lat: point.lat, lng: point.lng };
    }
  }
  // Convert 0-100 percentage layout coordinates to Bangalore metropolitan area
  const baseLat = 12.9716;
  const baseLng = 77.5946;
  return {
    lat: baseLat + ((point.lat - 50) / 100) * 0.12,
    lng: baseLng + ((point.lng - 50) / 100) * 0.12,
  };
}

/**
 * Fetch exact road driving route via OSRM (Open Source Routing Machine)
 * Follows actual street road networks, turns, highways, and flyovers.
 */
async function fetchOsrmRoute(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<RoadRouteResult | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates;

    const path = coordinates.map(([lng, lat]) => ({ lat, lng }));
    const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
    const durationMins = Math.max(2, Math.round(route.duration / 60));
    const summary = route.legs?.[0]?.summary || 'Fastest road route';

    return {
      path,
      distanceKm: Math.max(0.5, distanceKm),
      durationMins,
      summary,
      source: 'osrm',
    };
  } catch (err) {
    console.warn('OSRM routing fetch failed:', err);
    return null;
  }
}

/**
 * Dense fallback generator when network is offline
 */
function generateRealisticRoadSegments(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): RoadRouteResult {
  const points: { lat: number; lng: number }[] = [];
  const steps = 40;

  // Haversine straight line estimation
  const R = 6371; // Earth radius in km
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.lat * Math.PI) / 180) *
      Math.cos((end.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;
  
  // Real city road factor is typically 1.25x - 1.35x direct straight line
  const estimatedRoadDistance = Math.round(directDistance * 1.3 * 10) / 10;
  const estimatedDuration = Math.round(estimatedRoadDistance * 2.8);

  const midLat = (start.lat + end.lat) / 2;
  const midLng = (start.lng + end.lng) / 2;

  // Calculate perpendicular deviation for street grid curve
  const perpLat = -(end.lng - start.lng) * 0.15;
  const perpLng = (end.lat - start.lat) * 0.15;

  const controlLat = midLat + perpLat;
  const controlLng = midLng + perpLng;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier with micro jitter to avoid straight line
    const jitter = Math.sin(t * Math.PI * 4) * 0.0003;
    const lat =
      (1 - t) * (1 - t) * start.lat +
      2 * (1 - t) * t * controlLat +
      t * t * end.lat +
      jitter;
    const lng =
      (1 - t) * (1 - t) * start.lng +
      2 * (1 - t) * t * controlLng +
      t * t * end.lng +
      jitter;
    points.push({ lat, lng });
  }

  return {
    path: points,
    distanceKm: Math.max(1.2, estimatedRoadDistance),
    durationMins: Math.max(3, estimatedDuration),
    summary: 'Estimated Road Network Route',
    source: 'fallback',
  };
}

/**
 * Main function to fetch turn-by-turn road route between two points
 * Uses Open Source Routing Machine (OSRM) with seamless road geometry fallback
 */
export async function fetchExactRoadRoute(
  startPoint: { lat: number; lng: number },
  endPoint: { lat: number; lng: number }
): Promise<RoadRouteResult> {
  const start = normalizeLatLng(startPoint);
  const end = normalizeLatLng(endPoint);

  // 1. Fetch OSRM real street driving route (no API key required, 100% road network accuracy)
  const osrmResult = await fetchOsrmRoute(start, end);
  if (osrmResult && osrmResult.path.length > 2) {
    return osrmResult;
  }

  // 2. Fallback to realistic road network path
  return generateRealisticRoadSegments(start, end);
}
