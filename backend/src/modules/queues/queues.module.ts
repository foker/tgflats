import { Module, forwardRef } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { TelegramModule } from '../telegram/telegram.module'
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module'
import { GeocodingModule } from '../geocoding/geocoding.module'
import { ListingsModule } from '../listings/listings.module'

import { TelegramParseProcessor } from './processors/telegram-parse.processor'
import { AiAnalysisProcessor } from './processors/ai-analysis.processor'
import { GeocodingProcessor } from './processors/geocoding.processor'
import { ListingProcessProcessor } from './processors/listing-process.processor'
import { QueueService } from './queue.service'
import { QueueController } from './queue.controller'

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => TelegramModule),
    forwardRef(() => AiAnalysisModule),
    forwardRef(() => GeocodingModule),
    forwardRef(() => ListingsModule),
    
    // Register queues
    BullModule.registerQueue(
      { name: 'telegram-parse' },
      { name: 'ai-analysis' },
      { name: 'geocoding' },
      { name: 'listing-process' },
    ),
  ],
  controllers: [QueueController],
  providers: [
    QueueService,
    TelegramParseProcessor,
    AiAnalysisProcessor,
    GeocodingProcessor,
    ListingProcessProcessor,
  ],
  exports: [QueueService],
})
export class QueuesModule {}