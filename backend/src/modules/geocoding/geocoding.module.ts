import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { GeocodingService } from './geocoding.service'
import { OpenCageService } from './opencage.service'
import { GeocodingController } from './geocoding.controller'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [GeocodingController],
  providers: [
    GeocodingService,
    OpenCageService,
  ],
  exports: [
    GeocodingService,
    OpenCageService,
  ],
})
export class GeocodingModule {}