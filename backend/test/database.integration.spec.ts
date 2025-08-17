import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { ListingStatus } from '@prisma/client';

describe('Database Integration Tests', () => {
  let prisma: PrismaService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test to ensure isolation
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Clean up in correct order due to foreign key constraints
      await prisma.listing.deleteMany({ where: { telegramPostId: { startsWith: 'test-' } } });
      await prisma.telegramPost.deleteMany({ where: { id: { startsWith: 'test-' } } });
      await prisma.telegramChannel.deleteMany({ where: { id: { startsWith: 'test-' } } });
      await prisma.geocodingCache.deleteMany({ where: { address: { startsWith: 'test-' } } });
      await prisma.parseJob.deleteMany({ where: { id: { startsWith: 'test-' } } });
      await prisma.metric.deleteMany({ where: { name: { startsWith: 'test-' } } });
      await prisma.aiApiUsage.deleteMany({ where: { requestId: { startsWith: 'test-' } } });
      await prisma.user.deleteMany({ where: { email: { contains: 'test@' } } });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Schema Validation and Constraints', () => {
    it('should enforce unique constraints', async () => {
      const channelData = {
        id: 'test-channel-1',
        channelId: 'test-unique-channel',
        username: 'test_unique',
        title: 'Test Channel',
        isActive: true,
      };

      // Create first channel
      await prisma.telegramChannel.create({ data: channelData });

      // Try to create duplicate channel with same channelId
      await expect(
        prisma.telegramChannel.create({
          data: { ...channelData, id: 'test-channel-2' }
        })
      ).rejects.toThrow();

      // Try to create duplicate channel with same username
      await expect(
        prisma.telegramChannel.create({
          data: {
            ...channelData,
            id: 'test-channel-3',
            channelId: 'test-different-channel',
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints', async () => {
      // Try to create telegram post without valid channel
      await expect(
        prisma.telegramPost.create({
          data: {
            id: 'test-post-1',
            channelId: 'non-existent-channel',
            messageId: 12345,
            text: 'Test post',
          }
        })
      ).rejects.toThrow();
    });

    it('should enforce enum constraints', async () => {
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-enum',
          channelId: 'test-enum-channel',
          title: 'Test Enum Channel',
        }
      });

      const post = await prisma.telegramPost.create({
        data: {
          id: 'test-post-enum',
          channelId: channel.channelId,
          messageId: 12345,
          text: 'Test post',
        }
      });

      // Valid enum value should work
      await prisma.listing.create({
        data: {
          id: 'test-listing-enum',
          telegramPostId: post.id,
          district: 'Test District',
          status: ListingStatus.ACTIVE,
        }
      });

      // Invalid enum value should fail (this would be caught at TypeScript level)
      // But we can test that the enum values are correctly stored
      const listing = await prisma.listing.findUnique({
        where: { id: 'test-listing-enum' }
      });
      expect(listing?.status).toBe(ListingStatus.ACTIVE);
    });
  });

  describe('Index Performance', () => {
    it('should efficiently query listings by district', async () => {
      const testId = Date.now().toString();
      
      // Create test data
      const channel = await prisma.telegramChannel.create({
        data: {
          id: `test-channel-perf-${testId}`,
          channelId: `test-perf-channel-${testId}`,
          title: 'Performance Test Channel',
        }
      });

      const districts = ['Vake', 'Saburtalo', 'Old Town', 'Isani', 'Vera'];
      
      // Create multiple listings for each district
      for (let i = 0; i < districts.length; i++) {
        for (let j = 0; j < 5; j++) {
          await prisma.listing.create({
            data: {
              id: `test-listing-${testId}-${i}-${j}`,
              district: districts[i],
              price: 500 + (i * 100) + (j * 10),
              bedrooms: (i % 3) + 1,
              status: ListingStatus.ACTIVE,
            }
          });
        }
      }

      // Test district index performance
      const startTime = Date.now();
      const vakeListings = await prisma.listing.findMany({
        where: { district: 'Vake' }
      });
      const queryTime = Date.now() - startTime;

      expect(vakeListings.length).toBeGreaterThanOrEqual(5); // May include seed data
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it('should efficiently query listings by price range', async () => {
      const testId = Date.now().toString();
      
      // Create listings with different prices
      for (let i = 0; i < 20; i++) {
        await prisma.listing.create({
          data: {
            id: `test-listing-price-${testId}-${i}`,
            district: 'Test District',
            price: 500 + (i * 50), // Prices from 500 to 1450
            status: ListingStatus.ACTIVE,
          }
        });
      }

      // Test price range query performance
      const startTime = Date.now();
      const priceRangeListings = await prisma.listing.findMany({
        where: {
          price: {
            gte: 700,
            lte: 1000,
          }
        }
      });
      const queryTime = Date.now() - startTime;

      expect(priceRangeListings.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast with index
    });

    it('should efficiently query listings by coordinates', async () => {
      const testId = Date.now().toString();
      
      // Create listings with coordinates
      for (let i = 0; i < 20; i++) {
        await prisma.listing.create({
          data: {
            id: `test-listing-coords-${testId}-${i}`,
            district: 'Test District',
            latitude: 41.7 + (i * 0.001), // Vary coordinates slightly
            longitude: 44.8 + (i * 0.001),
            status: ListingStatus.ACTIVE,
          }
        });
      }

      // Test coordinate range query
      const startTime = Date.now();
      const coordinateListings = await prisma.listing.findMany({
        where: {
          AND: [
            { latitude: { gte: 41.705 } },
            { latitude: { lte: 41.715 } },
            { longitude: { gte: 44.805 } },
            { longitude: { lte: 44.815 } },
          ]
        }
      });
      const queryTime = Date.now() - startTime;

      expect(coordinateListings.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(100); // Should be fast with composite index
    });
  });

  describe('Data Relationships', () => {
    it('should maintain referential integrity with cascading', async () => {
      // Create channel with posts and listings
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-cascade',
          channelId: 'test-cascade-channel',
          title: 'Cascade Test Channel',
        }
      });

      const post = await prisma.telegramPost.create({
        data: {
          id: 'test-post-cascade',
          channelId: channel.channelId,
          messageId: 99999,
          text: 'Test cascade post',
        }
      });

      const listing = await prisma.listing.create({
        data: {
          id: 'test-listing-cascade',
          telegramPostId: post.id,
          district: 'Test District',
          status: ListingStatus.ACTIVE,
        }
      });

      // Verify relationships exist
      const listingWithPost = await prisma.listing.findUnique({
        where: { id: listing.id },
        include: { telegramPost: { include: { channel: true } } }
      });

      expect(listingWithPost?.telegramPost?.id).toBe(post.id);
      expect(listingWithPost?.telegramPost?.channel.id).toBe(channel.id);
    });

    it('should handle null relationships correctly', async () => {
      const testId = Date.now().toString();
      
      // Create listing without telegram post
      const listing = await prisma.listing.create({
        data: {
          id: `test-listing-no-post-${testId}`,

          district: 'Manual Entry District',
          price: 800,
          status: ListingStatus.ACTIVE,
        }
      });

      const listingWithPost = await prisma.listing.findUnique({
        where: { id: listing.id },
        include: { telegramPost: true }
      });

      expect(listingWithPost?.telegramPost).toBeNull();
      expect(listingWithPost?.telegramPostId).toBeNull();
    });
  });

  describe('JSON and Array Fields', () => {
    it('should store and query JSON data correctly', async () => {
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-json',
          channelId: 'test-json-channel',
          title: 'JSON Test Channel',
        }
      });

      const complexRawData = {
        message_id: 123456,
        date: 1678886400,
        text: 'Complex message',
        from: {
          id: 789,
          first_name: 'Test',
          username: 'testuser'
        },
        entities: [
          { type: 'phone_number', offset: 10, length: 12 },
          { type: 'url', offset: 25, length: 20 }
        ]
      };

      const post = await prisma.telegramPost.create({
        data: {
          id: 'test-post-json',
          channelId: channel.channelId,
          messageId: 123456,
          text: 'Test JSON post',
          rawData: complexRawData,
        }
      });

      const retrievedPost = await prisma.telegramPost.findUnique({
        where: { id: post.id }
      });

      expect(retrievedPost?.rawData).toEqual(complexRawData);
      expect((retrievedPost?.rawData as any)?.from?.username).toBe('testuser');
    });

    it('should store and query array fields correctly', async () => {
      const photos = [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg'
      ];

      const amenities = ['WiFi', 'Parking', 'Air Conditioning', 'Balcony'];

      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-arrays',
          channelId: 'test-arrays-channel',
          title: 'Arrays Test Channel',
        }
      });

      const post = await prisma.telegramPost.create({
        data: {
          id: 'test-post-arrays',
          channelId: channel.channelId,
          messageId: 654321,
          text: 'Test arrays post',
          photos: photos,
        }
      });

      const listing = await prisma.listing.create({
        data: {
          id: 'test-listing-arrays',
          telegramPostId: post.id,
          district: 'Test District',
          amenities: amenities,
          imageUrls: photos,
          status: ListingStatus.ACTIVE,
        }
      });

      const retrievedListing = await prisma.listing.findUnique({
        where: { id: listing.id }
      });

      expect(retrievedListing?.amenities).toEqual(amenities);
      expect(retrievedListing?.imageUrls).toEqual(photos);
      expect(retrievedListing?.amenities).toContain('WiFi');
      expect(retrievedListing?.amenities).toHaveLength(4);
    });
  });

  describe('Seed Data Integration', () => {
    it('should verify seed data structure', async () => {
      // Check if seed data follows the correct structure
      const channels = await prisma.telegramChannel.findMany();
      const posts = await prisma.telegramPost.findMany({ include: { channel: true } });
      const listings = await prisma.listing.findMany({ include: { telegramPost: true } });

      // Verify channels have required fields
      channels.forEach(channel => {
        expect(channel.channelId).toBeDefined();
        expect(channel.title).toBeDefined();
        expect(typeof channel.isActive).toBe('boolean');
      });

      // Verify posts are linked to valid channels
      posts.forEach(post => {
        expect(post.channelId).toBeDefined();
        expect(post.messageId).toBeDefined();
        expect(post.channel).toBeDefined();
      });

      // Verify listings have valid data
      listings.forEach(listing => {
        expect(listing.district).toBeDefined();
        expect(listing.status).toBeDefined();
        expect(Object.values(ListingStatus)).toContain(listing.status);
        
        if (listing.price) {
          expect(listing.price).toBeGreaterThan(0);
        }
        
        if (listing.bedrooms) {
          expect(listing.bedrooms).toBeGreaterThan(0);
        }
      });
    });

    it('should have proper geocoding cache data', async () => {
      const cacheEntries = await prisma.geocodingCache.findMany();
      
      cacheEntries.forEach(entry => {
        expect(entry.address).toBeDefined();
        expect(entry.latitude).toBeGreaterThan(41.6); // Tbilisi latitude range
        expect(entry.latitude).toBeLessThan(41.8);
        expect(entry.longitude).toBeGreaterThan(44.7); // Tbilisi longitude range
        expect(entry.longitude).toBeLessThan(44.9);
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk operations efficiently', async () => {
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-bulk',
          channelId: 'test-bulk-channel',
          title: 'Bulk Test Channel',
        }
      });

      const testId = Date.now().toString();
      
      // Bulk create listings
      const bulkListings = Array.from({ length: 100 }, (_, i) => ({
        id: `test-listing-bulk-${testId}-${i}`,

        district: `District ${i % 10}`,
        price: 500 + (i * 10),
        bedrooms: (i % 4) + 1,
        status: ListingStatus.ACTIVE,
      }));

      const startTime = Date.now();
      await prisma.listing.createMany({ data: bulkListings });
      const createTime = Date.now() - startTime;

      expect(createTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all were created
      const createdListings = await prisma.listing.findMany({
        where: { id: { startsWith: `test-listing-bulk-${testId}-` } }
      });
      expect(createdListings).toHaveLength(100);
    });

    it('should handle complex queries efficiently', async () => {
      const testId = Date.now().toString();
      
      // Create diverse test data
      for (let i = 0; i < 50; i++) {
        await prisma.listing.create({
          data: {
            id: `test-listing-complex-${testId}-${i}`,

            district: ['Vake', 'Saburtalo', 'Old Town'][i % 3],
            price: 400 + (i * 20),
            bedrooms: (i % 3) + 1,
            petsAllowed: i % 2 === 0,
            furnished: i % 3 === 0,
            amenities: i % 2 === 0 ? ['WiFi', 'Parking'] : ['WiFi'],
            status: ListingStatus.ACTIVE,
          }
        });
      }

      // Complex query with multiple filters
      const startTime = Date.now();
      const complexQuery = await prisma.listing.findMany({
        where: {
          AND: [
            { district: { in: ['Vake', 'Saburtalo'] } },
            { price: { gte: 500, lte: 800 } },
            { bedrooms: { gte: 2 } },
            { petsAllowed: true },
            { status: ListingStatus.ACTIVE },
          ]
        },
        orderBy: [
          { price: 'asc' },
          { bedrooms: 'desc' }
        ],
        take: 20,
      });
      const queryTime = Date.now() - startTime;

      expect(queryTime).toBeLessThan(200); // Should be fast with proper indexes
      expect(complexQuery.length).toBeGreaterThan(0);
      
      // Verify results match criteria
      complexQuery.forEach(listing => {
        expect(['Vake', 'Saburtalo']).toContain(listing.district);
        expect(listing.price).toBeGreaterThanOrEqual(500);
        expect(listing.price).toBeLessThanOrEqual(800);
        expect(listing.bedrooms).toBeGreaterThanOrEqual(2);
        expect(listing.petsAllowed).toBe(true);
        expect(listing.status).toBe(ListingStatus.ACTIVE);
      });
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should maintain data consistency under concurrent operations', async () => {
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-concurrent',
          channelId: 'test-concurrent-channel',
          title: 'Concurrent Test Channel',
        }
      });

      // Simulate concurrent updates
      const updatePromises = Array.from({ length: 10 }, (_, i) =>
        prisma.telegramChannel.update({
          where: { id: channel.id },
          data: { title: `Updated Title ${i}` }
        })
      );

      await Promise.allSettled(updatePromises);

      // Verify channel still exists and has a valid title
      const updatedChannel = await prisma.telegramChannel.findUnique({
        where: { id: channel.id }
      });

      expect(updatedChannel).toBeDefined();
      expect(updatedChannel?.title).toMatch(/Updated Title \d/);
    });

    it('should handle database constraints properly', async () => {
      // Test unique constraint on telegram post
      const channel = await prisma.telegramChannel.create({
        data: {
          id: 'test-channel-constraints',
          channelId: 'test-constraints-channel',
          title: 'Constraints Test Channel',
        }
      });

      await prisma.telegramPost.create({
        data: {
          id: 'test-post-constraint-1',
          channelId: channel.channelId,
          messageId: 777777,
          text: 'First post',
        }
      });

      // Try to create duplicate post with same channelId + messageId
      await expect(
        prisma.telegramPost.create({
          data: {
            id: 'test-post-constraint-2',
            channelId: channel.channelId,
            messageId: 777777, // Same message ID
            text: 'Duplicate post',
          }
        })
      ).rejects.toThrow();
    });
  });

  describe('Analytics and Metrics', () => {
    it('should store and query metrics efficiently', async () => {
      const metrics = [
        { name: 'test-listings_created', value: 10, metadata: { date: '2024-01-01' } },
        { name: 'test-listings_created', value: 15, metadata: { date: '2024-01-02' } },
        { name: 'test-api_calls', value: 150, metadata: { endpoint: '/listings' } },
        { name: 'test-api_calls', value: 200, metadata: { endpoint: '/search' } },
      ];

      await prisma.metric.createMany({ data: metrics });

      // Query metrics by name
      const listingMetrics = await prisma.metric.findMany({
        where: { name: 'test-listings_created' },
        orderBy: { timestamp: 'desc' }
      });

      expect(listingMetrics).toHaveLength(2);
      expect(listingMetrics.some(m => m.value === 15)).toBe(true); // Contains our test data
    });

    it('should track AI API usage correctly', async () => {
      const aiUsageData = [
        {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          cost: 0.0002,
          requestId: 'test-request-1',
          metadata: { purpose: 'listing_analysis' }
        },
        {
          provider: 'openai',
          model: 'gpt-4',
          inputTokens: 200,
          outputTokens: 100,
          totalTokens: 300,
          cost: 0.006,
          requestId: 'test-request-2',
          metadata: { purpose: 'text_extraction' }
        }
      ];

      await prisma.aiApiUsage.createMany({ data: aiUsageData });

      // Query usage by provider
      const openaiUsage = await prisma.aiApiUsage.findMany({
        where: { provider: 'openai' }
      });

      expect(openaiUsage).toHaveLength(2);

      // Aggregate cost by model
      const costByModel = await prisma.aiApiUsage.groupBy({
        by: ['model'],
        where: { provider: 'openai' },
        _sum: { cost: true, totalTokens: true },
        _count: { id: true }
      });

      expect(costByModel).toHaveLength(2);
      const gpt4Stats = costByModel.find(stat => stat.model === 'gpt-4');
      expect(gpt4Stats?._sum.cost).toBe(0.006);
    });
  });
});