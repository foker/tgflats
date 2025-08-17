import { ApiProperty } from '@nestjs/swagger';

export class ClusterBoundsDto {
  @ApiProperty({ description: 'North boundary' })
  north: number;

  @ApiProperty({ description: 'South boundary' })
  south: number;

  @ApiProperty({ description: 'East boundary' })
  east: number;

  @ApiProperty({ description: 'West boundary' })
  west: number;
}

export class PriceRangeDto {
  @ApiProperty({ description: 'Minimum price' })
  min: number;

  @ApiProperty({ description: 'Maximum price' })
  max: number;
}

export class ClusterDataDto {
  @ApiProperty({ description: 'Average price', required: false })
  avgPrice?: number | null;

  @ApiProperty({ description: 'Price range', required: false, type: PriceRangeDto })
  priceRange?: PriceRangeDto | null;

  @ApiProperty({ description: 'List of districts', required: false, type: [String] })
  districts?: string[];

  @ApiProperty({ description: 'Bedroom statistics', required: false })
  bedroomStats?: Record<string, number>;

  @ApiProperty({ description: 'Number of merged clusters', required: false })
  mergedFrom?: number;
}

export class PointDataDto {
  @ApiProperty({ description: 'Price', required: false })
  price?: number | null;

  @ApiProperty({ description: 'Minimum price', required: false })
  priceMin?: number | null;

  @ApiProperty({ description: 'Maximum price', required: false })
  priceMax?: number | null;

  @ApiProperty({ description: 'Currency' })
  currency: string;

  @ApiProperty({ description: 'Number of bedrooms', required: false })
  bedrooms?: number | null;

  @ApiProperty({ description: 'District', required: false })
  district?: string | null;

  @ApiProperty({ description: 'Address', required: false })
  address?: string | null;

  @ApiProperty({ description: 'Area in square meters', required: false })
  areaSqm?: number | null;

  @ApiProperty({ description: 'Is furnished', required: false })
  furnished?: boolean | null;

  @ApiProperty({ description: 'Pets allowed', required: false })
  petsAllowed?: boolean | null;
}

export class ClusterDto {
  @ApiProperty({ description: 'Cluster ID' })
  id: string;

  @ApiProperty({ description: 'Type', enum: ['cluster'] })
  type: 'cluster';

  @ApiProperty({ description: 'Cluster center latitude' })
  latitude: number;

  @ApiProperty({ description: 'Cluster center longitude' })
  longitude: number;

  @ApiProperty({ description: 'Number of points in cluster' })
  count: number;

  @ApiProperty({ description: 'Cluster bounds', type: ClusterBoundsDto })
  bounds: ClusterBoundsDto;

  @ApiProperty({ description: 'Cluster data', type: ClusterDataDto, required: false })
  data?: ClusterDataDto;
}

export class IndividualPointDto {
  @ApiProperty({ description: 'Point ID' })
  id: string;

  @ApiProperty({ description: 'Type', enum: ['point'] })
  type: 'point';

  @ApiProperty({ description: 'Point latitude' })
  latitude: number;

  @ApiProperty({ description: 'Point longitude' })
  longitude: number;

  @ApiProperty({ description: 'Point data', type: PointDataDto })
  data: PointDataDto;
}

export class ClusterResponseDto {
  @ApiProperty({
    description: 'Array of clusters and individual points',
    type: [Object],
  })
  results: (ClusterDto | IndividualPointDto)[];

  @ApiProperty({ description: 'Total number of results' })
  total: number;

  @ApiProperty({ description: 'Applied zoom level' })
  zoom: number;

  @ApiProperty({ description: 'Applied bounds', type: ClusterBoundsDto })
  bounds: ClusterBoundsDto;

  @ApiProperty({ description: 'Number of clusters' })
  clusterCount: number;

  @ApiProperty({ description: 'Number of individual points' })
  pointCount: number;
}