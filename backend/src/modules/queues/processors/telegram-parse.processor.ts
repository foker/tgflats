import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { TelegramService } from '../../telegram/telegram.service'

@Processor('telegram-parse')
export class TelegramParseProcessor extends WorkerHost {
  private readonly logger = new Logger(TelegramParseProcessor.name)

  constructor(private telegramService: TelegramService) {
    super()
  }

  async process(job: Job): Promise<any> {
    const { data } = job

    try {
      if (job.name === 'parse-channel') {
        return await this.parseChannel(job, data.channelUsername)
      } else if (job.name === 'scheduled-parse') {
        return await this.parseMultipleChannels(job, data.channels)
      }

      throw new Error(`Unknown job type: ${job.name}`)
    } catch (error) {
      this.logger.error(`Telegram parse job failed: ${error.message}`, error.stack)
      throw error
    }
  }

  private async parseChannel(job: Job, channelUsername: string) {
    this.logger.log(`Processing telegram parse job for channel: ${channelUsername}`)
    
    await job.updateProgress(10)
    
    const messages = await this.telegramService.parseChannelMessages(channelUsername, 100)
    
    await job.updateProgress(50)
    
    this.logger.log(`Parsed ${messages.length} messages from ${channelUsername}`)
    
    await job.updateProgress(100)
    
    return {
      channel: channelUsername,
      messagesCount: messages.length,
      processedAt: new Date().toISOString(),
    }
  }

  private async parseMultipleChannels(job: Job, channels: string[]) {
    this.logger.log(`Processing scheduled parse for ${channels.length} channels`)
    
    const results = []
    const progressStep = 100 / channels.length
    
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i]
      try {
        const messages = await this.telegramService.parseChannelMessages(channel, 50)
        results.push({
          channel,
          messagesCount: messages.length,
          success: true,
        })
        
        await job.updateProgress((i + 1) * progressStep)
      } catch (error) {
        this.logger.error(`Failed to parse channel ${channel}: ${error.message}`)
        results.push({
          channel,
          success: false,
          error: error.message,
        })
      }
    }
    
    return {
      totalChannels: channels.length,
      results,
      processedAt: new Date().toISOString(),
    }
  }
}