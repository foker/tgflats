import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for listings display functionality
 */

test.describe('Listings Display', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Console error: ${msg.text()}`);
      }
    });
    
    // Log network errors
    page.on('pageerror', exception => {
      console.log(`Page error: ${exception.message}`);
    });
    
    // Log failed requests
    page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('should load application and display listings', async ({ page }) => {
    console.log('Navigating to homepage...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for React to mount
    await page.waitForTimeout(2000);
    
    // Check if the root element exists
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    console.log('Root element is visible');
    
    // Check if React app has mounted
    const rootContent = await root.innerHTML();
    expect(rootContent).not.toBe('');
    console.log('React app has mounted');
    
    // Wait for any loading state to complete
    await page.waitForLoadState('networkidle');
    
    // Check for main app structure
    const mainContent = page.locator('main, [role="main"], .container, .app, .layout').first();
    if (await mainContent.count() > 0) {
      await expect(mainContent).toBeVisible({ timeout: 10000 });
      console.log('Main content container is visible');
    }
    
    // Check for header/navigation
    const header = page.locator('header, nav, [role="navigation"], .header, .navbar').first();
    if (await header.count() > 0) {
      await expect(header).toBeVisible();
      console.log('Header/navigation is visible');
    }
    
    // Check for listings container
    const listingsContainer = page.locator('[class*="grid"], [class*="list"], [class*="listings"], main').first();
    await expect(listingsContainer).toBeVisible({ timeout: 10000 });
    console.log('Listings container is visible');
    
    // Wait for listings to load
    const listings = page.locator('[class*="card"], article, [data-testid*="listing"], .listing-item, [class*="Card"]');
    
    // Wait for at least one listing to appear
    await expect(listings.first()).toBeVisible({ timeout: 15000 });
    const listingCount = await listings.count();
    console.log(`Found ${listingCount} listings`);
    
    expect(listingCount).toBeGreaterThan(0);
    
    // Check first listing has content
    const firstListing = listings.first();
    const listingText = await firstListing.textContent();
    expect(listingText).not.toBe('');
    console.log('First listing has content');
    
    // Check for price information
    const prices = page.locator('[class*="price"], [class*="Price"], span:has-text("$"), span:has-text("GEL"), span:has-text("₾")');
    if (await prices.count() > 0) {
      console.log(`Found ${await prices.count()} price elements`);
    }
    
    // Check for district/location information
    const locations = page.locator('[class*="location"], [class*="district"], [class*="address"]');
    if (await locations.count() > 0) {
      console.log(`Found ${await locations.count()} location elements`);
    }
  });

  test('should make successful API calls', async ({ page }) => {
    let apiCallMade = false;
    let apiResponse: any = null;
    
    // Intercept API calls
    page.on('response', async response => {
      if (response.url().includes('/api/listings')) {
        apiCallMade = true;
        const status = response.status();
        console.log(`API call: ${response.url()} - Status: ${status}`);
        
        if (status === 200) {
          try {
            apiResponse = await response.json();
            console.log(`API returned ${apiResponse?.data?.length || 0} listings`);
          } catch (e) {
            console.log('Failed to parse API response');
          }
        }
      }
    });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for API calls
    await page.waitForTimeout(3000);
    
    expect(apiCallMade).toBe(true);
    expect(apiResponse).not.toBeNull();
    expect(apiResponse?.data).toBeDefined();
    expect(apiResponse?.data?.length).toBeGreaterThan(0);
  });

  test('should display listing details correctly', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for listings to load
    await page.waitForTimeout(3000);
    
    // Find a listing with visible details
    const listing = page.locator('[class*="card"], article, [data-testid*="listing"]').first();
    await expect(listing).toBeVisible({ timeout: 10000 });
    
    // Check for essential listing information
    const listingContent = await listing.textContent();
    
    // Should have some text content
    expect(listingContent).not.toBe('');
    
    // Check for common listing elements
    const hasPrice = listingContent?.match(/\$|\d+\s*(USD|GEL|₾)/i);
    const hasRooms = listingContent?.match(/\d+\s*(room|bedroom|bed)/i);
    const hasArea = listingContent?.match(/\d+\s*(m²|sqm|m2)/i);
    
    console.log('Listing content checks:');
    console.log(`- Has price: ${!!hasPrice}`);
    console.log(`- Has rooms: ${!!hasRooms}`);
    console.log(`- Has area: ${!!hasArea}`);
    
    // At least one of these should be present
    expect(hasPrice || hasRooms || hasArea).toBeTruthy();
  });

  test('should handle images or placeholders', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Check for images or placeholder elements
    const images = page.locator('img, [class*="image"], [class*="Image"], svg, [class*="placeholder"]');
    const imageCount = await images.count();
    
    console.log(`Found ${imageCount} image/placeholder elements`);
    
    if (imageCount > 0) {
      // Check first image/placeholder
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      
      // If it's an img tag, check src
      if (await firstImage.evaluate(el => el.tagName === 'IMG')) {
        const src = await firstImage.getAttribute('src');
        console.log(`First image src: ${src}`);
        expect(src).toBeTruthy();
      }
    }
  });

  test('should display filters section', async ({ page }) => {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Check for filter section
    const filters = page.locator('aside, [class*="filter"], [class*="Filter"], [role="search"], form').first();
    
    if (await filters.count() > 0) {
      await expect(filters).toBeVisible();
      console.log('Filter section is visible');
      
      // Check for common filter elements
      const priceInputs = page.locator('input[type="range"], input[type="number"], [class*="price"]');
      const districtSelect = page.locator('select, [class*="select"], [role="combobox"]');
      const searchInput = page.locator('input[type="text"], input[type="search"], input[placeholder*="search" i]');
      
      console.log(`Found ${await priceInputs.count()} price inputs`);
      console.log(`Found ${await districtSelect.count()} select elements`);
      console.log(`Found ${await searchInput.count()} search inputs`);
    }
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Check desktop layout
    const desktopListings = page.locator('[class*="card"], article, [data-testid*="listing"]');
    const desktopCount = await desktopListings.count();
    console.log(`Desktop view: ${desktopCount} listings visible`);
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    // Check mobile layout
    const mobileListings = page.locator('[class*="card"], article, [data-testid*="listing"]');
    const mobileCount = await mobileListings.count();
    console.log(`Mobile view: ${mobileCount} listings visible`);
    
    // Both views should show listings
    expect(desktopCount).toBeGreaterThan(0);
    expect(mobileCount).toBeGreaterThan(0);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', exception => {
      errors.push(exception.message);
    });
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    
    // There should be no critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('DevTools') &&
      !e.includes('Warning:')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});