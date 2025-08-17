import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { IsOptional, IsNumber, IsArray, IsString, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { CronService } from '../telegram/cron.service'
import { ApifyService } from '../telegram/apify.service'
import { PrismaService } from '../prisma/prisma.service'

export class ParseInitialDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  postsPerChannel?: number = 100

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[]
}

export class ParseRecentDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number = 20

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[]
}

@ApiTags('Admin')
@Controller('admin')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
export class AdminController {
  constructor(
    private cronService: CronService,
    private apifyService: ApifyService,
    private prisma: PrismaService,
  ) {}

  @Post('parse-initial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Start initial parsing', 
    description: 'Parse initial batch of posts from Telegram channels (100 posts per channel by default)'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        postsPerChannel: { 
          type: 'number', 
          default: 100,
          description: 'Number of posts to parse per channel'
        },
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of channels to parse (uses defaults if not provided)'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Initial parsing started successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        duration: { type: 'number' },
        channels: { 
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              parsed: { type: 'number' },
              saved: { type: 'number' },
              processed: { type: 'number' },
              queued: { type: 'number' },
            }
          }
        },
        totals: {
          type: 'object',
          properties: {
            parsed: { type: 'number' },
            saved: { type: 'number' },
            processed: { type: 'number' },
            queued: { type: 'number' },
          }
        }
      }
    }
  })
  async parseInitial(@Body() dto: ParseInitialDto) {
    const result = await this.cronService.parseInitialPosts(dto.postsPerChannel)
    
    return {
      message: 'Initial parsing completed',
      ...result
    }
  }

  @Post('parse-recent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Parse recent posts', 
    description: 'Parse recent posts from Telegram channels (20 posts by default)'
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        limit: { 
          type: 'number', 
          default: 20,
          description: 'Number of recent posts to parse'
        },
        channels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional list of channels to parse'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Recent posts parsed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              savedCount: { type: 'number' },
            }
          }
        },
        totalQueued: { type: 'number' },
      }
    }
  })
  async parseRecent(@Body() dto: ParseRecentDto) {
    const result = await this.cronService.triggerManualParse(dto.channels, dto.limit)
    
    return {
      message: 'Recent posts parsed and queued for processing',
      ...result
    }
  }

  @Get('parsing-stats')
  @ApiOperation({ 
    summary: 'Get parsing statistics', 
    description: 'Get detailed statistics about Telegram parsing and processing'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Parsing statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        telegram: {
          type: 'object',
          properties: {
            totalPosts: { type: 'number' },
            processedPosts: { type: 'number' },
            unprocessedPosts: { type: 'number' },
            processingRate: { type: 'number' },
            channels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channel: { type: 'string' },
                  postCount: { type: 'number' },
                  lastPost: { type: 'string', format: 'date-time' },
                }
              }
            }
          }
        },
        listings: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            active: { type: 'number' },
            expired: { type: 'number' },
            withImages: { type: 'number' },
            withLocation: { type: 'number' },
            avgConfidence: { type: 'number' },
          }
        },
        queues: {
          type: 'object',
          properties: {
            telegramParse: {
              type: 'object',
              properties: {
                waiting: { type: 'number' },
                active: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
              }
            },
            aiAnalysis: {
              type: 'object',
              properties: {
                waiting: { type: 'number' },
                active: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
              }
            },
            listingProcess: {
              type: 'object',
              properties: {
                waiting: { type: 'number' },
                active: { type: 'number' },
                completed: { type: 'number' },
                failed: { type: 'number' },
              }
            }
          }
        },
        cron: {
          type: 'object',
          properties: {
            jobs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  running: { type: 'boolean' },
                }
              }
            },
            channels: {
              type: 'array',
              items: { type: 'string' }
            },
            parseInterval: { type: 'number' },
          }
        }
      }
    }
  })
  async getParsingStats() {
    // Get Telegram parsing stats
    const telegramStats = await this.apifyService.getParsingStats()
    
    // Get listing stats
    const [
      totalListings,
      activeListings,
      expiredListings,
      listingsWithImages,
      listingsWithLocation,
    ] = await Promise.all([
      this.prisma.listing.count(),
      this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
      this.prisma.listing.count({ where: { status: 'EXPIRED' } }),
      this.prisma.listing.count({ 
        where: { 
          NOT: { imageUrls: { isEmpty: true } } 
        } 
      }),
      this.prisma.listing.count({ 
        where: { 
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        } 
      }),
    ])
    
    // Calculate average confidence
    const avgConfidenceResult = await this.prisma.listing.aggregate({
      _avg: { confidence: true }
    })
    
    // Get queue stats (simplified - you may need to adjust based on your queue implementation)
    const queueStats = {
      telegramParse: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      },
      aiAnalysis: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      },
      listingProcess: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      }
    }
    
    // Get cron status
    const cronStatus = this.cronService.getCronStatus()
    
    return {
      telegram: telegramStats,
      listings: {
        total: totalListings,
        active: activeListings,
        expired: expiredListings,
        withImages: listingsWithImages,
        withLocation: listingsWithLocation,
        avgConfidence: avgConfidenceResult._avg.confidence || 0,
      },
      queues: queueStats,
      cron: cronStatus,
    }
  }

  @Post('cleanup-cache')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Clean up old cache', 
    description: 'Manually trigger cleanup of old geocoding cache entries'
  })
  @ApiQuery({ 
    name: 'daysOld', 
    required: false, 
    type: Number,
    description: 'Number of days old for cache entries to be deleted (default: 30)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cache cleanup completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        deletedEntries: { type: 'number' },
      }
    }
  })
  async cleanupCache(@Query('daysOld') daysOld?: number) {
    const days = daysOld || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const result = await this.prisma.geocodingCache.deleteMany({
      where: {
        lastUsedAt: {
          lt: cutoffDate
        }
      }
    })
    
    return {
      message: `Cleaned up cache entries older than ${days} days`,
      deletedEntries: result.count,
    }
  }

  @Get('api-config')
  @ApiOperation({ 
    summary: 'Get API configuration status', 
    description: 'Check which APIs are configured and ready to use'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API configuration status retrieved',
    schema: {
      type: 'object',
      properties: {
        apify: {
          type: 'object',
          properties: {
            configured: { type: 'boolean' },
            actorId: { type: 'string' },
            rateLimit: { type: 'number' },
            maxRetries: { type: 'number' },
            mockDataEnabled: { type: 'boolean' },
            channels: { type: 'array', items: { type: 'string' } },
          }
        },
        ai: {
          type: 'object',
          properties: {
            openai: { type: 'boolean' },
            openrouter: { type: 'boolean' },
            fallbackEnabled: { type: 'boolean' },
            monthlyLimit: { type: 'number' },
          }
        },
        geocoding: {
          type: 'object',
          properties: {
            googleMaps: { type: 'boolean' },
            opencage: { type: 'boolean' },
            cacheEnabled: { type: 'boolean' },
            cacheTTL: { type: 'number' },
          }
        },
        features: {
          type: 'object',
          properties: {
            mockData: { type: 'boolean' },
            aiAnalysis: { type: 'boolean' },
            geocoding: { type: 'boolean' },
            autoParsing: { type: 'boolean' },
            websocket: { type: 'boolean' },
          }
        }
      }
    }
  })
  async getApiConfig() {
    const apifyConfig = this.apifyService.getConfigStatus()
    const channels = process.env.TELEGRAM_CHANNELS?.split(',').map(c => c.trim()) || []
    
    return {
      apify: {
        ...apifyConfig,
        channels,
      },
      ai: {
        openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-YOUR_OPENAI_API_KEY_HERE',
        openrouter: !!process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'sk-or-v1-YOUR_OPENROUTER_KEY_HERE',
        fallbackEnabled: process.env.AI_ENABLE_FALLBACK === 'true',
        monthlyLimit: parseInt(process.env.AI_MONTHLY_SPENDING_LIMIT || '100', 10),
      },
      geocoding: {
        googleMaps: !!process.env.GOOGLE_MAPS_API_KEY && process.env.GOOGLE_MAPS_API_KEY !== 'AIza_YOUR_GOOGLE_MAPS_KEY_HERE',
        opencage: !!process.env.OPENCAGE_API_KEY && process.env.OPENCAGE_API_KEY !== 'YOUR_OPENCAGE_API_KEY_HERE',
        cacheEnabled: true,
        cacheTTL: parseInt(process.env.GEOCODING_CACHE_TTL || '2592000', 10),
      },
      features: {
        mockData: process.env.ENABLE_MOCK_DATA === 'true',
        aiAnalysis: process.env.ENABLE_AI_ANALYSIS !== 'false',
        geocoding: process.env.ENABLE_GEOCODING !== 'false',
        autoParsing: process.env.ENABLE_AUTO_PARSING === 'true',
        websocket: process.env.ENABLE_WEBSOCKET !== 'false',
      }
    }
  }

  @Get('system-health')
  @ApiOperation({ 
    summary: 'Get system health', 
    description: 'Get overall system health and status'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'System health retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        services: {
          type: 'object',
          properties: {
            database: { type: 'boolean' },
            redis: { type: 'boolean' },
            apify: { type: 'boolean' },
            openrouter: { type: 'boolean' },
            opencage: { type: 'boolean' },
          }
        },
        timestamp: { type: 'string', format: 'date-time' },
      }
    }
  })
  async getSystemHealth() {
    const services = {
      database: false,
      redis: false,
      apify: false,
      openrouter: false,
      opencage: false,
    }
    
    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`
      services.database = true
    } catch (error) {
      // Database is down
    }
    
    // Check if API keys are configured
    services.apify = !!process.env.APIFY_SECRET
    services.openrouter = !!process.env.OPENROUTER_API_KEY
    services.opencage = !!process.env.OPENCAGE_API_KEY
    
    // Determine overall status
    const healthyServices = Object.values(services).filter(v => v).length
    const totalServices = Object.keys(services).length
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (healthyServices === 0) {
      status = 'unhealthy'
    } else if (healthyServices < totalServices) {
      status = 'degraded'
    }
    
    return {
      status,
      services,
      timestamp: new Date().toISOString(),
    }
  }
}