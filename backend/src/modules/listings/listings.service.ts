import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { ClusterRequestDto } from './dto/cluster-request.dto';
import { ClusterResponseDto } from './dto/cluster-response.dto';
import { Prisma, Listing } from '@prisma/client';
import { calculateDistance, getBoundingBox, validateTbilisiCoordinates } from '../../utils/geospatial.utils';
import { ClusteringService } from './clustering.service';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);
  private readonly cachePrefix = 'listings';
  private readonly cacheTTL = 300; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private clusteringService: ClusteringService,
    private cacheService: CacheService,
  ) {}

  async create(createListingDto: CreateListingDto): Promise<Listing> {
    try {
      return await this.prisma.listing.create({
        data: createListingDto,
        include: {
          telegramPost: {
            select: {
              id: true,
              text: true,
              photos: true,
              channel: {
                select: {
                  title: true,
                  username: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async findAll(filters: FilterListingsDto) {
    const {
      search,
      district,
      priceMin,
      priceMax,
      currency,
      bedrooms,
      areaSqmMin,
      areaSqmMax,
      petsAllowed,
      furnished,
      amenities,
      status,
      swLat,
      swLng,
      neLat,
      neLng,
      centerLat,
      centerLng,
      radiusKm,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    // Generate cache key from filters
    const cacheKey = this.cacheService.generateKey(
      this.cachePrefix,
      'findAll',
      JSON.stringify(filters),
    );

    // Try to get from cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for listings with filters: ${JSON.stringify(filters)}`);
      return cached;
    }

    // Build where clause
    const where: Prisma.ListingWhereInput = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { district: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    if (currency) {
      where.currency = currency;
    }

    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    if (petsAllowed !== undefined) {
      where.petsAllowed = petsAllowed;
    }

    if (furnished !== undefined) {
      where.furnished = furnished;
    }

    if (status) {
      where.status = status;
    }

    // Price filtering
    if (priceMin !== undefined || priceMax !== undefined) {
      where.OR = [
        // Check exact price
        {
          AND: [
            priceMin !== undefined ? { price: { gte: priceMin } } : {},
            priceMax !== undefined ? { price: { lte: priceMax } } : {},
          ].filter(Boolean),
        },
        // Check price range
        {
          AND: [
            priceMin !== undefined ? { priceMax: { gte: priceMin } } : {},
            priceMax !== undefined ? { priceMin: { lte: priceMax } } : {},
          ].filter(Boolean),
        },
      ];
    }

    // Area filtering
    if (areaSqmMin !== undefined || areaSqmMax !== undefined) {
      where.areaSqm = {};
      if (areaSqmMin !== undefined) {
        where.areaSqm.gte = areaSqmMin;
      }
      if (areaSqmMax !== undefined) {
        where.areaSqm.lte = areaSqmMax;
      }
    }

    // Amenities filtering
    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasEvery: amenities,
      };
    }

    // Radius search takes precedence over map bounds
    if (centerLat !== undefined && centerLng !== undefined && radiusKm !== undefined) {
      // Validate center coordinates for Tbilisi
      if (!validateTbilisiCoordinates(centerLat, centerLng)) {
        throw new BadRequestException('Center coordinates must be within Tbilisi bounds');
      }
      
      // Get bounding box for initial filtering
      const bounds = getBoundingBox(centerLat, centerLng, radiusKm);
      
      where.AND = [
        { latitude: { gte: bounds.minLat, lte: bounds.maxLat } },
        { longitude: { gte: bounds.minLng, lte: bounds.maxLng } },
        { latitude: { not: null } },
        { longitude: { not: null } },
      ];
    } else if (swLat !== undefined && swLng !== undefined && neLat !== undefined && neLng !== undefined) {
      // Map bounds filtering (if no radius search)
      where.AND = [
        { latitude: { gte: swLat, lte: neLat } },
        { longitude: { gte: swLng, lte: neLng } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build order by
    const orderBy: Prisma.ListingOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    let [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: radiusKm ? undefined : skip, // Don't skip for radius search initially
        take: radiusKm ? undefined : limit, // Get all for radius search initially
        orderBy: radiusKm ? undefined : orderBy, // Sort manually for radius search
        include: {
          telegramPost: {
            select: {
              id: true,
              text: true,
              photos: true,
              channel: {
                select: {
                  title: true,
                  username: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    // If radius search, filter by exact distance and add distance to results
    if (centerLat !== undefined && centerLng !== undefined && radiusKm !== undefined) {
      // Calculate distance for each listing and filter
      const listingsWithDistance = listings
        .map(listing => {
          if (listing.latitude === null || listing.longitude === null) {
            return null;
          }
          
          const distance = calculateDistance(
            centerLat,
            centerLng,
            listing.latitude,
            listing.longitude,
          );
          
          if (distance <= radiusKm) {
            return { ...listing, distance };
          }
          
          return null;
        })
        .filter(listing => listing !== null);
      
      // Sort by distance if not using other sorting
      if (sortBy === 'createdAt' || sortBy === 'distance') {
        listingsWithDistance.sort((a, b) => a.distance - b.distance);
      } else {
        // Apply original sorting
        listingsWithDistance.sort((a, b) => {
          const aValue = a[sortBy];
          const bValue = b[sortBy];
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }
      
      // Update total count
      total = listingsWithDistance.length;
      
      // Apply pagination after filtering and sorting
      listings = listingsWithDistance.slice(skip, skip + limit);
    }

    const result = {
      data: listings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      filters: {
        search,
        district,
        priceMin,
        priceMax,
        currency,
        bedrooms,
        areaSqmMin,
        areaSqmMax,
        petsAllowed,
        furnished,
        amenities,
        status,
        centerLat,
        centerLng,
        radiusKm,
      },
    };

    // Cache the result
    await this.cacheService.set(cacheKey, result, { ttl: this.cacheTTL });
    this.logger.debug(`Cached listings result for filters: ${JSON.stringify(filters)}`);

    return result;
  }

  async findOne(id: string): Promise<Listing> {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        telegramPost: {
          select: {
            id: true,
            text: true,
            photos: true,
            createdAt: true,
            channel: {
              select: {
                title: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  async update(id: string, updateListingDto: UpdateListingDto): Promise<Listing> {
    try {
      return await this.prisma.listing.update({
        where: { id },
        data: updateListingDto,
        include: {
          telegramPost: {
            select: {
              id: true,
              text: true,
              photos: true,
              channel: {
                select: {
                  title: true,
                  username: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Listing with ID ${id} not found`);
        }
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.listing.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Listing with ID ${id} not found`);
        }
        throw new BadRequestException(`Database error: ${error.message}`);
      }
      throw error;
    }
  }

  async findByRadius(
    lat: number,
    lng: number,
    radiusKm: number,
    options?: {
      limit?: number;
      includeDistance?: boolean;
      filters?: Partial<FilterListingsDto>;
    },
  ) {
    // Validate coordinates
    if (!validateTbilisiCoordinates(lat, lng)) {
      throw new BadRequestException('Coordinates must be within Tbilisi bounds');
    }

    if (radiusKm < 0.1 || radiusKm > 50) {
      throw new BadRequestException('Radius must be between 0.1 and 50 kilometers');
    }

    const limit = options?.limit ?? 100;
    const includeDistance = options?.includeDistance ?? true;
    
    // Get bounding box for initial filtering
    const bounds = getBoundingBox(lat, lng, radiusKm);
    
    // Build where clause with additional filters if provided
    const where: Prisma.ListingWhereInput = {
      AND: [
        { latitude: { gte: bounds.minLat, lte: bounds.maxLat } },
        { longitude: { gte: bounds.minLng, lte: bounds.maxLng } },
        { latitude: { not: null } },
        { longitude: { not: null } },
        { status: 'ACTIVE' },
      ],
    };

    // Apply additional filters if provided
    if (options?.filters) {
      const { priceMin, priceMax, bedrooms, furnished, petsAllowed } = options.filters;
      
      if (priceMin !== undefined || priceMax !== undefined) {
        where.OR = [
          {
            AND: [
              priceMin !== undefined ? { price: { gte: priceMin } } : {},
              priceMax !== undefined ? { price: { lte: priceMax } } : {},
            ].filter(Boolean),
          },
        ];
      }
      
      if (bedrooms !== undefined) {
        where.bedrooms = bedrooms;
      }
      
      if (furnished !== undefined) {
        where.furnished = furnished;
      }
      
      if (petsAllowed !== undefined) {
        where.petsAllowed = petsAllowed;
      }
    }

    // Fetch listings within bounding box
    const listings = await this.prisma.listing.findMany({
      where,
      include: {
        telegramPost: {
          select: {
            id: true,
            text: true,
            photos: true,
            channel: {
              select: {
                title: true,
                username: true,
              },
            },
          },
        },
      },
    });

    // Filter by exact distance and calculate distances
    const listingsWithDistance = listings
      .map(listing => {
        if (listing.latitude === null || listing.longitude === null) {
          return null;
        }
        
        const distance = calculateDistance(lat, lng, listing.latitude, listing.longitude);
        
        if (distance <= radiusKm) {
          return includeDistance 
            ? { ...listing, distance }
            : listing;
        }
        
        return null;
      })
      .filter(listing => listing !== null)
      .sort((a, b) => {
        // Sort by distance if included
        if (includeDistance && 'distance' in a && 'distance' in b) {
          return a.distance - b.distance;
        }
        return 0;
      })
      .slice(0, limit);

    return {
      data: listingsWithDistance,
      meta: {
        total: listingsWithDistance.length,
        centerLat: lat,
        centerLng: lng,
        radiusKm,
      },
    };
  }

  async getMapListings(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom?: number;
  }) {
    const { north, south, east, west, zoom = 10 } = bounds;

    // For high zoom levels, return individual listings
    // For low zoom levels, return clusters
    const shouldCluster = zoom < 14;

    if (!shouldCluster) {
      // Return individual listings
      const listings = await this.prisma.listing.findMany({
        where: {
          AND: [
            { latitude: { gte: south, lte: north } },
            { longitude: { gte: west, lte: east } },
            { latitude: { not: null } },
            { longitude: { not: null } },
            { status: 'ACTIVE' },
          ],
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          price: true,
          priceMin: true,
          priceMax: true,
          currency: true,
          bedrooms: true,
          district: true,
          address: true,
        },
        take: 500, // Limit for performance
      });

      return listings.map(listing => ({
        id: listing.id,
        latitude: listing.latitude,
        longitude: listing.longitude,
        type: 'listing',
        data: listing,
      }));
    } else {
      // Return clusters - simplified clustering by rounding coordinates
      const precision = Math.max(1, Math.min(4, Math.floor(zoom / 3)));
      const factor = Math.pow(10, precision);

      const clusteredData = await this.prisma.$queryRaw<Array<{
        lat_cluster: number;
        lng_cluster: number;
        count: number;
        avg_price: number;
        min_price: number;
        max_price: number;
      }>>`
        SELECT 
          ROUND(CAST(latitude AS NUMERIC) * ${factor}) / ${factor} as lat_cluster,
          ROUND(CAST(longitude AS NUMERIC) * ${factor}) / ${factor} as lng_cluster,
          COUNT(*)::INTEGER as count,
          AVG(COALESCE(price, (price_min + price_max) / 2))::FLOAT as avg_price,
          MIN(COALESCE(price, price_min))::FLOAT as min_price,
          MAX(COALESCE(price, price_max))::FLOAT as max_price
        FROM listings 
        WHERE 
          latitude BETWEEN ${south} AND ${north}
          AND longitude BETWEEN ${west} AND ${east}
          AND latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND status = 'ACTIVE'
        GROUP BY lat_cluster, lng_cluster
        HAVING COUNT(*) > 0
        ORDER BY count DESC
        LIMIT 100
      `;

      return clusteredData.map(cluster => ({
        id: `cluster_${cluster.lat_cluster}_${cluster.lng_cluster}`,
        latitude: cluster.lat_cluster,
        longitude: cluster.lng_cluster,
        type: 'cluster',
        count: cluster.count,
        data: {
          avgPrice: cluster.avg_price,
          priceRange: {
            min: cluster.min_price,
            max: cluster.max_price,
          },
        },
      }));
    }
  }

  async getStats() {
    const total = await this.prisma.listing.count();
    
    // Simplified stats for now to avoid TypeScript issues
    return {
      total,
      byStatus: {},
      byDistrict: [],
      byBedrooms: [],
      priceStats: {
        _avg: { price: null, priceMin: null, priceMax: null },
        _min: { price: null, priceMin: null, priceMax: null },
        _max: { price: null, priceMin: null, priceMax: null },
      },
    };
  }

  /**
   * Get clustered listings for map view
   * Uses server-side clustering algorithm for better performance with large datasets
   */
  async getClusters(params: ClusterRequestDto): Promise<ClusterResponseDto> {
    const { zoom, north, south, east, west, priceMin, priceMax, bedrooms, district, furnished, petsAllowed } = params;

    // Build where clause for filtering
    const where: Prisma.ListingWhereInput = {
      AND: [
        { latitude: { gte: south, lte: north } },
        { longitude: { gte: west, lte: east } },
        { latitude: { not: null } },
        { longitude: { not: null } },
        { status: 'ACTIVE' },
      ],
    };

    // Apply filters
    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    if (bedrooms !== undefined) {
      where.bedrooms = bedrooms;
    }

    if (furnished !== undefined) {
      where.furnished = furnished;
    }

    if (petsAllowed !== undefined) {
      where.petsAllowed = petsAllowed;
    }

    // Price filtering
    if (priceMin !== undefined || priceMax !== undefined) {
      where.OR = [
        {
          AND: [
            priceMin !== undefined ? { price: { gte: priceMin } } : {},
            priceMax !== undefined ? { price: { lte: priceMax } } : {},
          ].filter(Boolean),
        },
        {
          AND: [
            priceMin !== undefined ? { priceMax: { gte: priceMin } } : {},
            priceMax !== undefined ? { priceMin: { lte: priceMax } } : {},
          ].filter(Boolean),
        },
      ];
    }

    // Fetch listings with applied filters
    const listings = await this.prisma.listing.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        price: true,
        priceMin: true,
        priceMax: true,
        currency: true,
        bedrooms: true,
        district: true,
        address: true,
        areaSqm: true,
        furnished: true,
        petsAllowed: true,
      },
    });

    // Perform clustering
    const results = this.clusteringService.clusterListings(listings as Listing[], {
      zoom,
      bounds: { north, south, east, west },
    });

    // Count clusters and points
    const clusterCount = results.filter(r => r.type === 'cluster').length;
    const pointCount = results.filter(r => r.type === 'point').length;

    return {
      results,
      total: results.length,
      zoom,
      bounds: { north, south, east, west },
      clusterCount,
      pointCount,
    };
  }
}