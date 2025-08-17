import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { GeocodingService } from '../../geocoding/geocoding.service'
import { PrismaService } from '../../prisma/prisma.service'

@Processor('geocoding')
export class GeocodingProcessor extends WorkerHost {
  private readonly logger = new Logger(GeocodingProcessor.name)

  constructor(
    private geocodingService: GeocodingService,
    private prisma: PrismaService,
  ) {
    super()
  }

  async process(job: Job): Promise<any> {
    const { listingId, address } = job.data

    try {
      this.logger.log(`Processing geocoding job for listing: ${listingId}, address: ${address}`)
      
      await job.updateProgress(10)
      
      const geocodeResult = await this.geocodingService.geocodeAddress(address)
      
      await job.updateProgress(70)
      
      if (geocodeResult && geocodeResult.isInTbilisi) {
        // Update listing with coordinates
        try {
          await this.prisma.listing.update({
            where: { id: listingId },
            data: {
              latitude: geocodeResult.latitude,
              longitude: geocodeResult.longitude,
              address: geocodeResult.formattedAddress,
              district: geocodeResult.district,
            }
          })
          
          this.logger.log(
            `Updated listing ${listingId} with coordinates: ` +
            `${geocodeResult.latitude}, ${geocodeResult.longitude}`
          )
        } catch (updateError) {
          // If listing doesn't exist yet, that's okay - it might be processed later
          this.logger.warn(`Could not update listing ${listingId}: ${updateError.message}`)
        }
      } else if (!geocodeResult) {
        this.logger.warn(`Failed to geocode address: ${address}`)
      } else {
        this.logger.warn(`Address outside Tbilisi bounds: ${address}`)
      }
      
      await job.updateProgress(100)
      
      return {
        listingId,
        address,
        geocodeResult,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`Geocoding job failed for listing ${listingId}: ${error.message}`, error.stack)
      throw error
    }
  }
}