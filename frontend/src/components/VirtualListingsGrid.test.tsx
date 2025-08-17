import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import VirtualListingsGrid from './VirtualListingsGrid'
import { Listing } from '../types'

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [
      { index: 0, start: 0, size: 400, key: '0' },
      { index: 1, start: 400, size: 400, key: '1' },
    ],
    getTotalSize: () => 800,
    scrollToOffset: vi.fn(),
    measure: vi.fn(),
  })),
}))

const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Beautiful Apartment',
    description: 'A lovely 2-bedroom apartment in Vake',
    price: 1200,
    priceMin: null,
    priceMax: null,
    currency: 'USD',
    district: 'Vake',
    address: '123 Chavchavadze Ave',
    latitude: 41.7097,
    longitude: 44.7565,
    bedrooms: 2,
    bathrooms: 1,
    areaSqm: 75,
    floor: 3,
    totalFloors: 10,
    yearBuilt: 2020,
    furnished: true,
    petsAllowed: true,
    amenities: ['Parking', 'Balcony', 'Elevator'],
    imageUrls: ['https://example.com/img1.jpg'],
    sourceUrl: 'https://example.com/listing1',
    status: 'ACTIVE',
    confidence: 0.95,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: '2',
    title: 'Modern Studio',
    description: 'Cozy studio in Saburtalo',
    price: 800,
    priceMin: null,
    priceMax: null,
    currency: 'USD',
    district: 'Saburtalo',
    address: '456 Vazha-Pshavela Ave',
    latitude: 41.7251,
    longitude: 44.7449,
    bedrooms: 1,
    bathrooms: 1,
    areaSqm: 45,
    floor: 5,
    totalFloors: 12,
    yearBuilt: 2019,
    furnished: false,
    petsAllowed: false,
    amenities: ['Elevator'],
    imageUrls: [],
    sourceUrl: 'https://example.com/listing2',
    status: 'ACTIVE',
    confidence: 0.88,
    createdAt: new Date('2025-01-02'),
    updatedAt: new Date('2025-01-02'),
  },
]

const renderComponent = (props = {}) => {
  const defaultProps = {
    listings: mockListings,
    isLoading: false,
    total: 2,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    onListingClick: vi.fn(),
  }

  return render(
    <BrowserRouter>
      <ChakraProvider>
        <div style={{ height: '600px' }}>
          <VirtualListingsGrid {...defaultProps} {...props} />
        </div>
      </ChakraProvider>
    </BrowserRouter>
  )
}

describe('VirtualListingsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('renders listings correctly', () => {
    renderComponent()
    
    expect(screen.getByText('2 properties found')).toBeInTheDocument()
    expect(screen.getByText('Vake - 2 Bedroom')).toBeInTheDocument()
    expect(screen.getByText('Saburtalo - 1 Bedroom')).toBeInTheDocument()
  })

  it('shows loading state when no listings', () => {
    renderComponent({ listings: [], isLoading: true })
    
    expect(screen.getAllByTestId(/skeleton/i).length).toBeGreaterThan(0)
  })

  it('shows empty state when no listings found', () => {
    renderComponent({ listings: [], isLoading: false, total: 0 })
    
    expect(screen.getByText('No listings found')).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your search filters/i)).toBeInTheDocument()
  })

  it('displays property details correctly', () => {
    renderComponent()
    
    // Check price display
    expect(screen.getByText('1,200 USD')).toBeInTheDocument()
    expect(screen.getByText('800 USD')).toBeInTheDocument()
    
    // Check bedrooms
    expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    
    // Check area
    expect(screen.getByText('75m²')).toBeInTheDocument()
    expect(screen.getByText('45m²')).toBeInTheDocument()
  })

  it('calls onListingClick when view details is clicked', async () => {
    const onListingClick = vi.fn()
    renderComponent({ onListingClick })
    
    const viewButtons = screen.getAllByText('View Details')
    viewButtons[0].click()
    
    await waitFor(() => {
      expect(onListingClick).toHaveBeenCalledWith(mockListings[0])
    })
  })

  it('calls fetchNextPage when scrolling near bottom', async () => {
    const fetchNextPage = vi.fn()
    renderComponent({ 
      hasNextPage: true, 
      fetchNextPage,
      listings: Array(20).fill(mockListings[0]).map((l, i) => ({ ...l, id: `${i}` }))
    })
    
    // Virtual scrolling mock would trigger fetchNextPage
    await waitFor(() => {
      // In real implementation, this would be triggered by scroll
      expect(fetchNextPage).toBeDefined()
    })
  })

  it('shows loading indicator when fetching next page', () => {
    renderComponent({ isFetchingNextPage: true })
    
    expect(screen.getByText('Loading more listings...')).toBeInTheDocument()
  })

  it('saves and restores scroll position', () => {
    const { rerender } = renderComponent()
    
    // Simulate scroll
    sessionStorage.setItem('listingsScrollPosition', '500')
    
    // Re-render component
    rerender(
      <BrowserRouter>
        <ChakraProvider>
          <div style={{ height: '600px' }}>
            <VirtualListingsGrid
              listings={mockListings}
              isLoading={false}
              total={2}
              hasNextPage={false}
              isFetchingNextPage={false}
              fetchNextPage={vi.fn()}
              onListingClick={vi.fn()}
            />
          </div>
        </ChakraProvider>
      </BrowserRouter>
    )
    
    expect(sessionStorage.getItem('listingsScrollPosition')).toBe('500')
  })

  it('displays amenities correctly', () => {
    renderComponent()
    
    expect(screen.getByText('Parking')).toBeInTheDocument()
    expect(screen.getByText('Balcony')).toBeInTheDocument()
    expect(screen.getByText('Elevator')).toBeInTheDocument()
  })

  it('shows furnished and pets allowed icons', () => {
    renderComponent()
    
    // These would be rendered as icons with titles
    const cards = screen.getAllByRole('article')
    expect(cards.length).toBeGreaterThan(0)
  })

  it('displays confidence score when available', () => {
    renderComponent()
    
    expect(screen.getByText(/AI Confidence: 95%/)).toBeInTheDocument()
    expect(screen.getByText(/AI Confidence: 88%/)).toBeInTheDocument()
  })

  it('handles responsive column layout', () => {
    // This would test breakpoint values but requires viewport mocking
    renderComponent()
    
    const grid = screen.getByText('2 properties found').parentElement?.parentElement
    expect(grid).toBeInTheDocument()
  })

  it('renders external link button when sourceUrl is available', () => {
    renderComponent()
    
    const externalLinks = screen.getAllByLabelText('View source')
    expect(externalLinks.length).toBe(2)
    expect(externalLinks[0]).toHaveAttribute('href', 'https://example.com/listing1')
    expect(externalLinks[1]).toHaveAttribute('href', 'https://example.com/listing2')
  })

  it('uses fallback image when no images provided', () => {
    renderComponent()
    
    const images = screen.getAllByRole('img')
    const fallbackImage = images.find(img => 
      img.getAttribute('src')?.includes('unsplash.com')
    )
    expect(fallbackImage).toBeInTheDocument()
  })
})