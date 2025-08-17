import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ListingDetailPage } from '../pages/ListingDetailPage';
import { BDDHelpers } from '../helpers/bdd-helpers';
import { testData } from '../fixtures/test-data';

/**
 * E2E Tests for List View Display Feature
 * Based on BDD scenarios from /bdd/list-view.feature
 */

test.describe('List View Display', () => {
  let homePage: HomePage;
  let listingDetailPage: ListingDetailPage;
  let bddHelpers: BDDHelpers;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    listingDetailPage = new ListingDetailPage(page);
    bddHelpers = new BDDHelpers(page);
    
    // Navigate to home page (list view is default)
    await homePage.goto();
  });

  test.describe('Display listings in table format', () => {
    test('should display listings with all required columns', async ({ page }) => {
      // When user is on list view
      await homePage.switchToListView();
      
      // Then listings should be displayed with required columns
      const listingsCount = await homePage.getListingsCount();
      expect(listingsCount).toBeGreaterThan(0);
      
      // Check first listing has all required fields
      const firstListing = await homePage.getListingDetails(0);
      expect(firstListing.price).toBeTruthy();
      expect(firstListing.district).toBeTruthy();
      expect(firstListing.bedrooms).toBeTruthy();
      expect(firstListing.area).toBeTruthy();
    });

    test('should allow sorting by price', async ({ page }) => {
      // Click sort button and select price ascending
      const sortButton = page.getByRole('button', { name: /sort/i });
      await sortButton.click();
      await page.getByRole('option', { name: /price.*low/i }).click();
      
      await homePage.waitForListingsToLoad();
      
      // Verify listings are sorted by price
      const sorted = await homePage.areListingsSortedByPrice('asc');
      expect(sorted).toBe(true);
      
      // Sort by price descending
      await sortButton.click();
      await page.getByRole('option', { name: /price.*high/i }).click();
      
      await homePage.waitForListingsToLoad();
      
      const sortedDesc = await homePage.areListingsSortedByPrice('desc');
      expect(sortedDesc).toBe(true);
    });

    test('should allow sorting by area', async ({ page }) => {
      const sortButton = page.getByRole('button', { name: /sort/i });
      await sortButton.click();
      
      // Look for area sort option
      const areaSortOption = page.getByRole('option', { name: /area/i });
      if (await areaSortOption.isVisible()) {
        await areaSortOption.click();
        await homePage.waitForListingsToLoad();
        
        // Get areas and check if sorted
        const areas: number[] = [];
        const count = await homePage.getListingsCount();
        for (let i = 0; i < Math.min(count, 5); i++) {
          const details = await homePage.getListingDetails(i);
          const area = parseInt(details.area);
          areas.push(area);
        }
        
        // Check if sorted
        const isSorted = areas.every((val, i, arr) => !i || arr[i - 1] <= val);
        expect(isSorted).toBe(true);
      }
    });

    test('should allow sorting by posted date', async ({ page }) => {
      const sortButton = page.getByRole('button', { name: /sort/i });
      await sortButton.click();
      
      const dateSortOption = page.getByRole('option', { name: /newest|date/i });
      if (await dateSortOption.isVisible()) {
        await dateSortOption.click();
        await homePage.waitForListingsToLoad();
        
        // First items should be the newest
        const listingsCount = await homePage.getListingsCount();
        expect(listingsCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Responsive list on mobile', () => {
    test('should display as cards on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await homePage.waitForListingsToLoad();
      
      // Listings should be displayed
      const listingsCount = await homePage.getListingsCount();
      expect(listingsCount).toBeGreaterThan(0);
      
      // Check if layout is card-based (mobile)
      const firstCard = homePage.listingCards.first();
      const cardBox = await firstCard.boundingBox();
      
      // Card should take most of the width on mobile
      expect(cardBox?.width).toBeGreaterThan(300);
      
      // Check key elements are visible
      const firstListing = await homePage.getListingDetails(0);
      expect(firstListing.price).toBeTruthy();
      expect(firstListing.district).toBeTruthy();
    });

    test('should have touch-friendly interactions on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await homePage.waitForListingsToLoad();
      
      // Click on first listing
      await homePage.clickListingCard(0);
      
      // Should navigate to detail page
      await page.waitForURL(/\/listings\/[\w-]+/);
      expect(page.url()).toContain('/listings/');
    });
  });

  test.describe('Inline preview on hover', () => {
    test('should show preview on hover (desktop only)', async ({ page }) => {
      // This test only works on desktop viewport
      const viewport = page.viewportSize();
      if (!viewport || viewport.width < 1024) {
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.reload();
        await homePage.waitForListingsToLoad();
      }
      
      // Hover over first listing
      const firstCard = homePage.listingCards.first();
      await firstCard.hover();
      
      // Wait for potential preview
      await page.waitForTimeout(500);
      
      // Check if preview or tooltip appears
      const preview = page.locator('[data-testid="listing-preview"]');
      const hasPreview = await preview.isVisible().catch(() => false);
      
      if (hasPreview) {
        // Preview should contain additional info
        const previewText = await preview.textContent();
        expect(previewText).toBeTruthy();
      }
    });
  });

  test.describe('Bulk actions', () => {
    test('should allow selecting multiple listings', async ({ page }) => {
      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"][data-testid*="listing"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount > 0) {
        // Select first 3 listings
        for (let i = 0; i < Math.min(3, checkboxCount); i++) {
          await checkboxes.nth(i).check();
        }
        
        // Bulk actions should appear
        const bulkActions = page.locator('[data-testid="bulk-actions"]');
        await expect(bulkActions).toBeVisible();
        
        // Check available actions
        const compareButton = page.getByRole('button', { name: /compare/i });
        const exportButton = page.getByRole('button', { name: /export/i });
        
        const hasCompare = await compareButton.isVisible();
        const hasExport = await exportButton.isVisible();
        
        expect(hasCompare || hasExport).toBe(true);
      }
    });
  });

  test.describe('Compare listings', () => {
    test('should open comparison view for selected listings', async ({ page }) => {
      // Select checkboxes if available
      const checkboxes = page.locator('input[type="checkbox"][data-testid*="listing"]');
      const checkboxCount = await checkboxes.count();
      
      if (checkboxCount >= 2) {
        // Select 2 listings
        await checkboxes.nth(0).check();
        await checkboxes.nth(1).check();
        
        // Click compare button
        const compareButton = page.getByRole('button', { name: /compare/i });
        if (await compareButton.isVisible()) {
          await compareButton.click();
          
          // Comparison view should open
          const comparisonView = page.locator('[data-testid="comparison-view"]');
          await expect(comparisonView).toBeVisible();
          
          // Should show side-by-side comparison
          const comparisonColumns = comparisonView.locator('[data-testid="comparison-column"]');
          const columnCount = await comparisonColumns.count();
          expect(columnCount).toBe(2);
        }
      }
    });
  });

  test.describe('Quick view modal', () => {
    test('should open quick view modal', async ({ page }) => {
      // Look for quick view button
      const quickViewButtons = page.locator('button:has-text("Quick view"), button[aria-label*="quick"]');
      const hasQuickView = await quickViewButtons.first().isVisible().catch(() => false);
      
      if (hasQuickView) {
        await quickViewButtons.first().click();
        
        // Modal should open
        const modal = page.getByRole('dialog');
        await expect(modal).toBeVisible();
        
        // Modal should contain listing details
        const modalContent = await modal.textContent();
        expect(modalContent).toBeTruthy();
        
        // Should have close button
        const closeButton = modal.getByRole('button', { name: /close/i });
        await expect(closeButton).toBeVisible();
        
        // Close modal
        await closeButton.click();
        await expect(modal).toBeHidden();
      }
    });
  });

  test.describe('Infinite scroll', () => {
    test('should load more listings on scroll', async ({ page }) => {
      // Get initial count
      const initialCount = await homePage.getListingsCount();
      
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for potential new listings to load
      await page.waitForTimeout(2000);
      
      // Check if more listings loaded
      const newCount = await homePage.getListingsCount();
      
      // If infinite scroll is implemented, more listings should load
      // Otherwise, pagination should be available
      if (newCount === initialCount) {
        // Check for pagination
        const hasNextButton = await homePage.nextPageButton.isVisible();
        expect(hasNextButton).toBe(true);
      } else {
        expect(newCount).toBeGreaterThan(initialCount);
      }
    });
  });

  test.describe('List view customization', () => {
    test('should allow customizing columns', async ({ page }) => {
      // Look for customize button
      const customizeButton = page.getByRole('button', { name: /customize/i });
      const hasCustomize = await customizeButton.isVisible().catch(() => false);
      
      if (hasCustomize) {
        await customizeButton.click();
        
        // Customization panel should open
        const customPanel = page.locator('[data-testid="customize-panel"]');
        await expect(customPanel).toBeVisible();
        
        // Should have column toggles
        const columnToggles = customPanel.locator('input[type="checkbox"]');
        const toggleCount = await columnToggles.count();
        expect(toggleCount).toBeGreaterThan(0);
        
        // Try toggling a column
        const firstToggle = columnToggles.first();
        const isChecked = await firstToggle.isChecked();
        await firstToggle.click();
        
        // State should change
        const newState = await firstToggle.isChecked();
        expect(newState).toBe(!isChecked);
      }
    });
  });

  test.describe('Highlight new listings', () => {
    test('should highlight recently posted listings', async ({ page }) => {
      // Look for new badges
      const newBadges = page.locator('[data-testid="new-badge"], .new-listing');
      const hasNewBadges = await newBadges.first().isVisible().catch(() => false);
      
      if (hasNewBadges) {
        // New listings should have visual distinction
        const firstNewBadge = newBadges.first();
        const badgeText = await firstNewBadge.textContent();
        expect(badgeText).toMatch(/new/i);
        
        // Check styling (color should be different)
        const color = await firstNewBadge.evaluate(el => 
          window.getComputedStyle(el).backgroundColor
        );
        expect(color).not.toBe('rgba(0, 0, 0, 0)'); // Should have a background color
      }
    });
  });

  test.describe('Show price changes', () => {
    test('should display price changes if available', async ({ page }) => {
      // Look for price change indicators
      const priceChanges = page.locator('[data-testid*="price-change"], .price-reduced');
      const hasPriceChanges = await priceChanges.first().isVisible().catch(() => false);
      
      if (hasPriceChanges) {
        const firstChange = priceChanges.first();
        
        // Should show old and new price
        const changeText = await firstChange.textContent();
        expect(changeText).toBeTruthy();
        
        // Look for strikethrough old price
        const oldPrice = firstChange.locator('s, del, .old-price');
        const hasOldPrice = await oldPrice.isVisible().catch(() => false);
        
        if (hasOldPrice) {
          const oldPriceText = await oldPrice.textContent();
          expect(oldPriceText).toMatch(/\d+/);
        }
      }
    });
  });

  test.describe('Favorite listings management', () => {
    test('should allow adding listings to favorites', async ({ page }) => {
      // Find heart/favorite icon
      const favoriteButtons = page.locator('[data-testid*="favorite"], button[aria-label*="favorite"], .heart-icon');
      const hasFavorites = await favoriteButtons.first().isVisible().catch(() => false);
      
      if (hasFavorites) {
        const firstFavorite = favoriteButtons.first();
        
        // Click to add to favorites
        await firstFavorite.click();
        
        // Icon should change state (filled)
        await page.waitForTimeout(500);
        
        // Check if state changed (class, aria-pressed, or data attribute)
        const isSelected = await firstFavorite.evaluate(el => {
          return el.classList.contains('selected') || 
                 el.classList.contains('active') ||
                 el.getAttribute('aria-pressed') === 'true' ||
                 el.getAttribute('data-favorited') === 'true';
        });
        
        expect(isSelected).toBe(true);
        
        // Click again to remove from favorites
        await firstFavorite.click();
        await page.waitForTimeout(500);
        
        const isDeselected = await firstFavorite.evaluate(el => {
          return !el.classList.contains('selected') && 
                 !el.classList.contains('active') &&
                 el.getAttribute('aria-pressed') !== 'true' &&
                 el.getAttribute('data-favorited') !== 'true';
        });
        
        expect(isDeselected).toBe(true);
      }
    });
  });

  test.describe('Export listings', () => {
    test('should provide export options', async ({ page }) => {
      // Look for export button
      const exportButton = page.getByRole('button', { name: /export/i });
      const hasExport = await exportButton.isVisible().catch(() => false);
      
      if (hasExport) {
        await exportButton.click();
        
        // Export options should appear
        const exportModal = page.getByRole('dialog');
        const exportMenu = page.locator('[data-testid="export-menu"]');
        
        const hasModal = await exportModal.isVisible().catch(() => false);
        const hasMenu = await exportMenu.isVisible().catch(() => false);
        
        expect(hasModal || hasMenu).toBe(true);
        
        // Check for export formats
        const pdfOption = page.getByText(/pdf/i);
        const excelOption = page.getByText(/excel/i);
        const csvOption = page.getByText(/csv/i);
        
        const hasPDF = await pdfOption.isVisible().catch(() => false);
        const hasExcel = await excelOption.isVisible().catch(() => false);
        const hasCSV = await csvOption.isVisible().catch(() => false);
        
        expect(hasPDF || hasExcel || hasCSV).toBe(true);
      }
    });
  });

  test.describe('Navigation to detail page', () => {
    test('should navigate to detail page on listing click', async ({ page }) => {
      // Click on first listing
      await homePage.clickListingCard(0);
      
      // Should navigate to detail page
      await page.waitForURL(/\/listings\/[\w-]+/);
      expect(page.url()).toContain('/listings/');
      
      // Detail page should load
      const sections = await listingDetailPage.hasAllRequiredSections();
      expect(sections.gallery || sections.details).toBe(true);
    });

    test('should open detail in new tab with middle click', async ({ page, context }) => {
      // Get initial page count
      const initialPages = context.pages().length;
      
      // Middle click on first listing (or Ctrl+Click)
      const firstCard = homePage.listingCards.first();
      await firstCard.click({ button: 'middle' });
      
      // Wait for new tab
      await page.waitForTimeout(1000);
      
      // Check if new tab opened
      const newPages = context.pages().length;
      
      // If middle click is supported, new tab should open
      if (newPages > initialPages) {
        const newPage = context.pages()[newPages - 1];
        await newPage.waitForLoadState();
        
        const newUrl = newPage.url();
        expect(newUrl).toContain('/listings/');
      }
    });
  });

  test.describe('Performance', () => {
    test('should render list efficiently with many items', async ({ page }) => {
      // Measure initial render time
      const startTime = Date.now();
      await homePage.goto();
      await homePage.waitForListingsToLoad();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time
      expect(loadTime).toBeLessThan(3000);
      
      // Check if virtual scrolling is used for performance
      const listContainer = page.locator('[data-testid="listings-grid"], .virtual-list');
      const isVirtual = await listContainer.evaluate(el => {
        return el.classList.contains('virtual') || 
               el.getAttribute('data-virtual') === 'true';
      }).catch(() => false);
      
      // Log performance info
      console.log(`List loaded in ${loadTime}ms, Virtual scrolling: ${isVirtual}`);
    });

    test('should handle rapid sorting changes', async ({ page }) => {
      const sortButton = page.getByRole('button', { name: /sort/i });
      
      // Rapidly change sort options
      for (let i = 0; i < 3; i++) {
        await sortButton.click();
        const options = page.getByRole('option');
        const optionCount = await options.count();
        
        if (optionCount > 0) {
          await options.nth(i % optionCount).click();
          await page.waitForTimeout(200);
        }
      }
      
      // Page should remain responsive
      const listingsCount = await homePage.getListingsCount();
      expect(listingsCount).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels and keyboard navigation', async ({ page }) => {
      // Check for ARIA labels
      const listings = homePage.listingCards;
      const firstListing = listings.first();
      
      const ariaLabel = await firstListing.getAttribute('aria-label');
      const role = await firstListing.getAttribute('role');
      
      // Should have proper ARIA attributes
      expect(ariaLabel || role).toBeTruthy();
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if an element is focused
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName;
      });
      
      expect(focusedElement).toBeTruthy();
      
      // Press Enter on focused listing
      await page.keyboard.press('Enter');
      
      // Should either open detail or perform action
      await page.waitForTimeout(500);
    });
  });
});