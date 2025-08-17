import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMap, FiList, FiGrid } from 'react-icons/fi';
import { useListings, useInfiniteListings } from '../hooks/useListings';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { useWebSocket } from '../hooks/useWebSocket';
import { AdvancedFilters, FilterOptions } from '../components/AdvancedFilters';
import { ListingCard } from '../components/ListingCard';
import { NewListingsNotification } from '../components/NewListingsNotification';
import { MobileNavigation } from '../components/MobileNavigation';
import { EnhancedLeafletMap } from '../components/map/EnhancedLeafletMap';
import VirtualListingsGrid from '../components/VirtualListingsGrid';
import { ListingFilters } from '../types';

type ViewType = 'grid' | 'list' | 'map';

export const HomePageNew: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewType>('grid');
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  
  // WebSocket integration
  const { isConnected, newListings, unreadCount, markAsRead, clearNewListings, subscribeToFilters } = useWebSocket();
  
  // URL-synced filters
  const { filters, updateFilters, clearFilters, getShareableUrl } = useUrlFilters();
  const currentPage = filters.page || 1;

  // Fetch listings with infinite scroll
  const {
    data: infiniteData,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteListings({ ...filters, limit: 20 });

  // Combine all pages of infinite data
  const allListings = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page.data || []);
  }, [infiniteData]);

  // Merge new WebSocket listings with existing ones
  const mergedListings = useMemo(() => {
    const listingMap = new Map();
    
    // Add existing listings
    allListings.forEach(listing => {
      listingMap.set(listing.id, listing);
    });
    
    // Add new listings from WebSocket (mark them as new)
    newListings.forEach(newListing => {
      if (!listingMap.has(newListing.id)) {
        listingMap.set(newListing.id, { ...newListing, isNew: true });
      }
    });
    
    return Array.from(listingMap.values());
  }, [allListings, newListings]);

  // Subscribe to filter changes via WebSocket
  useEffect(() => {
    if (isConnected) {
      subscribeToFilters(filters);
    }
  }, [isConnected, filters, subscribeToFilters]);

  // Load saved listings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedListings');
    if (saved) {
      setSavedListings(new Set(JSON.parse(saved)));
    }
  }, []);

  const handleFiltersChange = (newFilters: FilterOptions) => {
    const mappedFilters: ListingFilters = {
      minPrice: newFilters.minPrice,
      maxPrice: newFilters.maxPrice,
      minArea: newFilters.minArea,
      maxArea: newFilters.maxArea,
      rooms: newFilters.rooms?.join(','),
      districts: newFilters.districts?.join(','),
      amenities: newFilters.amenities?.join(','),
      searchQuery: newFilters.searchQuery,
      sortBy: newFilters.sortBy,
      sortOrder: newFilters.sortOrder,
      page: 1,
    };
    updateFilters(mappedFilters);
  };

  const handleSaveListing = (id: string) => {
    setSavedListings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      localStorage.setItem('savedListings', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const getTotal = () => {
    if (infiniteData?.pages?.[0]) {
      const firstPage = infiniteData.pages[0];
      return firstPage.meta?.total || firstPage.total || mergedListings.length;
    }
    return mergedListings.length;
  };

  // Convert filters to FilterOptions format
  const filterOptions: FilterOptions = {
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    minArea: filters.minArea,
    maxArea: filters.maxArea,
    rooms: filters.rooms ? filters.rooms.split(',').map(Number) : [],
    districts: filters.districts ? filters.districts.split(',') : [],
    amenities: filters.amenities ? filters.amenities.split(',') : [],
    searchQuery: filters.searchQuery,
    sortBy: filters.sortBy as any,
    sortOrder: filters.sortOrder as any,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* WebSocket Status Indicator */}
      <div className={`fixed top-0 left-0 right-0 h-1 z-50 transition-all ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />

      {/* Mobile Navigation */}
      <MobileNavigation
        currentView={view}
        onViewChange={setView}
        onOpenFilters={() => setShowFilters(true)}
        totalListings={getTotal()}
        newListingsCount={newListings.length}
      />

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filterOptions}
        onFiltersChange={handleFiltersChange}
        onReset={clearFilters}
        totalResults={getTotal()}
        isLoading={isLoading}
      />

      {/* New Listings Notification */}
      <NewListingsNotification
        newListings={newListings}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onClear={clearNewListings}
        onRefresh={handleRefresh}
      />

      {/* View Toggle */}
      <div className="container mx-auto px-4 py-4 mt-16 lg:mt-0 mb-16 lg:mb-0">
        <div className="hidden lg:flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                view === 'grid'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiGrid />
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                view === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiList />
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                view === 'map'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FiMap />
              Map
            </button>
          </div>

          {/* Results Count */}
          <div className="text-gray-600">
            {getTotal()} listings found
            {newListings.length > 0 && (
              <span className="ml-2 text-green-600 font-semibold">
                (+{newListings.length} new)
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error loading listings</p>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Something went wrong'}</p>
          </div>
        ) : view === 'map' ? (
          <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden shadow-lg">
            <EnhancedLeafletMap
              listings={mergedListings}
              isLoading={isLoading}
              onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
              selectedDistricts={filterOptions.districts}
            />
          </div>
        ) : view === 'list' ? (
          <VirtualListingsGrid
            listings={mergedListings}
            isLoading={isLoading}
            total={getTotal()}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            onListingClick={(listing) => navigate(`/listing/${listing.id}`)}
          />
        ) : (
          // Grid View with new ListingCard component
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mergedListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                pricePerM2={listing.pricePerM2}
                district={listing.district}
                address={listing.address}
                rooms={listing.rooms}
                area={listing.area}
                floor={listing.floor}
                totalFloors={listing.totalFloors}
                description={listing.description}
                images={listing.images}
                amenities={listing.amenities}
                phoneNumber={listing.phoneNumber}
                telegramUsername={listing.telegramUsername}
                createdAt={listing.createdAt}
                isNew={listing.isNew}
                onSave={handleSaveListing}
                isSaved={savedListings.has(listing.id)}
              />
            ))}
            
            {/* Load More */}
            {hasNextPage && (
              <div className="col-span-full flex justify-center py-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && mergedListings.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No listings found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && mergedListings.length === 0 && (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};