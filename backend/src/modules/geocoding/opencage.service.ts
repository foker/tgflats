import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as opencage from 'opencage-api-client'
import { PrismaService } from '../prisma/prisma.service'
import { GeocodeResult } from './geocoding.service'

@Injectable()
export class OpenCageService {
  private readonly logger = new Logger(OpenCageService.name)
  private apiKey: string | null = null
  
  // Tbilisi bounding box
  private readonly tbilisiBounds = {
    north: 41.8,
    south: 41.6,
    east: 44.9,
    west: 44.7
  }
  
  // District mapping based on coordinates
  private readonly districtBoundaries = {
    'Vake': { center: { lat: 41.724, lng: 44.768 }, radius: 0.02 },
    'Saburtalo': { center: { lat: 41.715, lng: 44.795 }, radius: 0.025 },
    'Old Tbilisi': { center: { lat: 41.695, lng: 44.808 }, radius: 0.015 },
    'Gldani': { center: { lat: 41.715, lng: 44.835 }, radius: 0.03 },
    'Isani': { center: { lat: 41.675, lng: 44.825 }, radius: 0.025 },
    'Didube': { center: { lat: 41.735, lng: 44.785 }, radius: 0.02 },
    'Nadzaladevi': { center: { lat: 41.735, lng: 44.765 }, radius: 0.02 },
    'Mtatsminda': { center: { lat: 41.685, lng: 44.795 }, radius: 0.015 },
    'Krtsanisi': { center: { lat: 41.655, lng: 44.815 }, radius: 0.02 },
    'Samgori': { center: { lat: 41.695, lng: 44.845 }, radius: 0.025 },
  }

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('OPENCAGE_API_KEY') || null
    
