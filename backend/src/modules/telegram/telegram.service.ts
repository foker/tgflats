import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Telegraf } from 'telegraf'
import { PrismaService } from '../prisma/prisma.service'

export interface ChannelMessage {
  id: number
  text?: string
  photos: string[]
  date: Date
  channelId: string
  raw: any
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name)
  private bot: Telegraf

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN')
    if (token) {
      this.bot = new Telegraf(token)
      this.setupBot()
    } else {
      this.logger.warn('Telegram bot token not provided, bot will not be initialized')
    }
  }

  private setupBot() {
    this.bot.start((ctx) => {
      ctx.reply('TBI-Prop Bot is running! This bot monitors rental channels.')
    })

    this.bot.help((ctx) => {
      ctx.reply('TBI-Prop Bot helps monitor Tbilisi rental channels for property listings.')
    })

    this.bot.launch()
    this.logger.log('Telegram bot launched successfully')

    // Graceful stop
    process.once('SIGINT', () => this.bot.stop('SIGINT'))
    process.once('SIGTERM', () => this.bot.stop('SIGTERM'))
  }

  /**
   * Parse messages from a specific channel
   * For now, this is a mock implementation that returns sample data
   * In production, you would use MTProto or web scraping
   */
  async parseChannelMessages(channelUsername: string, limit = 100): Promise<ChannelMessage[]> {
    // Clean username (remove @ if present)
    const cleanUsername = channelUsername.replace('@', '')
    this.logger.log(`Parsing messages from channel: ${cleanUsername}`)

    // Check if channel exists in our database
    let channel = await this.prisma.telegramChannel.findUnique({
      where: { username: cleanUsername }
    })

    if (!channel) {
      // Create channel if it doesn't exist
      channel = await this.prisma.telegramChannel.create({
        data: {
          channelId: `channel_${cleanUsername}`,
          username: cleanUsername,
          title: `Channel ${cleanUsername}`,
          isActive: true,
        }
      })
      this.logger.log(`Created new channel: ${cleanUsername} with ID: ${channel.channelId}`)
    }

    // For demonstration, return mock data
    // In production, you would implement actual Telegram API integration
    const mockMessages: ChannelMessage[] = this.generateMockMessages(channel.channelId, limit)

    // Save messages to database
    for (const message of mockMessages) {
      await this.saveTelegramPost(message, cleanUsername)
    }

    // Update channel last parsed time
    await this.prisma.telegramChannel.update({
      where: { id: channel.id },
      data: { lastParsed: new Date() }
    })

    return mockMessages
  }

  /**
   * Save telegram post to database
   */
  private async saveTelegramPost(message: ChannelMessage, channelUsername: string): Promise<void> {
    try {
      await this.prisma.telegramPost.upsert({
        where: {
          messageId_channelUsername: {
            messageId: BigInt(message.id),
            channelUsername: channelUsername
          }
        },
        create: {
          channelId: message.channelId, // This now contains the correct channel_<username> format
          channelUsername: channelUsername,
          messageId: BigInt(message.id),
          text: message.text,
          photos: message.photos,
          postDate: message.date,
          rawData: message.raw,
          processed: false,
        },
        update: {
          text: message.text,
          photos: message.photos,
          rawData: message.raw,
        }
      })
    } catch (error) {
      this.logger.error(`Failed to save telegram post: ${error.message}`, error.stack)
    }
  }

  /**
   * Generate mock messages for demonstration
   * This will be replaced with actual Telegram API integration
   */
  private generateMockMessages(channelId: string, count: number): ChannelMessage[] {
    const sampleTexts = [
      'Сдается 2-комнатная квартира в Сабуртало, 800 лари в месяц. Есть мебель, можно с животными. Тел: +995555123456',
      'For rent: 1 bedroom apartment in Vake district, $400/month. Furnished, pets allowed. Contact: +995555987654',
      'იყიდება 3 ოთახიანი ბინა ვაკეში, 120,000 დოლარი. ტელ: +995555111222',
      'Сдаю студию в центре города, 500 лари. Новая мебель, все удобства. +995555333444',
      'Rent: 2BR apartment near subway, $350/month. No pets. Call +995555555666',
      'გასაქირავებელია 1 ოთახიანი ბინა რუსთაველის გამზირზე, 600 ლარი. +995555777888',
    ]

    const districts = ['Saburtalo', 'Vake', 'Old Tbilisi', 'Rustavi', 'Gldani', 'Isani']
    
    return Array.from({ length: count }, (_, index) => ({
      id: Date.now() + index,
      text: sampleTexts[index % sampleTexts.length],
      photos: index % 3 === 0 ? [`https://example.com/photo${index}.jpg`] : [],
      date: new Date(Date.now() - index * 3600000), // Each message 1 hour earlier
      channelId,
      raw: {
        messageId: Date.now() + index,
        userId: Math.floor(Math.random() * 1000000),
        district: districts[index % districts.length],
        views: Math.floor(Math.random() * 1000),
      }
    }))
  }

  /**
   * Get all configured channels
   */
  async getChannels() {
    return this.prisma.telegramChannel.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' }
    })
  }

  /**
   * Add new channel to monitor
   */
  async addChannel(channelId: string, username?: string, title?: string) {
    return this.prisma.telegramChannel.create({
      data: {
        channelId,
        username,
        title: title || `Channel ${username || channelId}`,
        isActive: true,
      }
    })
  }

  /**
   * Get unprocessed posts
   */
  async getUnprocessedPosts(limit = 50) {
    return this.prisma.telegramPost.findMany({
      where: { processed: false },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { channel: true }
    })
  }

  /**
   * Mark post as processed
   */
  async markPostAsProcessed(postId: string) {
    return this.prisma.telegramPost.update({
      where: { id: postId },
      data: { processed: true }
    })
  }
}