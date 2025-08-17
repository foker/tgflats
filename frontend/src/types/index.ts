// Re-export everything from listing.ts
export * from './listing'

// Additional types for the TBI-Prop application
export interface TelegramChannel {
  id: string
  channelId: string
  username?: string
  title: string
  isActive: boolean
  lastParsed?: string
  createdAt: string
  updatedAt: string
}

export interface TelegramPost {
  id: string
  channelId: string
  messageId: number
  text?: string
  photos: string[]
  createdAt: string
  rawData?: any
  processed: boolean
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface ListingCluster {
  id: string
  latitude: number
  longitude: number
  count: number
  listings: any[] // Use any for now to avoid circular dependency
  priceRange: {
    min: number
    max: number
  }
}

export interface SearchResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}