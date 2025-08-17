import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.service'
import { AiAnalysisResult } from '../../ai-analysis/ai-analysis.service'
import { OpenCageService } from '../../geocoding/opencage.service'

@Processor('listing-process')
export class ListingProcessProcessor extends WorkerHost {
  private readonly logger = new Logger(ListingProcessProcessor.name)

  constructor(
    private prisma: PrismaService,
    private openCageService: OpenCageService,
  ) {
    super()
  }

  async process(job: Job): Promise<any> {
    const { postId, analysisResult, text, imageUrls } = job.data as {
      postId: string
      analysisResult: AiAnalysisResult
      text: string
      imageUrls?: string[]
    }

    try {
      this.logger.log(`Processing listing creation for post: ${postId}`)
      
      await job.updateProgress(10)
      
      // Check if listing already exists for this post
      const existingListing = await this.prisma.listing.findFirst({
        where: { telegramPostId: postId }
      })
      
      if (existingListing) {
        this.logger.log(`Listing already exists for post ${postId}, updating...`)
        return await this.updateListing(existingListing.id, analysisResult, job)
      }
      
      await job.updateProgress(30)
      
      // Create new listing
      const listingData = await this.prepareListingData(postId, analysisResult, text, imageUrls)
      
      await job.updateProgress(60)
      
      const listing = await this.prisma.listing.create({
        data: listingData
      })
      
      await job.updateProgress(90)
      
      // Mark telegram post as processed
      await this.prisma.telegramPost.update({
        where: { id: postId },
        data: { processed: true }
      })
      
      await job.updateProgress(100)
      
      this.logger.log(`Created listing ${listing.id} for post ${postId}`)
      
      return {
        listingId: listing.id,
        postId,
        confidence: analysisResult.confidence,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`Listing processing failed for post ${postId}: ${error.message}`, error.stack)
      throw error
    }
  }

  private async updateListing(listingId: string, analysisResult: AiAnalysisResult, job: Job) {
    const updateData = this.prepareUpdateData(analysisResult)
    
    const updatedListing = await this.prisma.listing.update({
      where: { id: listingId },
      data: updateData
    })
    
    this.logger.log(`Updated existing listing ${listingId}`)
    
    return {
      listingId: updatedListing.id,
      updated: true,
      confidence: analysisResult.confidence,
      processedAt: new Date().toISOString(),
    }
  }

  private async prepareListingData(
    postId: string, 
    analysisResult: AiAnalysisResult, 
    text: string,
    imageUrls?: string[]
  ) {
    const { extractedData } = analysisResult
    
    // Try to geocode the address if available
    let latitude: number | undefined
    let longitude: number | undefined
    let geocodedAddress: string | undefined
    let geocodedDistrict: string | undefined
    
    if (extractedData.address || extractedData.district) {
      try {
        const addressToGeocode = extractedData.address || 
          `${extractedData.district}, Tbilisi, Georgia`
        
        const geocodeResult = await this.openCageService.geocodeAddress(addressToGeocode)
        
        if (geocodeResult && geocodeResult.isInTbilisi) {
          latitude = geocodeResult.latitude
          longitude = geocodeResult.longitude
          geocodedAddress = geocodeResult.formattedAddress
          geocodedDistrict = geocodeResult.district
          
          this.logger.debug(`Geocoded address for listing: ${geocodedAddress}`)
        }
      } catch (error) {
        this.logger.warn(`Failed to geocode address: ${error.message}`)
      }
    }
    
    return {
      telegramPostId: postId,
      description: text,
      confidence: analysisResult.confidence,
      
      // Price data
      price: extractedData.price?.amount,
      priceMin: extractedData.priceRange?.min,
      priceMax: extractedData.priceRange?.max,
      currency: extractedData.price?.currency || extractedData.priceRange?.currency || 'GEL',
      
      // Property details
      bedrooms: extractedData.rooms,
      areaSqm: extractedData.area,
      district: geocodedDistrict || extractedData.district,
      address: geocodedAddress || extractedData.address,
      
      // Geocoding data
      latitude,
      longitude,
      
      // Images
      imageUrls: imageUrls || [],
      
      // Contact and amenities
      contactInfo: extractedData.contactInfo,
      petsAllowed: extractedData.petsAllowed,
      furnished: extractedData.furnished,
      amenities: extractedData.amenities || [],
      
      // Status
      status: 'ACTIVE' as const,
    }
  }

  private prepareUpdateData(analysisResult: AiAnalysisResult) {
    const { extractedData } = analysisResult
    
    const updateData: any = {
      confidence: analysisResult.confidence,
      updatedAt: new Date(),
    }
    
    // Only update fields that have values
    if (extractedData.price?.amount) {
      updateData.price = extractedData.price.amount
      updateData.currency = extractedData.price.currency
    }
    
    if (extractedData.priceRange) {
      updateData.priceMin = extractedData.priceRange.min
      updateData.priceMax = extractedData.priceRange.max
      updateData.currency = extractedData.priceRange.currency
    }
    
    if (extractedData.rooms) updateData.bedrooms = extractedData.rooms
    if (extractedData.area) updateData.areaSqm = extractedData.area
    if (extractedData.district) updateData.district = extractedData.district
    if (extractedData.address) updateData.address = extractedData.address
    if (extractedData.contactInfo) updateData.contactInfo = extractedData.contactInfo
    if (extractedData.petsAllowed !== undefined) updateData.petsAllowed = extractedData.petsAllowed
    if (extractedData.furnished !== undefined) updateData.furnished = extractedData.furnished
    if (extractedData.amenities && extractedData.amenities.length > 0) {
      updateData.amenities = extractedData.amenities
    }
    
    return updateData
  }
}