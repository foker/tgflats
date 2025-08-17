import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TelegramService } from './telegram.service'

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('channels')
  @ApiOperation({ summary: 'Get all configured Telegram channels' })
  @ApiResponse({ status: 200, description: 'List of channels' })
  async getChannels() {
    return this.telegramService.getChannels()
  }

  @Post('channels')
  @ApiOperation({ summary: 'Add new channel to monitor' })
  @ApiResponse({ status: 201, description: 'Channel created successfully' })
  async addChannel(@Body() body: { channelId: string; username?: string; title?: string }) {
    return this.telegramService.addChannel(body.channelId, body.username, body.title)
  }

  @Post('parse/:username')
  @ApiOperation({ summary: 'Parse messages from a specific channel' })
  @ApiResponse({ status: 200, description: 'Messages parsed successfully' })
  async parseChannel(
    @Param('username') username: string,
    @Query('limit') limit?: number
  ) {
    const messages = await this.telegramService.parseChannelMessages(username, limit || 100)
    return {
      success: true,
      count: messages.length,
      messages: messages.slice(0, 10), // Return first 10 for preview
    }
  }

  @Get('posts/unprocessed')
  @ApiOperation({ summary: 'Get unprocessed Telegram posts' })
  @ApiResponse({ status: 200, description: 'List of unprocessed posts' })
  async getUnprocessedPosts(@Query('limit') limit?: number) {
    return this.telegramService.getUnprocessedPosts(limit || 50)
  }

  @Post('posts/:id/processed')
  @ApiOperation({ summary: 'Mark post as processed' })
  @ApiResponse({ status: 200, description: 'Post marked as processed' })
  async markAsProcessed(@Param('id') id: string) {
    return this.telegramService.markPostAsProcessed(id)
  }
}