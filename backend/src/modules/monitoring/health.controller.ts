import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CustomPrismaHealthIndicator } from './prisma.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prismaHealth: CustomPrismaHealthIndicator,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async check() {
    const dbHealth = await this.prismaHealth.pingCheck('database');
    
    // Memory check
    const memUsage = process.memoryUsage();
    const memoryHealth = {
      memory_heap: {
        status: memUsage.heapUsed < 300 * 1024 * 1024 ? 'up' : 'down',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      memory_rss: {
        status: memUsage.rss < 1024 * 1024 * 1024 ? 'up' : 'down',
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
    };

    return {
      status: 'ok',
      info: {
        ...dbHealth,
        ...memoryHealth,
      },
      error: {},
      details: {
        ...dbHealth,
        ...memoryHealth,
      },
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async readiness() {
    const dbHealth = await this.prismaHealth.pingCheck('database');
    return {
      status: dbHealth.database ? 'ok' : 'error',
      checks: dbHealth,
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}