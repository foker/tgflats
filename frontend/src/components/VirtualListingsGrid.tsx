import { useRef, useCallback, useMemo, memo, useEffect } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Image,
  Card,
  CardBody,
  Heading,
  Button,
  IconButton,
  Skeleton,
  SkeletonText,
  useBreakpointValue,
  Flex,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react'
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaDollarSign, FaPaw, FaCouch } from 'react-icons/fa'
import { ExternalLinkIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { Listing } from '../types'
import { useVirtualizer } from '@tanstack/react-virtual'
import ImageThumbnail from './ImageThumbnail'
import ShareButton from './ShareButton'

interface VirtualListingsGridProps {
  listings: Listing[]
  isLoading: boolean
  total: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  onListingClick?: (listing: Listing) => void
}

// Memoized listing card component for better performance
const ListingCard = memo(({ listing, onListingClick }: { listing: Listing; onListingClick?: (listing: Listing) => void }) => {
  const formatPrice = (listing: Listing) => {
    if (listing.price) {
      return `${listing.price.toLocaleString()} ${listing.currency}`
    } else if (listing.priceMin && listing.priceMax) {
      return `${listing.priceMin.toLocaleString()} - ${listing.priceMax.toLocaleString()} ${listing.currency}`
    }
    return 'Price not specified'
  }

  return (
    <Card overflow="hidden" _hover={{ shadow: 'lg' }} transition="all 0.2s" h="full">
      {/* Image */}
      <Box position="relative">
        <ImageThumbnail
          images={listing.imageUrls}
          title={`Property in ${listing.district || 'Tbilisi'}`}
          height="200px"
          showCounter={true}
        />
        
        {/* Status Badge */}
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme={listing.status === 'ACTIVE' ? 'green' : 'gray'}
          variant="solid"
        >
          {listing.status}
        </Badge>

        {/* Price Badge */}
        <Box
          position="absolute"
          bottom={3}
          left={3}
          bg="blackAlpha.700"
          color="white"
          px={3}
          py={1}
          borderRadius="md"
          fontSize="sm"
          fontWeight="bold"
        >
          <HStack spacing={1}>
            <Icon as={FaDollarSign} />
            <Text>{formatPrice(listing)}</Text>
          </HStack>
        </Box>
      </Box>

      <CardBody>
        <VStack align="start" spacing={3}>
          {/* Title and Location */}
          <VStack align="start" spacing={1} w="full">
            <Heading size="sm" noOfLines={1}>
              {listing.district || 'Property'} - {listing.bedrooms || '?'} Bedroom
            </Heading>
            {listing.address && (
              <HStack spacing={1}>
                <Icon as={FaMapMarkerAlt} color="gray.500" boxSize={3} />
                <Text fontSize="sm" color="gray.600" noOfLines={1}>
                  {listing.address}
                </Text>
              </HStack>
            )}
          </VStack>

          {/* Property Details */}
          <HStack spacing={4} w="full" justify="space-between">
            {listing.bedrooms && (
              <HStack spacing={1}>
                <Icon as={FaBed} color="blue.500" boxSize={4} />
                <Text fontSize="sm" fontWeight="medium">
                  {listing.bedrooms}
                </Text>
              </HStack>
            )}

            {listing.areaSqm && (
              <HStack spacing={1}>
                <Icon as={FaRulerCombined} color="green.500" boxSize={4} />
                <Text fontSize="sm" fontWeight="medium">
                  {listing.areaSqm}m²
                </Text>
              </HStack>
            )}

            {listing.petsAllowed && (
              <Icon as={FaPaw} color="orange.500" boxSize={4} title="Pets allowed" />
            )}

            {listing.furnished && (
              <Icon as={FaCouch} color="purple.500" boxSize={4} title="Furnished" />
            )}
          </HStack>

          {/* Description */}
          {listing.description && (
            <Text fontSize="sm" color="gray.600" noOfLines={2}>
              {listing.description}
            </Text>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <HStack spacing={1} wrap="wrap">
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} size="sm" variant="outline" colorScheme="blue">
                  {amenity}
                </Badge>
              ))}
              {listing.amenities.length > 3 && (
                <Badge size="sm" variant="outline" colorScheme="gray">
                  +{listing.amenities.length - 3} more
                </Badge>
              )}
            </HStack>
          )}

          {/* Actions */}
          <HStack spacing={2} w="full" pt={2}>
            <Button
              as={Link}
              to={`/listing/${listing.id}`}
              size="sm"
              colorScheme="blue"
              flex={1}
              leftIcon={<ViewIcon />}
              onClick={(e) => {
                if (onListingClick) {
                  e.preventDefault()
                  onListingClick(listing)
                }
              }}
            >
              View Details
            </Button>

            <ShareButton 
              url={`/listing/${listing.id}`}
              title={`${listing.district || 'Property'} - ${listing.bedrooms || '?'} Bedroom`}
              description={`${formatPrice(listing)} • ${listing.address || ''}`}
              variant="icon"
            />

            {listing.sourceUrl && (
              <IconButton
                as="a"
                href={listing.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                variant="outline"
                colorScheme="gray"
                aria-label="View source"
                icon={<ExternalLinkIcon />}
              />
            )}
          </HStack>

          {/* Confidence Score */}
          {listing.confidence && (
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" color="gray.500">
                AI Confidence: {Math.round(listing.confidence * 100)}%
              </Text>
              <Text fontSize="xs" color="gray.500">
                {new Date(listing.createdAt).toLocaleDateString()}
              </Text>
            </HStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
})

ListingCard.displayName = 'ListingCard'

// Loading skeleton component
const LoadingCard = () => (
  <Card>
    <Skeleton height="200px" />
    <CardBody>
      <VStack align="start" spacing={3}>
        <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" />
        <SkeletonText noOfLines={1} spacing="4" skeletonHeight="2" />
        <SkeletonText noOfLines={3} spacing="4" skeletonHeight="2" />
      </VStack>
    </CardBody>
  </Card>
)

const VirtualListingsGrid = ({
  listings,
  isLoading,
  total,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onListingClick,
}: VirtualListingsGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const columns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 }) || 1
  
  // Calculate row height based on screen size
  const rowHeight = useBreakpointValue({ base: 450, md: 420, lg: 400 }) || 400
  
  // Calculate rows from listings
  const rows = useMemo(() => {
    const rowsArray = []
    for (let i = 0; i < listings.length; i += columns) {
      rowsArray.push(listings.slice(i, i + columns))
    }
    return rowsArray
  }, [listings, columns])

  // Virtual scrolling configuration
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 2, // Number of rows to render outside of the visible area
    paddingStart: 0,
    paddingEnd: 0,
  })

  // Load more when reaching the end
  useEffect(() => {
    const items = virtualizer.getVirtualItems()
    const lastItem = items[items.length - 1]

    if (
      lastItem &&
      lastItem.index >= rows.length - 2 &&
      hasNextPage &&
      !isFetchingNextPage &&
      fetchNextPage
    ) {
      fetchNextPage()
    }
  }, [virtualizer.getVirtualItems(), rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Save scroll position in sessionStorage
  const saveScrollPosition = useCallback(() => {
    if (parentRef.current) {
      sessionStorage.setItem('listingsScrollPosition', parentRef.current.scrollTop.toString())
    }
  }, [])

  // Restore scroll position
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('listingsScrollPosition')
    if (savedPosition && parentRef.current) {
      parentRef.current.scrollTop = parseInt(savedPosition, 10)
    }
  }, [])

  // Save position before unmount
  useEffect(() => {
    const parent = parentRef.current
    if (parent) {
      parent.addEventListener('scroll', saveScrollPosition)
      return () => {
        parent.removeEventListener('scroll', saveScrollPosition)
      }
    }
  }, [saveScrollPosition])

  if (isLoading && listings.length === 0) {
    return (
      <Box p={6} h="full" overflowY="auto">
        <SimpleGrid columns={columns} spacing={6}>
          {Array.from({ length: 8 }).map((_, index) => (
            <LoadingCard key={index} />
          ))}
        </SimpleGrid>
      </Box>
    )
  }

  if (listings.length === 0) {
    return (
      <Flex h="full" align="center" justify="center" direction="column" p={8}>
        <Icon as={FaMapMarkerAlt} boxSize={12} color="gray.400" mb={4} />
        <Heading size="lg" color="gray.600" mb={2}>
          No listings found
        </Heading>
        <Text color="gray.500" textAlign="center">
          Try adjusting your search filters to find more properties.
        </Text>
      </Flex>
    )
  }

  return (
    <Box h="full" position="relative">
      {/* Header */}
      <Flex
        position="sticky"
        top={0}
        bg="white"
        zIndex={1}
        p={4}
        borderBottom="1px"
        borderColor="gray.200"
        justify="space-between"
        align="center"
      >
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          {total.toLocaleString()} properties found
        </Text>
      </Flex>

      {/* Virtual scroll container */}
      <Box
        ref={parentRef}
        h="calc(100% - 60px)"
        overflowY="auto"
        px={6}
        pb={6}
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        <Box
          h={`${virtualizer.getTotalSize()}px`}
          w="100%"
          position="relative"
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <Box
                key={virtualRow.index}
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h={`${virtualRow.size}px`}
                transform={`translateY(${virtualRow.start}px)`}
              >
                <SimpleGrid columns={columns} spacing={6} h="full">
                  {row.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onListingClick={onListingClick}
                    />
                  ))}
                  {/* Fill empty cells in the last row */}
                  {row.length < columns &&
                    Array.from({ length: columns - row.length }).map((_, index) => (
                      <Box key={`empty-${index}`} />
                    ))}
                </SimpleGrid>
              </Box>
            )
          })}
        </Box>

        {/* Loading indicator for infinite scroll */}
        {isFetchingNextPage && (
          <Flex justify="center" py={4}>
            <HStack spacing={2}>
              <Skeleton height="20px" width="80px" />
              <Text fontSize="sm" color="gray.500">
                Loading more listings...
              </Text>
            </HStack>
          </Flex>
        )}
      </Box>
    </Box>
  )
}

export default VirtualListingsGrid