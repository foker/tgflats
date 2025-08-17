import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ApifyClient } from 'apify-client'
import { PrismaService } from '../prisma/prisma.service'

export interface TelegramPost {
  id: string
  messageId: number | bigint
  text: string
  date: Date
  channelUsername: string
  imageUrls?: string[]
  views?: number
  forwards?: number
}

export interface ApifyParseResult {
  posts: TelegramPost[]
  channelInfo: {
    username: string
    title: string
    subscribers?: number
  }
}

@Injectable()
export class ApifyService {
  private readonly logger = new Logger(ApifyService.name)
  private apifyClient: ApifyClient | null = null
  private readonly ACTOR_ID: string
  private readonly maxRetries: number
  private readonly rateLimit: number
  private lastRequestTime: number = 0
  private requestCount: number = 0

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Load configuration
    this.ACTOR_ID = this.configService.get<string>('APIFY_ACTOR_ID', 'CIHG1VRwmC01rsPar')
    this.maxRetries = this.configService.get<number>('APIFY_MAX_RETRIES', 3)
    this.rateLimit = this.configService.get<number>('APIFY_RATE_LIMIT', 10) // requests per minute
    
    const userId = this.configService.get<string>('APIFY_USER_ID')
    const secret = this.configService.get<string>('APIFY_SECRET')
    
