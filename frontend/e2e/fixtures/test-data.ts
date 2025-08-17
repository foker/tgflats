/**
 * Test data fixtures for E2E tests
 */

export const testData = {
  // Sample listings for testing
  listings: {
    vake: {
      id: 'test-1',
      price: 800,
      currency: 'USD',
      district: 'Vake',
      bedrooms: 2,
      area: 75,
      furnished: true,
      petsAllowed: true,
      address: 'Chavchavadze Avenue',
      description: 'Newly renovated apartment near Vake Park'
    },
    saburtalo: {
      id: 'test-2', 
      price: 600,
      currency: 'USD',
      district: 'Saburtalo',
      bedrooms: 1,
      area: 50,
      furnished: false,
      petsAllowed: false,
      address: 'Near Technical University',
      description: 'Cozy apartment close to metro station'
    },
    vera: {
      id: 'test-3',
      price: 1200,
      currency: 'USD',
      district: 'Vera',
      bedrooms: 3,
      area: 120,
      furnished: true,
      petsAllowed: true,
      address: 'Kiacheli Street',
      description: 'Spacious apartment with mountain views'
    }
  },

  // Filter combinations for testing
  filters: {
    priceRange: {
      budget: { min: 300, max: 600, currency: 'USD' },
      midRange: { min: 600, max: 1000, currency: 'USD' },
      luxury: { min: 1000, max: 3000, currency: 'USD' }
    },
    districts: {
      central: ['Vake', 'Vera', 'Saburtalo'],
      popular: ['Vake', 'Saburtalo'],
      single: ['Vake']
    },
    characteristics: {
      family: {
        bedrooms: 3,
        minArea: 100,
        petsAllowed: true
      },
      student: {
        bedrooms: 1,
        maxArea: 60,
        furnished: true
      },
      couple: {
        bedrooms: 2,
        minArea: 60,
        maxArea: 100,
        petsAllowed: true
      }
    }
  },

  // Search queries for testing
  searchQueries: {
    common: [
      'near metro',
      'newly renovated',
      'with balcony',
      'parking',
      'quiet area'
    ],
    specific: [
      'Vake Park',
      'Rustaveli',
      'Technical University',
      'city center'
    ]
  },

  // Map test data
  map: {
    tbilisiCenter: {
      lat: 41.7151,
      lng: 44.8271
    },
    districts: {
      vake: { lat: 41.7098, lng: 44.7584 },
      saburtalo: { lat: 41.7314, lng: 44.7599 },
      vera: { lat: 41.7025, lng: 44.7950 }
    },
    zoomLevels: {
      city: 12,
      district: 14,
      street: 16,
      building: 18
    },
    testPolygon: [
      { x: 100, y: 100 },
      { x: 300, y: 100 },
      { x: 300, y: 300 },
      { x: 100, y: 300 }
    ]
  },

  // Contact form test data
  contactForm: {
    valid: {
      name: 'Test User',
      email: 'test@example.com',
      message: 'I am interested in this property. Please contact me.'
    },
    invalid: {
      name: '',
      email: 'invalid-email',
      message: ''
    }
  },

  // User preferences
  userPreferences: {
    savedSearches: [
      {
        name: 'Budget apartments in Vake',
        filters: {
          priceRange: { min: 400, max: 700, currency: 'USD' },
          districts: ['Vake'],
          bedrooms: 2
        }
      },
      {
        name: 'Pet-friendly homes',
        filters: {
          petsAllowed: true,
          minArea: 60
        }
      }
    ]
  },

  // Expected results for validation
  expectedResults: {
    noResults: {
      message: 'No listings found',
      suggestions: [
        'Expand price range',
        'Include nearby districts',
        'Remove some filters'
      ]
    },
    sorting: {
      priceAsc: 'lowest',
      priceDesc: 'highest',
      areaAsc: 'smallest',
      areaDesc: 'largest',
      dateDesc: 'newest'
    },
    pagination: {
      itemsPerPage: [10, 20, 50],
      defaultPerPage: 20
    }
  },

  // Quick filters
  quickFilters: [
    'Under $500',
    'Pet-friendly',
    '2+ bedrooms',
    'Furnished',
    'Near metro'
  ],

  // Amenities list
  amenities: [
    'WiFi',
    'Washing Machine',
    'Air Conditioning',
    'Heating',
    'Balcony',
    'Parking',
    'Elevator',
    'Security',
    'Storage',
    'Gym'
  ],

  // Currency conversion rates (mock)
  currencyRates: {
    USD: 1,
    GEL: 2.65,
    EUR: 0.92
  },

  // Timeout values
  timeouts: {
    short: 5000,
    medium: 10000,
    long: 30000,
    animation: 500,
    debounce: 300
  },

  // Error messages
  errors: {
    networkError: 'Failed to load listings',
    invalidFilter: 'Invalid filter parameters',
    searchError: 'Search failed. Please try again.'
  },

  // Success messages
  success: {
    searchSaved: 'Search saved successfully',
    messageSent: 'Message sent successfully',
    listingSaved: 'Listing saved to favorites',
    linkCopied: 'Link copied to clipboard'
  }
};

