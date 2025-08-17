import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthIndicatorResult {
  [key: string]: {
    status: 'up' | 'down';
    message?: string;
  };
}

@Injectable()
export class CustomPrismaHealthIndicator {
  constructor(private readonly prismaService: PrismaService) {}

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return {
        [key]: {
          status: 'up',
        },
      };
    } catch (error) {
      return {
        [key]: {
          status: 'down',
          message: error.message,
        },
      };
    }
  }
}