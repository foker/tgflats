import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { WebSocketGateway } from './websocket.gateway';
import { SubscriptionService } from './services/subscription.service';
import { ConnectionManagerService } from './services/connection-manager.service';
import { WebSocketController } from './websocket.controller';

@Module({
  imports: [
    // WebSocket-specific throttling configuration
    ThrottlerModule.forRoot([
      {
        name: 'websocket',
        ttl: 60000, // 1 minute
        limit: 100, // 100 messages per minute
      },
    ]),
  ],
  controllers: [WebSocketController],
  providers: [
    WebSocketGateway,
    SubscriptionService,
    ConnectionManagerService,
  ],
  exports: [WebSocketGateway],
})
export class WebsocketModule {}