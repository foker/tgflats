/**
 * Geospatial utility functions for location-based calculations
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lng1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lng2 - Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate bounding box for a given center point and radius
 * This is used for initial filtering before precise distance calculation
 * @param lat - Center latitude
 * @param lng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box coordinates
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusKm: number,
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const R = 6371; // Earth's radius in kilometers
  
  // Calculate latitude bounds
  const latDelta = radiusKm / R * (180 / Math.PI);
  const minLat = lat - latDelta;
  const maxLat = lat + latDelta;
  
  // Calculate longitude bounds (accounting for latitude)
  const lngDelta = radiusKm / (R * Math.cos(toRadians(lat))) * (180 / Math.PI);
  const minLng = lng - lngDelta;
  const maxLng = lng + lngDelta;
  
  return {
    minLat: Math.max(minLat, -90),
    maxLat: Math.min(maxLat, 90),
    minLng: Math.max(minLng, -180),
    maxLng: Math.min(maxLng, 180),
  };
}

/**
 * Validate coordinates for Tbilisi area
 * @param lat - Latitude to validate
 * @param lng - Longitude to validate
 * @returns true if coordinates are within Tbilisi bounds
 */
export function validateTbilisiCoordinates(lat: number, lng: number): boolean {
  const TBILISI_BOUNDS = {
    minLat: 41.6,
    maxLat: 41.8,
    minLng: 44.7,
    maxLng: 44.9,
  };
  
  return (
    lat >= TBILISI_BOUNDS.minLat &&
    lat <= TBILISI_BOUNDS.maxLat &&
    lng >= TBILISI_BOUNDS.minLng &&
    lng <= TBILISI_BOUNDS.maxLng
  );
}

/**
 * Sort locations by distance from a center point
 * @param locations - Array of locations with latitude and longitude
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @returns Sorted array with added distance property
 */
export function sortByDistance<T extends { latitude: number | null; longitude: number | null }>(
  locations: T[],
  centerLat: number,
  centerLng: number,
): (T & { distance?: number })[] {
  return locations
    .map(location => {
      if (location.latitude === null || location.longitude === null) {
        return { ...location, distance: undefined };
      }
      
      const distance = calculateDistance(
        centerLat,
        centerLng,
        location.latitude,
        location.longitude,
      );
      
      return { ...location, distance };
    })
    .sort((a, b) => {
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    });
}