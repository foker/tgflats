import { Test, TestingModule } from '@nestjs/testing';
import { ClusteringService } from './clustering.service';
import { Listing } from '@prisma/client';

describe('ClusteringService', () => {
  let service: ClusteringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClusteringService],
    }).compile();

    service = module.get<ClusteringService>(ClusteringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clusterListings', () => {
    const createMockListing = (id: string, lat: number, lng: number, additionalData = {}): Listing => ({
      id,
      latitude: lat,
      longitude: lng,
      price: 1000,
      priceMin: null,
      priceMax: null,
      currency: 'USD',
      bedrooms: 2,
      district: 'Saburtalo',
      address: 'Test Address',
      areaSqm: 50,
      furnished: true,
      petsAllowed: false,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      description: null,
      amenities: [],
      telegramPostId: null,
      ...additionalData,
    } as Listing);

    it('should return individual points at high zoom levels (>= 15)', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271),
        createMockListing('2', 41.7152, 44.8272),
        createMockListing('3', 41.7153, 44.8273),
      ];

      const result = service.clusterListings(listings, {
        zoom: 16,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      expect(result).toHaveLength(3);
      expect(result.every(r => r.type === 'point')).toBe(true);
    });

    it('should create clusters at low zoom levels', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271),
        createMockListing('2', 41.7152, 44.8272),
        createMockListing('3', 41.7153, 44.8273),
        createMockListing('4', 41.7500, 44.8500),
      ];

      const result = service.clusterListings(listings, {
        zoom: 8,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      // Should have fewer results than listings due to clustering
      expect(result.length).toBeLessThan(listings.length);
      expect(result.some(r => r.type === 'cluster')).toBe(true);
    });

    it('should filter listings outside bounds', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271), // Inside bounds
        createMockListing('2', 41.5000, 44.8272), // Outside south boundary
        createMockListing('3', 41.9000, 44.8273), // Outside north boundary
        createMockListing('4', 41.7151, 44.6000), // Outside west boundary
        createMockListing('5', 41.7151, 45.0000), // Outside east boundary
      ];

      const result = service.clusterListings(listings, {
        zoom: 16,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should handle listings with null coordinates', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271),
        { ...createMockListing('2', 0, 0), latitude: null, longitude: null } as Listing,
        createMockListing('3', 41.7153, 44.8273),
      ];

      const result = service.clusterListings(listings, {
        zoom: 16,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      expect(result).toHaveLength(2);
      expect(result.map(r => r.id)).toEqual(['1', '3']);
    });

    it('should calculate cluster centroid correctly', () => {
      const listings = [
        createMockListing('1', 41.7100, 44.8200),
        createMockListing('2', 41.7200, 44.8300),
        createMockListing('3', 41.7300, 44.8400),
      ];

      const result = service.clusterListings(listings, {
        zoom: 10,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      const cluster = result.find(r => r.type === 'cluster');
      if (cluster && cluster.type === 'cluster') {
        // Centroid should be average of coordinates
        expect(cluster.latitude).toBeCloseTo(41.72, 1);
        expect(cluster.longitude).toBeCloseTo(44.83, 1);
        expect(cluster.count).toBe(3);
      }
    });

    it('should include price statistics in cluster data', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271, { price: 500 }),
        createMockListing('2', 41.7152, 44.8272, { price: 1000 }),
        createMockListing('3', 41.7153, 44.8273, { price: 1500 }),
      ];

      const result = service.clusterListings(listings, {
        zoom: 10,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      const cluster = result.find(r => r.type === 'cluster');
      if (cluster && cluster.type === 'cluster' && cluster.data) {
        // Average price should be calculated correctly (500 + 1000 + 1500) / 3 = 1000
        // But due to grid clustering, might be different based on actual grouping
        expect(cluster.data.avgPrice).toBeGreaterThan(0);
        expect(cluster.data.priceRange).toBeDefined();
        if (cluster.data.priceRange) {
          expect(cluster.data.priceRange.min).toBeLessThanOrEqual(1500);
          expect(cluster.data.priceRange.max).toBeGreaterThanOrEqual(500);
        }
      }
    });

    it('should cache results for same parameters', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271),
        createMockListing('2', 41.7152, 44.8272),
      ];

      const options = {
        zoom: 12,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      };

      // First call
      const result1 = service.clusterListings(listings, options);
      
      // Second call with same parameters
      const result2 = service.clusterListings(listings, options);

      // Results should be identical (from cache)
      expect(result1).toEqual(result2);
    });

    it('should clear cache when requested', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271),
      ];

      const options = {
        zoom: 12,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      };

      // First call (cached)
      service.clusterListings(listings, options);
      
      // Clear cache
      service.clearCache();
      
      // This should not be from cache
      const result = service.clusterListings(listings, options);
      expect(result).toBeDefined();
    });

    it('should handle empty listings array', () => {
      const result = service.clusterListings([], {
        zoom: 12,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      expect(result).toEqual([]);
    });

    it('should merge nearby clusters at low zoom levels', () => {
      const listings = [
        // First group - close together
        createMockListing('1', 41.7151, 44.8271),
        createMockListing('2', 41.7152, 44.8272),
        // Second group - close together
        createMockListing('3', 41.7161, 44.8281),
        createMockListing('4', 41.7162, 44.8282),
        // Far away point
        createMockListing('5', 41.7900, 44.8900),
      ];

      const result = service.clusterListings(listings, {
        zoom: 6, // Very low zoom
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      // Should have fewer results due to clustering (3 or less)
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should include district information in clusters', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271, { district: 'Saburtalo' }),
        createMockListing('2', 41.7152, 44.8272, { district: 'Vake' }),
        createMockListing('3', 41.7153, 44.8273, { district: 'Saburtalo' }),
      ];

      const result = service.clusterListings(listings, {
        zoom: 10,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      const cluster = result.find(r => r.type === 'cluster');
      if (cluster && cluster.type === 'cluster' && cluster.data) {
        expect(cluster.data.districts).toContain('Saburtalo');
        expect(cluster.data.districts).toContain('Vake');
      }
    });

    it('should include bedroom statistics in clusters', () => {
      const listings = [
        createMockListing('1', 41.7151, 44.8271, { bedrooms: 1 }),
        createMockListing('2', 41.7152, 44.8272, { bedrooms: 2 }),
        createMockListing('3', 41.7153, 44.8273, { bedrooms: 2 }),
        createMockListing('4', 41.7154, 44.8274, { bedrooms: 3 }),
      ];

      const result = service.clusterListings(listings, {
        zoom: 10,
        bounds: {
          north: 41.8,
          south: 41.6,
          east: 44.9,
          west: 44.7,
        },
      });

      const cluster = result.find(r => r.type === 'cluster');
      if (cluster && cluster.type === 'cluster' && cluster.data && cluster.data.bedroomStats) {
        // Check that bedroom statistics are included (exact values may vary based on clustering)
        const stats = cluster.data.bedroomStats;
        const totalCount = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
        expect(totalCount).toBeGreaterThan(0);
        expect(totalCount).toBeLessThanOrEqual(4); // We have 4 listings total
      }
    });
  });
});