import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SubscriptionService } from './services/subscription.service';
import { ConnectionManagerService } from './services/connection-manager.service';
import { SubscriptionDto, WebSocketEventType, WebSocketErrorDto } from './dto';

@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@UseGuards(ThrottlerGuard)
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly connectionManager: ConnectionManagerService,
  ) {}

  /**
   * Handle new client connection
   */
  handleConnection(client: Socket) {
    try {
      this.connectionManager.addConnection(client);
      
      // Send welcome message
      client.emit('connected', {
        clientId: client.id,
        timestamp: new Date(),
        message: 'Connected to TBI-Prop WebSocket',
      });
    } catch (error) {
      this.logger.error(`Error handling connection for ${client.id}:`, error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    try {
      // Remove all subscriptions for this client
      this.subscriptionService.removeAllSubscriptions(client.id);
      
      // Remove connection from manager
      this.connectionManager.removeConnection(client.id);
    } catch (error) {
      this.logger.error(`Error handling disconnection for ${client.id}:`, error);
    }
  }

  /**
   * Handle subscription request
   */
  @SubscribeMessage('subscribe')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleSubscribe(
    @MessageBody() filters: SubscriptionDto,
    @ConnectedSocket() client: Socket,
  ) {
    // Check rate limit
    if (!this.connectionManager.canSendMessage(client.id)) {
      const error: WebSocketErrorDto = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      };
      client.emit(WebSocketEventType.ERROR, error);
      return;
    }

    try {
      const subscriptionId = this.subscriptionService.addSubscription(client.id, filters);
      
      if (!subscriptionId) {
        const error: WebSocketErrorDto = {
          code: 'MAX_SUBSCRIPTIONS_REACHED',
          message: 'Maximum number of subscriptions reached (10)',
        };
        client.emit(WebSocketEventType.ERROR, error);
        return;
      }

      // Send confirmation
      client.emit(WebSocketEventType.SUBSCRIPTION_CONFIRMED, {
        subscriptionId,
        filters,
        timestamp: new Date(),
      });

      this.logger.log(`Client ${client.id} subscribed with ID ${subscriptionId}`);
    } catch (error) {
      this.logger.error(`Error subscribing client ${client.id}:`, error);
      const wsError: WebSocketErrorDto = {
        code: 'SUBSCRIPTION_ERROR',
        message: 'Failed to create subscription',
        details: error.message,
      };
      client.emit(WebSocketEventType.ERROR, wsError);
    }
  }

  /**
   * Handle unsubscribe request
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { subscriptionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Check rate limit
    if (!this.connectionManager.canSendMessage(client.id)) {
      const error: WebSocketErrorDto = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      };
      client.emit(WebSocketEventType.ERROR, error);
      return;
    }

    try {
      const removed = this.subscriptionService.removeSubscription(client.id, data.subscriptionId);
      
      if (removed) {
        client.emit(WebSocketEventType.SUBSCRIPTION_REMOVED, {
          subscriptionId: data.subscriptionId,
          timestamp: new Date(),
        });
        this.logger.log(`Client ${client.id} unsubscribed from ${data.subscriptionId}`);
      } else {
        const error: WebSocketErrorDto = {
          code: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Subscription not found',
        };
        client.emit(WebSocketEventType.ERROR, error);
      }
    } catch (error) {
      this.logger.error(`Error unsubscribing client ${client.id}:`, error);
      const wsError: WebSocketErrorDto = {
        code: 'UNSUBSCRIBE_ERROR',
        message: 'Failed to unsubscribe',
        details: error.message,
      };
      client.emit(WebSocketEventType.ERROR, wsError);
    }
  }

  /**
   * Handle unsubscribe all request
   */
  @SubscribeMessage('unsubscribeAll')
  handleUnsubscribeAll(@ConnectedSocket() client: Socket) {
    // Check rate limit
    if (!this.connectionManager.canSendMessage(client.id)) {
      const error: WebSocketErrorDto = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      };
      client.emit(WebSocketEventType.ERROR, error);
      return;
    }

    try {
      const count = this.subscriptionService.removeAllSubscriptions(client.id);
      
      client.emit('allSubscriptionsRemoved', {
        count,
        timestamp: new Date(),
      });
      
      this.logger.log(`Client ${client.id} unsubscribed from all ${count} subscriptions`);
    } catch (error) {
      this.logger.error(`Error unsubscribing all for client ${client.id}:`, error);
      const wsError: WebSocketErrorDto = {
        code: 'UNSUBSCRIBE_ALL_ERROR',
        message: 'Failed to unsubscribe from all',
        details: error.message,
      };
      client.emit(WebSocketEventType.ERROR, wsError);
    }
  }

  /**
   * Handle pong response from client (for heartbeat)
   */
  @SubscribeMessage('pong')
  handlePong(@ConnectedSocket() client: Socket) {
    this.connectionManager.updateActivity(client.id);
  }

  /**
   * Get client subscriptions
   */
  @SubscribeMessage('getSubscriptions')
  handleGetSubscriptions(@ConnectedSocket() client: Socket) {
    // Check rate limit
    if (!this.connectionManager.canSendMessage(client.id)) {
      const error: WebSocketErrorDto = {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please slow down.',
      };
      client.emit(WebSocketEventType.ERROR, error);
      return;
    }

    try {
      const subscriptions = this.subscriptionService.getClientSubscriptions(client.id);
      
      client.emit('subscriptions', {
        subscriptions,
        count: subscriptions.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error getting subscriptions for client ${client.id}:`, error);
      const wsError: WebSocketErrorDto = {
        code: 'GET_SUBSCRIPTIONS_ERROR',
        message: 'Failed to get subscriptions',
        details: error.message,
      };
      client.emit(WebSocketEventType.ERROR, wsError);
    }
  }

  /**
   * Broadcast new listing to subscribed clients
   */
  broadcastNewListing(listing: any) {
    try {
      const matchingClients = this.subscriptionService.getMatchingClients(listing);
      
      if (matchingClients.size === 0) {
        this.logger.debug('No matching subscriptions for new listing');
        return;
      }

      for (const [clientId, subscriptions] of matchingClients.entries()) {
        const connection = this.connectionManager.getConnection(clientId);
        
        if (!connection) {
          this.logger.warn(`Client ${clientId} has subscriptions but no active connection`);
          this.subscriptionService.removeAllSubscriptions(clientId);
          continue;
        }

        try {
          connection.socket.emit(WebSocketEventType.NEW_LISTING, {
            listing,
            matchedSubscriptions: subscriptions.map(s => s.subscriptionId),
            timestamp: new Date(),
          });
          
          this.logger.debug(`Sent new listing to client ${clientId} (matched ${subscriptions.length} subscriptions)`);
        } catch (error) {
          this.logger.error(`Failed to send listing to client ${clientId}:`, error);
        }
      }

      this.logger.log(`Broadcasted new listing to ${matchingClients.size} clients`);
    } catch (error) {
      this.logger.error('Error broadcasting new listing:', error);
    }
  }

  /**
   * Broadcast listing update to subscribed clients
   */
  broadcastListingUpdate(listingId: string, updates: any) {
    try {
      // For updates, we broadcast to all clients with any subscription
      // You might want to implement more sophisticated logic here
      const allSubscriptions = this.subscriptionService.getAllSubscriptions();
      const clientIds = new Set(allSubscriptions.map(s => s.clientId));

      for (const clientId of clientIds) {
        const connection = this.connectionManager.getConnection(clientId);
        
        if (!connection) {
          this.logger.warn(`Client ${clientId} has subscriptions but no active connection`);
          this.subscriptionService.removeAllSubscriptions(clientId);
          continue;
        }

        try {
          connection.socket.emit(WebSocketEventType.LISTING_UPDATE, {
            listingId,
            updates,
            timestamp: new Date(),
          });
        } catch (error) {
          this.logger.error(`Failed to send update to client ${clientId}:`, error);
        }
      }

      if (clientIds.size > 0) {
        this.logger.log(`Broadcasted listing update to ${clientIds.size} clients`);
      }
    } catch (error) {
      this.logger.error('Error broadcasting listing update:', error);
    }
  }

  /**
   * Get WebSocket statistics (for monitoring)
   */
  getStats() {
    return {
      connections: this.connectionManager.getStats(),
      subscriptions: this.subscriptionService.getStats(),
      timestamp: new Date(),
    };
  }
}