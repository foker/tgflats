import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { GeocodingService } from './geocoding.service'

@ApiTags('geocoding')
@Controller('geocoding')
export class GeocodingController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Post('geocode')
  @ApiOperation({ summary: 'Geocode an address to coordinates' })
  @ApiResponse({ status: 200, description: 'Geocoding result' })
  async geocodeAddress(@Body() body: { address: string }) {
    return this.geocodingService.geocodeAddress(body.address)
  }

  @Post('reverse-geocode')
  @ApiOperation({ summary: 'Reverse geocode coordinates to address' })
  @ApiResponse({ status: 200, description: 'Reverse geocoding result' })
  async reverseGeocode(@Body() body: { latitude: number; longitude: number }) {
    return this.geocodingService.reverseGeocode(body.latitude, body.longitude)
  }

  @Post('batch-geocode')
  @ApiOperation({ summary: 'Geocode multiple addresses in batch' })
  @ApiResponse({ status: 200, description: 'Batch geocoding results' })
  async batchGeocode(@Body() body: { addresses: string[] }) {
    return this.geocodingService.batchGeocode(body.addresses)
  }
}