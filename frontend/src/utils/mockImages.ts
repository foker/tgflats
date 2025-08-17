// Mock image URLs for development and testing
export const MOCK_PROPERTY_IMAGES = [
  // Modern apartments
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1565623833408-d77e39b88af6?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&h=600&fit=crop&crop=center',
  
  // Cozy interiors
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800&h=600&fit=crop&crop=center',
  
  // Living rooms
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1558618563-bee892d68b7c?w=800&h=600&fit=crop&crop=center',
  
  // Bedrooms
  'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560184897-b4b5c2c33a8c?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560448075-cbc16bb4af8e?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&h=600&fit=crop&crop=center',
  
  // Kitchens
  'https://images.unsplash.com/photo-1556909114-b73d6b416f87?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556909114-61283373e25b?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556909039-1e0f6b6d2ad6?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop&crop=center',
  
  // Bathrooms
  'https://images.unsplash.com/photo-1564540574859-0dfb63985162?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&h=600&fit=crop&crop=center',
  
  // Balconies and views
  'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&crop=center',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center',
]

// Helper function to get random property images
export function getRandomPropertyImages(count: number = 3): string[] {
  const shuffled = [...MOCK_PROPERTY_IMAGES].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, Math.min(count, MOCK_PROPERTY_IMAGES.length))
}

// Helper function to get a single random image
export function getRandomPropertyImage(): string {
  return MOCK_PROPERTY_IMAGES[Math.floor(Math.random() * MOCK_PROPERTY_IMAGES.length)]
}

// Get images based on property characteristics 
export function getPropertyImages(options?: {
  bedrooms?: number
  hasKitchen?: boolean
  hasBathroom?: boolean
  hasBalcony?: boolean
  count?: number
}): string[] {
  const { count = 3 } = options || {}
  
  // For now, just return random images
  // In the future, this could be more sophisticated based on the options
  return getRandomPropertyImages(count)
}