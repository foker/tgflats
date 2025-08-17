import {
  SimpleGrid,
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
  Divider,
} from '@chakra-ui/react'
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaDollarSign, FaPaw, FaCouch } from 'react-icons/fa'
import { ExternalLinkIcon, ViewIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom'
import { Listing } from '../types'
import ImageThumbnail from './ImageThumbnail'
import ShareButton from './ShareButton'

interface ListingsGridProps {
  listings: Listing[]
  isLoading: boolean
  total: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

const ListingsGrid = ({ listings, isLoading, total, currentPage, totalPages, onPageChange }: ListingsGridProps) => {
  const columns = useBreakpointValue({ base: 1, md: 2, lg: 3, xl: 4 })

  const formatPrice = (listing: Listing) => {
    if (listing.price) {
      return `${listing.price.toLocaleString()} ${listing.currency}`
    } else if (listing.priceMin && listing.priceMax) {
      return `${listing.priceMin.toLocaleString()} - ${listing.priceMax.toLocaleString()} ${listing.currency}`
    }
    return 'Price not specified'
  }


  if (isLoading) {
    return (
      <Box p={6} h="full" overflowY="auto">
        <SimpleGrid columns={columns} spacing={6}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index}>
              <Skeleton height="200px" />
              <CardBody>
                <VStack align="start" spacing={3}>
                  <SkeletonText noOfLines={2} spacing="4" skeletonHeight="2" />
                  <SkeletonText noOfLines={1} spacing="4" skeletonHeight="2" />
                  <SkeletonText noOfLines={3} spacing="4" skeletonHeight="2" />
                </VStack>
              </CardBody>
            </Card>
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
    <Box p={6} h="full" overflowY="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="semibold" color="gray.700">
          {total.toLocaleString()} properties found
        </Text>
      </Flex>

      {/* Listings Grid */}
      <SimpleGrid columns={columns} spacing={6}>
        {listings.map((listing) => (
          <Card key={listing.id} overflow="hidden" _hover={{ shadow: 'lg' }} transition="all 0.2s">
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
        ))}
      </SimpleGrid>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <>
          <Divider my={6} />
          <Flex justify="space-between" align="center" mb={4}>
            <Text fontSize="sm" color="gray.600">
              Page {currentPage} of {totalPages}
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                onClick={() => onPageChange(currentPage! - 1)}
                disabled={currentPage === 1}
                variant="outline"
              >
                Previous
              </Button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage! <= 3) {
                  pageNum = i + 1;
                } else if (currentPage! >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage! - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    variant={currentPage === pageNum ? "solid" : "outline"}
                    colorScheme={currentPage === pageNum ? "blue" : "gray"}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="sm"
                onClick={() => onPageChange(currentPage! + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Next
              </Button>
            </HStack>
          </Flex>
        </>
      )}
    </Box>
  )
}

export default ListingsGrid