/**
 * Generate mock listings
 */
export function generateMockListings(count: number): any[] {
  const districts = ['Vake', 'Saburtalo', 'Vera', 'Mtatsminda', 'Didube', 'Isani'];
  const listings = [];
  
  for (let i = 1; i <= count; i++) {
    listings.push({
      id: `listing-${i}`,
      title: `Apartment ${i}`,
      price: 400 + Math.floor(Math.random() * 1600),
      currency: 'USD',
      district: districts[Math.floor(Math.random() * districts.length)],
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 2) + 1,
      area: 40 + Math.floor(Math.random() * 160),
      floor: Math.floor(Math.random() * 15) + 1,
      totalFloors: 20,
      furnished: Math.random() > 0.5,
      petsAllowed: Math.random() > 0.5,
      hasParking: Math.random() > 0.5,
      hasBalcony: Math.random() > 0.7,
      images: [
        '/mock-image-1.jpg',
        '/mock-image-2.jpg',
        '/mock-image-3.jpg'
      ],
      description: `This is a beautiful apartment in ${districts[i % districts.length]}. Newly renovated with modern amenities.`,
      postedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      coordinates: {
        lat: 41.7151 + (Math.random() - 0.5) * 0.1,
        lng: 44.8271 + (Math.random() - 0.5) * 0.1
      }
    });
  }
  
  return listings;
}

/**
 * Generate filter combinations for testing
 */
export function generateFilterCombinations(): any[] {
  const combinations = [];
  const priceRanges = testData.filters.priceRange;
  const districts = testData.filters.districts;
  const characteristics = testData.filters.characteristics;
  
  // Single filter tests
  Object.values(priceRanges).forEach(range => {
    combinations.push({ priceRange: range });
  });
  
  Object.values(districts).forEach(districtList => {
    combinations.push({ districts: districtList });
  });
  
  Object.values(characteristics).forEach(chars => {
    combinations.push({ characteristics: chars });
  });
  
  // Combined filter tests
  combinations.push({
    priceRange: priceRanges.midRange,
    districts: districts.popular,
    characteristics: characteristics.couple
  });
  
  return combinations;
}

/**
 * Wait helper for animations and transitions
 */
export async function waitForAnimation(page: any, duration: number = 500) {
  await page.waitForTimeout(duration);
}

/**
 * Get random item from array
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GEL: '₾'
  };
  return `${symbols[currency] || ''}${price.toLocaleString()}`;
}

/**
 * Convert price between currencies
 */
export function convertCurrency(amount: number, from: string, to: string): number {
  const fromRate = testData.currencyRates[from as keyof typeof testData.currencyRates] || 1;
  const toRate = testData.currencyRates[to as keyof typeof testData.currencyRates] || 1;
  return Math.round((amount / fromRate) * toRate);
}