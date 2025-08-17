import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { WebSocketGateway } from './websocket.gateway';

@ApiTags('WebSocket')
@Controller('websocket')
@UseGuards(ThrottlerGuard)
export class WebSocketController {
  constructor(private readonly webSocketGateway: WebSocketGateway) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get WebSocket statistics' })
  @ApiResponse({
    status: 200,
    description: 'WebSocket statistics including connections and subscriptions',
    schema: {
      type: 'object',
      properties: {
        connections: {
          type: 'object',
          properties: {
            totalConnections: { type: 'number' },
            connections: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  clientId: { type: 'string' },
                  connectedAt: { type: 'string' },
                  lastActivity: { type: 'string' },
                  messageCount: { type: 'number' },
                  uptime: { type: 'number' },
                  address: { type: 'string' },
                },
              },
            },
            messageRateLimit: { type: 'number' },
            messageRateWindow: { type: 'number' },
          },
        },
        subscriptions: {
          type: 'object',
          properties: {
            totalClients: { type: 'number' },
            totalSubscriptions: { type: 'number' },
            avgSubscriptionsPerClient: { type: 'number' },
            subscriptionsByClient: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  clientId: { type: 'string' },
                  count: { type: 'number' },
                },
              },
            },
          },
        },
        timestamp: { type: 'string' },
      },
    },
  })
  getStats() {
    return this.webSocketGateway.getStats();
  }
}