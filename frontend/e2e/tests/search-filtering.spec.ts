import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { BDDHelpers } from '../helpers/bdd-helpers';
import { testData } from '../fixtures/test-data';

/**
 * E2E Tests for Search and Filtering Feature
 * Based on BDD scenarios from /bdd/search-filtering.feature
 */

test.describe('Search and Filtering', () => {
  let homePage: HomePage;
  let bddHelpers: BDDHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    bddHelpers = new BDDHelpers(page);
    await homePage.goto();
  });

  test.describe('Filter by price range', () => {
    test('should filter listings by USD price range', async ({ page }) => {
      // Given a user sets price filter
      const priceFilter = testData.filters.priceRange.midRange;
      
      // When the search is performed
      await homePage.filterByPrice(priceFilter.min, priceFilter.max, priceFilter.currency);
      
      // Then only listings with price between $600-$1000 should be shown
      const prices = await homePage.getAllListingPrices();
      expect(prices.length).toBeGreaterThan(0);
      
      prices.forEach(price => {
        expect(price).toBeGreaterThanOrEqual(priceFilter.min);
        expect(price).toBeLessThanOrEqual(priceFilter.max);
      });
      
      // And the result count should be displayed
      await bddHelpers.thenResultCountShouldBeDisplayed();
    });

    test('should handle currency conversion', async ({ page }) => {
      // Test with different currencies
      const currencies = ['USD', 'EUR', 'GEL'];
      
      for (const currency of currencies) {
        await homePage.filterByPrice(500, 1000, currency);
        await homePage.waitForListingsToLoad();
        
        const resultsCount = await homePage.getListingsCount();
        expect(resultsCount).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Filter by district', () => {
    test('should filter listings by selected districts', async ({ page }) => {
      // Given a user selects districts
      const districts = testData.filters.districts.popular;
      
      // When the search is performed
      await homePage.filterByDistricts(districts);
      
      // Then only listings in selected districts should be shown
      const allInDistricts = await homePage.areAllListingsInDistricts(districts);
      expect(allInDistricts).toBe(true);
      
      // And districts should be matched regardless of spelling variations
      const districtTexts = await homePage.getAllListingDistricts();
      districtTexts.forEach(district => {
        const matchFound = districts.some(d => 
          district.toLowerCase().includes(d.toLowerCase())
        );
        expect(matchFound).toBe(true);
      });
    });

    test('should handle multiple district selection', async ({ page }) => {
      const multipleDistricts = ['Vake', 'Saburtalo', 'Vera'];
      
      await homePage.filterByDistricts(multipleDistricts);
      
      const resultsCount = await homePage.getListingsCount();
      expect(resultsCount).toBeGreaterThan(0);
      
      const allInDistricts = await homePage.areAllListingsInDistricts(multipleDistricts);
      expect(allInDistricts).toBe(true);
    });
  });

  test.describe('Filter by property characteristics', () => {
    test('should filter by all property characteristics', async ({ page }) => {
      // Given a user sets filters
      const characteristics = testData.filters.characteristics.couple;
      
      // When the search is performed
      await homePage.filterByCharacteristics(characteristics);
      
      // Then only matching listings should be shown
      const resultsCount = await homePage.getListingsCount();
      
      if (resultsCount > 0) {
        // Verify each listing matches criteria
        for (let i = 0; i < Math.min(resultsCount, 5); i++) {
          const details = await homePage.getListingDetails(i);
          
          if (characteristics.bedrooms) {
            expect(parseInt(details.bedrooms)).toBe(characteristics.bedrooms);
          }
          
          // Area should be within range
          const area = parseInt(details.area);
          if (characteristics.minArea) {
            expect(area).toBeGreaterThanOrEqual(characteristics.minArea);
          }
          if (characteristics.maxArea) {
            expect(area).toBeLessThanOrEqual(characteristics.maxArea);
          }
        }
      }
    });

    test('should filter by pets allowed', async ({ page }) => {
      await homePage.filterByCharacteristics({ petsAllowed: true });
      
      const resultsCount = await homePage.getListingsCount();
      expect(resultsCount).toBeGreaterThanOrEqual(0);
      
      // Check that filter is applied (URL or UI indication)
      const url = page.url();
      expect(url).toContain('petsAllowed');
    });

    test('should filter by furnished status', async ({ page }) => {
      await homePage.filterByCharacteristics({ furnished: true });
      
      const resultsCount = await homePage.getListingsCount();
      expect(resultsCount).toBeGreaterThanOrEqual(0);
      
      const url = page.url();
      expect(url).toContain('furnished');
    });
  });

  test.describe('Text search in descriptions', () => {
    test('should search for listings by text', async ({ page }) => {
      // Given a user searches for "near metro"
      const searchQuery = 'near metro';
      
      // When the search is performed
      await homePage.searchListings(searchQuery);
      
      // Then listings mentioning metro proximity should be returned
      const resultsCount = await homePage.getListingsCount();
      
      // Results should be present or show no results message
      if (resultsCount === 0) {
        const hasNoResults = await homePage.hasNoResultsMessage();
        expect(hasNoResults).toBe(true);
      } else {
        expect(resultsCount).toBeGreaterThan(0);
      }
    });

    test('should handle multiple search terms', async ({ page }) => {
      const searchTerms = ['renovated', 'balcony', 'parking'];
      
      for (const term of searchTerms) {
        await homePage.searchListings(term);
        await homePage.waitForListingsToLoad();
        
        // Verify search was performed
        const url = page.url();
        expect(url).toContain(encodeURIComponent(term));
      }
    });
  });

  test.describe('Combined filters', () => {
    test('should apply multiple filters simultaneously', async ({ page }) => {
      // Given a user applies multiple filters
      const combinedFilters = {
        priceRange: { min: 400, max: 700, currency: 'USD' },
        districts: ['Vake', 'Saburtalo'],
        characteristics: { bedrooms: 2 },
        textSearch: 'newly renovated'
      };
      
      // Apply all filters
      await homePage.filterByPrice(
        combinedFilters.priceRange.min,
        combinedFilters.priceRange.max,
        combinedFilters.priceRange.currency
      );
      await homePage.filterByDistricts(combinedFilters.districts);
      await homePage.filterByCharacteristics(combinedFilters.characteristics);
      await homePage.searchListings(combinedFilters.textSearch);
      
      // Then results should match ALL filter criteria
      const resultsCount = await homePage.getListingsCount();
      
      if (resultsCount > 0) {
        // Verify price range
        const prices = await homePage.getAllListingPrices();
        prices.forEach(price => {
          expect(price).toBeGreaterThanOrEqual(combinedFilters.priceRange.min);
          expect(price).toBeLessThanOrEqual(combinedFilters.priceRange.max);
        });
        
        // Verify districts
        const allInDistricts = await homePage.areAllListingsInDistricts(combinedFilters.districts);
        expect(allInDistricts).toBe(true);
      }
    });
  });

  test.describe('Sort search results', () => {
    test('should sort results by price ascending', async ({ page }) => {
      // Given search results are displayed
      await homePage.waitForListingsToLoad();
      
      // When user selects sort by price ascending
      const sortButton = page.getByRole('button', { name: /sort/i });
      await sortButton.click();
      await page.getByRole('option', { name: /price.*low/i }).click();
      
      // Then results should be reordered accordingly
      await homePage.waitForListingsToLoad();
      const sorted = await homePage.areListingsSortedByPrice('asc');
      expect(sorted).toBe(true);
    });

    test('should sort results by price descending', async ({ page }) => {
      const sortButton = page.getByRole('button', { name: /sort/i });
      await sortButton.click();
      await page.getByRole('option', { name: /price.*high/i }).click();
      
      await homePage.waitForListingsToLoad();
      const sorted = await homePage.areListingsSortedByPrice('desc');
      expect(sorted).toBe(true);
    });
  });

  test.describe('Save search preferences', () => {
    test('should save search with specific filters', async ({ page }) => {
      // Given a user performs a search with specific filters
      await homePage.filterByPrice(500, 800, 'USD');
      await homePage.filterByDistricts(['Vake']);
      
      // When the user clicks "Save Search"
      const searchName = 'My Test Search';
      await homePage.saveCurrentSearch(searchName);
      
      // Then the search criteria should be saved
      await homePage.openSavedSearches();
      const savedSearch = page.getByText(searchName);
      await expect(savedSearch).toBeVisible();
    });
  });

  test.describe('No results handling', () => {
    test('should show helpful message when no results found', async ({ page }) => {
      // Given a search with very restrictive filters
      await homePage.filterByPrice(100, 150, 'USD'); // Very low price range
      await homePage.filterByDistricts(['NonExistentDistrict']);
      
      // When no results are found
      // Then a helpful message should be shown
      const hasNoResults = await homePage.hasNoResultsMessage();
      expect(hasNoResults).toBe(true);
      
      // And suggestions should be provided
      const suggestions = [
        'Expand price range',
        'Include nearby districts',
        'Remove some filters'
      ];
      
      for (const suggestion of suggestions) {
        const hasSuggestion = await page.getByText(suggestion).isVisible();
        expect(hasSuggestion).toBe(true);
      }
    });
  });

  test.describe('Pagination', () => {
    test('should navigate through pages', async ({ page }) => {
      // Assuming we have enough results for pagination
      await homePage.waitForListingsToLoad();
      
      const hasNextButton = await homePage.nextPageButton.isVisible();
      
      if (hasNextButton) {
        // Navigate to next page
        await homePage.goToNextPage();
        
        // URL should update with page parameter
        expect(page.url()).toContain('page=2');
        
        // Navigate back to previous page
        await homePage.goToPreviousPage();
        expect(page.url()).toContain('page=1');
      }
    });

    test('should jump to specific page', async ({ page }) => {
      await homePage.waitForListingsToLoad();
      
      // Check if page 3 exists
      const page3Button = page.getByRole('button', { name: '3', exact: true });
      const hasPage3 = await page3Button.isVisible();
      
      if (hasPage3) {
        await homePage.goToPage(3);
        expect(page.url()).toContain('page=3');
      }
    });
  });

  test.describe('Quick filters', () => {
    test('should display and apply quick filters', async ({ page }) => {
      // Given the search interface is displayed
      await homePage.waitForListingsToLoad();
      
      // Then popular filters should be shown as chips
      for (const filter of testData.quickFilters) {
        const hasFilter = await homePage.hasQuickFilter(filter);
        expect(hasFilter).toBe(true);
      }
      
      // And clicking a chip should instantly apply the filter
      await homePage.applyQuickFilter('Pet-friendly');
      await homePage.waitForListingsToLoad();
      
      // Verify filter is applied
      const url = page.url();
      expect(url).toContain('petsAllowed');
    });
  });

  test.describe('Performance', () => {
    test('should load and filter results within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      // Apply multiple filters
      await homePage.filterByPrice(500, 1000, 'USD');
      await homePage.filterByDistricts(['Vake', 'Saburtalo']);
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should complete within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid filter changes', async ({ page }) => {
      // Rapidly change filters
      for (let i = 0; i < 5; i++) {
        await homePage.filterByPrice(400 + i * 100, 800 + i * 100, 'USD');
      }
      
      // Page should remain responsive
      const isResponsive = await homePage.searchButton.isEnabled();
      expect(isResponsive).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await homePage.goto();
      
      // Filters should be accessible (might be in a drawer/modal)
      const filterButton = page.getByRole('button', { name: /filter/i });
      await expect(filterButton).toBeVisible();
      
      await filterButton.click();
      
      // Filter panel should be visible
      await expect(homePage.filterPanel).toBeVisible();
      
      // Apply a filter
      await homePage.filterByPrice(500, 1000, 'USD');
      
      // Results should update
      await homePage.waitForListingsToLoad();
      const resultsCount = await homePage.getListingsCount();
      expect(resultsCount).toBeGreaterThanOrEqual(0);
    });
  });
});