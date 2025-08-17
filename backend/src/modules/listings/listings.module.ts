import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { ListingsService } from './listings.service'
import { ListingsController } from './listings.controller'
import { ClusteringService } from './clustering.service'

@Module({
  imports: [PrismaModule],
  controllers: [ListingsController],
  providers: [ListingsService, ClusteringService],
  exports: [ListingsService],
})
export class ListingsModule {}