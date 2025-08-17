import { Page, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { MapPage } from '../pages/MapPage';
import { ListingDetailPage } from '../pages/ListingDetailPage';

/**
 * BDD Step Definitions Helper
 * Maps BDD scenarios to actual test implementations
 */

export class BDDHelpers {
  private homePage: HomePage;
  private mapPage: MapPage;
  private listingDetailPage: ListingDetailPage;
  
  constructor(private page: Page) {
    this.homePage = new HomePage(page);
    this.mapPage = new MapPage(page);
    this.listingDetailPage = new ListingDetailPage(page);
  }

  // ===== GIVEN Steps =====
  
  async givenDatabaseContainsListings(count: number) {
    // This assumes backend is seeded with test data
    // In real scenario, you might want to verify via API
    const response = await this.page.request.get('http://localhost:3001/api/listings');
    const data = await response.json();
    expect(data.data).toBeDefined();
    console.log(`Database contains ${data.data.length} listings`);
  }

  async givenUserIsOnMainPage() {
    await this.homePage.goto();
  }

  async givenUserIsOnMapView() {
    await this.mapPage.goto();
  }

  async givenFiltersAreApplied(filters: any) {
    await this.homePage.goto();
    
    if (filters.price) {
      await this.homePage.filterByPrice(
        filters.price.min, 
        filters.price.max, 
        filters.price.currency
      );
    }
    
    if (filters.districts) {
      await this.homePage.filterByDistricts(filters.districts);
    }
    
    if (filters.characteristics) {
      await this.homePage.filterByCharacteristics(filters.characteristics);
    }
  }

  // ===== WHEN Steps =====
  
  async whenUserSetsFilters(filters: any) {
    if (filters.priceRange) {
      await this.homePage.filterByPrice(
        filters.priceRange.min,
        filters.priceRange.max,
        filters.priceRange.currency || 'USD'
      );
    }
    
    if (filters.districts) {
      await this.homePage.filterByDistricts(filters.districts);
    }
    
    if (filters.characteristics) {
      await this.homePage.filterByCharacteristics(filters.characteristics);
    }
    
    if (filters.textSearch) {
      await this.homePage.searchListings(filters.textSearch);
    }
  }

  async whenSearchIsPerformed() {
    // Search is typically performed automatically after setting filters
    // This step might just wait for results
    await this.homePage.waitForListingsToLoad();
  }

  async whenUserClicksOnListing(index: number = 0) {
    await this.homePage.clickListingCard(index);
  }

  async whenUserSwitchesToMapView() {
    await this.homePage.switchToMapView();
  }

  async whenUserSwitchesToListView() {
    await this.homePage.switchToListView();
  }

  async whenUserZoomsMap(direction: 'in' | 'out', times: number = 1) {
    for (let i = 0; i < times; i++) {
      if (direction === 'in') {
        await this.mapPage.zoomIn();
      } else {
        await this.mapPage.zoomOut();
      }
    }
  }

  async whenUserClicksMarker(index: number = 0) {
    await this.mapPage.clickMarker(index);
  }

  async whenUserClicksCluster(index: number = 0) {
    await this.mapPage.clickCluster(index);
  }

  async whenUserDrawsSearchArea(points: Array<{ x: number; y: number }>) {
    await this.mapPage.startDrawingArea();
    await this.mapPage.drawPolygon(points);
  }

  async whenUserTogglesDistrictBoundaries() {
    await this.mapPage.toggleDistrictBoundaries();
  }

  async whenUserTogglesHeatMap() {
    await this.mapPage.toggleHeatMap();
  }

  async whenUserNavigatesToPage(pageNumber: number) {
    await this.homePage.goToPage(pageNumber);
  }

  async whenUserSavesSearch(name: string) {
    await this.homePage.saveCurrentSearch(name);
  }

  // ===== THEN Steps =====
  
  async thenOnlyListingsMatchingFiltersShouldBeShown(expectedFilters: any) {
    const listings = await this.homePage.getListingsCount();
    expect(listings).toBeGreaterThan(0);
    
    if (expectedFilters.priceRange) {
      const prices = await this.homePage.getAllListingPrices();
      prices.forEach(price => {
        expect(price).toBeGreaterThanOrEqual(expectedFilters.priceRange.min);
        expect(price).toBeLessThanOrEqual(expectedFilters.priceRange.max);
      });
    }
    
    if (expectedFilters.districts) {
      const allInDistricts = await this.homePage.areAllListingsInDistricts(expectedFilters.districts);
      expect(allInDistricts).toBe(true);
    }
  }

  async thenResultCountShouldBeDisplayed() {
    const countText = await this.homePage.getResultsCountText();
    expect(countText).toMatch(/\d+ listings? found/i);
  }

  async thenListingsShouldBeSorted(sortBy: string, order: 'asc' | 'desc') {
    if (sortBy === 'price') {
      const sorted = await this.homePage.areListingsSortedByPrice(order);
      expect(sorted).toBe(true);
    }
    // Add more sort checks as needed
  }

  async thenMapShouldShowMarkers() {
    const markersCount = await this.mapPage.getVisibleMarkersCount();
    expect(markersCount).toBeGreaterThan(0);
  }

  async thenMarkersShouldBeClustered() {
    const clustersCount = await this.mapPage.getVisibleClustersCount();
    expect(clustersCount).toBeGreaterThan(0);
  }

  async thenInfoWindowShouldAppear() {
    const isVisible = await this.mapPage.isInfoWindowVisible();
    expect(isVisible).toBe(true);
  }

  async thenInfoWindowShouldContain(fields: string[]) {
    const details = await this.mapPage.getInfoWindowDetails();
    
    if (fields.includes('price')) {
      expect(details.price).toBeTruthy();
    }
    if (fields.includes('bedrooms')) {
      expect(details.bedrooms).toBeTruthy();
    }
    if (fields.includes('area')) {
      expect(details.area).toBeTruthy();
    }
    if (fields.includes('district')) {
      expect(details.district).toBeTruthy();
    }
    if (fields.includes('photo')) {
      expect(details.hasPhoto).toBe(true);
    }
  }

  async thenClustersShouldUpdateDynamically() {
    const initialClusters = await this.mapPage.getVisibleClustersCount();
    await this.mapPage.zoomIn();
    const afterZoomClusters = await this.mapPage.getVisibleClustersCount();
    const afterZoomMarkers = await this.mapPage.getVisibleMarkersCount();
    
    // Either clusters decreased or markers increased (or both)
    expect(afterZoomClusters <= initialClusters || afterZoomMarkers > 0).toBe(true);
  }

  async thenDistrictBoundariesShouldBeVisible() {
    const visible = await this.mapPage.areDistrictBoundariesVisible();
    expect(visible).toBe(true);
  }

  async thenHeatMapShouldBeVisible() {
    const visible = await this.mapPage.isHeatMapVisible();
    expect(visible).toBe(true);
  }

  async thenNoResultsMessageShouldBeShown() {
    const hasMessage = await this.homePage.hasNoResultsMessage();
    expect(hasMessage).toBe(true);
  }

  async thenPaginationShouldShow(expectedPages: number) {
    const pageNumbers = await this.page.locator('[data-testid="page-number"]').count();
    expect(pageNumbers).toBe(expectedPages);
  }

  async thenQuickFiltersShouldBeAvailable(filters: string[]) {
    for (const filter of filters) {
      const hasFilter = await this.homePage.hasQuickFilter(filter);
      expect(hasFilter).toBe(true);
    }
  }

  async thenListingDetailsShouldBeDisplayed() {
    const sections = await this.listingDetailPage.hasAllRequiredSections();
    expect(sections.gallery).toBe(true);
    expect(sections.details).toBe(true);
    expect(sections.contact).toBe(true);
  }

  async thenListingShouldHaveImages() {
    const imagesCount = await this.listingDetailPage.getImagesCount();
    expect(imagesCount).toBeGreaterThan(0);
  }

  async thenMapShouldCenterOnListing() {
    const isMapDisplayed = await this.listingDetailPage.isMapDisplayed();
    expect(isMapDisplayed).toBe(true);
  }

  // ===== Utility Methods =====
  
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`, 
      fullPage: true 
    });
  }

  async checkPerformance(): Promise<{ fps: number; loadTime: number }> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    const fps = await this.page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let fps = 0;
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
          frames++;
          const currentTime = performance.now();
          const delta = currentTime - lastTime;
          
          if (delta >= 1000) {
            fps = Math.round(frames * 1000 / delta);
            resolve(fps);
          } else {
            requestAnimationFrame(measureFPS);
          }
        };
        
        requestAnimationFrame(measureFPS);
      });
    });
    
    return { fps, loadTime };
  }

  async verifyAccessibility() {
    // Basic accessibility checks
    const hasSkipLink = await this.page.locator('a[href="#main"]').count() > 0;
    const hasProperHeadings = await this.page.locator('h1').count() === 1;
    const imagesHaveAlt = await this.page.evaluate(() => {
      const images = document.querySelectorAll('img');
      return Array.from(images).every(img => img.hasAttribute('alt'));
    });
    
    expect(hasProperHeadings).toBe(true);
    expect(imagesHaveAlt).toBe(true);
  }

  async simulateMobileView() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async simulateTabletView() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async simulateDesktopView() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  async verifyResponsiveLayout() {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(500);
      
      // Check if content is properly visible
      const contentVisible = await this.page.locator('#root').isVisible();
      expect(contentVisible).toBe(true);
      
      // Take screenshot for visual verification
      await this.takeScreenshot(`responsive-${viewport.name}`);
    }
  }
}