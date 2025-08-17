import { IsOptional, IsString, IsNumber, IsBoolean, IsEnum, Min, Max, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ListingStatus } from '@prisma/client';

export class FilterListingsDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'District filter' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Currency filter' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Number of bedrooms' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Minimum area in sqm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaSqmMin?: number;

  @ApiPropertyOptional({ description: 'Maximum area in sqm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  areaSqmMax?: number;

  @ApiPropertyOptional({ description: 'Pets allowed filter' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ description: 'Furnished filter' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({ description: 'Amenities filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Status filter', enum: ListingStatus })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({ description: 'Southwest latitude for map bounds' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  swLat?: number;

  @ApiPropertyOptional({ description: 'Southwest longitude for map bounds' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  swLng?: number;

  @ApiPropertyOptional({ description: 'Northeast latitude for map bounds' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  neLat?: number;

  @ApiPropertyOptional({ description: 'Northeast longitude for map bounds' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  neLng?: number;

  @ApiPropertyOptional({ description: 'Center latitude for radius search (Tbilisi: 41.6-41.8)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(41.6)
  @Max(41.8)
  centerLat?: number;

  @ApiPropertyOptional({ description: 'Center longitude for radius search (Tbilisi: 44.7-44.9)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(44.7)
  @Max(44.9)
  centerLng?: number;

  @ApiPropertyOptional({ description: 'Search radius in kilometers', minimum: 0.1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radiusKm?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}