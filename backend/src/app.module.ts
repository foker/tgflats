import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ListingsModule } from './modules/listings/listings.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AiAnalysisModule } from './modules/ai-analysis/ai-analysis.module';
import { GeocodingModule } from './modules/geocoding/geocoding.module';
import { QueuesModule } from './modules/queues/queues.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { CacheModule } from './modules/cache/cache.module';
import { AdminModule } from './modules/admin/admin.module';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config';
import { validationSchema } from './config/env.validation';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: configuration,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    
    // Bull queues with Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL', 'redis://redis:6379')
        const url = new URL(redisUrl)
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
          },
        }
      },
      inject: [ConfigService],
    }),
    
    // Application modules
    PrismaModule,
    CacheModule,
    MonitoringModule,
    ListingsModule,
    TelegramModule,
    AiAnalysisModule,
    GeocodingModule,
    QueuesModule,
    WebsocketModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .exclude(
        { path: 'api/health', method: RequestMethod.GET },
        { path: 'api/metrics', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}