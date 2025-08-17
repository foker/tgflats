import React, { useState, useEffect } from 'react';
import { FiBell, FiX, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { NewListingNotification } from '../services/websocket';

interface NewListingsNotificationProps {
  newListings: NewListingNotification[];
  unreadCount: number;
  onMarkAsRead: () => void;
  onClear: () => void;
  onRefresh?: () => void;
}

export const NewListingsNotification: React.FC<NewListingsNotificationProps> = ({
  newListings,
  unreadCount,
  onMarkAsRead,
  onClear,
  onRefresh,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (unreadCount > 0 && !isOpen) {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    onMarkAsRead();
    setShowToast(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleOpen}
          className="relative p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <FiBell size={24} className="text-gray-700" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && unreadCount > 0 && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed top-20 right-4 z-40 bg-green-500 text-white p-4 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">New listings available!</p>
                <p className="text-sm opacity-90">
                  {unreadCount} new {unreadCount === 1 ? 'listing' : 'listings'}
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-4 text-white/80 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold">New Listings</h2>
                  <div className="flex gap-2">
                    {onRefresh && (
                      <button
                        onClick={onRefresh}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        title="Refresh"
                      >
                        <FiRefreshCw size={20} />
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <FiX size={20} />
                    </button>
                  </div>
                </div>
                <p className="text-sm opacity-90">
                  {newListings.length} {newListings.length === 1 ? 'listing' : 'listings'} received
                </p>
              </div>

              {/* Content */}
              <div className="h-full overflow-y-auto pb-20">
                {newListings.length > 0 ? (
                  <div className="p-4 space-y-4">
                    {newListings.map((listing) => (
                      <motion.div
                        key={listing.id}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => {
                          window.location.href = `/listing/${listing.id}`;
                          handleClose();
                        }}
                      >
                        <div className="flex gap-4">
                          {listing.images?.[0] && (
                            <img
                              src={listing.images[0]}
                              alt={listing.title}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 line-clamp-1">
                              {listing.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {listing.district} • {listing.rooms} rooms • {listing.area} m²
                            </p>
                            <p className="text-lg font-bold text-blue-600 mt-2">
                              {listing.price.toLocaleString()} ₾
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Clear All Button */}
                    <button
                      onClick={onClear}
                      className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FiBell size={48} className="mb-4" />
                    <p>No new listings</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};