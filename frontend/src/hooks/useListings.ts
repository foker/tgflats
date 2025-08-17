import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { listingsApi } from '../services/api'
import { ListingFilters, MapBounds } from '../types'

// Hook for fetching listings with pagination
export const useListings = (
  filters: ListingFilters & { page?: number; limit?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      console.log('🔍 Fetching listings with filters:', filters)
      try {
        const result = await listingsApi.getListings(filters)
        console.log('✅ Successfully fetched listings:', result)
        return result
      } catch (error) {
        console.error('❌ Error fetching listings:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false,
  })
}

// Hook for infinite scroll listings
export const useInfiniteListings = (
  filters: ListingFilters & { limit?: number },
  options?: { enabled?: boolean }
) => {
  return useInfiniteQuery({
    queryKey: ['listings-infinite', filters],
    queryFn: ({ pageParam = 1 }) => 
      listingsApi.getListings({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      // Handle both response formats
      if (lastPage.meta) {
        return lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined
      }
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled !== false,
  })
}

// Hook for single listing
export const useListing = (id: string) => {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingsApi.getListing(id),
    enabled: !!id,
  })
}

// Hook for search
export const useSearchListings = (query: string, filters?: ListingFilters) => {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => listingsApi.searchListings(query, filters),
    enabled: !!query.trim(),
    staleTime: 2 * 60 * 1000, // 2 minutes for search results
  })
}

// Hook for map listings
export const useMapListings = (bounds: MapBounds, zoom: number) => {
  return useQuery({
    queryKey: ['map-listings', bounds, zoom],
    queryFn: () => listingsApi.getMapListings(bounds, zoom),
    staleTime: 1 * 60 * 1000, // 1 minute for map data
  })
}

// Hook for statistics
export const useListingsStats = () => {
  return useQuery({
    queryKey: ['listings-stats'],
    queryFn: () => listingsApi.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}