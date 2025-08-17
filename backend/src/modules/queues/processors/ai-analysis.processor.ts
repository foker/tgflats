import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job, Queue } from 'bullmq'
import { AiAnalysisService } from '../../ai-analysis/ai-analysis.service'

@Processor('ai-analysis')
export class AiAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AiAnalysisProcessor.name)

  constructor(
    private aiAnalysisService: AiAnalysisService,
    @InjectQueue('geocoding') private geocodingQueue: Queue,
    @InjectQueue('listing-process') private listingProcessQueue: Queue,
  ) {
    super()
  }

  async process(job: Job): Promise<any> {
    const { postId, text, imageUrls } = job.data

    try {
      this.logger.log(`Processing AI analysis job for post: ${postId}`)
      
      await job.updateProgress(10)
      
      const analysisResult = await this.aiAnalysisService.analyzeText(text)
      
      await job.updateProgress(70)
      
      // If it's a rental with good confidence, trigger listing processing
      if (analysisResult.isRental && analysisResult.confidence > 0.6) {
        await this.listingProcessQueue.add('process-listing', {
          postId,
          analysisResult,
          text,
          imageUrls, // Pass imageUrls to listing processor
        })
        
        // If we have address data, trigger geocoding
        if (analysisResult.extractedData.address) {
          await this.geocodingQueue.add('geocode-address', {
            listingId: postId, // We'll use postId as temporary listingId
            address: analysisResult.extractedData.address,
          })
        }
      }
      
      await job.updateProgress(100)
      
      this.logger.log(
        `AI analysis completed for post ${postId}: ` +
        `isRental=${analysisResult.isRental}, confidence=${analysisResult.confidence}`
      )
      
      return {
        postId,
        analysisResult,
        processedAt: new Date().toISOString(),
      }
    } catch (error) {
      this.logger.error(`AI analysis job failed for post ${postId}: ${error.message}`, error.stack)
      throw error
    }
  }
}