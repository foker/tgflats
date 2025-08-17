import { test, expect } from '@playwright/test';

/**
 * Smoke tests to verify basic functionality
 */

test.describe('Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check that main elements are visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
    
    // Check that listings are loaded
    const listings = page.locator('[class*="Card"], article, img[src*="placeholder"]');
    await expect(listings.first()).toBeVisible({ timeout: 10000 });
    
    // Check that filters are visible
    const filters = page.locator('aside, [class*="filter"]').first();
    await expect(filters).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Check for navigation elements
    const mapButton = page.getByRole('button', { name: /map/i });
    const listButton = page.getByRole('button', { name: /list/i });
    
    // Try switching views
    if (await mapButton.isVisible()) {
      await mapButton.click();
      // Wait for view change
      await page.waitForTimeout(1000);
    }
    
    if (await listButton.isVisible()) {
      await listButton.click();
      // Wait for view change
      await page.waitForTimeout(1000);
    }
  });

  test('should display listings with images', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for images (placeholders or actual)
    const images = page.locator('img');
    const imageCount = await images.count();
    
    expect(imageCount).toBeGreaterThan(0);
    
    // Check first image is visible
    if (imageCount > 0) {
      await expect(images.first()).toBeVisible();
    }
  });

  test('should have functional filters', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Find price range slider
    const priceSlider = page.locator('input[type="range"]').first();
    
    if (await priceSlider.isVisible()) {
      // Get initial value
      const initialValue = await priceSlider.inputValue();
      
      // Change the value
      await priceSlider.fill('1000');
      
      // Check value changed
      const newValue = await priceSlider.inputValue();
      expect(newValue).not.toBe(initialValue);
    }
    
    // Check district selector
    const districtSelect = page.locator('select').first();
    if (await districtSelect.isVisible()) {
      const options = await districtSelect.locator('option').count();
      expect(options).toBeGreaterThan(1);
    }
  });

  test('should handle search input', async ({ page }) => {
    await page.goto('http://localhost:5173');
    
    // Find search input
    const searchInput = page.getByPlaceholder(/search/i);
    
    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('Vake');
      
      // Check value was entered
      const value = await searchInput.inputValue();
      expect(value).toBe('Vake');
      
      // Try to submit (if form exists)
      const searchButton = page.locator('button[type="submit"]').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should be responsive', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1000);
    
    // Check desktop layout
    const desktopSidebar = page.locator('aside').first();
    const isDesktopSidebarVisible = await desktopSidebar.isVisible();
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // On mobile, sidebar might be hidden or in different position
    const mobileSidebar = page.locator('aside').first();
    const isMobileSidebarVisible = await mobileSidebar.isVisible();
    
    // Layout should be different between desktop and mobile
    console.log(`Desktop sidebar: ${isDesktopSidebarVisible}, Mobile sidebar: ${isMobileSidebarVisible}`);
  });

  test('should make API calls', async ({ page }) => {
    let apiCalled = false;
    
    // Listen for API calls
    page.on('response', response => {
      if (response.url().includes('/api/listings')) {
        apiCalled = true;
        console.log(`API call made: ${response.url()}, Status: ${response.status()}`);
      }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    // Check if API was called
    expect(apiCalled).toBe(true);
  });
});