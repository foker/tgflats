import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  type: 'listing:new' | 'listing:updated' | 'listing:deleted' | 'connection' | 'error';
  data?: any;
  timestamp?: string;
}

export interface NewListingNotification {
  id: string;
  title: string;
  price: number;
  district: string;
  rooms: number;
  area: number;
  images?: string[];
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(url: string = 'http://localhost:3333') {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });

    // Listen for new listings
    this.socket.on('listing:new', (data: NewListingNotification) => {
      console.log('New listing received:', data);
      this.emit('listing:new', data);
    });

    // Listen for updated listings
    this.socket.on('listing:updated', (data: any) => {
      console.log('Listing updated:', data);
      this.emit('listing:updated', data);
    });

    // Listen for deleted listings
    this.socket.on('listing:deleted', (data: { id: string }) => {
      console.log('Listing deleted:', data);
      this.emit('listing:deleted', data);
    });

    // Listen for bulk updates
    this.socket.on('listings:bulk', (data: any[]) => {
      console.log('Bulk listings update:', data.length, 'items');
      this.emit('listings:bulk', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Subscribe to specific filters
  subscribeToFilters(filters: any) {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('subscribe:filters', filters);
  }

  // Unsubscribe from filters
  unsubscribeFromFilters() {
    if (!this.socket) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('unsubscribe:filters');
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Singleton instance
export const websocketService = new WebSocketService();