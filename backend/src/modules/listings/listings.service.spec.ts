import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { Listing, ListingStatus } from '@prisma/client';
import { FilterListingsDto } from './dto/filter-listings.dto';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    listing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockListing: Listing = {
    id: '1',
    telegramPostId: 'post1',
    district: 'Vake',
    address: 'Test Address',
    latitude: 41.7151,
    longitude: 44.8271,
    price: 800,
    priceMin: null,
    priceMax: null,
    currency: 'USD',
    bedrooms: 2,
    areaSqm: 75,
    petsAllowed: true,
    furnished: true,
    amenities: ['wifi', 'parking'],
    description: 'Test description',
    contactInfo: null,
    sourceUrl: null,
    imageUrls: [],
    status: ListingStatus.ACTIVE,
    confidence: 0.95,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new listing', async () => {
      mockPrismaService.listing.create.mockResolvedValue(mockListing);

      const createDto = {
        district: 'Vake',
        price: 800,
        bedrooms: 2,
        currency: 'GEL',
        status: ListingStatus.ACTIVE,
      };
      
      const result = await service.create(createDto);

      expect(result).toEqual(mockListing);
      expect(mockPrismaService.listing.create).toHaveBeenCalledWith({
        data: {
          district: 'Vake',
          price: 800,
          bedrooms: 2,
          currency: 'GEL',
          status: ListingStatus.ACTIVE,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated listings', async () => {
      const mockListings = [mockListing];
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);
      mockPrismaService.listing.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockListings);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should filter by price range', async () => {
      const mockListings = [mockListing];
      mockPrismaService.listing.findMany.mockResolvedValue(mockListings);
      mockPrismaService.listing.count.mockResolvedValue(1);

      await service.findAll({ 
        priceMin: 500, 
        priceMax: 1000,
        page: 1,
        limit: 20 
      });

      expect(mockPrismaService.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter by district', async () => {
      mockPrismaService.listing.findMany.mockResolvedValue([mockListing]);
      mockPrismaService.listing.count.mockResolvedValue(1);

      await service.findAll({ 
        district: 'Vake',
        page: 1,
        limit: 20 
      });

      expect(mockPrismaService.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            district: {
              contains: 'Vake',
              mode: 'insensitive',
            },
          }),
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single listing', async () => {
      mockPrismaService.listing.findUnique.mockResolvedValue(mockListing);

      const result = await service.findOne('1');

      expect(result).toEqual(mockListing);
      expect(mockPrismaService.listing.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: expect.any(Object),
      });
    });

    it('should throw error if listing not found', async () => {
      mockPrismaService.listing.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a listing', async () => {
      const updatedListing = { ...mockListing, price: 900 };
      mockPrismaService.listing.update.mockResolvedValue(updatedListing);

      const result = await service.update('1', { price: 900 });

      expect(result).toEqual(updatedListing);
      expect(mockPrismaService.listing.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { price: 900 },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete a listing', async () => {
      mockPrismaService.listing.delete.mockResolvedValue(mockListing);

      await service.remove('1');

      expect(mockPrismaService.listing.delete).toHaveBeenCalled();
      expect(mockPrismaService.listing.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getStats', () => {
    it('should return listing statistics', async () => {
      mockPrismaService.listing.count.mockResolvedValue(100);

      const result = await service.getStats();

      expect(result.total).toBe(100);
    });
  });

  describe('findAll with search', () => {
    it('should search listings by query', async () => {
      mockPrismaService.listing.findMany.mockResolvedValue([mockListing]);
      mockPrismaService.listing.count.mockResolvedValue(1);

      const result = await service.findAll({
        search: 'Vake',
        page: 1,
        limit: 20,
      });

      expect(result.data).toEqual([mockListing]);
      expect(result.meta.total).toBe(1);

      expect(mockPrismaService.listing.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { district: expect.any(Object) },
              { address: expect.any(Object) },
              { description: expect.any(Object) },
            ]),
          }),
        })
      );
    });
  });

  describe('Geospatial Features', () => {
    describe('findByRadius', () => {
      const validLat = 41.7151;
      const validLng = 44.8271;
      const validRadius = 5;

      const mockListings = [
        {
          id: '1',
          telegramPostId: null,
          latitude: 41.7160,
          longitude: 44.8280,
          price: 1000,
          priceMin: null,
          priceMax: null,
          currency: 'GEL',
          district: 'Vake',
          address: 'Test Address 1',
          bedrooms: 2,
          areaSqm: 65,
          petsAllowed: true,
          furnished: true,
          amenities: [],
          description: null,
          contactInfo: null,
          sourceUrl: null,
          imageUrls: [],
          status: ListingStatus.ACTIVE,
          confidence: 0.9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          telegramPostId: null,
          latitude: 41.7140,
          longitude: 44.8260,
          price: 1200,
          priceMin: null,
          priceMax: null,
          currency: 'GEL',
          district: 'Saburtalo',
          address: 'Test Address 2',
          bedrooms: 3,
          areaSqm: 75,
          petsAllowed: false,
          furnished: false,
          amenities: [],
          description: null,
          contactInfo: null,
          sourceUrl: null,
          imageUrls: [],
          status: ListingStatus.ACTIVE,
          confidence: 0.9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      it('should find listings within radius', async () => {
        mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

        const result = await service.findByRadius(validLat, validLng, validRadius);

        expect(result.data).toBeDefined();
        expect(result.meta.centerLat).toBe(validLat);
        expect(result.meta.centerLng).toBe(validLng);
        expect(result.meta.radiusKm).toBe(validRadius);
        
        // Check that distances are calculated
        result.data.forEach((listing: any) => {
          expect(listing.distance).toBeDefined();
          expect(listing.distance).toBeGreaterThanOrEqual(0);
          expect(listing.distance).toBeLessThanOrEqual(validRadius);
        });
      });

      it('should reject invalid Tbilisi coordinates', async () => {
        const invalidLat = 40.0; // Outside Tbilisi
        
        await expect(
          service.findByRadius(invalidLat, validLng, validRadius)
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject invalid radius', async () => {
        const invalidRadius = 100; // > 50 km
        
        await expect(
          service.findByRadius(validLat, validLng, invalidRadius)
        ).rejects.toThrow(BadRequestException);
      });

      it('should apply additional filters', async () => {
        mockPrismaService.listing.findMany.mockResolvedValue(mockListings);

        await service.findByRadius(validLat, validLng, validRadius, {
          filters: {
            priceMin: 900,
            priceMax: 1500,
            bedrooms: 2,
          },
        });

        expect(mockPrismaService.listing.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              AND: expect.arrayContaining([
                expect.objectContaining({ latitude: expect.any(Object) }),
                expect.objectContaining({ longitude: expect.any(Object) }),
              ]),
            }),
          })
        );
      });
    });

    describe('findAll with radius search', () => {
      const mockListings = [
        {
          id: '1',
          telegramPostId: null,
          latitude: 41.7160,
          longitude: 44.8280,
          price: 1000,
          priceMin: null,
          priceMax: null,
          currency: 'GEL',
          district: 'Vake',
          address: 'Test Address 1',
          bedrooms: 2,
          areaSqm: 65,
          petsAllowed: true,
          furnished: true,
          amenities: [],
          description: null,
          contactInfo: null,
          sourceUrl: null,
          imageUrls: [],
          status: ListingStatus.ACTIVE,
          confidence: 0.9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      it('should use radius search when center and radius are provided', async () => {
        mockPrismaService.listing.findMany.mockResolvedValue(mockListings);
        mockPrismaService.listing.count.mockResolvedValue(1);

        const filters: FilterListingsDto = {
          centerLat: 41.7151,
          centerLng: 44.8271,
          radiusKm: 5,
          page: 1,
          limit: 20,
        };

        const result = await service.findAll(filters);

        expect(result.data).toBeDefined();
        expect(result.filters.centerLat).toBe(filters.centerLat);
        expect(result.filters.centerLng).toBe(filters.centerLng);
        expect(result.filters.radiusKm).toBe(filters.radiusKm);
        
        // Check that distances are added
        result.data.forEach((listing: any) => {
          expect(listing.distance).toBeDefined();
        });
      });

      it('should throw error for invalid center coordinates', async () => {
        const filters: FilterListingsDto = {
          centerLat: 40.0, // Outside Tbilisi
          centerLng: 44.8271,
          radiusKm: 5,
          page: 1,
          limit: 20,
        };

        await expect(service.findAll(filters)).rejects.toThrow(BadRequestException);
      });
    });
  });
});