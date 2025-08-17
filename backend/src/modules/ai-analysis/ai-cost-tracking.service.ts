import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'
import { encode } from 'gpt-tokenizer'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface CostCalculation {
  cost: number
  breakdown: {
    inputCost: number
    outputCost: number
  }
}

export interface UsageStats {
  totalCost: number
  totalTokens: number
  byProvider: Record<string, {
    cost: number
    tokens: number
    requests: number
  }>
  byModel: Record<string, {
    cost: number
    tokens: number
    requests: number
  }>
  byDay: Array<{
    date: string
    cost: number
    tokens: number
    requests: number
  }>
}

// Pricing per 1K tokens in USD
export const AI_MODEL_PRICING = {
  openai: {
    'gpt-3.5-turbo': {
      input: 0.0005,  // $0.50 per 1M tokens
      output: 0.0015, // $1.50 per 1M tokens
    },
    'gpt-3.5-turbo-16k': {
      input: 0.0005,
      output: 0.0015,
    },
    'gpt-4': {
      input: 0.03,    // $30 per 1M tokens
      output: 0.06,   // $60 per 1M tokens
    },
    'gpt-4-turbo': {
      input: 0.01,    // $10 per 1M tokens
      output: 0.03,   // $30 per 1M tokens
    },
    'gpt-4o': {
      input: 0.005,   // $5 per 1M tokens
      output: 0.015,  // $15 per 1M tokens
    },
    'gpt-4o-mini': {
      input: 0.00015, // $0.15 per 1M tokens
      output: 0.0006, // $0.60 per 1M tokens
    },
  },
  anthropic: {
    'claude-3-opus': {
      input: 0.015,   // $15 per 1M tokens
      output: 0.075,  // $75 per 1M tokens
    },
    'claude-3-sonnet': {
      input: 0.003,   // $3 per 1M tokens
      output: 0.015,  // $15 per 1M tokens
    },
    'claude-3-haiku': {
      input: 0.00025, // $0.25 per 1M tokens
      output: 0.00125,// $1.25 per 1M tokens
    },
    'claude-2.1': {
      input: 0.008,   // $8 per 1M tokens
      output: 0.024,  // $24 per 1M tokens
    },
  },
}

@Injectable()
export class AiCostTrackingService {
  private readonly logger = new Logger(AiCostTrackingService.name)

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Count tokens in text using appropriate tokenizer
   * For simplicity, using GPT tokenizer for all models
   * In production, consider using model-specific tokenizers
   */
  countTokens(text: string): number {
    try {
      // Using gpt-tokenizer package for accurate token counting
      const tokens = encode(text)
      return tokens.length
    } catch (error) {
      this.logger.warn(`Failed to count tokens accurately, using approximation: ${error.message}`)
      // Fallback: rough approximation (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4)
    }
  }

  /**
   * Count tokens for messages in OpenAI format
   */
  countMessagesTokens(messages: Array<{ role: string; content: string }>): number {
    // OpenAI counts tokens including message structure
    // Approximate overhead: 3 tokens per message + role/content tokens
    let totalTokens = 0
    
    for (const message of messages) {
      totalTokens += 3 // Message overhead
      totalTokens += this.countTokens(message.role)
      totalTokens += this.countTokens(message.content || '')
    }
    
    totalTokens += 3 // Reply overhead
    return totalTokens
  }

  /**
   * Calculate cost based on model and token usage
   */
  calculateCost(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): CostCalculation {
    const pricing = this.getModelPricing(provider, model)
    
    if (!pricing) {
      this.logger.warn(`No pricing found for ${provider}/${model}, using default`)
      // Default pricing if model not found
      const inputCost = (inputTokens / 1000) * 0.001
      const outputCost = (outputTokens / 1000) * 0.002
      return {
        cost: inputCost + outputCost,
        breakdown: { inputCost, outputCost }
      }
    }

    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    
    return {
      cost: inputCost + outputCost,
      breakdown: { inputCost, outputCost }
    }
  }

  /**
   * Get pricing for specific model
   */
  private getModelPricing(provider: string, model: string): { input: number; output: number } | null {
    const providerPricing = AI_MODEL_PRICING[provider.toLowerCase()]
    if (!providerPricing) return null

    // Try exact match first
    if (providerPricing[model]) {
      return providerPricing[model]
    }

    // Try to find best match (e.g., "gpt-3.5-turbo-0613" -> "gpt-3.5-turbo")
    for (const [modelKey, pricing] of Object.entries(providerPricing)) {
      if (model.startsWith(modelKey) && typeof pricing === 'object' && 'input' in pricing && 'output' in pricing) {
        return pricing as { input: number; output: number }
      }
    }

    return null
  }

  /**
   * Track API usage in database
   */
  async trackUsage(data: {
    provider: string
    model: string
    inputTokens: number
    outputTokens: number
    cost?: number
    requestId?: string
    metadata?: any
  }): Promise<void> {
    try {
      const totalTokens = data.inputTokens + data.outputTokens
      
      // Calculate cost if not provided
      const cost = data.cost ?? 
        this.calculateCost(data.provider, data.model, data.inputTokens, data.outputTokens).cost

      // TODO: Uncomment when AiApiUsage model is added back to schema
      // await this.prisma.aiApiUsage.create({
      //   data: {
      //     provider: data.provider,
      //     model: data.model,
      //     inputTokens: data.inputTokens,
      //     outputTokens: data.outputTokens,
      //     totalTokens,
      //     cost,
      //     requestId: data.requestId,
      //     metadata: data.metadata,
      //   }
      // })

      this.logger.log(
        `Tracked AI usage: ${data.provider}/${data.model} - ` +
        `${totalTokens} tokens ($${cost.toFixed(4)})`
      )
    } catch (error) {
      this.logger.error(`Failed to track AI usage: ${error.message}`)
    }
  }

