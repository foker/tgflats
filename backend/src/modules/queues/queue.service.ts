import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)

  constructor(
    @InjectQueue('telegram-parse') private telegramParseQueue: Queue,
    @InjectQueue('ai-analysis') private aiAnalysisQueue: Queue,
    @InjectQueue('geocoding') private geocodingQueue: Queue,
    @InjectQueue('listing-process') private listingProcessQueue: Queue,
    private configService: ConfigService,
  ) {
    this.setupScheduledJobs()
  }

  /**
   * Add telegram parsing job
   */
  async addTelegramParseJob(data: {
    postId?: string
    text?: string
    channelUsername: string
    imageUrls?: string[]
  }, priority = 1) {
    // If we have postId and text, it's for AI analysis
    if (data.postId && data.text) {
      return this.aiAnalysisQueue.add(
        'analyze-post',
        {
          postId: data.postId,
          text: data.text,
          imageUrls: data.imageUrls,
        },
        {
          priority,
          removeOnComplete: 10,
          removeOnFail: 5,
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        }
      )
    }
    
    // Otherwise it's for channel parsing
    return this.telegramParseQueue.add(
      'parse-channel',
      { channelUsername: data.channelUsername },
      {
        priority,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    )
  }

  /**
   * Add AI analysis job
   */
  async addAiAnalysisJob(postId: string, text: string, imageUrls?: string[], priority = 1) {
    return this.aiAnalysisQueue.add(
      'analyze-post',
      { postId, text, imageUrls },
      {
        priority,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    )
  }

  /**
   * Add geocoding job
   */
  async addGeocodingJob(listingId: string, address: string, priority = 1) {
    return this.geocodingQueue.add(
      'geocode-address',
      { listingId, address },
      {
        priority,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1500,
        },
      }
    )
  }

  /**
   * Add listing processing job
   */
  async addListingProcessJob(data: any, priority = 1) {
    return this.listingProcessQueue.add(
      'process-listing',
      data,
      {
        priority,
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 2,
      }
    )
  }

  /**
   * Setup scheduled jobs
   */
  private async setupScheduledJobs() {
    const parseInterval = this.configService.get('PARSE_INTERVAL_MINUTES', 15)
    
    // Schedule telegram parsing every X minutes
    await this.telegramParseQueue.add(
      'scheduled-parse',
      { 
        channels: ['kvartiry_v_tbilisi', 'propertyintbilisi', 'GeorgiaRealEstateGroup']
      },
      {
        repeat: { every: parseInterval * 60 * 1000 }, // Convert to milliseconds
        removeOnComplete: 5,
        removeOnFail: 3,
      }
    )

    this.logger.log(`Scheduled telegram parsing every ${parseInterval} minutes`)
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [
      telegramWaiting,
      telegramActive,
      telegramCompleted,
      telegramFailed,
      aiWaiting,
      aiActive,
      aiCompleted,
      aiFailed,
      geocodingWaiting,
      geocodingActive,
      geocodingCompleted,
      geocodingFailed,
      listingWaiting,
      listingActive,
      listingCompleted,
      listingFailed,
    ] = await Promise.all([
      this.telegramParseQueue.getWaiting(),
      this.telegramParseQueue.getActive(),
      this.telegramParseQueue.getCompleted(),
      this.telegramParseQueue.getFailed(),
      this.aiAnalysisQueue.getWaiting(),
      this.aiAnalysisQueue.getActive(),
      this.aiAnalysisQueue.getCompleted(),
      this.aiAnalysisQueue.getFailed(),
      this.geocodingQueue.getWaiting(),
      this.geocodingQueue.getActive(),
      this.geocodingQueue.getCompleted(),
      this.geocodingQueue.getFailed(),
      this.listingProcessQueue.getWaiting(),
      this.listingProcessQueue.getActive(),
      this.listingProcessQueue.getCompleted(),
      this.listingProcessQueue.getFailed(),
    ])

    return {
      telegramParse: {
        waiting: telegramWaiting.length,
        active: telegramActive.length,
        completed: telegramCompleted.length,
        failed: telegramFailed.length,
      },
      aiAnalysis: {
        waiting: aiWaiting.length,
        active: aiActive.length,
        completed: aiCompleted.length,
        failed: aiFailed.length,
      },
      geocoding: {
        waiting: geocodingWaiting.length,
        active: geocodingActive.length,
        completed: geocodingCompleted.length,
        failed: geocodingFailed.length,
      },
      listingProcess: {
        waiting: listingWaiting.length,
        active: listingActive.length,
        completed: listingCompleted.length,
        failed: listingFailed.length,
      },
    }
  }

  /**
   * Trigger manual parsing of all channels
   */
  async triggerManualParse() {
    const channels = ['kvartiry_v_tbilisi', 'propertyintbilisi', 'GeorgiaRealEstateGroup']
    
    const jobs = await Promise.all(
      channels.map(channel => this.addTelegramParseJob({ channelUsername: channel }, 10)) // High priority
    )

    return {
      message: 'Manual parsing triggered',
      jobs: jobs.map(job => ({ id: job.id, channel: job.data.channelUsername }))
    }
  }

  /**
   * Clear failed jobs from all queues
   */
  async clearFailedJobs() {
    await Promise.all([
      this.telegramParseQueue.clean(0, 10, 'failed'),
      this.aiAnalysisQueue.clean(0, 10, 'failed'),
      this.geocodingQueue.clean(0, 10, 'failed'),
      this.listingProcessQueue.clean(0, 10, 'failed'),
    ])

    return { message: 'Failed jobs cleared from all queues' }
  }
}