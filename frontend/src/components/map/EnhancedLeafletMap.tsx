import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import { Listing } from '../../types/listing';
import { FiMapPin, FiHome, FiMaximize, FiDollarSign, FiPhone, FiMessageCircle } from 'react-icons/fi';
import ReactDOMServer from 'react-dom/server';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EnhancedLeafletMapProps {
  listings: Listing[];
  isLoading?: boolean;
  onListingClick?: (listing: Listing) => void;
  selectedDistricts?: string[];
}

// Custom marker icon based on price
const createPriceIcon = (price: number): L.DivIcon => {
  const priceStr = price >= 1000 ? `${Math.round(price / 1000)}k` : price.toString();
  const color = price < 50000 ? '#10B981' : price < 100000 ? '#3B82F6' : '#EF4444';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-weight: bold;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        white-space: nowrap;
        position: relative;
      ">
        ${priceStr} ₾
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>
      </div>
    `,
    className: 'price-marker',
    iconSize: [60, 30],
    iconAnchor: [30, 30],
  });
};

// Create popup content
const createPopupContent = (listing: Listing): string => {
  return `
    <div style="width: 280px; font-family: system-ui, -apple-system, sans-serif;">
      ${listing.images && listing.images[0] ? `
        <img src="${listing.images[0]}" alt="${listing.title}" 
          style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -10px -10px 10px -10px;"
          onerror="this.style.display='none'"
        />
      ` : ''}
      
      <div style="padding: 0 5px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1F2937;">
          ${listing.title}
        </h3>
        
        <div style="display: flex; align-items: center; color: #6B7280; margin-bottom: 8px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span style="margin-left: 4px; font-size: 14px;">${listing.district}</span>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="text-align: center; padding: 4px; background: #F3F4F6; border-radius: 6px;">
            <div style="font-size: 12px; color: #6B7280;">Rooms</div>
            <div style="font-size: 14px; font-weight: 600; color: #1F2937;">${listing.rooms}</div>
          </div>
          <div style="text-align: center; padding: 4px; background: #F3F4F6; border-radius: 6px;">
            <div style="font-size: 12px; color: #6B7280;">Area</div>
            <div style="font-size: 14px; font-weight: 600; color: #1F2937;">${listing.area} m²</div>
          </div>
          <div style="text-align: center; padding: 4px; background: #F3F4F6; border-radius: 6px;">
            <div style="font-size: 12px; color: #6B7280;">Floor</div>
            <div style="font-size: 14px; font-weight: 600; color: #1F2937;">
              ${listing.floor || '-'}${listing.totalFloors ? `/${listing.totalFloors}` : ''}
            </div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 12px; border-top: 1px solid #E5E7EB;">
          <div>
            <div style="font-size: 20px; font-weight: bold; color: #3B82F6;">
              ${listing.price.toLocaleString()} ₾
            </div>
            ${listing.pricePerM2 ? `
              <div style="font-size: 12px; color: #6B7280;">
                ${listing.pricePerM2.toLocaleString()} ₾/m²
              </div>
            ` : ''}
          </div>
          
          <div style="display: flex; gap: 8px;">
            ${listing.phoneNumber ? `
              <a href="tel:${listing.phoneNumber}" 
                style="padding: 8px; background: #10B981; color: white; border-radius: 6px; text-decoration: none; display: flex; align-items: center; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </a>
            ` : ''}
            
            <button onclick="window.open('/listing/${listing.id}', '_blank')"
              style="padding: 8px 12px; background: #3B82F6; color: white; border-radius: 6px; border: none; cursor: pointer; font-size: 14px;">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};

