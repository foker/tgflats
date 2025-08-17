export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED',
}

export interface Listing {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  title?: string;
  district?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  currency: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaSqm?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  furnished?: boolean;
  petsAllowed?: boolean;
  amenities?: string[];
  description?: string;
  contactInfo?: string;
  sourceUrl?: string;
  imageUrls?: string[];
  status: string;
  confidence?: number;
  telegramPostId?: string;
}

export interface ListingFilters {
  // Search and basic filters
  q?: string; // search query
  search?: string; // backward compatibility
  
  // Price filters
  priceMin?: number;
  priceMax?: number;
  minPrice?: number; // backward compatibility  
  maxPrice?: number; // backward compatibility
  
  // Room and area filters
  rooms?: number;
  bedrooms?: number; // backward compatibility
  maxRooms?: number;
  areaMin?: number;
  areaMax?: number;
  minArea?: number; // backward compatibility
  maxArea?: number; // backward compatibility
  
  // Location filters
  district?: string;
  districts?: string[];
  
  // Property features
  petFriendly?: boolean;
  petsAllowed?: boolean; // backward compatibility
  furnished?: boolean;
  
  // Amenities
  amenities?: string[];
  
  // Pagination and sorting
  page?: number;
  limit?: number;
  sort?: string;
  
  // Legacy support
  query?: string; // backward compatibility
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  price?: number;
  bedrooms?: number;
  district: string;
}