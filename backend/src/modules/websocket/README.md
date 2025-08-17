# WebSocket Module Documentation

## Overview
Enhanced WebSocket module for TBI-Prop platform with subscription management, rate limiting, and connection monitoring.

## Features

### 1. Subscription Management
- Clients can subscribe to listings with custom filters
- Maximum 10 subscriptions per client
- Filters include:
  - District
  - Price range (min/max)
  - Number of bedrooms
  - Location radius
  - Amenities
  - Furnished status
  - Pet-friendly status

### 2. Rate Limiting
- 100 messages per minute per client
- Automatic rate limit enforcement
- Error messages on limit exceeded

### 3. Connection Management
- Automatic connection tracking
- Heartbeat/ping-pong mechanism (30 seconds interval)
- Auto-disconnect inactive clients (5 minutes timeout)
- Connection statistics

### 4. WebSocket Events

#### Client → Server Events

| Event | Description | Payload |
|-------|-------------|---------|
| `subscribe` | Create new subscription | `SubscriptionDto` |
| `unsubscribe` | Remove specific subscription | `{ subscriptionId: string }` |
| `unsubscribeAll` | Remove all subscriptions | - |
| `getSubscriptions` | Get client's subscriptions | - |
| `pong` | Heartbeat response | - |

#### Server → Client Events

| Event | Description | Payload |
|-------|-------------|---------|
| `connected` | Connection confirmed | `{ clientId, timestamp, message }` |
| `subscriptionConfirmed` | Subscription created | `{ subscriptionId, filters, timestamp }` |
| `subscriptionRemoved` | Subscription removed | `{ subscriptionId, timestamp }` |
| `allSubscriptionsRemoved` | All subscriptions cleared | `{ count, timestamp }` |
| `subscriptions` | List of subscriptions | `{ subscriptions, count, timestamp }` |
| `newListing` | New listing notification | `{ listing, matchedSubscriptions, timestamp }` |
| `listingUpdate` | Listing update notification | `{ listingId, updates, timestamp }` |
| `error` | Error message | `{ code, message, details? }` |
| `heartbeat` | Keep-alive ping | `{ timestamp }` |

## Usage

### Client Connection Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling'],
  reconnection: true,
});

// Handle connection
socket.on('connect', () => {
  console.log('Connected to server');
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

// Subscribe to listings
socket.emit('subscribe', {
  district: 'Seminyak',
  priceMin: 500,
  priceMax: 2000,
  currency: 'USD',
  bedroomsMin: 1,
  furnished: true
});

// Handle new listings
socket.on('newListing', (data) => {
  console.log('New listing:', data.listing);
  console.log('Matched subscriptions:', data.matchedSubscriptions);
});

// Handle errors
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Respond to heartbeat
socket.on('heartbeat', () => {
  socket.emit('pong');
});
```

### Subscription Filters

```typescript
interface SubscriptionDto {
  subscriptionId?: string;      // Optional custom ID
  district?: string;            // District name
  priceMin?: number;           // Minimum price
  priceMax?: number;           // Maximum price
  currency?: string;           // Currency code
  bedroomsMin?: number;        // Minimum bedrooms
  bedroomsMax?: number;        // Maximum bedrooms
  location?: {                // Location-based filter
    latitude: number;
    longitude: number;
    radiusKm: number;          // Radius in kilometers (0.1-50)
  };
  furnished?: boolean;         // Furnished status
  petsAllowed?: boolean;       // Pet-friendly
  amenities?: string[];        // Required amenities
}
```

## API Endpoints

### GET /api/websocket/stats
Returns current WebSocket statistics including:
- Active connections with details
- Active subscriptions
- Rate limiting configuration

Response example:
```json
{
  "connections": {
    "totalConnections": 2,
    "connections": [
      {
        "clientId": "abc123",
        "connectedAt": "2025-01-01T10:00:00Z",
        "lastActivity": "2025-01-01T10:05:00Z",
        "messageCount": 15,
        "uptime": 300,
        "address": "127.0.0.1"
      }
    ],
    "messageRateLimit": 100,
    "messageRateWindow": 60000
  },
  "subscriptions": {
    "totalClients": 2,
    "totalSubscriptions": 5,
    "avgSubscriptionsPerClient": 2.5,
    "subscriptionsByClient": [
      {
        "clientId": "abc123",
        "count": 3
      }
    ]
  },
  "timestamp": "2025-01-01T10:05:00Z"
}
```

## Testing

Use the included test client to verify WebSocket functionality:

1. Open `src/modules/websocket/test-client.html` in a browser
2. Click "Connect" to establish WebSocket connection
3. Configure filters and click "Subscribe"
4. Monitor the message log for events

## Architecture

```
WebSocketModule
├── WebSocketGateway         # Main gateway handling connections
├── SubscriptionService      # Manages client subscriptions
├── ConnectionManagerService # Tracks connections and rate limiting
└── WebSocketController      # REST API for statistics
```

## Configuration

Environment variables:
- `CORS_ORIGIN`: Allowed origins for WebSocket connections (default: `http://localhost:5173`)
- `REDIS_URL`: Redis connection URL for future scaling

## Error Codes

| Code | Description |
|------|-------------|
| `RATE_LIMIT_EXCEEDED` | Client exceeded message rate limit |
| `MAX_SUBSCRIPTIONS_REACHED` | Client reached 10 subscription limit |
| `SUBSCRIPTION_NOT_FOUND` | Subscription ID not found |
| `SUBSCRIPTION_ERROR` | Failed to create subscription |
| `UNSUBSCRIBE_ERROR` | Failed to unsubscribe |

## Performance Considerations

- Subscriptions are stored in memory (consider Redis for production scaling)
- Heartbeat interval: 30 seconds
- Inactive timeout: 5 minutes
- Rate limit: 100 messages/minute per client
- Maximum subscriptions: 10 per client
- Location radius search: 0.1-50 km

## Security

- Rate limiting prevents abuse
- Automatic disconnection of inactive clients
- Input validation on all subscription filters
- CORS configuration for allowed origins