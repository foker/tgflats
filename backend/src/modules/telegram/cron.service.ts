import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as cron from 'node-cron'
import { ApifyService } from './apify.service'
import { QueueService } from '../queues/queue.service'
import { AiAnalysisService } from '../ai-analysis/ai-analysis.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronService.name)
  private cronJobs: cron.ScheduledTask[] = []
  
  // Default channels to parse
  private readonly DEFAULT_CHANNELS = [
    '@kvartiry_v_tbilisi',
    '@propertyintbilisi',
    '@GeorgiaRealEstateGroup',
  ]
  
  constructor(
    private configService: ConfigService,
    private apifyService: ApifyService,
    private queueService: QueueService,
    private aiAnalysisService: AiAnalysisService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.initializeCronJobs()
  }

  onModuleDestroy() {
    this.stopAllCronJobs()
  }

  /**
   * Initialize all cron jobs
   */
  private initializeCronJobs() {
    const parseInterval = this.configService.get<number>('PARSE_INTERVAL_MINUTES', 720) // Default 12 hours
    
    // Convert minutes to cron expression (every N minutes)
    const cronExpression = parseInterval < 60 
      ? `*/${parseInterval} * * * *` // Every N minutes
      : `0 */${Math.floor(parseInterval / 60)} * * *` // Every N hours
    
    // Schedule periodic parsing
    const parseJob = cron.schedule(cronExpression, async () => {
      await this.parseRecentPosts()
    })
    
    this.cronJobs.push(parseJob)
    
    // Schedule daily cache cleanup at 3 AM
    const cleanupJob = cron.schedule('0 3 * * *', async () => {
      await this.cleanupOldData()
    })
    
    this.cronJobs.push(cleanupJob)
    
    this.logger.log(`Cron jobs initialized. Parsing every ${parseInterval} minutes`)
  }

  /**
   * Stop all cron jobs
   */
  private stopAllCronJobs() {
    for (const job of this.cronJobs) {
      job.stop()
    }
    this.logger.log('All cron jobs stopped')
  }

  /**
   * Parse recent posts from all channels
   */
  async parseRecentPosts(limit: number = 20): Promise<void> {
    this.logger.log(`Starting scheduled parse of recent ${limit} posts`)
    
    const startTime = Date.now()
    const results = []
    
    for (const channel of this.DEFAULT_CHANNELS) {
      try {
        this.logger.log(`Parsing channel: ${channel}`)
        
        // Parse posts from channel
        const parseResult = await this.apifyService.parseChannelPosts(channel, limit)
        
        this.logger.log(`Parsed ${parseResult.posts.length} posts from ${channel}`)
        
        // Save posts to database
        let savedCount = 0
        try {
          savedCount = await this.apifyService.savePosts(parseResult.posts)
        } catch (saveError) {
          this.logger.error(`Error saving posts for ${channel}: ${saveError.message}`)
        }
        
        // Queue posts for AI analysis
        let queuedCount = 0
        for (const post of parseResult.posts) {
          if (post.text && post.text.length > 20) { // Skip very short posts
            try {
              await this.queueService.addTelegramParseJob({
                postId: post.id,
                text: post.text,
                channelUsername: post.channelUsername,
                imageUrls: post.imageUrls,
              })
              queuedCount++
            } catch (error) {
              this.logger.warn(`Failed to queue post ${post.id}: ${error.message}`)
            }
          }
        }
        
        results.push({
          channel,
          parsed: parseResult.posts.length,
          saved: savedCount,
          queued: queuedCount,
        })
        
        // Add delay between channels
        await new Promise(resolve => setTimeout(resolve, 3000))
      } catch (error) {
        this.logger.error(`Failed to parse channel ${channel}: ${error.message}`)
        results.push({
          channel,
          parsed: 0,
          saved: 0,
          queued: 0,
          error: error.message,
        })
      }
    }
    
    const duration = Date.now() - startTime
    this.logger.log(`Scheduled parse completed in ${duration}ms`, { results })
  }

  /**
   * Parse initial batch of posts (for seeding)
   */
  async parseInitialPosts(postsPerChannel: number = 100): Promise<any> {
    this.logger.log(`Starting initial parse of ${postsPerChannel} posts per channel`)
    
    const startTime = Date.now()
    const results = []
    
    for (const channel of this.DEFAULT_CHANNELS) {
      try {
        this.logger.log(`Initial parsing channel: ${channel}`)
        
        // Parse larger batch of posts
        const parseResult = await this.apifyService.parseChannelPosts(channel, postsPerChannel)
        
        this.logger.log(`Parsed ${parseResult.posts.length} posts from ${channel} for initial parsing`)
        
        // Save posts to database
        let savedCount = 0
        try {
          savedCount = await this.apifyService.savePosts(parseResult.posts)
        } catch (saveError) {
          this.logger.error(`Error saving posts for ${channel} during initial parsing: ${saveError.message}`)
        }
        
        // Process posts in batches for AI analysis
        const batchSize = 10
        let processedCount = 0
        let queuedCount = 0
        
        for (let i = 0; i < parseResult.posts.length; i += batchSize) {
          const batch = parseResult.posts.slice(i, i + batchSize)
          
          for (const post of batch) {
            if (post.text && post.text.length > 20) {
              try {
                // Analyze immediately for initial seeding
                const analysisResult = await this.aiAnalysisService.analyzeText(post.text)
                
                if (analysisResult.isRental && analysisResult.confidence > 0.5) {
                  // Queue for listing creation
                  await this.queueService.addListingProcessJob({
                    postId: post.id,
                    analysisResult,
                    text: post.text,
                    imageUrls: post.imageUrls,
                  })
                  queuedCount++
                }
                processedCount++
              } catch (error) {
                this.logger.warn(`Failed to process post ${post.id}: ${error.message}`)
              }
            }
          }
          
          // Add delay between batches
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        results.push({
          channel,
          parsed: parseResult.posts.length,
          saved: savedCount,
          processed: processedCount,
          queued: queuedCount,
          channelInfo: parseResult.channelInfo,
        })
        
        // Longer delay between channels for initial parsing
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        this.logger.error(`Initial parse failed for channel ${channel}: ${error.message}`)
        results.push({
          channel,
          error: error.message,
        })
      }
    }
    
    const duration = Date.now() - startTime
    this.logger.log(`Initial parse completed in ${duration}ms`)
    
    return {
      duration,
      channels: results,
      totals: {
        parsed: results.reduce((sum, r) => sum + (r.parsed || 0), 0),
        saved: results.reduce((sum, r) => sum + (r.saved || 0), 0),
        processed: results.reduce((sum, r) => sum + (r.processed || 0), 0),
        queued: results.reduce((sum, r) => sum + (r.queued || 0), 0),
      }
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of old data')
      
      // Clean old geocoding cache (older than 30 days)
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)
      
      const deletedCache = await this.prisma.geocodingCache.deleteMany({
        where: {
          lastUsedAt: {
            lt: cutoffDate
          }
        }
      })
      
      // Clean old processed telegram posts (older than 60 days)
      const oldPostsCutoff = new Date()
      oldPostsCutoff.setDate(oldPostsCutoff.getDate() - 60)
      
      const deletedPosts = await this.prisma.telegramPost.deleteMany({
        where: {
          processed: true,
          createdAt: {
            lt: oldPostsCutoff
          }
        }
      })
      
      // Update inactive listings (no views in 30 days)
      const inactiveCutoff = new Date()
      inactiveCutoff.setDate(inactiveCutoff.getDate() - 30)
      
      const updatedListings = await this.prisma.listing.updateMany({
        where: {
          status: 'ACTIVE',
          updatedAt: {
            lt: inactiveCutoff
          }
        },
        data: {
          status: 'EXPIRED'
        }
      })
      
      this.logger.log('Cleanup completed', {
        deletedCache: deletedCache.count,
        deletedPosts: deletedPosts.count,
        expiredListings: updatedListings.count,
      })
    } catch (error) {
      this.logger.error(`Cleanup failed: ${error.message}`)
    }
  }

  /**
   * Get cron status
   */
  getCronStatus() {
    return {
      jobs: this.cronJobs.map((job, index) => ({
        id: index,
        running: true, // node-cron doesn't expose running state directly
      })),
      channels: this.DEFAULT_CHANNELS,
      parseInterval: this.configService.get<number>('PARSE_INTERVAL_MINUTES', 720),
    }
  }

  /**
   * Manually trigger parsing
   */
  async triggerManualParse(channels?: string[], limit: number = 20) {
    const targetChannels = channels || this.DEFAULT_CHANNELS
    
    this.logger.log(`Manual parse triggered for channels: ${targetChannels.join(', ')}`)
    
    const results = await this.apifyService.parseMultipleChannels(targetChannels, limit)
    
    // Queue for processing
    let totalQueued = 0
    for (const channel of targetChannels) {
      const posts = await this.prisma.telegramPost.findMany({
        where: {
          channelUsername: channel.replace('@', ''),
          processed: false,
        },
        take: limit,
        orderBy: {
          postDate: 'desc'
        }
      })
      
      for (const post of posts) {
        if (post.text && post.text.length > 20) {
          await this.queueService.addTelegramParseJob({
            postId: post.id,
            text: post.text,
            channelUsername: post.channelUsername,
            imageUrls: post.imageUrls as string[],
          })
          totalQueued++
        }
      }
    }
    
    return {
      results,
      totalQueued,
    }
  }
}