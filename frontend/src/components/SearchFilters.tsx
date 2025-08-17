import { useState, useEffect } from 'react'
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Text,
  HStack,
  Select,
  Checkbox,
  Badge,
  Wrap,
  WrapItem,
  Divider,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { SearchIcon, CloseIcon, CopyIcon } from '@chakra-ui/icons'
import { ListingFilters } from '../types'
import SavedSearches from './SavedSearches'

interface SearchFiltersProps {
  filters: ListingFilters
  onFiltersChange: (filters: ListingFilters) => void
  isLoading?: boolean
  onShareSearch?: () => string // Function to get shareable URL
}

const SearchFilters = ({ filters, onFiltersChange, isLoading, onShareSearch }: SearchFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ListingFilters>(filters)
  const [searchQuery, setSearchQuery] = useState(filters.q || filters.search || '')
  const [priceRange, setPriceRange] = useState([
    filters.priceMin || filters.minPrice || 0, 
    filters.priceMax || filters.maxPrice || 5000
  ])

  // Update local filters when props change
  useEffect(() => {
    setLocalFilters(filters)
    setSearchQuery(filters.q || filters.search || '')
    setPriceRange([
      filters.priceMin || filters.minPrice || 0, 
      filters.priceMax || filters.maxPrice || 5000
    ])
  }, [filters])

  const handleApplyFilters = () => {
    const updatedFilters = {
      ...localFilters,
      priceMin: priceRange[0] > 0 ? priceRange[0] : undefined,
      priceMax: priceRange[1] < 5000 ? priceRange[1] : undefined,
    }

    // Add search query to filters
    if (searchQuery.trim()) {
      updatedFilters.q = searchQuery.trim()
    } else {
      delete updatedFilters.q
    }

    onFiltersChange(updatedFilters)
  }

  const handleQuickSearch = () => {
    const searchFilters: ListingFilters = {
      q: searchQuery.trim() || undefined
    }
    onFiltersChange(searchFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: ListingFilters = {}
    setLocalFilters(clearedFilters)
    setSearchQuery('')
    setPriceRange([0, 5000])
    onFiltersChange(clearedFilters)
  }

  const updateFilter = (key: keyof ListingFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleShareSearch = async () => {
    if (!onShareSearch) return
    
    const shareableUrl = onShareSearch()
    
    try {
      await navigator.clipboard.writeText(shareableUrl)
      // Could add toast notification here
      console.log('✅ Search URL copied to clipboard:', shareableUrl)
    } catch (err) {
      console.error('❌ Failed to copy to clipboard:', err)
      // Fallback: open in new tab or show URL in alert
      window.prompt('Copy this URL to share your search:', shareableUrl)
    }
  }

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = localFilters.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity]
    
    updateFilter('amenities', newAmenities.length > 0 ? newAmenities : undefined)
  }

  const activeFiltersCount = Object.keys(localFilters).filter(
    key => localFilters[key as keyof ListingFilters] !== undefined
  ).length

  const tbilisiDistricts = [
    'Vake',
    'Saburtalo',
    'Old Tbilisi',
    'Gldani',
    'Isani',
    'Didube',
    'Chugureti',
    'Krtsanisi',
    'Mtatsminda',
    'Nadzaladevi',
  ]

  const popularAmenities = [
    'Parking',
    'Balcony',
    'Air Conditioning',
    'Washing Machine',
    'Internet',
    'Elevator',
    'Security',
    'Garden',
  ]

  return (
    <Box p={6} h="full" overflowY="auto">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Heading size="md">Filters</Heading>
          {activeFiltersCount > 0 && (
            <Badge colorScheme="blue" variant="solid">
              {activeFiltersCount}
            </Badge>
          )}
        </HStack>

        {/* Saved Searches */}
        <SavedSearches 
          currentFilters={filters}
          onLoadSearch={onFiltersChange}
        />

        <Divider />

        {/* Search */}
        <FormControl>
          <FormLabel>Search</FormLabel>
          <VStack spacing={3}>
            <HStack w="full">
              <Input
                placeholder="Search by address, district, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
              />
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleQuickSearch}
                isLoading={isLoading}
                disabled={!searchQuery.trim()}
              >
                <SearchIcon />
              </Button>
            </HStack>
            
            {/* Show current search filter if applied */}
            {(filters.q || filters.search) && (
              <HStack justify="space-between" w="full" p={2} bg="blue.50" borderRadius="md">
                <Text fontSize="sm" color="blue.700">
                  Searching: "{filters.q || filters.search}"
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={() => onFiltersChange({ ...filters, q: undefined, search: undefined })}
                >
                  <CloseIcon />
                </Button>
              </HStack>
            )}
          </VStack>
        </FormControl>

        <Divider />

        {/* Price Range */}
        <FormControl>
          <FormLabel>Price Range (GEL)</FormLabel>
          <VStack spacing={4}>
            <RangeSlider
              value={priceRange}
              onChange={setPriceRange}
              min={0}
              max={5000}
              step={50}
            >
              <RangeSliderTrack>
                <RangeSliderFilledTrack bg="blue.500" />
              </RangeSliderTrack>
              <RangeSliderThumb index={0} />
              <RangeSliderThumb index={1} />
            </RangeSlider>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600">
                {priceRange[0]} GEL
              </Text>
              <Text fontSize="sm" color="gray.600">
                {priceRange[1] >= 5000 ? '5000+ GEL' : `${priceRange[1]} GEL`}
              </Text>
            </HStack>
          </VStack>
        </FormControl>

        <Divider />

        {/* District */}
        <FormControl>
          <FormLabel>District</FormLabel>
          <Select
            placeholder="Any district"
            value={localFilters.district || localFilters.districts?.[0] || ''}
            onChange={(e) => updateFilter('district', e.target.value || undefined)}
          >
            {tbilisiDistricts.map(district => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </Select>
        </FormControl>

        {/* Bedrooms */}
        <FormControl>
          <FormLabel>Maximum Bedrooms</FormLabel>
          <NumberInput
            value={localFilters.rooms || localFilters.maxRooms || localFilters.bedrooms || ''}
            onChange={(_, num) => updateFilter('rooms', isNaN(num) ? undefined : num)}
            min={1}
            max={10}
          >
            <NumberInputField placeholder="Any" />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        {/* Area */}
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Minimum Area (m²)</FormLabel>
            <NumberInput
              value={localFilters.areaMin || localFilters.minArea || ''}
              onChange={(_, num) => updateFilter('areaMin', isNaN(num) ? undefined : num)}
              min={1}
            >
              <NumberInputField placeholder="Any" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Maximum Area (m²)</FormLabel>
            <NumberInput
              value={localFilters.areaMax || localFilters.maxArea || ''}
              onChange={(_, num) => updateFilter('areaMax', isNaN(num) ? undefined : num)}
              min={1}
            >
              <NumberInputField placeholder="Any" />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </VStack>

        <Divider />

        {/* Property Features */}
        <VStack spacing={4} align="stretch">
          <Checkbox
            isChecked={localFilters.petFriendly || localFilters.petsAllowed || false}
            onChange={(e) => updateFilter('petFriendly', e.target.checked ? true : undefined)}
          >
            Pets Allowed
          </Checkbox>

          <Checkbox
            isChecked={localFilters.furnished || false}
            onChange={(e) => updateFilter('furnished', e.target.checked ? true : undefined)}
          >
            Furnished
          </Checkbox>
        </VStack>

        <Divider />

        {/* Amenities */}
        <FormControl>
          <FormLabel>Amenities</FormLabel>
          <Wrap spacing={2}>
            {popularAmenities.map(amenity => (
              <WrapItem key={amenity}>
                <Button
                  size="xs"
                  variant={localFilters.amenities?.includes(amenity) ? 'solid' : 'outline'}
                  colorScheme="blue"
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Button>
              </WrapItem>
            ))}
          </Wrap>
        </FormControl>

        <Divider />

        {/* Action Buttons */}
        <VStack spacing={3}>
          <Button
            colorScheme="blue"
            size="lg"
            w="full"
            onClick={handleApplyFilters}
            isLoading={isLoading}
            leftIcon={<SearchIcon />}
          >
            Apply Filters
          </Button>

          <HStack w="full" spacing={2}>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                flex={1}
                onClick={handleClearFilters}
                leftIcon={<CloseIcon />}
              >
                Clear All
              </Button>
            )}
            
            {onShareSearch && activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                flex={1}
                onClick={handleShareSearch}
                leftIcon={<CopyIcon />}
                colorScheme="green"
              >
                Share Search
              </Button>
            )}
          </HStack>
        </VStack>
      </VStack>
    </Box>
  )
}

export default SearchFilters