export const EnhancedLeafletMap: React.FC<EnhancedLeafletMapProps> = ({ 
  listings, 
  isLoading, 
  onListingClick,
  selectedDistricts = []
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.MarkerClusterGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // District boundaries (approximate)
  const districtCenters: { [key: string]: [number, number] } = {
    'Vake': [41.7103, 44.7544],
    'Saburtalo': [41.7311, 44.7652],
    'Isani': [41.6947, 44.8522],
    'Samgori': [41.6864, 44.8742],
    'Didube': [41.7607, 44.7687],
    'Gldani': [41.7693, 44.8073],
    'Nadzaladevi': [41.7447, 44.7858],
    'Chugureti': [41.6974, 44.8014],
    'Krtsanisi': [41.6638, 44.8257],
    'Mtatsminda': [41.6941, 44.7936],
  };

  useEffect(() => {
    if (!mapRef.current && !mapReady) {
      const mapContainer = document.getElementById('enhanced-map');
      if (!mapContainer) return;

      // Initialize map
      mapRef.current = L.map('enhanced-map', {
        center: [41.7151, 44.8271],
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      // Add tile layer with better styling
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Initialize marker cluster group with custom options
      markersRef.current = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          let size = 'small';
          let color = '#10B981';
          
          if (count > 50) {
            size = 'large';
            color = '#EF4444';
          } else if (count > 20) {
            size = 'medium';
            color = '#F59E0B';
          }

          return L.divIcon({
            html: `
              <div style="
                background: ${color};
                color: white;
                border-radius: 50%;
                width: ${size === 'small' ? 40 : size === 'medium' ? 50 : 60}px;
                height: ${size === 'small' ? 40 : size === 'medium' ? 50 : 60}px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: ${size === 'small' ? 14 : size === 'medium' ? 16 : 18}px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                border: 3px solid white;
              ">
                ${count}
              </div>
            `,
            className: 'marker-cluster-custom',
            iconSize: L.point(40, 40, true),
          });
        },
      });

      mapRef.current.addLayer(markersRef.current);
      setMapReady(true);

      // Add resize handler
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }

    return () => {
      if (mapRef.current && mapReady) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
        setMapReady(false);
      }
    };
  }, [mapReady]);

  // Update markers when listings change
  useEffect(() => {
    if (!mapRef.current || !markersRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.clearLayers();

    // Add new markers
    const validListings = listings.filter(listing => 
      listing.latitude && 
      listing.longitude && 
      !isNaN(listing.latitude) && 
      !isNaN(listing.longitude)
    );

    const bounds: L.LatLngBounds | null = validListings.length > 0 ? L.latLngBounds([]) : null;

    validListings.forEach(listing => {
      const marker = L.marker(
        [listing.latitude!, listing.longitude!],
        { icon: createPriceIcon(listing.price) }
      );

      marker.bindPopup(createPopupContent(listing), {
        maxWidth: 300,
        minWidth: 280,
        className: 'custom-popup',
      });

      marker.on('click', () => {
        if (onListingClick) {
          onListingClick(listing);
        }
      });

      markersRef.current!.addLayer(marker);
      
      if (bounds) {
        bounds.extend([listing.latitude!, listing.longitude!]);
      }
    });

    // Fit bounds if we have markers
    if (bounds && validListings.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [listings, mapReady, onListingClick]);

  // Handle district filtering
  useEffect(() => {
    if (!mapRef.current || !mapReady || selectedDistricts.length === 0) return;

    const districtBounds = L.latLngBounds([]);
    selectedDistricts.forEach(district => {
      if (districtCenters[district]) {
        districtBounds.extend(districtCenters[district]);
      }
    });

    if (districtBounds.isValid()) {
      mapRef.current.fitBounds(districtBounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [selectedDistricts, mapReady]);

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-gray-600">Loading listings...</span>
          </div>
        </div>
      )}
      
      {/* Map Statistics */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <div className="text-sm">
          <div className="font-semibold text-gray-800">
            {listings.filter(l => l.latitude && l.longitude).length} listings on map
          </div>
          {selectedDistricts.length > 0 && (
            <div className="text-xs text-gray-600 mt-1">
              Filtering: {selectedDistricts.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div id="enhanced-map" className="w-full h-full rounded-lg" />
      
      {/* Custom Styles */}
      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 10px;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .price-marker {
          background: transparent !important;
          border: none !important;
        }
        .marker-cluster-custom {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};