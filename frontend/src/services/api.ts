import axios from 'axios'
import { Listing, ListingFilters, SearchResponse, ListingCluster, MapBounds } from '../types'

// API client configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const listingsApi = {
  // Get listings with filters and pagination
  getListings: async (filters: ListingFilters & { page?: number; limit?: number }): Promise<SearchResponse<Listing>> => {
    const response = await api.get('/listings', { params: filters })
    const { data, meta } = response.data
    return {
      data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      hasMore: meta.hasNext
    }
  },

  // Get single listing by ID
  getListing: async (id: string): Promise<Listing> => {
    const response = await api.get(`/listings/${id}`)
    return response.data
  },

  // Search listings with text query
  searchListings: async (query: string, filters?: ListingFilters): Promise<SearchResponse<Listing>> => {
    const response = await api.get('/listings/search', {
      params: { q: query, ...filters }
    })
    const { data, meta } = response.data
    return {
      data,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      hasMore: meta.hasNext
    }
  },

  // Get listings for map view with clustering
  getMapListings: async (bounds: MapBounds, zoom: number): Promise<ListingCluster[]> => {
    const response = await api.get('/listings/map', {
      params: {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
        zoom
      }
    })
    return response.data
  },

  // Get listing statistics
  getStats: async (): Promise<{
    total: number
    byDistrict: Record<string, number>
    averagePrice: number
    priceRange: { min: number; max: number }
  }> => {
    const response = await api.get('/listings/stats')
    return response.data
  }
}

// Export the axios instance for custom requests
export default api