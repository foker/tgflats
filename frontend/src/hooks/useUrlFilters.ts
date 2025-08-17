import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ListingFilters } from '../types'

/**
 * Hook for managing filter state synchronized with URL parameters
 */
export const useUrlFilters = (initialFilters: ListingFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState<ListingFilters>(initialFilters)

  // Parse URL parameters to filters object
  const parseFiltersFromUrl = useCallback((): ListingFilters => {
    const urlFilters: ListingFilters = {}

    // Search query
    const q = searchParams.get('q')
    if (q) urlFilters.q = q

    // Price filters
    const priceMin = searchParams.get('priceMin')
    if (priceMin && !isNaN(Number(priceMin))) {
      urlFilters.priceMin = Number(priceMin)
    }
    
    const priceMax = searchParams.get('priceMax')
    if (priceMax && !isNaN(Number(priceMax))) {
      urlFilters.priceMax = Number(priceMax)
    }

    // Room filters
    const rooms = searchParams.get('rooms')
    if (rooms && !isNaN(Number(rooms))) {
      urlFilters.rooms = Number(rooms)
    }

    // Area filters
    const areaMin = searchParams.get('areaMin')
    if (areaMin && !isNaN(Number(areaMin))) {
      urlFilters.areaMin = Number(areaMin)
    }

    const areaMax = searchParams.get('areaMax')
    if (areaMax && !isNaN(Number(areaMax))) {
      urlFilters.areaMax = Number(areaMax)
    }

    // Location filters
    const district = searchParams.get('district')
    if (district) urlFilters.district = district

    // Boolean filters
    const petFriendly = searchParams.get('petFriendly')
    if (petFriendly === '1' || petFriendly === 'true') {
      urlFilters.petFriendly = true
    }

    const furnished = searchParams.get('furnished')
    if (furnished === '1' || furnished === 'true') {
      urlFilters.furnished = true
    }

    // Amenities (comma-separated)
    const amenities = searchParams.get('amenities')
    if (amenities) {
      urlFilters.amenities = amenities.split(',').filter(Boolean)
    }

    // Pagination
    const page = searchParams.get('page')
    if (page && !isNaN(Number(page))) {
      urlFilters.page = Number(page)
    }

    // Sorting
    const sort = searchParams.get('sort')
    if (sort) urlFilters.sort = sort

    return urlFilters
  }, [searchParams])

  // Convert filters object to URL parameters
  const filtersToUrlParams = useCallback((filtersToConvert: ListingFilters): URLSearchParams => {
    const params = new URLSearchParams()

    // Search query
    if (filtersToConvert.q) {
      params.set('q', filtersToConvert.q)
    }

    // Price filters
    if (filtersToConvert.priceMin !== undefined) {
      params.set('priceMin', filtersToConvert.priceMin.toString())
    }
    if (filtersToConvert.priceMax !== undefined) {
      params.set('priceMax', filtersToConvert.priceMax.toString())
    }

    // Room filters
    if (filtersToConvert.rooms !== undefined) {
      params.set('rooms', filtersToConvert.rooms.toString())
    }

    // Area filters
    if (filtersToConvert.areaMin !== undefined) {
      params.set('areaMin', filtersToConvert.areaMin.toString())
    }
    if (filtersToConvert.areaMax !== undefined) {
      params.set('areaMax', filtersToConvert.areaMax.toString())
    }

    // Location filters
    if (filtersToConvert.district) {
      params.set('district', filtersToConvert.district)
    }

    // Boolean filters
    if (filtersToConvert.petFriendly) {
      params.set('petFriendly', '1')
    }
    if (filtersToConvert.furnished) {
      params.set('furnished', '1')
    }

    // Amenities
    if (filtersToConvert.amenities && filtersToConvert.amenities.length > 0) {
      params.set('amenities', filtersToConvert.amenities.join(','))
    }

    // Pagination
    if (filtersToConvert.page && filtersToConvert.page > 1) {
      params.set('page', filtersToConvert.page.toString())
    }

    // Sorting
    if (filtersToConvert.sort) {
      params.set('sort', filtersToConvert.sort)
    }

    return params
  }, [])

  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters = parseFiltersFromUrl()
    setFilters(prev => ({ ...prev, ...urlFilters }))
  }, [parseFiltersFromUrl])

  // Update filters and URL
  const updateFilters = useCallback((newFilters: ListingFilters, replaceUrl = false) => {
    // Merge with existing filters
    const mergedFilters = { ...filters, ...newFilters }
    
    // Remove undefined values
    Object.keys(mergedFilters).forEach(key => {
      if (mergedFilters[key as keyof ListingFilters] === undefined) {
        delete mergedFilters[key as keyof ListingFilters]
      }
    })

    setFilters(mergedFilters)
    
    // Update URL
    const params = filtersToUrlParams(mergedFilters)
    setSearchParams(params, { replace: replaceUrl })
  }, [filters, filtersToUrlParams, setSearchParams])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({})
    setSearchParams({})
  }, [setSearchParams])

  // Get shareable URL with current filters
  const getShareableUrl = useCallback(() => {
    const params = filtersToUrlParams(filters)
    const baseUrl = window.location.origin + window.location.pathname
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl
  }, [filters, filtersToUrlParams])

  // Backward compatibility - map new filter names to old ones
  const compatibilityFilters: ListingFilters = {
    ...filters,
    // Map new names to old names for API compatibility
    search: filters.q,
    minPrice: filters.priceMin,
    maxPrice: filters.priceMax,
    bedrooms: filters.rooms,
    minArea: filters.areaMin,
    maxArea: filters.areaMax,
    petsAllowed: filters.petFriendly,
    query: filters.q,
    districts: filters.district ? [filters.district] : undefined,
    maxRooms: filters.rooms,
  }

  return {
    filters: compatibilityFilters,
    updateFilters,
    clearFilters,
    getShareableUrl,
    rawFilters: filters, // Raw filters without compatibility mapping
  }
}

export default useUrlFilters