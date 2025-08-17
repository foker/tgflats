import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, NewListingNotification } from '../services/websocket';

export interface WebSocketState {
  isConnected: boolean;
  newListings: NewListingNotification[];
  unreadCount: number;
}

export function useWebSocket() {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    newListings: [],
    unreadCount: 0,
  });
  
  const unsubscribers = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Connect to WebSocket server
    websocketService.connect();

    // Setup event listeners
    const unsubConnection = websocketService.on('connection', (data) => {
      setState(prev => ({
        ...prev,
        isConnected: data.status === 'connected',
      }));
    });

    const unsubNewListing = websocketService.on('listing:new', (listing: NewListingNotification) => {
      setState(prev => ({
        ...prev,
        newListings: [listing, ...prev.newListings].slice(0, 50), // Keep last 50
        unreadCount: prev.unreadCount + 1,
      }));

      // Show browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Listing Available!', {
          body: `${listing.title} - ${listing.price.toLocaleString()} ₾`,
          icon: listing.images?.[0] || '/vite.svg',
          tag: `listing-${listing.id}`,
        });
      }
    });

    unsubscribers.current = [unsubConnection, unsubNewListing];

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      unsubscribers.current.forEach(unsub => unsub());
      websocketService.disconnect();
    };
  }, []);

  const markAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      unreadCount: 0,
    }));
  }, []);

  const clearNewListings = useCallback(() => {
    setState(prev => ({
      ...prev,
      newListings: [],
      unreadCount: 0,
    }));
  }, []);

  const subscribeToFilters = useCallback((filters: any) => {
    websocketService.subscribeToFilters(filters);
  }, []);

  return {
    isConnected: state.isConnected,
    newListings: state.newListings,
    unreadCount: state.unreadCount,
    markAsRead,
    clearNewListings,
    subscribeToFilters,
  };
}