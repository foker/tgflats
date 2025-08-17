import { IsOptional, IsNumber, IsString, Min, Max, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LocationFilter {
  @ApiPropertyOptional({ description: 'Latitude for radius search' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for radius search' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Radius in kilometers', minimum: 0.1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radiusKm?: number;
}

export class SubscriptionDto {
  @ApiPropertyOptional({ description: 'Subscription ID for tracking' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'Filter by district name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Minimum price filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price filter' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Currency filter' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum number of bedrooms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bedroomsMin?: number;

  @ApiPropertyOptional({ description: 'Maximum number of bedrooms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  bedroomsMax?: number;

  @ApiPropertyOptional({ description: 'Location-based filter' })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationFilter)
  location?: LocationFilter;

  @ApiPropertyOptional({ description: 'Filter for furnished properties' })
  @IsOptional()
  furnished?: boolean;

  @ApiPropertyOptional({ description: 'Filter for pet-friendly properties' })
  @IsOptional()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ description: 'Required amenities', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}