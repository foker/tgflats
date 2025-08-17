import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { TelegramModule } from '../telegram/telegram.module'
import { QueuesModule } from '../queues/queues.module'
import { PrismaModule } from '../prisma/prisma.module'
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module'

@Module({
  imports: [
    TelegramModule,
    QueuesModule,
    PrismaModule,
    AiAnalysisModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}