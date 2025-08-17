import React, { useState, useEffect } from 'react';
import { FiFilter, FiX, FiSearch, FiMapPin, FiHome, FiDollarSign } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  rooms?: number[];
  districts?: string[];
  amenities?: string[];
  searchQuery?: string;
  sortBy?: 'price' | 'area' | 'date' | 'pricePerM2';
  sortOrder?: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset?: () => void;
  totalResults?: number;
  isLoading?: boolean;
}

const DISTRICTS = [
  'Vake', 'Saburtalo', 'Isani', 'Samgori', 'Didube', 
  'Gldani', 'Nadzaladevi', 'Chugureti', 'Krtsanisi', 'Mtatsminda'
];

const AMENITIES = [
  'Parking', 'Balcony', 'Storage', 'Elevator', 'Security',
  'Gym', 'Pool', 'Garden', 'Furnished', 'Pet Friendly',
  'Air Conditioning', 'Heating', 'Internet', 'Cable TV'
];

const ROOM_OPTIONS = [1, 2, 3, 4, 5];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  totalResults = 0,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  useEffect(() => {
    // Count active filters
    let count = 0;
    if (localFilters.minPrice || localFilters.maxPrice) count++;
    if (localFilters.minArea || localFilters.maxArea) count++;
    if (localFilters.rooms && localFilters.rooms.length > 0) count++;
    if (localFilters.districts && localFilters.districts.length > 0) count++;
    if (localFilters.amenities && localFilters.amenities.length > 0) count++;
    if (localFilters.searchQuery) count++;
    setActiveFiltersCount(count);
  }, [localFilters]);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsExpanded(false);
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset?.();
  };

  const toggleRoom = (room: number) => {
    const currentRooms = localFilters.rooms || [];
    const newRooms = currentRooms.includes(room)
      ? currentRooms.filter(r => r !== room)
      : [...currentRooms, room];
    handleFilterChange('rooms', newRooms);
  };

  const toggleDistrict = (district: string) => {
    const currentDistricts = localFilters.districts || [];
    const newDistricts = currentDistricts.includes(district)
      ? currentDistricts.filter(d => d !== district)
      : [...currentDistricts, district];
    handleFilterChange('districts', newDistricts);
  };

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = localFilters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    handleFilterChange('amenities', newAmenities);
  };

  return (
    <>
      {/* Filter Bar */}
      <div className="bg-white shadow-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Search Input */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search listings..."
                  value={localFilters.searchQuery || ''}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleApplyFilters()}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="hidden md:flex items-center gap-2">
              {/* Price Range */}
              <select
                value={`${localFilters.minPrice || ''}-${localFilters.maxPrice || ''}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-');
                  handleFilterChange('minPrice', min ? parseInt(min) : undefined);
                  handleFilterChange('maxPrice', max ? parseInt(max) : undefined);
                }}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="-">Any Price</option>
                <option value="0-50000">Under 50,000 ₾</option>
                <option value="50000-100000">50,000 - 100,000 ₾</option>
                <option value="100000-200000">100,000 - 200,000 ₾</option>
                <option value="200000-">Above 200,000 ₾</option>
              </select>

              {/* Rooms */}
              <select
                value={localFilters.rooms?.[0] || ''}
                onChange={(e) => {
                  const room = e.target.value ? [parseInt(e.target.value)] : [];
                  handleFilterChange('rooms', room);
                }}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any Rooms</option>
                {ROOM_OPTIONS.map(room => (
                  <option key={room} value={room}>{room} {room === 1 ? 'Room' : 'Rooms'}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={`${localFilters.sortBy}-${localFilters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy as any);
                  handleFilterChange('sortOrder', sortOrder as any);
                }}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="area-asc">Area: Small to Large</option>
                <option value="area-desc">Area: Large to Small</option>
                <option value="pricePerM2-asc">Price/m²: Low to High</option>
              </select>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiFilter />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Apply Button */}
            <button
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {isLoading ? 'Loading...' : `Apply (${totalResults})`}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 bg-white shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Advanced Filters</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Reset All
                    </button>
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FiDollarSign className="text-blue-500" />
                      Price Range
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={localFilters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max Price"
                        value={localFilters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Area Range */}
                  <div>
                    <h3 className="font-semibold mb-3">Area (m²)</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Min Area"
                        value={localFilters.minArea || ''}
                        onChange={(e) => handleFilterChange('minArea', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Max Area"
                        value={localFilters.maxArea || ''}
                        onChange={(e) => handleFilterChange('maxArea', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Rooms */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FiHome className="text-blue-500" />
                      Number of Rooms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {ROOM_OPTIONS.map(room => (
                        <button
                          key={room}
                          onClick={() => toggleRoom(room)}
                          className={`px-3 py-1 rounded-lg border transition-colors ${
                            localFilters.rooms?.includes(room)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {room}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Districts */}
                  <div className="lg:col-span-2">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FiMapPin className="text-blue-500" />
                      Districts
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {DISTRICTS.map(district => (
                        <button
                          key={district}
                          onClick={() => toggleDistrict(district)}
                          className={`px-3 py-1 rounded-lg border transition-colors ${
                            localFilters.districts?.includes(district)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                          }`}
                        >
                          {district}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amenities */}
                  <div className="lg:col-span-3">
                    <h3 className="font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {AMENITIES.map(amenity => (
                        <label key={amenity} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localFilters.amenities?.includes(amenity) || false}
                            onChange={() => toggleAmenity(amenity)}
                            className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Apply Filters ({totalResults} results)
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};