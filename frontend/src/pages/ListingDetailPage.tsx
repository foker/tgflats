import { useParams, Link } from 'react-router-dom'
import {
  Box,
  Container,
  Grid,
  GridItem,
  Text,
  Heading,
  VStack,
  HStack,
  Badge,
  Button,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Divider,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react'
import { ArrowBackIcon, ExternalLinkIcon, PhoneIcon } from '@chakra-ui/icons'
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaDollarSign } from 'react-icons/fa'
import { useListing } from '../hooks/useListings'
import ImageGallery from '../components/ImageGallery'
import ShareButton from '../components/ShareButton'

const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data: listing, isLoading, error } = useListing(id!)

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Center h="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading listing details...</Text>
          </VStack>
        </Center>
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error loading listing!</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'Listing not found'}
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  if (!listing) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Listing not found</AlertTitle>
          <AlertDescription>
            The listing you're looking for doesn't exist or has been removed.
          </AlertDescription>
        </Alert>
      </Container>
    )
  }

  const formatPrice = (price?: number, currency = 'GEL') => {
    if (!price) return 'Price not specified'
    return `${price.toLocaleString()} ${currency}`
  }

  const getPriceDisplay = () => {
    if (listing.price) {
      return formatPrice(listing.price, listing.currency)
    } else if (listing.priceMin && listing.priceMax) {
      return `${formatPrice(listing.priceMin, listing.currency)} - ${formatPrice(listing.priceMax, listing.currency)}`
    }
    return 'Price not specified'
  }

  return (
    <Container maxW="container.xl" py={8}>
      {/* Breadcrumb */}
      <Breadcrumb mb={6}>
        <BreadcrumbItem>
          <BreadcrumbLink as={Link} to="/">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href="#">Listing Details</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Back Button */}
      <Button
        as={Link}
        to="/"
        leftIcon={<ArrowBackIcon />}
        variant="ghost"
        mb={6}
      >
        Back to Listings
      </Button>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
        {/* Main Content */}
        <GridItem>
          {/* Image Gallery */}
          <Box mb={6}>
            <ImageGallery 
              images={listing.imageUrls || []} 
              title={`${listing.district || 'Property'} Rental`}
              height="500px"
            />
          </Box>

          {/* Title and Status */}
          <VStack align="start" spacing={4} mb={6}>
            <HStack justify="space-between" width="100%">
              <HStack>
                <Heading size="lg">{listing.district || 'Property'} Rental</Heading>
                <Badge
                  colorScheme={listing.status === 'ACTIVE' ? 'green' : 'gray'}
                  variant="solid"
                >
                  {listing.status}
                </Badge>
              </HStack>
              
              {/* Share Button */}
              <ShareButton 
                url={`/listing/${listing.id}`}
                title={`${listing.district || 'Property'} Rental`}
                description={`${getPriceDisplay()} • ${listing.address || ''}`}
              />
            </HStack>

            {/* Price */}
            <HStack>
              <Icon as={FaDollarSign} color="green.500" />
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {getPriceDisplay()}
              </Text>
            </HStack>

            {/* Location */}
            {listing.address && (
              <HStack>
                <Icon as={FaMapMarkerAlt} color="red.500" />
                <Text>{listing.address}</Text>
              </HStack>
            )}
          </VStack>

          {/* Property Details */}
          <Box bg="white" p={6} rounded="lg" shadow="sm" mb={6}>
            <Heading size="md" mb={4}>Property Details</Heading>
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
              {listing.bedrooms && (
                <HStack>
                  <Icon as={FaBed} color="blue.500" />
                  <Text>
                    <Text as="span" fontWeight="bold">{listing.bedrooms}</Text> Bedrooms
                  </Text>
                </HStack>
              )}

              {listing.areaSqm && (
                <HStack>
                  <Icon as={FaRulerCombined} color="purple.500" />
                  <Text>
                    <Text as="span" fontWeight="bold">{listing.areaSqm}</Text> m²
                  </Text>
                </HStack>
              )}

              {listing.petsAllowed !== undefined && (
                <Text>
                  <Text as="span" fontWeight="bold">Pets:</Text>{' '}
                  {listing.petsAllowed ? 'Allowed' : 'Not allowed'}
                </Text>
              )}

              {listing.furnished !== undefined && (
                <Text>
                  <Text as="span" fontWeight="bold">Furnished:</Text>{' '}
                  {listing.furnished ? 'Yes' : 'No'}
                </Text>
              )}
            </Grid>
          </Box>

          {/* Description */}
          {listing.description && (
            <Box bg="white" p={6} rounded="lg" shadow="sm" mb={6}>
              <Heading size="md" mb={4}>Description</Heading>
              <Text whiteSpace="pre-wrap">{listing.description}</Text>
            </Box>
          )}

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <Box bg="white" p={6} rounded="lg" shadow="sm" mb={6}>
              <Heading size="md" mb={4}>Amenities</Heading>
              <HStack wrap="wrap" spacing={2}>
                {listing.amenities.map((amenity, index) => (
                  <Badge key={index} colorScheme="blue" variant="outline">
                    {amenity}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}
        </GridItem>

        {/* Sidebar */}
        <GridItem>
          <VStack spacing={6} align="stretch">
            {/* Contact Info */}
            {listing.contactInfo && (
              <Box bg="white" p={6} rounded="lg" shadow="sm">
                <Heading size="md" mb={4}>Contact Information</Heading>
                <HStack>
                  <Icon as={PhoneIcon} color="green.500" />
                  <Text fontFamily="mono">{listing.contactInfo}</Text>
                </HStack>
              </Box>
            )}

            {/* Source Link */}
            {listing.sourceUrl && (
              <Box bg="white" p={6} rounded="lg" shadow="sm">
                <Heading size="md" mb={4}>Original Post</Heading>
                <Button
                  as="a"
                  href={listing.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  rightIcon={<ExternalLinkIcon />}
                  colorScheme="blue"
                  size="sm"
                  w="full"
                >
                  View Source
                </Button>
              </Box>
            )}

            {/* Listing Info */}
            <Box bg="white" p={6} rounded="lg" shadow="sm">
              <Heading size="md" mb={4}>Listing Information</Heading>
              <VStack align="start" spacing={2}>
                <Text fontSize="sm" color="gray.600">
                  <Text as="span" fontWeight="bold">Posted:</Text>{' '}
                  {new Date(listing.createdAt).toLocaleDateString()}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  <Text as="span" fontWeight="bold">Updated:</Text>{' '}
                  {new Date(listing.updatedAt).toLocaleDateString()}
                </Text>
                {listing.confidence && (
                  <Text fontSize="sm" color="gray.600">
                    <Text as="span" fontWeight="bold">AI Confidence:</Text>{' '}
                    {Math.round(listing.confidence * 100)}%
                  </Text>
                )}
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Container>
  )
}

export default ListingDetailPage