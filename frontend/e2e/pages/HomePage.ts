import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // Locators
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly filterPanel: Locator;
  readonly listingsGrid: Locator;
  readonly mapViewButton: Locator;
  readonly listViewButton: Locator;
  readonly savedSearchesButton: Locator;
  readonly shareButton: Locator;
  readonly resultsCount: Locator;
  readonly loadingSpinner: Locator;

  // Filter locators
  readonly priceMinInput: Locator;
  readonly priceMaxInput: Locator;
  readonly currencySelect: Locator;
  readonly bedroomsSelect: Locator;
  readonly districtSelect: Locator;
  readonly areaMinInput: Locator;
  readonly areaMaxInput: Locator;
  readonly petsAllowedCheckbox: Locator;
  readonly furnishedCheckbox: Locator;
  readonly applyFiltersButton: Locator;
  readonly clearFiltersButton: Locator;

  // Listing card locators
  readonly listingCards: Locator;
  readonly listingPrice: Locator;
  readonly listingDistrict: Locator;
  readonly listingBedrooms: Locator;
  readonly listingArea: Locator;

  // Pagination
  readonly paginationContainer: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly pageNumbers: Locator;

  constructor(page: Page) {
    super(page);

    // Initialize locators - using actual selectors from the app
    this.searchInput = page.getByPlaceholder(/search/i);
    this.searchButton = page.locator('button[type="submit"]').first();
    this.filterPanel = page.locator('aside').first(); // Filters sidebar
    this.listingsGrid = page.locator('main').first(); // Main content area
    this.mapViewButton = page.getByRole('button', { name: /map/i });
    this.listViewButton = page.getByRole('button', { name: /list/i });
    this.savedSearchesButton = page.getByText(/saved searches/i);
    this.shareButton = page.getByRole('button', { name: /share/i });
    this.resultsCount = page.locator('text=/\\d+ listings? found/i');
    this.loadingSpinner = page.locator('.loading-spinner, [role="status"]');

    // Filter locators - based on actual UI
    this.priceMinInput = page.locator('input[type="range"]').first();
    this.priceMaxInput = page.locator('input[type="range"]').last();
    this.currencySelect = page.locator('select').first();
    this.bedroomsSelect = page.locator('select').filter({ hasText: /bedrooms/i });
    this.districtSelect = page.locator('select').filter({ hasText: /district/i });
    this.areaMinInput = page.locator('input[name*="area"]').first();
    this.areaMaxInput = page.locator('input[name*="area"]').last();
    this.petsAllowedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /pets/i });
    this.furnishedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /furnished/i });
    this.applyFiltersButton = page.getByRole('button', { name: /apply/i });
    this.clearFiltersButton = page.getByRole('button', { name: /clear|reset/i });

    // Listing card locators - using actual structure
    this.listingCards = page.locator('[class*="Card"], article').filter({ hasText: /nag/i });
    this.listingPrice = page.locator('[class*="price"], .price');
    this.listingDistrict = page.locator('[class*="district"], .district');
    this.listingBedrooms = page.locator('[class*="bedrooms"], .bedrooms');
    this.listingArea = page.locator('[class*="area"], .area');

    // Pagination
    this.paginationContainer = page.locator('[class*="pagination"], nav[aria-label*="pagination"]');
    this.nextPageButton = page.getByRole('button', { name: /next|>/i });
    this.prevPageButton = page.getByRole('button', { name: /prev|</i });
    this.pageNumbers = page.locator('button[class*="page"]');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.navigate('/');
    await this.waitForListingsToLoad();
  }

  /**
   * Wait for listings to load
   */
  async waitForListingsToLoad() {
    // Wait for either API response or content to be visible
    await Promise.race([
      this.page.waitForResponse(response => 
        response.url().includes('/api/listings') && response.status() === 200,
        { timeout: 5000 }
      ).catch(() => {}),
      this.page.waitForSelector('[class*="Card"], article, .listing-item', { 
        state: 'visible',
        timeout: 5000 
      }).catch(() => {})
    ]);
    
    // Wait for loading spinner to disappear if it exists
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    
    // Small delay for animations
    await this.page.waitForTimeout(500);
  }

  /**
   * Search for listings by text
   */
  async searchListings(searchText: string) {
    await this.fillInput(this.searchInput, searchText);
    await this.clickWhenReady(this.searchButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Apply price filter
   */
  async filterByPrice(minPrice: number, maxPrice: number, currency: string = 'USD') {
    await this.fillInput(this.priceMinInput, minPrice.toString());
    await this.fillInput(this.priceMaxInput, maxPrice.toString());
    await this.selectOption(this.currencySelect, currency);
    await this.applyFilters();
  }

  /**
   * Apply district filter
   */
  async filterByDistricts(districts: string[]) {
    for (const district of districts) {
      await this.selectOption(this.districtSelect, district);
    }
    await this.applyFilters();
  }

  /**
   * Apply property characteristics filter
   */
  async filterByCharacteristics(options: {
    bedrooms?: number;
    minArea?: number;
    maxArea?: number;
    petsAllowed?: boolean;
    furnished?: boolean;
  }) {
    if (options.bedrooms !== undefined) {
      await this.selectOption(this.bedroomsSelect, options.bedrooms.toString());
    }
    if (options.minArea !== undefined) {
      await this.fillInput(this.areaMinInput, options.minArea.toString());
    }
    if (options.maxArea !== undefined) {
      await this.fillInput(this.areaMaxInput, options.maxArea.toString());
    }
    if (options.petsAllowed !== undefined) {
      const isChecked = await this.petsAllowedCheckbox.isChecked();
      if (isChecked !== options.petsAllowed) {
        await this.petsAllowedCheckbox.click();
      }
    }
    if (options.furnished !== undefined) {
      const isChecked = await this.furnishedCheckbox.isChecked();
      if (isChecked !== options.furnished) {
        await this.furnishedCheckbox.click();
      }
    }
    await this.applyFilters();
  }

  /**
   * Apply filters
   */
  async applyFilters() {
    await this.clickWhenReady(this.applyFiltersButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.clickWhenReady(this.clearFiltersButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Get number of listings
   */
  async getListingsCount(): Promise<number> {
    const count = await this.listingCards.count();
    return count;
  }

  /**
   * Get results count text
   */
  async getResultsCountText(): Promise<string> {
    return await this.getTextContent(this.resultsCount);
  }

  /**
   * Get listing details by index
   */
  async getListingDetails(index: number): Promise<{
    price: string;
    district: string;
    bedrooms: string;
    area: string;
  }> {
    const card = this.listingCards.nth(index);
    return {
      price: await this.getTextContent(card.locator('[data-testid="listing-price"]')),
      district: await this.getTextContent(card.locator('[data-testid="listing-district"]')),
      bedrooms: await this.getTextContent(card.locator('[data-testid="listing-bedrooms"]')),
      area: await this.getTextContent(card.locator('[data-testid="listing-area"]'))
    };
  }

  /**
   * Click on listing card
   */
  async clickListingCard(index: number) {
    await this.listingCards.nth(index).click();
  }

  /**
   * Switch to map view
   */
  async switchToMapView() {
    await this.clickWhenReady(this.mapViewButton);
    await this.page.waitForSelector('[data-testid="map-container"]');
  }

  /**
   * Switch to list view
   */
  async switchToListView() {
    await this.clickWhenReady(this.listViewButton);
    await this.page.waitForSelector('[data-testid="list-container"]');
  }

  /**
   * Navigate to next page
   */
  async goToNextPage() {
    await this.clickWhenReady(this.nextPageButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Navigate to previous page
   */
  async goToPreviousPage() {
    await this.clickWhenReady(this.prevPageButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Navigate to specific page
   */
  async goToPage(pageNumber: number) {
    const pageButton = this.page.getByRole('button', { name: pageNumber.toString(), exact: true });
    await this.clickWhenReady(pageButton);
    await this.waitForListingsToLoad();
  }

  /**
   * Open saved searches
   */
  async openSavedSearches() {
    await this.clickWhenReady(this.savedSearchesButton);
  }

  /**
   * Share current search
   */
  async shareSearch() {
    await this.clickWhenReady(this.shareButton);
  }

  /**
   * Check if no results message is displayed
   */
  async hasNoResultsMessage(): Promise<boolean> {
    return await this.hasText('No listings found');
  }

  /**
   * Get all listing prices
   */
  async getAllListingPrices(): Promise<number[]> {
    const priceTexts = await this.getAllTextContent(this.listingPrice);
    return priceTexts.map(text => {
      const match = text.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(/,/g, '')) : 0;
    });
  }

  /**
   * Check if listings are sorted by price
   */
  async areListingsSortedByPrice(order: 'asc' | 'desc' = 'asc'): Promise<boolean> {
    const prices = await this.getAllListingPrices();
    for (let i = 1; i < prices.length; i++) {
      if (order === 'asc' && prices[i] < prices[i - 1]) return false;
      if (order === 'desc' && prices[i] > prices[i - 1]) return false;
    }
    return true;
  }

  /**
   * Get all listing districts
   */
  async getAllListingDistricts(): Promise<string[]> {
    return await this.getAllTextContent(this.listingDistrict);
  }

  /**
   * Check if all listings are in specified districts
   */
  async areAllListingsInDistricts(districts: string[]): Promise<boolean> {
    const listingDistricts = await this.getAllListingDistricts();
    return listingDistricts.every(district => 
      districts.some(d => district.toLowerCase().includes(d.toLowerCase()))
    );
  }

  /**
   * Save current search
   */
  async saveCurrentSearch(name: string) {
    await this.clickWhenReady(this.page.getByRole('button', { name: /save.*search/i }));
    const modal = this.page.getByRole('dialog');
    await modal.waitFor({ state: 'visible' });
    await this.fillInput(modal.getByLabel(/search.*name/i), name);
    await this.clickWhenReady(modal.getByRole('button', { name: /save/i }));
    await modal.waitFor({ state: 'hidden' });
  }

  /**
   * Check if quick filter exists
   */
  async hasQuickFilter(filterName: string): Promise<boolean> {
    const quickFilter = this.page.getByRole('button', { name: filterName });
    return await this.isVisible(quickFilter);
  }

  /**
   * Apply quick filter
   */
  async applyQuickFilter(filterName: string) {
    const quickFilter = this.page.getByRole('button', { name: filterName });
    await this.clickWhenReady(quickFilter);
    await this.waitForListingsToLoad();
  }
}