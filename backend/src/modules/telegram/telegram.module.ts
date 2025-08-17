import { Module, forwardRef } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TelegramService } from './telegram.service'
import { TelegramController } from './telegram.controller'
import { ApifyService } from './apify.service'
import { CronService } from './cron.service'
import { PrismaModule } from '../prisma/prisma.module'
import { QueuesModule } from '../queues/queues.module'
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => QueuesModule),
    forwardRef(() => AiAnalysisModule),
  ],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    ApifyService,
    CronService,
  ],
  exports: [
    TelegramService,
    ApifyService,
    CronService,
  ],
})
export class TelegramModule {}