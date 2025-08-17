import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import ListingsGrid from './ListingsGrid';
import { Listing } from '../types/listing';

const mockListings: Listing[] = [
  {
    id: '1',
    district: 'Vake',
    address: 'Test Street 1',
    price: 800,
    currency: 'USD',
    bedrooms: 2,
    areaSqm: 75,
    petsAllowed: true,
    furnished: true,
    amenities: ['wifi', 'parking'],
    description: 'Nice apartment in Vake',
    photos: [],
    status: 'ACTIVE',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  },
  {
    id: '2',
    district: 'Saburtalo',
    address: 'Test Street 2',
    price: 600,
    currency: 'USD',
    bedrooms: 1,
    areaSqm: 50,
    petsAllowed: false,
    furnished: false,
    amenities: [],
    description: 'Cozy studio',
    photos: [],
    status: 'ACTIVE',
    createdAt: '2024-01-02',
    updatedAt: '2024-01-02',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ChakraProvider>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ChakraProvider>
  );
};

describe('ListingsGrid', () => {
  const defaultProps = {
    listings: mockListings,
    isLoading: false,
    total: 2,
    currentPage: 1,
    totalPages: 1,
    onPageChange: jest.fn(),
  };

  it('renders listings correctly', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    expect(screen.getByText('Nice apartment in Vake')).toBeInTheDocument();
    expect(screen.getByText('Cozy studio')).toBeInTheDocument();
    expect(screen.getByText('$800/month')).toBeInTheDocument();
    expect(screen.getByText('$600/month')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Loading listings...')).toBeInTheDocument();
  });

  it('displays empty state when no listings', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} listings={[]} total={0} />);
    
    expect(screen.getByText('No listings found')).toBeInTheDocument();
  });

  it('shows correct district badges', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    expect(screen.getByText('Vake')).toBeInTheDocument();
    expect(screen.getByText('Saburtalo')).toBeInTheDocument();
  });

  it('displays property details correctly', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    expect(screen.getByText('2 bed')).toBeInTheDocument();
    expect(screen.getByText('75 m²')).toBeInTheDocument();
    expect(screen.getByText('1 bed')).toBeInTheDocument();
    expect(screen.getByText('50 m²')).toBeInTheDocument();
  });

  it('shows pets allowed badge when applicable', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    const petsAllowedBadges = screen.getAllByText('Pets OK');
    expect(petsAllowedBadges).toHaveLength(1);
  });

  it('shows furnished badge when applicable', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    const furnishedBadges = screen.getAllByText('Furnished');
    expect(furnishedBadges).toHaveLength(1);
  });

  it('handles pagination correctly', () => {
    const onPageChange = jest.fn();
    renderWithProviders(
      <ListingsGrid 
        {...defaultProps} 
        totalPages={3}
        onPageChange={onPageChange}
      />
    );
    
    const nextButton = screen.getByLabelText('Next page');
    fireEvent.click(nextButton);
    
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables previous button on first page', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} currentPage={1} />);
    
    const prevButton = screen.getByLabelText('Previous page');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    renderWithProviders(
      <ListingsGrid 
        {...defaultProps} 
        currentPage={3}
        totalPages={3}
      />
    );
    
    const nextButton = screen.getByLabelText('Next page');
    expect(nextButton).toBeDisabled();
  });

  it('shows page numbers correctly', () => {
    renderWithProviders(
      <ListingsGrid 
        {...defaultProps} 
        currentPage={2}
        totalPages={5}
      />
    );
    
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
  });

  it('renders amenities when present', () => {
    renderWithProviders(<ListingsGrid {...defaultProps} />);
    
    expect(screen.getByText('wifi')).toBeInTheDocument();
    expect(screen.getByText('parking')).toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const longDescription = 'A'.repeat(200);
    const listingsWithLongDesc = [{
      ...mockListings[0],
      description: longDescription,
    }];
    
    renderWithProviders(
      <ListingsGrid 
        {...defaultProps} 
        listings={listingsWithLongDesc}
      />
    );
    
    const description = screen.getByText((content, element) => {
      return content.length < 200 && content.includes('A');
    });
    
    expect(description).toBeInTheDocument();
  });
});