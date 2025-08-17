import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface ClientConnection {
  socket: Socket;
  connectedAt: Date;
  lastActivity: Date;
  messageCount: number;
  messageCountResetAt: Date;
}

@Injectable()
export class ConnectionManagerService {
  private readonly logger = new Logger(ConnectionManagerService.name);
  private readonly connections = new Map<string, ClientConnection>();
  private readonly messageRateLimit = 100; // messages per minute
  private readonly messageRateWindow = 60000; // 1 minute in milliseconds
  private readonly heartbeatInterval = 30000; // 30 seconds
  private heartbeatTimer: any = null;

  /**
   * Register a new client connection
   */
  addConnection(socket: Socket): void {
    const now = new Date();
    this.connections.set(socket.id, {
      socket,
      connectedAt: now,
      lastActivity: now,
      messageCount: 0,
      messageCountResetAt: now,
    });

    this.logger.log(`Client connected: ${socket.id} from ${socket.handshake.address}`);
    
    // Start heartbeat if this is the first connection
    if (this.connections.size === 1) {
      this.startHeartbeat();
    }
  }

  /**
   * Remove a client connection
   */
  removeConnection(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      this.connections.delete(clientId);
      this.logger.log(`Client disconnected: ${clientId}`);
    }

    // Stop heartbeat if no connections remain
    if (this.connections.size === 0 && this.heartbeatTimer) {
      this.stopHeartbeat();
    }
  }

  /**
   * Get a client connection
   */
  getConnection(clientId: string): ClientConnection | undefined {
    return this.connections.get(clientId);
  }

  /**
   * Get all active connections
   */
  getAllConnections(): Map<string, ClientConnection> {
    return this.connections;
  }

  /**
   * Check if a client can send a message (rate limiting)
   */
  canSendMessage(clientId: string): boolean {
    const connection = this.connections.get(clientId);
    if (!connection) {
      return false;
    }

    const now = new Date();
    const timeSinceReset = now.getTime() - connection.messageCountResetAt.getTime();

    // Reset counter if window has passed
    if (timeSinceReset >= this.messageRateWindow) {
      connection.messageCount = 0;
      connection.messageCountResetAt = now;
    }

    // Check if under rate limit
    if (connection.messageCount >= this.messageRateLimit) {
      this.logger.warn(`Client ${clientId} exceeded rate limit`);
      return false;
    }

    // Increment counter and update activity
    connection.messageCount++;
    connection.lastActivity = now;
    return true;
  }

  /**
   * Update client activity timestamp
   */
  updateActivity(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeats();
      this.checkInactiveConnections();
    }, this.heartbeatInterval);

    this.logger.log('Started heartbeat monitoring');
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.logger.log('Stopped heartbeat monitoring');
    }
  }

  /**
   * Send heartbeat to all clients
   */
  private sendHeartbeats(): void {
    const now = Date.now();
    for (const [clientId, connection] of this.connections.entries()) {
      try {
        connection.socket.emit('heartbeat', { timestamp: now });
      } catch (error) {
        this.logger.error(`Failed to send heartbeat to ${clientId}:`, error);
      }
    }
  }

  /**
   * Check for inactive connections
   */
  private checkInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 5 * 60 * 1000; // 5 minutes

    for (const [clientId, connection] of this.connections.entries()) {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime();
      
      if (inactiveTime > inactiveThreshold) {
        this.logger.warn(`Disconnecting inactive client ${clientId} (inactive for ${Math.round(inactiveTime / 1000)}s)`);
        try {
          connection.socket.disconnect(true);
        } catch (error) {
          this.logger.error(`Failed to disconnect inactive client ${clientId}:`, error);
        }
        this.removeConnection(clientId);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const now = new Date();
    const connections = Array.from(this.connections.entries()).map(([clientId, conn]) => ({
      clientId,
      connectedAt: conn.connectedAt,
      lastActivity: conn.lastActivity,
      messageCount: conn.messageCount,
      uptime: Math.round((now.getTime() - conn.connectedAt.getTime()) / 1000),
      address: conn.socket.handshake.address,
    }));

    return {
      totalConnections: this.connections.size,
      connections,
      messageRateLimit: this.messageRateLimit,
      messageRateWindow: this.messageRateWindow,
    };
  }

  /**
   * Cleanup on service destroy
   */
  onModuleDestroy() {
    this.stopHeartbeat();
    for (const [, connection] of this.connections.entries()) {
      try {
        connection.socket.disconnect(true);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.connections.clear();
  }
}