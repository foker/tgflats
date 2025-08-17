import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class ClusterRequestDto {
  @ApiProperty({
    description: 'Map zoom level',
    minimum: 0,
    maximum: 20,
    example: 12,
  })
  @IsNumber()
  @Min(0)
  @Max(20)
  @Type(() => Number)
  zoom: number;

  @ApiProperty({
    description: 'North boundary latitude',
    example: 41.8,
  })
  @IsNumber()
  @Type(() => Number)
  north: number;

  @ApiProperty({
    description: 'South boundary latitude',
    example: 41.6,
  })
  @IsNumber()
  @Type(() => Number)
  south: number;

  @ApiProperty({
    description: 'East boundary longitude',
    example: 44.9,
  })
  @IsNumber()
  @Type(() => Number)
  east: number;

  @ApiProperty({
    description: 'West boundary longitude',
    example: 44.7,
  })
  @IsNumber()
  @Type(() => Number)
  west: number;

  @ApiProperty({
    description: 'Minimum price filter',
    required: false,
    example: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceMin?: number;

  @ApiProperty({
    description: 'Maximum price filter',
    required: false,
    example: 2000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  priceMax?: number;

  @ApiProperty({
    description: 'Number of bedrooms filter',
    required: false,
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  @Type(() => Number)
  bedrooms?: number;

  @ApiProperty({
    description: 'District filter',
    required: false,
    example: 'Saburtalo',
  })
  @IsOptional()
  district?: string;

  @ApiProperty({
    description: 'Furnished filter',
    required: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  furnished?: boolean;

  @ApiProperty({
    description: 'Pets allowed filter',
    required: false,
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  petsAllowed?: boolean;
}