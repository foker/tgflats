import { Test, TestingModule } from '@nestjs/testing';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { CreateListingDto, UpdateListingDto, ListingQueryDto } from './dto';
import { ListingStatus } from '@prisma/client';

describe('ListingsController', () => {
  let controller: ListingsController;
  let service: ListingsService;

  const mockListingsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
    search: jest.fn(),
    getMapData: jest.fn(),
  };

  const mockListing = {
    id: '1',
    district: 'Vake',
    address: 'Test Street',
    price: 800,
    bedrooms: 2,
    areaSqm: 75,
    petsAllowed: true,
    furnished: true,
    status: ListingStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [
        {
          provide: ListingsService,
          useValue: mockListingsService,
        },
      ],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
    service = module.get<ListingsService>(ListingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new listing', async () => {
      const createDto: CreateListingDto = {
        district: 'Vake',
        price: 800,
        bedrooms: 2,
      };

      mockListingsService.create.mockResolvedValue(mockListing);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockListing);
      expect(mockListingsService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated listings', async () => {
      const query: ListingQueryDto = {
        page: 1,
        limit: 20,
      };

      const expectedResult = {
        data: [mockListing],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockListingsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(expectedResult);
      expect(mockListingsService.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle filters', async () => {
      const query: ListingQueryDto = {
        page: 1,
        limit: 20,
        district: 'Vake',
        minPrice: 500,
        maxPrice: 1000,
        bedrooms: 2,
      };

      const expectedResult = {
        data: [mockListing],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockListingsService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(result).toEqual(expectedResult);
      expect(mockListingsService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('getStats', () => {
    it('should return listing statistics', async () => {
      const mockStats = {
        totalListings: 100,
        activeListings: 90,
        averagePrice: 750,
        listingsByDistrict: {
          Vake: 30,
          Saburtalo: 25,
          Vera: 20,
        },
        priceRange: {
          min: 300,
          max: 2000,
        },
      };

      mockListingsService.getStats.mockResolvedValue(mockStats);

      const result = await controller.getStats();

      expect(result).toEqual(mockStats);
      expect(mockListingsService.getStats).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search listings', async () => {
      const query = { query: 'Vake apartment' };
      const expectedResult = {
        data: [mockListing],
        total: 1,
        page: 1,
        limit: 20,
      };

      mockListingsService.search.mockResolvedValue(expectedResult);

      const result = await controller.search(query);

      expect(result).toEqual(expectedResult);
      expect(mockListingsService.search).toHaveBeenCalledWith(query);
    });
  });

  describe('getMapData', () => {
    it('should return map data', async () => {
      const mockMapData = [
        {
          id: '1',
          latitude: 41.7151,
          longitude: 44.8271,
          price: 800,
          district: 'Vake',
        },
      ];

      mockListingsService.getMapData.mockResolvedValue(mockMapData);

      const result = await controller.getMapData();

      expect(result).toEqual(mockMapData);
      expect(mockListingsService.getMapData).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single listing', async () => {
      mockListingsService.findOne.mockResolvedValue(mockListing);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockListing);
      expect(mockListingsService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a listing', async () => {
      const updateDto: UpdateListingDto = {
        price: 900,
      };

      const updatedListing = { ...mockListing, price: 900 };
      mockListingsService.update.mockResolvedValue(updatedListing);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(updatedListing);
      expect(mockListingsService.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('remove', () => {
    it('should delete a listing', async () => {
      mockListingsService.remove.mockResolvedValue(mockListing);

      const result = await controller.remove('1');

      expect(result).toEqual(mockListing);
      expect(mockListingsService.remove).toHaveBeenCalledWith('1');
    });
  });
});