    if (this.apiKey) {
      this.logger.log('OpenCage geocoding service initialized')
    } else {
      this.logger.warn('OpenCage API key not provided, will use fallback geocoding')
    }
  }

  /**
   * Geocode an address using OpenCage
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address || address.trim().length === 0) {
      return null
    }

    // Check cache first
    const cached = await this.getCachedGeocode(address)
    if (cached) {
      this.logger.debug(`Using cached geocode for: ${address}`)
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        formattedAddress: cached.formattedAddress || address,
        isInTbilisi: this.isInTbilisi(cached.latitude, cached.longitude),
        confidence: cached.confidence || 0.9,
        district: cached.district || this.detectDistrict(cached.latitude, cached.longitude),
      }
    }

    if (!this.apiKey) {
      this.logger.warn('Using mock geocoding for address: ' + address)
      return this.generateMockGeocode(address)
    }

    try {
      // Enhance address with Tbilisi context if not present
      let searchAddress = address
      if (!address.toLowerCase().includes('tbilisi') && !address.toLowerCase().includes('თბილისი')) {
        searchAddress = `${address}, Tbilisi, Georgia`
      }

      const response = await opencage.geocode({
        q: searchAddress,
        key: this.apiKey,
        language: 'en',
        limit: 1,
        countrycode: 'ge',
        bounds: `${this.tbilisiBounds.west},${this.tbilisiBounds.south},${this.tbilisiBounds.east},${this.tbilisiBounds.north}`,
      })

      if (response.results.length === 0) {
        this.logger.warn(`No geocoding results for: ${address}`)
        return null
      }

      const result = response.results[0]
      const { lat, lng } = result.geometry
      const formattedAddress = result.formatted

      const geocodeResult: GeocodeResult = {
        latitude: lat,
        longitude: lng,
        formattedAddress,
        isInTbilisi: this.isInTbilisi(lat, lng),
        confidence: this.calculateConfidence(result),
        district: this.detectDistrict(lat, lng),
      }

      // Cache the result
      await this.cacheGeocode(address, geocodeResult)
      
      this.logger.debug(`Geocoded address: ${address} -> ${formattedAddress}`)
      return geocodeResult
    } catch (error) {
      this.logger.error(`OpenCage geocoding failed for ${address}: ${error.message}`)
      return this.generateMockGeocode(address)
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async batchGeocode(addresses: string[]): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = []
    
    for (const address of addresses) {
      try {
        const result = await this.geocodeAddress(address)
        results.push(result)
        
        // Add small delay to respect rate limits
        if (this.apiKey) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      } catch (error) {
        this.logger.error(`Batch geocoding failed for address: ${error.message}`)
        results.push(null)
      }
    }
    
    return results
  }

  /**
   * Check if coordinates are within Tbilisi bounds
   */
  private isInTbilisi(lat: number, lng: number): boolean {
    return (
      lat >= this.tbilisiBounds.south &&
      lat <= this.tbilisiBounds.north &&
      lng >= this.tbilisiBounds.west &&
      lng <= this.tbilisiBounds.east
    )
  }

  /**
   * Detect district based on coordinates
   */
  private detectDistrict(lat: number, lng: number): string | undefined {
    if (!this.isInTbilisi(lat, lng)) {
      return undefined
    }

    // Find closest district based on distance to district centers
    let closestDistrict: string | undefined
    let minDistance = Infinity

    for (const [district, bounds] of Object.entries(this.districtBoundaries)) {
      const distance = this.calculateDistance(
        lat, lng,
        bounds.center.lat, bounds.center.lng
      )
      
      if (distance < bounds.radius && distance < minDistance) {
        minDistance = distance
        closestDistrict = district
      }
    }

    return closestDistrict || 'Other'
  }

  /**
   * Calculate distance between two points (simplified)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const latDiff = lat2 - lat1
    const lngDiff = lng2 - lng1
    return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff)
  }

  /**
   * Calculate confidence score for geocoding result
   */
  private calculateConfidence(result: any): number {
    let confidence = 0.5

    // Check confidence from OpenCage
    if (result.confidence) {
      // OpenCage confidence is 1-10, normalize to 0-1
      confidence = result.confidence / 10
    }

    // Boost confidence if result is in Tbilisi
    if (result.components?.city === 'Tbilisi' || 
        result.components?.town === 'Tbilisi' ||
        result.formatted?.includes('Tbilisi')) {
      confidence += 0.2
    }

    // Boost if we have street-level accuracy
    if (result.components?.road || result.components?.house_number) {
      confidence += 0.1
    }

    // Check bounds
    const { lat, lng } = result.geometry
    if (this.isInTbilisi(lat, lng)) {
      confidence += 0.1
    }

    return Math.min(1, confidence)
  }

  /**
   * Get cached geocode result
   */
  private async getCachedGeocode(address: string) {
    try {
      const normalized = address.toLowerCase().trim()
      const cached = await this.prisma.geocodingCache.findUnique({
        where: { address: normalized }
      })
      
      if (cached) {
        // Update last used timestamp
        await this.prisma.geocodingCache.update({
          where: { id: cached.id },
          data: { lastUsedAt: new Date() }
        })
      }
      
      return cached
    } catch (error) {
      this.logger.error(`Failed to get cached geocode: ${error.message}`)
      return null
    }
  }

  /**
   * Cache geocode result
   */
  private async cacheGeocode(address: string, result: GeocodeResult) {
    try {
      const normalized = address.toLowerCase().trim()
      
      await this.prisma.geocodingCache.upsert({
        where: { address: normalized },
        create: {
          address: normalized,
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          district: result.district,
          confidence: result.confidence,
          lastUsedAt: new Date(),
        },
        update: {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          district: result.district,
          confidence: result.confidence,
          lastUsedAt: new Date(),
        }
      })
    } catch (error) {
      this.logger.error(`Failed to cache geocode: ${error.message}`)
    }
  }

  /**
   * Generate mock geocode for testing
   */
  private generateMockGeocode(address: string): GeocodeResult {
    const lowerAddress = address.toLowerCase()
    
    // Try to detect district from address
    let district = 'Other'
    let coordinates = { lat: 41.7151, lng: 44.8271 } // Default Tbilisi center
    
    for (const [districtName, bounds] of Object.entries(this.districtBoundaries)) {
      if (lowerAddress.includes(districtName.toLowerCase())) {
        district = districtName
        coordinates = bounds.center
        break
      }
    }
    
    // Add some randomness to avoid identical coordinates
    coordinates.lat += (Math.random() - 0.5) * 0.01
    coordinates.lng += (Math.random() - 0.5) * 0.01
    
    return {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      formattedAddress: `${address}, Tbilisi, Georgia`,
      isInTbilisi: true,
      confidence: 0.7,
      district,
    }
  }

  /**
   * Clean up old cache entries
   */
  async cleanupCache(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const result = await this.prisma.geocodingCache.deleteMany({
        where: {
          lastUsedAt: {
            lt: cutoffDate
          }
        }
      })
      
      this.logger.log(`Cleaned up ${result.count} old geocoding cache entries`)
      return result.count
    } catch (error) {
      this.logger.error(`Failed to cleanup geocoding cache: ${error.message}`)
      return 0
    }
  }
}