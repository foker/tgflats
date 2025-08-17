import { useState, useCallback, useMemo, useRef } from 'react'
import { Box, Center, VStack, Text, Spinner, Alert, AlertIcon } from '@chakra-ui/react'
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { Listing } from '../types'

interface MapWithClusteringProps {
  listings: Listing[]
  isLoading: boolean
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

// Tbilisi center coordinates
const center = {
  lat: 41.7151,
  lng: 44.8271,
}

const options = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  scaleControl: true,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true,
}

const MapWithClustering = ({ listings, isLoading }: MapWithClusteringProps) => {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  // Filter listings that have valid coordinates
  const validListings = useMemo(() => {
    return listings.filter(listing => 
      listing.latitude && 
      listing.longitude && 
      !isNaN(listing.latitude) && 
      !isNaN(listing.longitude)
    )
  }, [listings])

  // Simple clustering logic based on proximity
  const clusteredListings = useMemo(() => {
    if (validListings.length === 0) return []

    const clusters: { listings: Listing[], center: { lat: number, lng: number } }[] = []
    const CLUSTER_DISTANCE = 0.005 // Approximately 500m

    validListings.forEach(listing => {
      let addedToCluster = false

      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(cluster.center.lat - listing.latitude!, 2) +
          Math.pow(cluster.center.lng - listing.longitude!, 2)
        )

        if (distance < CLUSTER_DISTANCE) {
          cluster.listings.push(listing)
          // Recalculate center
          const avgLat = cluster.listings.reduce((sum, l) => sum + l.latitude!, 0) / cluster.listings.length
          const avgLng = cluster.listings.reduce((sum, l) => sum + l.longitude!, 0) / cluster.listings.length
          cluster.center = { lat: avgLat, lng: avgLng }
          addedToCluster = true
          break
        }
      }

      if (!addedToCluster) {
        clusters.push({
          listings: [listing],
          center: { lat: listing.latitude!, lng: listing.longitude! }
        })
      }
    })

    return clusters
  }, [validListings])

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
    
    // Fit map to show all markers if we have listings
    if (validListings.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      validListings.forEach(listing => {
        bounds.extend({
          lat: listing.latitude!,
          lng: listing.longitude!,
        })
      })
      map.fitBounds(bounds)
    }
  }, [validListings])

  const formatPrice = (listing: Listing) => {
    if (listing.price) {
      return `${listing.price.toLocaleString()} ${listing.currency}`
    } else if (listing.priceMin && listing.priceMax) {
      return `${listing.priceMin.toLocaleString()} - ${listing.priceMax.toLocaleString()} ${listing.currency}`
    }
    return 'Price not specified'
  }

  const getClusterPriceRange = (listings: Listing[]) => {
    const prices = listings.flatMap(listing => {
      if (listing.price) return [listing.price]
      if (listing.priceMin && listing.priceMax) return [listing.priceMin, listing.priceMax]
      return []
    })

    if (prices.length === 0) return 'Various prices'

    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const currency = listings[0]?.currency || 'GEL'

    if (min === max) return `${min.toLocaleString()} ${currency}`
    return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency}`
  }

  if (isLoading) {
    return (
      <Center h="full">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading map...</Text>
        </VStack>
      </Center>
    )
  }

  if (loadError) {
    return (
      <Center h="full" p={4}>
        <Alert status="error" maxW="md">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Error loading Google Maps</Text>
            <Text fontSize="sm">
              Please check your Google Maps API key configuration.
            </Text>
            <Text fontSize="xs" color="gray.600">
              Current API key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'}
            </Text>
          </VStack>
        </Alert>
      </Center>
    )
  }

  if (!isLoaded) {
    return (
      <Center h="full">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading Google Maps...</Text>
        </VStack>
      </Center>
    )
  }

  if (validListings.length === 0) {
    return (
      <Center h="full" p={4}>
        <VStack spacing={4}>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700">
            No listings with location data
          </Text>
          <Text color="gray.600" textAlign="center" maxW="md">
            {listings.length > 0 
              ? `${listings.length} listings found, but none have valid coordinates.`
              : 'No listings available to display on the map.'
            }
          </Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box h="full" position="relative">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={12}
        center={center}
        options={options}
        onLoad={onMapLoad}
      >
        {clusteredListings.map((cluster, index) => {
          // If cluster has only one listing, show regular marker
          if (cluster.listings.length === 1) {
            const listing = cluster.listings[0]
            return (
              <MarkerF
                key={`single-${listing.id}`}
                position={cluster.center}
                onClick={() => setSelectedListing(listing)}
                title={`${listing.district || 'Property'} - ${formatPrice(listing)}`}
              />
            )
          }

          // If cluster has multiple listings, show cluster marker
          return (
            <MarkerF
              key={`cluster-${index}`}
              position={cluster.center}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#3182CE" stroke="#ffffff" stroke-width="2"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">
                      ${cluster.listings.length}
                    </text>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20),
              }}
              onClick={() => {
                // Zoom into cluster area
                if (mapRef.current) {
                  const bounds = new window.google.maps.LatLngBounds()
                  cluster.listings.forEach(listing => {
                    bounds.extend({
                      lat: listing.latitude!,
                      lng: listing.longitude!,
                    })
                  })
                  mapRef.current.fitBounds(bounds)
                }
              }}
              title={`${cluster.listings.length} properties - ${getClusterPriceRange(cluster.listings)}`}
            />
          )
        })}

        {selectedListing && (
          <InfoWindowF
            position={{
              lat: selectedListing.latitude!,
              lng: selectedListing.longitude!,
            }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <Box p={2} minW="250px">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="md">
                  {selectedListing.district || 'Property'}
                </Text>
                
                {selectedListing.address && (
                  <Text fontSize="sm" color="gray.600">
                    📍 {selectedListing.address}
                  </Text>
                )}

                <Text fontSize="sm" fontWeight="semibold" color="green.600">
                  💰 {formatPrice(selectedListing)}
                </Text>

                {selectedListing.bedrooms && (
                  <Text fontSize="sm">
                    🛏️ {selectedListing.bedrooms} bedroom{selectedListing.bedrooms > 1 ? 's' : ''}
                  </Text>
                )}

                {selectedListing.areaSqm && (
                  <Text fontSize="sm">
                    📏 {selectedListing.areaSqm}m²
                  </Text>
                )}

                {selectedListing.petsAllowed && (
                  <Text fontSize="sm">
                    🐕 Pets allowed
                  </Text>
                )}

                {selectedListing.furnished && (
                  <Text fontSize="sm">
                    🪑 Furnished
                  </Text>
                )}

                {selectedListing.description && (
                  <Text fontSize="xs" color="gray.700" noOfLines={2}>
                    {selectedListing.description}
                  </Text>
                )}

                <Text fontSize="xs" color="blue.500" cursor="pointer">
                  Click for details →
                </Text>
              </VStack>
            </Box>
          </InfoWindowF>
        )}
      </GoogleMap>
    </Box>
  )
}

export default MapWithClustering