    if (userId && secret && userId !== 'YOUR_APIFY_USER_ID_HERE') {
      this.apifyClient = new ApifyClient({
        token: secret,
      })
      this.logger.log('✅ Apify client initialized with real credentials')
    } else {
      this.logger.warn('⚠️ Apify credentials not configured, will use mock data')
      this.logger.warn('To enable real parsing, set APIFY_USER_ID and APIFY_SECRET in .env')
    }
  }

  /**
   * Rate limiting helper
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minuteWindow = 60000 // 1 minute in ms
    
    // Reset counter if we're in a new minute window
    if (timeSinceLastRequest > minuteWindow) {
      this.requestCount = 0
    }
    
    // Check if we've hit the rate limit
    if (this.requestCount >= this.rateLimit) {
      const waitTime = minuteWindow - timeSinceLastRequest
      if (waitTime > 0) {
        this.logger.warn(`Rate limit reached. Waiting ${waitTime}ms...`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
        this.requestCount = 0
      }
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  /**
   * Retry logic wrapper
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    retries: number = this.maxRetries
  ): Promise<T> {
    let lastError: any
    
    for (let i = 0; i <= retries; i++) {
      try {
        // Enforce rate limiting before each attempt
        await this.enforceRateLimit()
        
        // Try the operation
        return await operation()
      } catch (error) {
        lastError = error
        
        if (i < retries) {
          const backoffTime = Math.min(1000 * Math.pow(2, i), 30000) // Exponential backoff, max 30s
          this.logger.warn(
            `${operationName} failed (attempt ${i + 1}/${retries + 1}). ` +
            `Retrying in ${backoffTime}ms... Error: ${error.message}`
          )
          await new Promise(resolve => setTimeout(resolve, backoffTime))
        }
      }
    }
    
    this.logger.error(`${operationName} failed after ${retries + 1} attempts`, lastError)
    throw lastError
  }

  /**
   * Parse channel posts using Apify actor
   */
  async parseChannelPosts(
    channelUsername: string, 
    limit: number = 20
  ): Promise<ApifyParseResult> {
    // Clean channel username (remove @ if present)
    const cleanUsername = channelUsername.replace('@', '')
    
    // ALWAYS use real data, never use mocks
    if (!this.apifyClient) {
      throw new Error('Apify client not configured. Please set APIFY_USER_ID and APIFY_SECRET in .env file')
    }

    try {
      this.logger.log(`🚀 Starting Apify parsing for channel: ${cleanUsername}, limit: ${limit}`)
      
      // Prepare input for the actor - ONLY channel and limit as required
      const input = {
        channel: cleanUsername,
        limit: limit
      }

      // Run the actor with retry logic
      const result = await this.retryWithBackoff(
        async () => {
          const run = await this.apifyClient!.actor(this.ACTOR_ID).call(input, {
            waitSecs: 120, // Wait up to 2 minutes
          })
          
          if (!run.defaultDatasetId) {
            throw new Error('No dataset returned from Apify actor')
          }
          
          // Get dataset items
          const { items } = await this.apifyClient!.dataset(run.defaultDatasetId).listItems()
          
          if (!items || items.length === 0) {
            throw new Error('No items returned from Apify dataset')
          }
          
          return items
        },
        `Apify parsing for ${cleanUsername}`
      )
      
      this.logger.log(`✅ Fetched ${result.length} posts from ${cleanUsername}`)
      
      // Transform Apify results to our format
      return this.transformApifyResults(result, cleanUsername)
    } catch (error) {
      this.logger.error(`❌ Apify parsing failed for ${cleanUsername}: ${error.message}`, error.stack)
      // Never fall back to mock data - always throw error
      throw error
    }
  }

  /**
   * Validate and clean text content
   */
  private cleanText(text: any): string {
    if (!text) return ''
    if (typeof text === 'string') return text.trim()
    if (typeof text === 'object' && text.text) return this.cleanText(text.text)
    return String(text).trim()
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateValue: any): Date {
    if (!dateValue) return new Date()
    
    // If it's already a Date object
    if (dateValue instanceof Date) return dateValue
    
    // Try parsing as string
    const parsed = new Date(dateValue)
    
    // Check if the date is valid
    if (isNaN(parsed.getTime())) {
      this.logger.warn(`Invalid date value: ${dateValue}`)
      return new Date()
    }
    
    return parsed
  }

  /**
   * Extract images from various response formats
   */
  private extractImages(item: any): string[] {
    const images: string[] = []
    
    // Try different possible image fields
    const imageFields = [
      item.photos,
      item.images,
      item.media?.filter((m: any) => m.type === 'photo'),
      item.attachments?.filter((a: any) => a.type === 'photo'),
      item.imageUrl ? [item.imageUrl] : [],
      item.photoUrl ? [item.photoUrl] : [],
    ]
    
    for (const field of imageFields) {
      if (!field) continue
      
      if (Array.isArray(field)) {
        for (const img of field) {
          if (typeof img === 'string' && img.startsWith('http')) {
            images.push(img)
          } else if (img && typeof img === 'object') {
            const url = img.url || img.file_path || img.src || img.href
            if (url && typeof url === 'string' && url.startsWith('http')) {
              images.push(url)
            }
          }
        }
      }
    }
    
    // Remove duplicates
    return [...new Set(images)]
  }

  /**
   * Transform Apify results to our format
   */
  private transformApifyResults(items: any[], channelUsername: string): ApifyParseResult {
    const posts: TelegramPost[] = []
    let channelInfo = {
      username: channelUsername,
      title: channelUsername,
      subscribers: undefined as number | undefined,
    }

    for (const item of items) {
      try {
        // Log the structure of the first item for debugging
        if (posts.length === 0) {
          this.logger.debug('Sample Apify item structure:', JSON.stringify(Object.keys(item)))
        }
        
        // Extract channel info from first item
        if (!channelInfo.title) {
          channelInfo.title = item.channelTitle || item.channel_title || item.channelName || channelUsername
        }
        if (!channelInfo.subscribers) {
          channelInfo.subscribers = item.channelSubscribers || item.channel_subscribers || item.subscribers
        }

        // Extract message ID
        const messageId = item.messageId || item.message_id || item.id || item.postId || 0
        
        // Skip if no message ID
        if (!messageId) {
          this.logger.warn('Skipping item without message ID')
          continue
        }

        // Transform post data
        const post: TelegramPost = {
          id: `${channelUsername}_${messageId}`,
          messageId: BigInt(messageId), // Convert to BigInt here
          text: this.cleanText(item.text || item.message || item.content || item.caption || ''),
          date: this.parseDate(item.date || item.timestamp || item.created_at || item.postDate),
          channelUsername,
          views: item.views || item.viewCount || item.view_count || 0,
          forwards: item.forwards || item.forwardCount || item.forward_count || 0,
        }

        // Extract image URLs
        const images = this.extractImages(item)
        if (images.length > 0) {
          post.imageUrls = images
        }

        // Only add posts with some content
        if (post.text || (post.imageUrls && post.imageUrls.length > 0)) {
          posts.push(post)
        } else {
          this.logger.debug(`Skipping empty post: ${post.id}`)
        }
      } catch (error) {
        this.logger.warn(`Failed to transform item: ${error.message}`, {
          itemKeys: Object.keys(item),
          error: error.stack,
        })
      }
    }

    return { posts, channelInfo }
  }

  /**
   * Save parsed posts to database
   */
  async savePosts(posts: TelegramPost[]): Promise<number> {
    let savedCount = 0
    
    for (const post of posts) {
      try {
        // First, ensure the channel exists in the database
        const cleanUsername = post.channelUsername.replace('@', '')
        
        // Find or create the channel - using plain Prisma without any complex queries
        let channel: any
        try {
          channel = await this.prisma.$queryRaw`
            SELECT * FROM telegram_channels WHERE username = ${cleanUsername} LIMIT 1
          `
          if (!channel || channel.length === 0) {
            const channelId = `channel_${cleanUsername}`
            await this.prisma.$executeRaw`
              INSERT INTO telegram_channels (id, channel_id, username, title, is_active, created_at, updated_at)
              VALUES (gen_random_uuid(), ${channelId}, ${cleanUsername}, ${`Channel ${cleanUsername}`}, true, NOW(), NOW())
              ON CONFLICT (username) DO NOTHING
            `
            channel = [{ channel_id: channelId }]
          }
        } catch (channelError) {
          this.logger.error(`Failed to ensure channel ${cleanUsername}: ${channelError.message}`)
          continue
        }
        
        const channelId = channel[0]?.channel_id || `channel_${cleanUsername}`
        
        // Save the post using raw SQL to avoid Prisma issues
        try {
          await this.prisma.$executeRaw`
            INSERT INTO telegram_posts (
              id, channel_id, channel_username, message_id, 
              text, photos, post_date, views, forwards, 
              processed, created_at, updated_at
            )
            VALUES (
              gen_random_uuid(), 
              ${channelId}, 
              ${cleanUsername}, 
              ${post.messageId}::bigint,
              ${post.text || ''}, 
              ${post.imageUrls || []}, 
              ${post.date}, 
              ${post.views}, 
              ${post.forwards}, 
              false, 
              NOW(), 
              NOW()
            )
            ON CONFLICT (message_id, channel_username) DO UPDATE SET
              text = EXCLUDED.text,
              photos = EXCLUDED.photos,
              views = EXCLUDED.views,
              forwards = EXCLUDED.forwards,
              updated_at = NOW()
          `
          savedCount++
          this.logger.log(`Saved post ${post.id} to database`)
        } catch (saveError) {
          this.logger.error(`Failed to save post ${post.id}: ${saveError.message}`)
        }
      } catch (error) {
        this.logger.error(`Failed to process post ${post.id}: ${error.message}`)
      }
    }
    
    this.logger.log(`Successfully saved ${savedCount} out of ${posts.length} posts to database`)
    return savedCount
  }

  /**
   * Parse and save posts from multiple channels
   */
  async parseMultipleChannels(
    channels: string[], 
    limit: number = 20
  ): Promise<{ channel: string; savedCount: number }[]> {
    const results = []
    
    for (const channel of channels) {
      try {
        const parseResult = await this.parseChannelPosts(channel, limit)
        
        // Update channel info if we got it from parsing
        if (parseResult.channelInfo) {
          const cleanUsername = parseResult.channelInfo.username.replace('@', '')
          await this.prisma.telegramChannel.upsert({
            where: { username: cleanUsername },
            create: {
              channelId: `channel_${cleanUsername}`,
              username: cleanUsername,
              title: parseResult.channelInfo.title || `Channel ${cleanUsername}`,
              isActive: true,
            },
            update: {
              title: parseResult.channelInfo.title,
              lastParsed: new Date(),
            }
          })
        }
        
        const savedCount = await this.savePosts(parseResult.posts)
        
        results.push({ channel, savedCount })
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        this.logger.error(`Failed to parse channel ${channel}: ${error.message}`, error.stack)
        results.push({ channel, savedCount: 0 })
      }
    }
    
    return results
  }

  /**
   * Generate mock posts for testing
   */
  private generateMockPosts(channelUsername: string, limit: number): ApifyParseResult {
    const posts: TelegramPost[] = []
    const baseDate = new Date()
    
    const mockTexts = [
      '🏠 Сдается 2-комнатная квартира в Ваке\n📍 Адрес: ул. Чавчавадзе 15\n💰 Цена: $700/месяц\n📱 Контакт: +995 555 123456',
      '✨ For rent: Modern studio in Saburtalo\n📍 Near Metro Delisi\n💵 450$ per month\n🐕 Pets allowed\n☎️ Call: 595123456',
      'გამოქირავდება 3 ოთახიანი ბინა საბურთალოზე\nფასი: 1500 ლარი\nტელ: 599887766',
      '🔑 Сдаю 1-комнатную квартиру\n📍 Район: Глдани\n💰 350-400$\n🪑 С мебелью\n📞 +995591234567',
      'Apartment for rent in Old Tbilisi\n2 bedrooms, 65 sqm\nPrice: 900 GEL\nFurnished, all amenities\nContact: 577998877',
    ]
    
    for (let i = 0; i < Math.min(limit, mockTexts.length); i++) {
      const messageId = Math.floor(Math.random() * 10000) + 1000
      const postDate = new Date(baseDate.getTime() - i * 3600000) // 1 hour apart
      
      posts.push({
        id: `${channelUsername}_${messageId}`,
        messageId: BigInt(messageId),
        text: mockTexts[i % mockTexts.length],
        date: postDate,
        channelUsername,
        views: Math.floor(Math.random() * 1000) + 100,
        forwards: Math.floor(Math.random() * 50),
        imageUrls: i % 2 === 0 ? [`https://example.com/image${i}.jpg`] : undefined,
      })
    }
    
    return {
      posts,
      channelInfo: {
        username: channelUsername,
        title: `Mock ${channelUsername} Channel`,
        subscribers: Math.floor(Math.random() * 10000) + 1000,
      }
    }
  }

  /**
   * Check if Apify is properly configured
   */
  isConfigured(): boolean {
    return this.apifyClient !== null
  }

  /**
   * Get current configuration status
   */
  getConfigStatus() {
    return {
      isConfigured: this.isConfigured(),
      actorId: this.ACTOR_ID,
      maxRetries: this.maxRetries,
      rateLimit: this.rateLimit,
      mockDataEnabled: false, // ALWAYS disabled
    }
  }

  /**
   * Get parsing statistics
   */
  async getParsingStats() {
    const totalPosts = await this.prisma.telegramPost.count()
    const processedPosts = await this.prisma.telegramPost.count({
      where: { processed: true }
    })
    const unprocessedPosts = await this.prisma.telegramPost.count({
      where: { processed: false }
    })
    
    const channelStats = await this.prisma.telegramPost.groupBy({
      by: ['channelUsername'],
      _count: {
        id: true,
      },
      _max: {
        postDate: true,
      }
    })
    
    return {
      totalPosts,
      processedPosts,
      unprocessedPosts,
      processingRate: totalPosts > 0 ? (processedPosts / totalPosts) : 0,
      channels: channelStats.map(stat => ({
        channel: stat.channelUsername,
        postCount: stat._count.id,
        lastPost: stat._max.postDate,
      })),
    }
  }
}