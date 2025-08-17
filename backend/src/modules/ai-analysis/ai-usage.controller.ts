import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { AiCostTrackingService } from './ai-cost-tracking.service'

@Controller('ai-usage')
export class AiUsageController {
  constructor(private readonly costTrackingService: AiCostTrackingService) {}

  /**
   * Get usage statistics for a period
   * GET /api/ai-usage/stats?startDate=2024-01-01&endDate=2024-01-31
   */
  @Get('stats')
  async getUsageStats(
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    try {
      const startDate = startDateStr ? new Date(startDateStr) : undefined
      const endDate = endDateStr ? new Date(endDateStr) : undefined

      if (startDate && isNaN(startDate.getTime())) {
        throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST)
      }
      if (endDate && isNaN(endDate.getTime())) {
        throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST)
      }

      const stats = await this.costTrackingService.getUsageStats(startDate, endDate)
      
      return {
        success: true,
        data: stats,
        period: {
          start: startDate?.toISOString() || 'all-time',
          end: endDate?.toISOString() || 'now'
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        `Failed to fetch usage statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Get detailed cost information
   * GET /api/ai-usage/costs?provider=openai&model=gpt-3.5-turbo&limit=50&offset=0
   */
  @Get('costs')
  async getCostDetails(
    @Query('provider') provider?: string,
    @Query('model') model?: string,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    try {
      const startDate = startDateStr ? new Date(startDateStr) : undefined
      const endDate = endDateStr ? new Date(endDateStr) : undefined

      if (startDate && isNaN(startDate.getTime())) {
        throw new HttpException('Invalid startDate format', HttpStatus.BAD_REQUEST)
      }
      if (endDate && isNaN(endDate.getTime())) {
        throw new HttpException('Invalid endDate format', HttpStatus.BAD_REQUEST)
      }

      const details = await this.costTrackingService.getUsageDetails({
        provider,
        model,
        startDate,
        endDate,
        limit,
        offset,
      })

      return {
        success: true,
        data: details.records,
        pagination: {
          total: details.total,
          limit: details.limit,
          offset: details.offset,
          hasMore: details.offset + details.limit < details.total,
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        `Failed to fetch cost details: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Get current month spending status
   * GET /api/ai-usage/monthly
   */
  @Get('monthly')
  async getMonthlySpending() {
    try {
      const spending = await this.costTrackingService.getCurrentMonthSpending()
      const limits = await this.costTrackingService.checkSpendingLimits()

      return {
        success: true,
        data: {
          spending,
          status: {
            isNearLimit: limits.isNearLimit,
            isOverLimit: limits.isOverLimit,
            message: limits.message,
          }
        }
      }
    } catch (error) {
      throw new HttpException(
        `Failed to fetch monthly spending: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Get cost estimate for text
   * GET /api/ai-usage/estimate?provider=openai&model=gpt-3.5-turbo&text=...
   */
  @Get('estimate')
  async estimateCost(
    @Query('provider') provider: string,
    @Query('model') model: string,
    @Query('text') text: string,
    @Query('estimatedOutputTokens', new DefaultValuePipe(500), ParseIntPipe) estimatedOutputTokens?: number,
  ) {
    try {
      if (!provider || !model || !text) {
        throw new HttpException(
          'Provider, model, and text are required',
          HttpStatus.BAD_REQUEST
        )
      }

      const estimate = this.costTrackingService.estimateCost(
        provider,
        model,
        text,
        estimatedOutputTokens
      )

      const inputTokens = this.costTrackingService.countTokens(text)

      return {
        success: true,
        data: {
          provider,
          model,
          inputTokens,
          estimatedOutputTokens,
          estimatedCost: estimate.cost,
          breakdown: estimate.breakdown,
        }
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error
      }
      throw new HttpException(
        `Failed to estimate cost: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  /**
   * Get supported models and their pricing
   * GET /api/ai-usage/models
   */
  @Get('models')
  async getModelPricing() {
    const { AI_MODEL_PRICING } = await import('./ai-cost-tracking.service')
    
    return {
      success: true,
      data: AI_MODEL_PRICING,
    }
  }
}