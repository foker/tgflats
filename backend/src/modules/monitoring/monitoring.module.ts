import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CustomPrismaHealthIndicator } from './prisma.health';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [HealthController, MetricsController],
  providers: [MetricsService, CustomPrismaHealthIndicator],
  exports: [MetricsService],
})
export class MonitoringModule {}