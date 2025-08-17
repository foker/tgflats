import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Client } from '@googlemaps/google-maps-services-js'
import { PrismaService } from '../prisma/prisma.service'
import axios from 'axios'

export interface GeocodeResult {
  latitude: number
  longitude: number
  formattedAddress: string
  district?: string
  isInTbilisi: boolean
  confidence: number
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name)
  private googleMapsClient: Client
  private opencageApiKey: string | null = null
  private lastGoogleApiCall = 0
  private lastOpencageApiCall = 0
  private readonly RATE_LIMIT_MS = 100 // 10 requests per second max
  private readonly tbilisiBounds = {
    north: 41.8,
    south: 41.6,
    east: 44.9,
    west: 44.7
  }

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.googleMapsClient = new Client({})
    this.opencageApiKey = this.configService.get<string>('OPENCAGE_API_KEY')
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!address || address.trim().length === 0) {
      return null
    }

    // First check cache
    const cached = await this.getCachedGeocode(address)
    if (cached) {
      return {
        latitude: cached.latitude,
        longitude: cached.longitude,
        formattedAddress: cached.formattedAddress || address,
        isInTbilisi: this.isInTbilisi(cached.latitude, cached.longitude),
        confidence: cached.confidence || 0.9,
        district: cached.district || this.getDistrict(cached.latitude, cached.longitude),
      }
    }

    const googleApiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')
    
    // Try Google Maps first if API key is available
    if (googleApiKey) {
      try {
        // Rate limiting
        await this.enforceRateLimit('google')
        
        // Add "Tbilisi, Georgia" to improve accuracy
        const searchAddress = address.includes('Tbilisi') ? address : `${address}, Tbilisi, Georgia`
        
        const response = await this.googleMapsClient.geocode({
          params: {
            address: searchAddress,
            key: googleApiKey,
            region: 'ge', // Georgia country code
            bounds: {
              northeast: { lat: this.tbilisiBounds.north, lng: this.tbilisiBounds.east },
              southwest: { lat: this.tbilisiBounds.south, lng: this.tbilisiBounds.west },
            }
          }
        })

        if (response.data.results.length > 0) {
          const result = response.data.results[0]
          const location = result.geometry.location
          const formattedAddress = result.formatted_address

          const geocodeResult: GeocodeResult = {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress,
            isInTbilisi: this.isInTbilisi(location.lat, location.lng),
            confidence: this.calculateConfidence(result),
            district: this.getDistrict(location.lat, location.lng),
          }

          // Cache the result
          await this.cacheGeocode(address, geocodeResult)
          return geocodeResult
        }
      } catch (error) {
        this.logger.error(`Google Maps geocoding failed for address ${address}: ${error.message}`)
      }
    }

    // Fall back to OpenCage if available
    if (this.opencageApiKey) {
      try {
        return await this.geocodeWithOpencage(address)
      } catch (error) {
        this.logger.error(`OpenCage geocoding failed for address ${address}: ${error.message}`)
      }
    }

    // If no API keys available, use mock geocoding
    this.logger.warn('No geocoding API keys provided, using mock geocoding')
    return this.generateMockGeocode(address)
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      return this.generateMockAddress(latitude, longitude)
    }

    try {
      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: { lat: latitude, lng: longitude },
          key: apiKey,
        }
      })

      if (response.data.results.length === 0) {
        return null
      }

      return response.data.results[0].formatted_address
    } catch (error) {
      this.logger.error(`Reverse geocoding failed: ${error.message}`)
      return null
    }
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
   * Get district based on coordinates (simplified)
   */
  private getDistrict(lat: number, lng: number): string | undefined {
    // This is a simplified district detection
    // In production, you would have more precise district boundaries
    
    if (!this.isInTbilisi(lat, lng)) {
      return undefined
    }

    // Simple district mapping based on rough coordinates
    if (lat > 41.72 && lng < 44.78) return 'Vake'
    if (lat > 41.71 && lng > 44.78 && lng < 44.82) return 'Saburtalo'
    if (lat < 41.70 && lng < 44.82) return 'Old Tbilisi'
    if (lat > 41.70 && lng > 44.82) return 'Gldani'
    if (lat < 41.68) return 'Isani'
    
    return 'Other'
  }

  /**
   * Calculate confidence score for geocoding result
   */
  private calculateConfidence(result: any): number {
    let confidence = 0.5

    // Check if result contains street number
    if (result.formatted_address.match(/\d+/)) {
      confidence += 0.3
    }

    // Check location type
    if (result.geometry.location_type === 'ROOFTOP') {
      confidence += 0.2
    } else if (result.geometry.location_type === 'RANGE_INTERPOLATED') {
      confidence += 0.1
    }

    // Check if it's in Tbilisi
    if (result.formatted_address.toLowerCase().includes('tbilisi')) {
      confidence += 0.2
    }

    return Math.min(1, confidence)
  }

  /**
   * Get cached geocode result
   */
  private async getCachedGeocode(address: string) {
    try {
      const cached = await this.prisma.geocodingCache.findUnique({
        where: { address: address.toLowerCase().trim() }
      })
      
      if (cached) {
        // Update lastUsedAt timestamp
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
      await this.prisma.geocodingCache.upsert({
        where: { address: address.toLowerCase().trim() },
        create: {
          address: address.toLowerCase().trim(),
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
    // Mock coordinates within Tbilisi bounds
    const mockDistricts = {
      'vake': { lat: 41.724, lng: 44.768 },
      'saburtalo': { lat: 41.715, lng: 44.795 },
      'old tbilisi': { lat: 41.695, lng: 44.808 },
      'gldani': { lat: 41.715, lng: 44.835 },
      'isani': { lat: 41.675, lng: 44.825 },
    }

    // Try to match district from address
    const lowerAddress = address.toLowerCase()
    let coordinates = { lat: 41.7151, lng: 44.8271 } // Default Tbilisi center

    for (const [district, coords] of Object.entries(mockDistricts)) {
      if (lowerAddress.includes(district)) {
        coordinates = coords
        break
      }
    }

    // Add some randomness
    coordinates.lat += (Math.random() - 0.5) * 0.02
    coordinates.lng += (Math.random() - 0.5) * 0.02

    return {
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      formattedAddress: `${address}, Tbilisi, Georgia`,
      isInTbilisi: true,
      confidence: 0.7,
      district: this.getDistrict(coordinates.lat, coordinates.lng),
    }
  }

  /**
   * Generate mock address for reverse geocoding
   */
  private generateMockAddress(lat: number, lng: number): string {
    const district = this.getDistrict(lat, lng)
    const streetNumber = Math.floor(Math.random() * 100) + 1
    return `${streetNumber} ${district} Street, Tbilisi, Georgia`
  }

  /**
   * Geocode using OpenCage API
   */
  private async geocodeWithOpencage(address: string): Promise<GeocodeResult | null> {
    try {
      // Rate limiting
      await this.enforceRateLimit('opencage')
      
      // Add context for better results
      const searchAddress = address.includes('Tbilisi') ? address : `${address}, Tbilisi, Georgia`
      
      const response = await axios.get<{
        results: Array<{
          geometry: { lat: number; lng: number }
          formatted: string
          confidence: number
          components: any
        }>
      }>('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: searchAddress,
          key: this.opencageApiKey,
          countrycode: 'ge',
          bounds: `${this.tbilisiBounds.west},${this.tbilisiBounds.south},${this.tbilisiBounds.east},${this.tbilisiBounds.north}`,
          limit: 1,
          language: 'en',
        }
      })

      if (response.data.results && response.data.results.length > 0) {
        const result = response.data.results[0]
        const { lat, lng } = result.geometry
        
        const geocodeResult: GeocodeResult = {
          latitude: lat,
          longitude: lng,
          formattedAddress: result.formatted || `${address}, Tbilisi, Georgia`,
          isInTbilisi: this.isInTbilisi(lat, lng),
          confidence: result.confidence ? result.confidence / 10 : 0.7, // OpenCage confidence is 0-10
          district: this.getDistrict(lat, lng) || this.extractDistrictFromComponents(result.components),
        }

        // Cache the result
        await this.cacheGeocode(address, geocodeResult)
        return geocodeResult
      }

      return null
    } catch (error) {
      this.logger.error(`OpenCage geocoding error: ${error.message}`)
      throw error
    }
  }

  /**
   * Extract district from OpenCage components
   */
  private extractDistrictFromComponents(components: any): string | undefined {
    // Try to extract district from various component fields
    const districtFields = ['suburb', 'neighbourhood', 'district', 'quarter']
    
    for (const field of districtFields) {
      if (components[field]) {
        // Map common Georgian district names to English
        const districtMap = {
          'ვაკე': 'Vake',
          'საბურთალო': 'Saburtalo',
          'ძველი თბილისი': 'Old Tbilisi',
          'გლდანი': 'Gldani',
          'ისანი': 'Isani',
          'დიდუბე': 'Didube',
          'ნაძალადევი': 'Nadzaladevi',
          'მთაწმინდა': 'Mtatsminda',
          'კრწანისი': 'Krtsanisi',
          'სამგორი': 'Samgori',
        }
        
        const district = components[field]
        return districtMap[district] || district
      }
    }
    
    return undefined
  }

  /**
   * Enforce rate limiting for API calls
   */
  private async enforceRateLimit(provider: 'google' | 'opencage'): Promise<void> {
    const now = Date.now()
    const lastCall = provider === 'google' ? this.lastGoogleApiCall : this.lastOpencageApiCall
    const timeSinceLastCall = now - lastCall
    
    if (timeSinceLastCall < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastCall
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
    
    if (provider === 'google') {
      this.lastGoogleApiCall = Date.now()
    } else {
      this.lastOpencageApiCall = Date.now()
    }
  }

  /**
   * Batch geocode multiple addresses
   */
  async batchGeocode(addresses: string[]): Promise<(GeocodeResult | null)[]> {
    // Process addresses sequentially to respect rate limits
    const results: (GeocodeResult | null)[] = []
    
    for (const address of addresses) {
      try {
        const result = await this.geocodeAddress(address)
        results.push(result)
      } catch (error) {
        this.logger.error(`Batch geocoding failed for address: ${error.message}`)
        results.push(null)
      }
    }

    return results
  }
}