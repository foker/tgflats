import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMessageCircle, FiHeart, FiMapPin, FiHome, FiMaximize, FiClock } from 'react-icons/fi';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  pricePerM2?: number;
  district: string;
  address?: string;
  rooms: number;
  area: number;
  floor?: number;
  totalFloors?: number;
  description?: string;
  images?: string[];
  amenities?: string[];
  phoneNumber?: string;
  telegramUsername?: string;
  createdAt?: string;
  isNew?: boolean;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  id,
  title,
  price,
  pricePerM2,
  district,
  address,
  rooms,
  area,
  floor,
  totalFloors,
  description,
  images = [],
  amenities = [],
  phoneNumber,
  telegramUsername,
  createdAt,
  isNew = false,
  onSave,
  isSaved = false,
}) => {
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [saved, setSaved] = useState(isSaved);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    setSaved(!saved);
    onSave?.(id);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.preventDefault();
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.preventDefault();
    if (telegramUsername) {
      window.open(`https://t.me/${telegramUsername.replace('@', '')}`, '_blank');
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (hours < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Generate placeholder images if none provided
  const displayImages = images.length > 0 ? images : [
    `https://via.placeholder.com/400x300/E2E8F0/475569?text=${encodeURIComponent(title.slice(0, 20))}`
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group relative">
      {/* New Badge */}
      {isNew && (
        <div className="absolute top-4 left-4 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
          New
        </div>
      )}

      {/* Image Gallery */}
      <div className="relative h-64 bg-gray-100">
        {displayImages.length > 1 ? (
          <Swiper
            modules={[Navigation, Pagination]}
            navigation
            pagination={{ clickable: true }}
            className="h-full"
            loop={true}
          >
            {displayImages.map((image, index) => (
              <SwiperSlide key={index}>
                <img
                  src={imageError[index] ? `https://via.placeholder.com/400x300/E2E8F0/475569?text=Image+${index + 1}` : image}
                  alt={`${title} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(prev => ({ ...prev, [index]: true }))}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <img
            src={displayImages[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError({ 0: true })}
          />
        )}

        {/* Price Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="text-white">
            <p className="text-2xl font-bold">{price.toLocaleString()} ₾</p>
            {pricePerM2 && (
              <p className="text-sm opacity-90">{pricePerM2.toLocaleString()} ₾/m²</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Title and Location */}
        <Link to={`/listing/${id}`} className="block mb-3">
          <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        <div className="flex items-center text-gray-600 mb-4">
          <FiMapPin className="mr-2 text-blue-500" />
          <span className="text-sm">{district}</span>
          {address && <span className="text-sm text-gray-500 ml-2">• {address}</span>}
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center">
            <FiHome className="mr-2 text-gray-400" />
            <span className="text-sm font-medium">{rooms} rooms</span>
          </div>
          <div className="flex items-center">
            <FiMaximize className="mr-2 text-gray-400" />
            <span className="text-sm font-medium">{area} m²</span>
          </div>
          {floor && (
            <div className="flex items-center">
              <span className="text-sm font-medium">
                {floor}{totalFloors && `/${totalFloors}`} floor
              </span>
            </div>
          )}
        </div>

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                {amenity}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Time and Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center text-gray-500 text-sm">
            <FiClock className="mr-1" />
            <span>{formatDate(createdAt)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {phoneNumber && (
              <button
                onClick={handleCall}
                className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                title="Call"
              >
                <FiPhone size={18} />
              </button>
            )}
            {telegramUsername && (
              <button
                onClick={handleMessage}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                title="Message on Telegram"
              >
                <FiMessageCircle size={18} />
              </button>
            )}
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg transition-colors ${
                saved
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
              }`}
              title={saved ? 'Remove from saved' : 'Save'}
            >
              <FiHeart size={18} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};