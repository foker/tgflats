import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus } from '@prisma/client';

export class ListingEntity {
  @ApiProperty({ description: 'Unique listing ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Associated telegram post ID' })
  telegramPostId?: string;

  @ApiPropertyOptional({ description: 'District name' })
  district?: string;

  @ApiPropertyOptional({ description: 'Full address' })
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  longitude?: number;

  @ApiPropertyOptional({ description: 'Exact price' })
  price?: number;

  @ApiPropertyOptional({ description: 'Minimum price' })
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  priceMax?: number;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiPropertyOptional({ description: 'Number of bedrooms' })
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Area in square meters' })
  areaSqm?: number;

  @ApiPropertyOptional({ description: 'Pets allowed' })
  petsAllowed?: boolean;

  @ApiPropertyOptional({ description: 'Is furnished' })
  furnished?: boolean;

  @ApiProperty({ description: 'Amenities list', type: [String] })
  amenities: string[];

  @ApiPropertyOptional({ description: 'Property description' })
  description?: string;

  @ApiProperty({ description: 'Listing status', enum: ListingStatus })
  status: ListingStatus;

  @ApiPropertyOptional({ description: 'AI confidence score' })
  confidence?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Associated telegram post data' })
  telegramPost?: {
    id: string;
    channelName: string;
    text?: string;
    photos: string[];
  };
}