  /**
   * Get usage statistics for a time period
   */
  async getUsageStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageStats> {
    // TODO: Uncomment when AiApiUsage model is added back to schema
    // const where: Prisma.AiApiUsageWhereInput = {}
    
    // if (startDate || endDate) {
    //   where.createdAt = {}
    //   if (startDate) where.createdAt.gte = startDate
    //   if (endDate) where.createdAt.lte = endDate
    // }

    // const usage = await this.prisma.aiApiUsage.findMany({
    //   where,
    //   orderBy: { createdAt: 'desc' }
    // })
    
    const usage: any[] = [] // Temporary empty array

    // Calculate aggregated stats
    const stats: UsageStats = {
      totalCost: 0,
      totalTokens: 0,
      byProvider: {},
      byModel: {},
      byDay: []
    }

    // Group by provider and model
    for (const record of usage) {
      stats.totalCost += record.cost
      stats.totalTokens += record.totalTokens

      // By provider
      if (!stats.byProvider[record.provider]) {
        stats.byProvider[record.provider] = { cost: 0, tokens: 0, requests: 0 }
      }
      stats.byProvider[record.provider].cost += record.cost
      stats.byProvider[record.provider].tokens += record.totalTokens
      stats.byProvider[record.provider].requests += 1

      // By model
      const modelKey = `${record.provider}/${record.model}`
      if (!stats.byModel[modelKey]) {
        stats.byModel[modelKey] = { cost: 0, tokens: 0, requests: 0 }
      }
      stats.byModel[modelKey].cost += record.cost
      stats.byModel[modelKey].tokens += record.totalTokens
      stats.byModel[modelKey].requests += 1
    }

    // Group by day
    const dailyStats = new Map<string, { cost: number; tokens: number; requests: number }>()
    
    for (const record of usage) {
      const dateKey = record.createdAt.toISOString().split('T')[0]
      
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, { cost: 0, tokens: 0, requests: 0 })
      }
      
      const dayStats = dailyStats.get(dateKey)!
      dayStats.cost += record.cost
      dayStats.tokens += record.totalTokens
      dayStats.requests += 1
    }

    stats.byDay = Array.from(dailyStats.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return stats
  }

  /**
   * Get detailed usage records
   */
  async getUsageDetails(
    options: {
      startDate?: Date
      endDate?: Date
      provider?: string
      model?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    const where: Prisma.AiApiUsageWhereInput = {}
    
    if (options.startDate || options.endDate) {
      where.createdAt = {}
      if (options.startDate) where.createdAt.gte = options.startDate
      if (options.endDate) where.createdAt.lte = options.endDate
    }
    
    if (options.provider) where.provider = options.provider
    if (options.model) where.model = options.model

    const [records, total] = await Promise.all([
      this.prisma.aiApiUsage.findMany({
        where,
        take: options.limit || 100,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.aiApiUsage.count({ where })
    ])

    return {
      records,
      total,
      limit: options.limit || 100,
      offset: options.offset || 0
    }
  }

  /**
   * Get current month's spending
   */
  async getCurrentMonthSpending(): Promise<{
    total: number
    limit: number
    percentage: number
    daysRemaining: number
  }> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const stats = await this.getUsageStats(startOfMonth, now)
    
    // Get spending limit from config or use default
    const monthlyLimit = this.configService.get<number>('AI_MONTHLY_SPENDING_LIMIT', 100)
    
    const daysInMonth = endOfMonth.getDate()
    const currentDay = now.getDate()
    const daysRemaining = daysInMonth - currentDay

    return {
      total: stats.totalCost,
      limit: monthlyLimit,
      percentage: (stats.totalCost / monthlyLimit) * 100,
      daysRemaining
    }
  }

  /**
   * Check if we're approaching spending limits
   */
  async checkSpendingLimits(): Promise<{
    isNearLimit: boolean
    isOverLimit: boolean
    message?: string
  }> {
    const spending = await this.getCurrentMonthSpending()
    
    if (spending.percentage >= 100) {
      return {
        isNearLimit: true,
        isOverLimit: true,
        message: `Monthly AI spending limit exceeded: $${spending.total.toFixed(2)} / $${spending.limit}`
      }
    }
    
    if (spending.percentage >= 80) {
      return {
        isNearLimit: true,
        isOverLimit: false,
        message: `Approaching monthly AI spending limit: $${spending.total.toFixed(2)} / $${spending.limit} (${spending.percentage.toFixed(1)}%)`
      }
    }
    
    return {
      isNearLimit: false,
      isOverLimit: false
    }
  }

  /**
   * Estimate cost for text analysis
   */
  estimateCost(
    provider: string,
    model: string,
    inputText: string,
    estimatedOutputTokens: number = 500
  ): CostCalculation {
    const inputTokens = this.countTokens(inputText)
    return this.calculateCost(provider, model, inputTokens, estimatedOutputTokens)
  }
}