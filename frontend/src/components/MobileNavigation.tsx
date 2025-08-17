import React, { useState } from 'react';
import { FiMenu, FiX, FiFilter, FiMap, FiList, FiGrid, FiSearch } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileNavigationProps {
  currentView: 'grid' | 'list' | 'map';
  onViewChange: (view: 'grid' | 'list' | 'map') => void;
  onOpenFilters: () => void;
  totalListings: number;
  newListingsCount: number;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentView,
  onViewChange,
  onOpenFilters,
  totalListings,
  newListingsCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>

          <h1 className="text-xl font-bold text-blue-600">TBI Properties</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenFilters}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiFilter size={20} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <FiSearch size={20} />
            </button>
          </div>
        </div>

        {/* Results Bar */}
        <div className="px-4 pb-2 text-sm text-gray-600 border-t">
          <div className="flex justify-between items-center pt-2">
            <span>{totalListings} listings found</span>
            {newListingsCount > 0 && (
              <span className="text-green-600 font-semibold">
                +{newListingsCount} new
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="grid grid-cols-3 h-16">
          <button
            onClick={() => onViewChange('grid')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentView === 'grid'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiGrid size={20} />
            <span className="text-xs">Grid</span>
          </button>
          
          <button
            onClick={() => onViewChange('list')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentView === 'list'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiList size={20} />
            <span className="text-xs">List</span>
          </button>
          
          <button
            onClick={() => onViewChange('map')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              currentView === 'map'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FiMap size={20} />
            <span className="text-xs">Map</span>
          </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-30"
            />
            
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-40"
            >
              <div className="p-4 border-b">
                <h2 className="text-lg font-bold text-gray-800">Menu</h2>
              </div>
              
              <nav className="p-4">
                <a href="/" className="block py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors">
                  Browse Listings
                </a>
                <a href="#saved" className="block py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors">
                  Saved Properties
                </a>
                <a href="#alerts" className="block py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors">
                  Price Alerts
                </a>
                <a href="#about" className="block py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors">
                  About Us
                </a>
                <a href="#contact" className="block py-3 px-4 hover:bg-gray-100 rounded-lg transition-colors">
                  Contact
                </a>
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                <p className="text-xs text-gray-500 text-center">
                  Version 1.0.0 • © 2024 TBI Properties
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};