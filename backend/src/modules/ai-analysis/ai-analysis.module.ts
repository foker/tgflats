import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AiAnalysisService } from './ai-analysis.service'
import { AiAnalysisController } from './ai-analysis.controller'
import { AiUsageController } from './ai-usage.controller'
import { AiCostTrackingService } from './ai-cost-tracking.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AiAnalysisController, AiUsageController],
  providers: [AiAnalysisService, AiCostTrackingService],
  exports: [AiAnalysisService, AiCostTrackingService],
})
export class AiAnalysisModule {}