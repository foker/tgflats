import { useState, useMemo } from 'react'
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Button,
  useBreakpointValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
} from '@chakra-ui/react'
import { ViewIcon, HamburgerIcon } from '@chakra-ui/icons'
import SearchFilters from '../components/SearchFilters'
import ListingsGrid from '../components/ListingsGrid'
import VirtualListingsGrid from '../components/VirtualListingsGrid'
import LeafletMap from '../components/map/LeafletMap'
import { useListings, useInfiniteListings } from '../hooks/useListings'
import { useUrlFilters } from '../hooks/useUrlFilters'
import { ListingFilters } from '../types'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [useVirtualScroll, setUseVirtualScroll] = useState(true) // Virtual scroll enabled by default
  const isMobile = useBreakpointValue({ base: true, lg: false })
  const navigate = useNavigate()
  
  // Use URL-synced filters
  const { filters, updateFilters, clearFilters, getShareableUrl } = useUrlFilters()
  const currentPage = filters.page || 1
  
  // Force map resize when switching to map view
  const handleViewChange = (newView: 'list' | 'map') => {
    setView(newView);
    if (newView === 'map') {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }

  // Regular pagination query for classic mode
  const { data: paginatedData, isLoading: isPaginatedLoading, error: paginatedError } = useListings({
    ...filters,
    page: currentPage,
    limit: 20,
  }, { enabled: !useVirtualScroll })

  // Infinite query for virtual scroll mode
  const {
    data: infiniteData,
    error: infiniteError,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading: isInfiniteLoading,
  } = useInfiniteListings({ ...filters, limit: 20 }, { enabled: useVirtualScroll })

  // Combine all pages of infinite data
  const allListings = useMemo(() => {
    if (!infiniteData?.pages) return []
    return infiniteData.pages.flatMap(page => page.data || [])
  }, [infiniteData])

  // Get total from meta or from the response directly
  const getTotal = () => {
    if (useVirtualScroll && infiniteData?.pages?.[0]) {
      const firstPage = infiniteData.pages[0]
      return firstPage.meta?.total || firstPage.total || 0
    }
    return paginatedData?.meta?.total || paginatedData?.total || 0
  }

  // Use appropriate data and loading state based on mode
  const data = useVirtualScroll 
    ? { data: allListings, total: getTotal(), meta: infiniteData?.pages?.[0]?.meta } 
    : paginatedData
  const isLoading = useVirtualScroll ? isInfiniteLoading : isPaginatedLoading
  const error = useVirtualScroll ? infiniteError : paginatedError

  const handleFiltersChange = (newFilters: ListingFilters) => {
    // Reset page to 1 when filters change (except when just changing page)
    const filtersWithPage = { ...newFilters, page: 1 }
    updateFilters(filtersWithPage)
  }

  const handlePageChange = (page: number) => {
    updateFilters({ page })
  }

  const handleListingClick = (listing: any) => {
    navigate(`/listing/${listing.id}`)
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error loading listings!</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Something went wrong'}
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxW="full" p={0}>
      <Flex h="calc(100vh - 80px)">
        {/* Filters Sidebar */}
        <Box
          w={isMobile ? 'full' : '300px'}
          bg="white"
          borderRight="1px"
          borderColor="gray.200"
          overflowY="auto"
          position={isMobile ? 'absolute' : 'relative'}
          zIndex={5}
          h="full"
        >
          <SearchFilters 
            filters={filters} 
            onFiltersChange={handleFiltersChange}
            isLoading={isLoading}
            onShareSearch={getShareableUrl}
          />
        </Box>

        {/* Main Content */}
        <Box flex={1} position="relative">
          {/* View Toggle and Virtual Scroll Switch */}
          <Box
            position="absolute"
            top={4}
            right={4}
            zIndex={10}
            bg="white"
            rounded="md"
            shadow="md"
            p={3}
          >
            <VStack align="start" spacing={3}>
              <HStack spacing={0}>
                <Button
                  size="sm"
                  variant={view === 'list' ? 'solid' : 'ghost'}
                  colorScheme={view === 'list' ? 'blue' : 'gray'}
                  leftIcon={<HamburgerIcon />}
                  onClick={() => handleViewChange('list')}
                  borderRadius="md"
                >
                  List
                </Button>
                <Button
                  size="sm"
                  variant={view === 'map' ? 'solid' : 'ghost'}
                  colorScheme={view === 'map' ? 'blue' : 'gray'}
                  leftIcon={<ViewIcon />}
                  onClick={() => handleViewChange('map')}
                  borderRadius="md"
                >
                  Map
                </Button>
              </HStack>
              
              {/* Virtual Scroll Toggle - only show in list view */}
              {view === 'list' && (
                <FormControl display="flex" alignItems="center">
                  <Tooltip label="Virtual scrolling improves performance for large lists">
                    <FormLabel htmlFor="virtual-scroll" mb="0" fontSize="xs" cursor="pointer">
                      Virtual Scroll
                    </FormLabel>
                  </Tooltip>
                  <Switch
                    id="virtual-scroll"
                    size="sm"
                    isChecked={useVirtualScroll}
                    onChange={(e) => setUseVirtualScroll(e.target.checked)}
                    colorScheme="blue"
                  />
                </FormControl>
              )}
            </VStack>
          </Box>

          {/* Content Area */}
          <Box h="full" position="relative">
            {isLoading && (!data?.data || data.data.length === 0) ? (
              <Center h="full">
                <VStack spacing={4}>
                  <Spinner size="xl" color="blue.500" />
                  <Box>Loading listings...</Box>
                </VStack>
              </Center>
            ) : view === 'list' ? (
              useVirtualScroll ? (
                <VirtualListingsGrid
                  listings={data?.data || []}
                  isLoading={isLoading}
                  total={data?.total || 0}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  onListingClick={handleListingClick}
                />
              ) : (
                <ListingsGrid 
                  listings={data?.data || []} 
                  isLoading={isLoading}
                  total={data?.total || 0}
                  currentPage={currentPage}
                  totalPages={Math.ceil((data?.total || 0) / 20)}
                  onPageChange={handlePageChange}
                />
              )
            ) : (
              <LeafletMap 
                listings={data?.data || []}
                isLoading={isLoading}
                onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
              />
            )}
          </Box>
        </Box>
      </Flex>
    </Container>
  )
}

export default HomePage