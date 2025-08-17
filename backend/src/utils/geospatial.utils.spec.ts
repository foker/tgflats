import {
  calculateDistance,
  getBoundingBox,
  validateTbilisiCoordinates,
  sortByDistance,
} from './geospatial.utils';

describe('Geospatial Utils', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between two known points in Tbilisi
      // Freedom Square to Rustaveli Theatre (~1.2 km)
      const lat1 = 41.6938;
      const lng1 = 44.8015;
      const lat2 = 41.7025;
      const lng2 = 44.7965;
      
      const distance = calculateDistance(lat1, lng1, lat2, lng2);
      
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.5);
    });

    it('should return 0 for same coordinates', () => {
      const lat = 41.7151;
      const lng = 44.8271;
      
      const distance = calculateDistance(lat, lng, lat, lng);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-41.7151, -44.8271, -41.7000, -44.8000);
      
      expect(distance).toBeGreaterThan(0);
    });
  });

  describe('getBoundingBox', () => {
    it('should calculate bounding box correctly', () => {
      const lat = 41.7151;
      const lng = 44.8271;
      const radiusKm = 5;
      
      const bounds = getBoundingBox(lat, lng, radiusKm);
      
      expect(bounds.minLat).toBeLessThan(lat);
      expect(bounds.maxLat).toBeGreaterThan(lat);
      expect(bounds.minLng).toBeLessThan(lng);
      expect(bounds.maxLng).toBeGreaterThan(lng);
    });

    it('should respect latitude bounds', () => {
      const bounds = getBoundingBox(89, 0, 500);
      
      expect(bounds.maxLat).toBeLessThanOrEqual(90);
      expect(bounds.minLat).toBeGreaterThanOrEqual(-90);
    });

    it('should respect longitude bounds', () => {
      const bounds = getBoundingBox(0, 179, 500);
      
      expect(bounds.maxLng).toBeLessThanOrEqual(180);
      expect(bounds.minLng).toBeGreaterThanOrEqual(-180);
    });

    it('should create larger bounding box for larger radius', () => {
      const lat = 41.7151;
      const lng = 44.8271;
      
      const smallBounds = getBoundingBox(lat, lng, 1);
      const largeBounds = getBoundingBox(lat, lng, 10);
      
      expect(largeBounds.maxLat - largeBounds.minLat).toBeGreaterThan(
        smallBounds.maxLat - smallBounds.minLat
      );
      expect(largeBounds.maxLng - largeBounds.minLng).toBeGreaterThan(
        smallBounds.maxLng - smallBounds.minLng
      );
    });
  });

  describe('validateTbilisiCoordinates', () => {
    it('should validate coordinates within Tbilisi bounds', () => {
      // Valid Tbilisi coordinates
      expect(validateTbilisiCoordinates(41.7, 44.8)).toBe(true);
      expect(validateTbilisiCoordinates(41.65, 44.75)).toBe(true);
      expect(validateTbilisiCoordinates(41.75, 44.85)).toBe(true);
    });

    it('should reject coordinates outside Tbilisi bounds', () => {
      // Outside Tbilisi
      expect(validateTbilisiCoordinates(40.0, 44.8)).toBe(false); // Too far south
      expect(validateTbilisiCoordinates(42.0, 44.8)).toBe(false); // Too far north
      expect(validateTbilisiCoordinates(41.7, 44.0)).toBe(false); // Too far west
      expect(validateTbilisiCoordinates(41.7, 45.5)).toBe(false); // Too far east
    });

    it('should handle edge cases', () => {
      // Exactly on bounds
      expect(validateTbilisiCoordinates(41.6, 44.7)).toBe(true);
      expect(validateTbilisiCoordinates(41.8, 44.9)).toBe(true);
      
      // Just outside bounds
      expect(validateTbilisiCoordinates(41.59, 44.8)).toBe(false);
      expect(validateTbilisiCoordinates(41.81, 44.8)).toBe(false);
    });
  });

  describe('sortByDistance', () => {
    const locations = [
      { id: '1', latitude: 41.7000, longitude: 44.8000 },
      { id: '2', latitude: 41.7151, longitude: 44.8271 },
      { id: '3', latitude: 41.6938, longitude: 44.8015 },
      { id: '4', latitude: null, longitude: null },
      { id: '5', latitude: 41.7200, longitude: 44.8300 },
    ];

    it('should sort locations by distance from center', () => {
      const centerLat = 41.7151;
      const centerLng = 44.8271;
      
      const sorted = sortByDistance(locations, centerLat, centerLng);
      
      // Closest should be the center itself (id: '2')
      expect(sorted[0].id).toBe('2');
      expect(sorted[0].distance).toBe(0);
      
      // Locations with null coordinates should be at the end
      expect(sorted[sorted.length - 1].id).toBe('4');
      expect(sorted[sorted.length - 1].distance).toBeUndefined();
    });

    it('should add distance property to each location', () => {
      const centerLat = 41.7151;
      const centerLng = 44.8271;
      
      const sorted = sortByDistance(locations, centerLat, centerLng);
      
      sorted.forEach(location => {
        if (location.latitude !== null && location.longitude !== null) {
          expect(location.distance).toBeDefined();
          expect(typeof location.distance).toBe('number');
          expect(location.distance).toBeGreaterThanOrEqual(0);
        } else {
          expect(location.distance).toBeUndefined();
        }
      });
    });

    it('should handle empty array', () => {
      const sorted = sortByDistance([], 41.7151, 44.8271);
      
      expect(sorted).toEqual([]);
    });

    it('should handle all null coordinates', () => {
      const nullLocations = [
        { id: '1', latitude: null, longitude: null },
        { id: '2', latitude: null, longitude: null },
      ];
      
      const sorted = sortByDistance(nullLocations, 41.7151, 44.8271);
      
      expect(sorted.every(l => l.distance === undefined)).toBe(true);
    });
  });
});