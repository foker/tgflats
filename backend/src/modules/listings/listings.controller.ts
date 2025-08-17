import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ListingsService } from './listings.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { FilterListingsDto } from './dto/filter-listings.dto';
import { ClusterRequestDto } from './dto/cluster-request.dto';
import { ClusterResponseDto } from './dto/cluster-response.dto';
import { ListingEntity } from './entities/listing.entity';

@ApiTags('Listings')
@Controller('listings')
@UseGuards(ThrottlerGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
    type: ListingEntity,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createListingDto: CreateListingDto) {
    return this.listingsService.create(createListingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all listings with filters and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of listings with metadata',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  @ApiQuery({ name: 'district', required: false, description: 'District filter' })
  @ApiQuery({ name: 'priceMin', required: false, type: Number, description: 'Minimum price' })
  @ApiQuery({ name: 'priceMax', required: false, type: Number, description: 'Maximum price' })
  @ApiQuery({ name: 'currency', required: false, description: 'Currency filter' })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number, description: 'Number of bedrooms' })
  @ApiQuery({ name: 'areaSqmMin', required: false, type: Number, description: 'Minimum area' })
  @ApiQuery({ name: 'areaSqmMax', required: false, type: Number, description: 'Maximum area' })
  @ApiQuery({ name: 'petsAllowed', required: false, type: Boolean, description: 'Pets allowed' })
  @ApiQuery({ name: 'furnished', required: false, type: Boolean, description: 'Is furnished' })
  @ApiQuery({ name: 'amenities', required: false, type: [String], description: 'Required amenities' })
  @ApiQuery({ name: 'status', required: false, description: 'Listing status' })
  @ApiQuery({ name: 'swLat', required: false, type: Number, description: 'Southwest latitude' })
  @ApiQuery({ name: 'swLng', required: false, type: Number, description: 'Southwest longitude' })
  @ApiQuery({ name: 'neLat', required: false, type: Number, description: 'Northeast latitude' })
  @ApiQuery({ name: 'neLng', required: false, type: Number, description: 'Northeast longitude' })
  @ApiQuery({ name: 'centerLat', required: false, type: Number, description: 'Center latitude for radius search' })
  @ApiQuery({ name: 'centerLng', required: false, type: Number, description: 'Center longitude for radius search' })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Search radius in kilometers' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  findAll(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get listings statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics about listings',
  })
  getStats() {
    return this.listingsService.getStats();
  }

  @Get('search')
  @ApiOperation({ summary: 'Advanced search for listings' })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  search(@Query() filters: FilterListingsDto) {
    return this.listingsService.findAll(filters);
  }

  @Get('radius-search')
  @ApiOperation({ summary: 'Search listings within a radius from a center point' })
  @ApiResponse({
    status: 200,
    description: 'Listings within the specified radius',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, description: 'Center latitude (41.6-41.8 for Tbilisi)' })
  @ApiQuery({ name: 'lng', required: true, type: Number, description: 'Center longitude (44.7-44.9 for Tbilisi)' })
  @ApiQuery({ name: 'radius', required: true, type: Number, description: 'Search radius in kilometers (0.1-50)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results' })
  @ApiQuery({ name: 'priceMin', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'priceMax', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number, description: 'Number of bedrooms filter' })
  @ApiQuery({ name: 'furnished', required: false, type: Boolean, description: 'Furnished filter' })
  @ApiQuery({ name: 'petsAllowed', required: false, type: Boolean, description: 'Pets allowed filter' })
  radiusSearch(@Query() query: {
    lat: number;
    lng: number;
    radius: number;
    limit?: number;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    furnished?: boolean;
    petsAllowed?: boolean;
  }) {
    const { lat, lng, radius, limit, ...filters } = query;
    return this.listingsService.findByRadius(
      Number(lat), 
      Number(lng), 
      Number(radius), 
      {
        limit: limit ? Number(limit) : undefined,
        includeDistance: true,
        filters,
      }
    );
  }

  @Get('map')
  @ApiOperation({ summary: 'Get listings for map view with clustering' })
  @ApiResponse({
    status: 200,
    description: 'Map listings with clusters',
  })
  @ApiQuery({ name: 'north', required: true, type: Number, description: 'North boundary' })
  @ApiQuery({ name: 'south', required: true, type: Number, description: 'South boundary' })
  @ApiQuery({ name: 'east', required: true, type: Number, description: 'East boundary' })
  @ApiQuery({ name: 'west', required: true, type: Number, description: 'West boundary' })
  @ApiQuery({ name: 'zoom', required: false, type: Number, description: 'Map zoom level' })
  getMapListings(@Query() query: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom?: number;
  }) {
    return this.listingsService.getMapListings(query);
  }

  @Get('clusters')
  @ApiOperation({ summary: 'Get clustered listings using advanced server-side clustering algorithm' })
  @ApiResponse({
    status: 200,
    description: 'Clustered listings with metadata',
    type: ClusterResponseDto,
  })
  @ApiQuery({ name: 'zoom', required: true, type: Number, description: 'Map zoom level (0-20)' })
  @ApiQuery({ name: 'north', required: true, type: Number, description: 'North boundary latitude' })
  @ApiQuery({ name: 'south', required: true, type: Number, description: 'South boundary latitude' })
  @ApiQuery({ name: 'east', required: true, type: Number, description: 'East boundary longitude' })
  @ApiQuery({ name: 'west', required: true, type: Number, description: 'West boundary longitude' })
  @ApiQuery({ name: 'priceMin', required: false, type: Number, description: 'Minimum price filter' })
  @ApiQuery({ name: 'priceMax', required: false, type: Number, description: 'Maximum price filter' })
  @ApiQuery({ name: 'bedrooms', required: false, type: Number, description: 'Number of bedrooms' })
  @ApiQuery({ name: 'district', required: false, description: 'District filter' })
  @ApiQuery({ name: 'furnished', required: false, type: Boolean, description: 'Furnished filter' })
  @ApiQuery({ name: 'petsAllowed', required: false, type: Boolean, description: 'Pets allowed filter' })
  getClusters(@Query() params: ClusterRequestDto) {
    return this.listingsService.getClusters(params);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific listing by ID' })
  @ApiResponse({
    status: 200,
    description: 'Listing details',
    type: ListingEntity,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  @ApiResponse({
    status: 200,
    description: 'Listing updated successfully',
    type: ListingEntity,
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  update(@Param('id') id: string, @Body() updateListingDto: UpdateListingDto) {
    return this.listingsService.update(id, updateListingDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiResponse({ status: 204, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  remove(@Param('id') id: string) {
    return this.listingsService.remove(id);
  }
}