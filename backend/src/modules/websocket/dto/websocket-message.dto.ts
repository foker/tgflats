import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WebSocketEventType {
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  UNSUBSCRIBE_ALL = 'unsubscribeAll',
  NEW_LISTING = 'newListing',
  LISTING_UPDATE = 'listingUpdate',
  ERROR = 'error',
  SUBSCRIPTION_CONFIRMED = 'subscriptionConfirmed',
  SUBSCRIPTION_REMOVED = 'subscriptionRemoved',
  HEARTBEAT = 'heartbeat',
  PONG = 'pong',
}

export class WebSocketMessageDto {
  @ApiProperty({ description: 'Event type', enum: WebSocketEventType })
  @IsEnum(WebSocketEventType)
  event: WebSocketEventType;

  @ApiPropertyOptional({ description: 'Message payload' })
  @IsOptional()
  @IsObject()
  data?: any;

  @ApiPropertyOptional({ description: 'Unique message ID for tracking' })
  @IsOptional()
  @IsString()
  messageId?: string;

  @ApiPropertyOptional({ description: 'Timestamp of the message' })
  @IsOptional()
  timestamp?: Date;
}

export class WebSocketErrorDto {
  @ApiProperty({ description: 'Error code' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  details?: any;
}