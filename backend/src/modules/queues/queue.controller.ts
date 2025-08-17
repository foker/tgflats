import { Controller, Get, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { QueueService } from './queue.service'

@ApiTags('queues')
@Controller('queues')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics' })
  async getQueueStats() {
    return this.queueService.getQueueStats()
  }

  @Post('trigger-parse')
  @ApiOperation({ summary: 'Trigger manual parsing of all channels' })
  @ApiResponse({ status: 200, description: 'Manual parsing triggered' })
  async triggerManualParse() {
    return this.queueService.triggerManualParse()
  }

  @Post('clear-failed')
  @ApiOperation({ summary: 'Clear failed jobs from all queues' })
  @ApiResponse({ status: 200, description: 'Failed jobs cleared' })
  async clearFailedJobs() {
    return this.queueService.clearFailedJobs()
  }

  @Post('telegram-parse')
  @ApiOperation({ summary: 'Add telegram parse job manually' })
  @ApiResponse({ status: 200, description: 'Job added to queue' })
  async addTelegramParseJob(@Body() body: { channelUsername: string; priority?: number }) {
    const job = await this.queueService.addTelegramParseJob({ channelUsername: body.channelUsername }, body.priority)
    return { jobId: (job as any).id, channel: body.channelUsername }
  }

  @Post('ai-analysis')
  @ApiOperation({ summary: 'Add AI analysis job manually' })
  @ApiResponse({ status: 200, description: 'Job added to queue' })
  async addAiAnalysisJob(@Body() body: { postId: string; text: string; priority?: number }) {
    const job = await this.queueService.addAiAnalysisJob(body.postId, body.text, undefined, body.priority)
    return { jobId: (job as any).id, postId: body.postId }
  }

  @Post('geocoding')
  @ApiOperation({ summary: 'Add geocoding job manually' })
  @ApiResponse({ status: 200, description: 'Job added to queue' })
  async addGeocodingJob(@Body() body: { listingId: string; address: string; priority?: number }) {
    const job = await this.queueService.addGeocodingJob(body.listingId, body.address, body.priority)
    return { jobId: (job as any).id, listingId: body.listingId }
  }
}