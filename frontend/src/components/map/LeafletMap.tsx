import React, { useEffect, useRef } from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Spinner, Center } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Listing } from '../../types/listing';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface LeafletMapProps {
  listings: Listing[];
  isLoading?: boolean;
  onListingClick?: (listing: Listing) => void;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ listings, isLoading, onListingClick }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize map
    if (!mapRef.current) {
      // Wait for the container to be available
      const mapContainer = document.getElementById('map');
      if (!mapContainer) return;

      mapRef.current = L.map('map').setView([41.7151, 44.8271], 12); // Tbilisi center

      // Force resize after a small delay to ensure container has dimensions
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      }, 100);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Initialize marker cluster group
      markersRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        maxClusterRadius: 60,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          let className = 'marker-cluster-small';
          
          if (count > 10) {
            size = 'medium';
            className = 'marker-cluster-medium';
          }
          if (count > 50) {
            size = 'large';
            className = 'marker-cluster-large';
          }

          return L.divIcon({
            html: `<div><span>${count}</span></div>`,
            className: `marker-cluster ${className}`,
            iconSize: L.point(40, 40),
          });
        },
      });

      mapRef.current.addLayer(markersRef.current);
    }

    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.clearLayers();
    }

    // Add markers for listings
    const bounds = L.latLngBounds([]);
    
    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        const marker = L.marker([listing.latitude, listing.longitude]);
        
        // Create popup content
        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px;">
              ${listing.price ? `${listing.price} ${listing.currency}/month` : 
                listing.priceMin && listing.priceMax ? `${listing.priceMin}-${listing.priceMax} ${listing.currency}/month` :
                listing.priceMin ? `from ${listing.priceMin} ${listing.currency}/month` :
                'Price not specified'}
            </h3>
            <p style="margin: 4px 0; color: #666;">
              <strong>District:</strong> ${listing.district || 'Unknown'}
            </p>
            ${listing.bedrooms ? `
              <p style="margin: 4px 0; color: #666;">
                <strong>Bedrooms:</strong> ${listing.bedrooms}
              </p>
            ` : ''}
            ${listing.areaSqm ? `
              <p style="margin: 4px 0; color: #666;">
                <strong>Area:</strong> ${listing.areaSqm} m²
              </p>
            ` : ''}
            ${listing.address ? `
              <p style="margin: 4px 0; color: #666;">
                <strong>Address:</strong> ${listing.address}
              </p>
            ` : ''}
            <button 
              onclick="window.dispatchEvent(new CustomEvent('listing-click', { detail: '${listing.id}' }))"
              style="margin-top: 8px; padding: 6px 12px; background: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer;"
            >
              View Details
            </button>
          </div>
        `;
        
        marker.bindPopup(popupContent);
        
        if (markersRef.current) {
          markersRef.current.addLayer(marker);
        }
        
        bounds.extend([listing.latitude, listing.longitude]);
      }
    });

    // Fit map to show all markers
    if (listings.length > 0 && mapRef.current && bounds.isValid()) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    // Setup event listener for listing click
    const handleListingClick = (event: CustomEvent) => {
      const listingId = event.detail;
      const listing = listings.find(l => l.id === listingId);
      if (listing && onListingClick) {
        onListingClick(listing);
      }
    };

    window.addEventListener('listing-click' as any, handleListingClick as any);

    return () => {
      window.removeEventListener('listing-click' as any, handleListingClick as any);
    };
  }, [listings, onListingClick]);

  // Force map resize when component becomes visible
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 200);

    // Add resize listener to handle window resize and view changes
    const handleResize = () => {
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Center h="600px" bg="gray.50">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Center>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        <Box>
          <AlertTitle>No listings to display</AlertTitle>
          <AlertDescription>
            Try adjusting your filters or search criteria.
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <>
      <style>{`
        .marker-cluster {
          background-clip: padding-box;
          border-radius: 50%;
        }
        
        .marker-cluster div {
          width: 30px;
          height: 30px;
          margin-left: 5px;
          margin-top: 5px;
          text-align: center;
          border-radius: 50%;
          font: 12px "Helvetica Neue", Arial, Helvetica, sans-serif;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .marker-cluster-small {
          background-color: rgba(110, 204, 57, 0.6);
        }
        
        .marker-cluster-small div {
          background-color: rgba(110, 204, 57, 0.9);
        }
        
        .marker-cluster-medium {
          background-color: rgba(240, 194, 12, 0.6);
        }
        
        .marker-cluster-medium div {
          background-color: rgba(240, 194, 12, 0.9);
        }
        
        .marker-cluster-large {
          background-color: rgba(241, 128, 23, 0.6);
        }
        
        .marker-cluster-large div {
          background-color: rgba(241, 128, 23, 0.9);
        }
        
        .leaflet-popup-content {
          margin: 12px;
        }
        
        /* Ensure the map container has proper dimensions */
        #map {
          width: 100% !important;
          height: 600px !important;
        }
        
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: #f8f9fa;
        }
      `}</style>
      <Box 
        ref={containerRef}
        id="map" 
        h="600px" 
        w="100%" 
        minW="300px"
        borderRadius="lg" 
        overflow="hidden"
        boxShadow="lg"
        position="relative"
        css={{
          '& .leaflet-container': {
            width: '100% !important',
            height: '100% !important',
          }
        }}
      />
    </>
  );
};

export default LeafletMap;