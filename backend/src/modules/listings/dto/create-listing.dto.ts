import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';

export class CreateListingDto {
  @ApiPropertyOptional({ description: 'Telegram post ID' })
  @IsOptional()
  @IsString()
  telegramPostId?: string;

  @ApiPropertyOptional({ description: 'District name' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Exact price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @ApiProperty({ description: 'Currency', default: 'GEL' })
  @IsString()
  currency: string = 'GEL';

  @ApiPropertyOptional({ description: 'Number of bedrooms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Area in square meters' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number;

  @ApiPropertyOptional({ description: 'Pets allowed' })
  @IsOptional()
  @IsBoolean()
  petsAllowed?: boolean;

  @ApiPropertyOptional({ description: 'Is furnished' })
  @IsOptional()
  @IsBoolean()
  furnished?: boolean;

  @ApiPropertyOptional({ description: 'Amenities list', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Property description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Listing status', enum: ListingStatus, default: ListingStatus.ACTIVE })
  @IsEnum(ListingStatus)
  status: ListingStatus = ListingStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'AI confidence score', minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}