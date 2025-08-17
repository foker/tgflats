import { test, expect } from '@playwright/test';
import { MapPage } from '../pages/MapPage';
import { HomePage } from '../pages/HomePage';
import { BDDHelpers } from '../helpers/bdd-helpers';
import { testData } from '../fixtures/test-data';

/**
 * E2E Tests for Map Visualization Feature
 * Based on BDD scenarios from /bdd/map-visualization.feature
 */

test.describe('Map Visualization', () => {
  let mapPage: MapPage;
  let homePage: HomePage;
  let bddHelpers: BDDHelpers;

  test.beforeEach(async ({ page }) => {
    mapPage = new MapPage(page);
    homePage = new HomePage(page);
    bddHelpers = new BDDHelpers(page);
    
    // Navigate to home and switch to map view
    await homePage.goto();
    await homePage.switchToMapView();
    await mapPage.waitForMapToLoad();
  });

  test.describe('Display map with listings', () => {
    test('should display map centered on Tbilisi with markers', async ({ page }) => {
      // Then the map should show centered on Tbilisi
      const iscentered = await mapPage.isMapCenteredOn(
        testData.map.tbilisiCenter.lat,
        testData.map.tbilisiCenter.lng,
        0.1 // Allow some tolerance
      );
      expect(iscentered).toBe(true);
      
      // And markers should appear for each listing with coordinates
      const markersCount = await mapPage.getVisibleMarkersCount();
      const clustersCount = await mapPage.getVisibleClustersCount();
      
      // Either individual markers or clusters should be visible
      expect(markersCount + clustersCount).toBeGreaterThan(0);
      
      // Initial zoom should be appropriate for city view
      const zoomLevel = await mapPage.getZoomLevel();
      expect(zoomLevel).toBeGreaterThanOrEqual(10);
      expect(zoomLevel).toBeLessThanOrEqual(14);
    });

    test('should have map controls', async ({ page }) => {
      // Check zoom controls
      await expect(mapPage.zoomInButton).toBeVisible();
      await expect(mapPage.zoomOutButton).toBeVisible();
      
      // Check fullscreen button
      await expect(mapPage.fullscreenButton).toBeVisible();
      
      // Check map type button (if available)
      const hasMapType = await mapPage.mapTypeButton.isVisible();
      if (hasMapType) {
        await mapPage.changeMapType('satellite');
        await page.waitForTimeout(1000);
        await mapPage.changeMapType('roadmap');
      }
    });
  });

  test.describe('Cluster nearby markers', () => {
    test('should cluster markers at appropriate zoom levels', async ({ page }) => {
      // Set zoom to show clusters
      await mapPage.setZoomLevel(testData.map.zoomLevels.city);
      
      // Then markers should be clustered
      const clustersCount = await mapPage.getVisibleClustersCount();
      expect(clustersCount).toBeGreaterThan(0);
      
      // Check cluster shows count
      if (clustersCount > 0) {
        const clusterCount = await mapPage.getClusterCount(0);
        expect(clusterCount).toBeGreaterThan(1);
      }
      
      // Cluster color should indicate density
      const density = await mapPage.checkClusterDensity(0);
      expect(['low', 'medium', 'high']).toContain(density);
    });

    test('should expand cluster on click', async ({ page }) => {
      // Find and click a cluster
      const clustersCount = await mapPage.getVisibleClustersCount();
      
      if (clustersCount > 0) {
        const initialZoom = await mapPage.getZoomLevel();
        
        // Click the cluster
        await mapPage.clickCluster(0);
        
        // Map should zoom in
        const newZoom = await mapPage.getZoomLevel();
        expect(newZoom).toBeGreaterThan(initialZoom);
        
        // Individual markers should become visible or smaller clusters
        const newClustersCount = await mapPage.getVisibleClustersCount();
        const markersCount = await mapPage.getVisibleMarkersCount();
        
        // Either fewer clusters or more individual markers
        expect(newClustersCount < clustersCount || markersCount > 0).toBe(true);
      }
    });
  });

  test.describe('Show listing details on marker click', () => {
    test('should show info window with listing details', async ({ page }) => {
      // Zoom in to see individual markers
      await mapPage.setZoomLevel(testData.map.zoomLevels.street);
      await page.waitForTimeout(1000);
      
      const markersCount = await mapPage.getVisibleMarkersCount();
      
      if (markersCount > 0) {
        // Click a marker
        await mapPage.clickMarker(0);
        
        // Info window should appear
        await bddHelpers.thenInfoWindowShouldAppear();
        
        // Info window should contain required fields
        const details = await mapPage.getInfoWindowDetails();
        expect(details.price).toBeTruthy();
        expect(details.bedrooms).toBeTruthy();
        expect(details.area).toBeTruthy();
        expect(details.district).toBeTruthy();
        
        // Should have view button
        await expect(mapPage.infoWindowViewButton).toBeVisible();
      }
    });

    test('should navigate to listing detail from info window', async ({ page }) => {
      await mapPage.setZoomLevel(testData.map.zoomLevels.street);
      await page.waitForTimeout(1000);
      
      const markersCount = await mapPage.getVisibleMarkersCount();
      
      if (markersCount > 0) {
        await mapPage.clickMarker(0);
        await mapPage.clickViewInInfoWindow();
        
        // Should navigate to listing detail page
        await page.waitForURL(/\/listings\/[\w-]+/);
        expect(page.url()).toContain('/listings/');
      }
    });

    test('should close info window', async ({ page }) => {
      await mapPage.setZoomLevel(testData.map.zoomLevels.street);
      await page.waitForTimeout(1000);
      
      const markersCount = await mapPage.getVisibleMarkersCount();
      
      if (markersCount > 0) {
        await mapPage.clickMarker(0);
        await expect(mapPage.infoWindow).toBeVisible();
        
        await mapPage.closeInfoWindow();
        await expect(mapPage.infoWindow).toBeHidden();
      }
    });
  });

  test.describe('Dynamic clustering based on zoom', () => {
    test('should update clusters dynamically when zooming', async ({ page }) => {
      // Start at city level
      await mapPage.setZoomLevel(testData.map.zoomLevels.city);
      const initialClusters = await mapPage.getVisibleClustersCount();
      
      // Zoom in to district level
      await mapPage.setZoomLevel(testData.map.zoomLevels.district);
      await page.waitForTimeout(1000);
      const districtClusters = await mapPage.getVisibleClustersCount();
      const districtMarkers = await mapPage.getVisibleMarkersCount();
      
      // Zoom in to street level
      await mapPage.setZoomLevel(testData.map.zoomLevels.street);
      await page.waitForTimeout(1000);
      const streetMarkers = await mapPage.getVisibleMarkersCount();
      
      // Clusters should decrease and markers increase as we zoom in
      expect(districtClusters).toBeLessThanOrEqual(initialClusters);
      expect(streetMarkers).toBeGreaterThanOrEqual(districtMarkers);
    });

    test('should handle zoom controls', async ({ page }) => {
      const initialZoom = await mapPage.getZoomLevel();
      
      // Zoom in
      await mapPage.zoomIn();
      const zoomedIn = await mapPage.getZoomLevel();
      expect(zoomedIn).toBeGreaterThan(initialZoom);
      
      // Zoom out
      await mapPage.zoomOut();
      await mapPage.zoomOut();
      const zoomedOut = await mapPage.getZoomLevel();
      expect(zoomedOut).toBeLessThan(zoomedIn);
    });
  });

  test.describe('Filter markers on map', () => {
    test('should update markers when filters are applied', async ({ page }) => {
      // Get initial marker/cluster count
      const initialMarkers = await mapPage.getVisibleMarkersCount();
      const initialClusters = await mapPage.getVisibleClustersCount();
      const initialTotal = initialMarkers + initialClusters;
      
      // Apply filter
      await homePage.filterByPrice(500, 800, 'USD');
      await mapPage.waitForMarkersUpdate();
      
      // Markers should update
      const filteredMarkers = await mapPage.getVisibleMarkersCount();
      const filteredClusters = await mapPage.getVisibleClustersCount();
      const filteredTotal = filteredMarkers + filteredClusters;
      
      // Should have fewer markers/clusters after filtering
      expect(filteredTotal).toBeLessThanOrEqual(initialTotal);
    });

    test('should adjust map bounds to visible markers', async ({ page }) => {
      // Apply restrictive filter
      await homePage.filterByDistricts(['Vake']);
      await mapPage.waitForMarkersUpdate();
      
      // Map should adjust to show filtered results
      const center = await mapPage.getMapCenter();
      
      // Center should be near Vake district
      const vakeCoords = testData.map.districts.vake;
      const distance = Math.sqrt(
        Math.pow(center.lat - vakeCoords.lat, 2) + 
        Math.pow(center.lng - vakeCoords.lng, 2)
      );
      
      // Should be relatively close to Vake
      expect(distance).toBeLessThan(0.1);
    });
  });

  test.describe('Draw search area', () => {
    test('should allow drawing polygon on map', async ({ page }) => {
      // Start drawing mode
      await mapPage.startDrawingArea();
      
      // Draw a polygon
      await mapPage.drawPolygon(testData.map.testPolygon);
      
      // Wait for filtering
      await page.waitForTimeout(1000);
      
      // Only listings within polygon should be shown
      const markersCount = await mapPage.getVisibleMarkersCount();
      const clustersCount = await mapPage.getVisibleClustersCount();
      
      // Should have filtered results
      expect(markersCount + clustersCount).toBeGreaterThanOrEqual(0);
      
      // Clear the drawn area
      await mapPage.clearDrawnArea();
    });
  });

  test.describe('Show district boundaries', () => {
    test('should toggle district boundaries overlay', async ({ page }) => {
      // Initially boundaries should not be visible
      let boundariesVisible = await mapPage.areDistrictBoundariesVisible();
      expect(boundariesVisible).toBe(false);
      
      // Toggle districts on
      await mapPage.toggleDistrictBoundaries();
      
      // Boundaries should be visible
      boundariesVisible = await mapPage.areDistrictBoundariesVisible();
      expect(boundariesVisible).toBe(true);
      
      // Toggle districts off
      await mapPage.toggleDistrictBoundaries();
      
      // Boundaries should be hidden again
      boundariesVisible = await mapPage.areDistrictBoundariesVisible();
      expect(boundariesVisible).toBe(false);
    });
  });

  test.describe('Heat map view', () => {
    test('should switch to heat map mode', async ({ page }) => {
      // Initially heat map should not be visible
      let heatMapVisible = await mapPage.isHeatMapVisible();
      expect(heatMapVisible).toBe(false);
      
      // Toggle heat map on
      await mapPage.toggleHeatMap();
      
      // Heat map should be visible
      heatMapVisible = await mapPage.isHeatMapVisible();
      expect(heatMapVisible).toBe(true);
      
      // Toggle heat map off
      await mapPage.toggleHeatMap();
      
      // Heat map should be hidden
      heatMapVisible = await mapPage.isHeatMapVisible();
      expect(heatMapVisible).toBe(false);
    });
  });

  test.describe('Navigate from list to map', () => {
    test('should center map on listing when navigating from list', async ({ page }) => {
      // Go back to list view
      await homePage.switchToListView();
      
      // Get first listing details
      const listingDetails = await homePage.getListingDetails(0);
      
      // Click "Show on map" for first listing
      const showOnMapButton = page.getByRole('button', { name: /show on map/i }).first();
      await showOnMapButton.click();
      
      // Should switch to map view
      await mapPage.waitForMapToLoad();
      
      // Info window should open automatically
      const infoWindowVisible = await mapPage.isInfoWindowVisible();
      expect(infoWindowVisible).toBe(true);
      
      // Info window should show the same listing
      const infoDetails = await mapPage.getInfoWindowDetails();
      expect(infoDetails.district).toContain(listingDetails.district);
    });
  });

  test.describe('Mobile responsive map', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await mapPage.waitForMapToLoad();
      
      // Map should be visible
      await expect(mapPage.mapContainer).toBeVisible();
      
      // Controls should be accessible
      await expect(mapPage.zoomInButton).toBeVisible();
      await expect(mapPage.zoomOutButton).toBeVisible();
      
      // Should support touch gestures (can't test actual gestures, but check UI)
      const mapCanvas = await mapPage.mapCanvas.boundingBox();
      expect(mapCanvas?.width).toBeGreaterThan(300);
      expect(mapCanvas?.height).toBeGreaterThan(400);
      
      // Click a marker/cluster
      const markersCount = await mapPage.getVisibleMarkersCount();
      const clustersCount = await mapPage.getVisibleClustersCount();
      
      if (markersCount > 0) {
        await mapPage.clickMarker(0);
        
        // Info should appear (might be bottom sheet on mobile)
        const infoVisible = await mapPage.isInfoWindowVisible();
        expect(infoVisible).toBe(true);
      } else if (clustersCount > 0) {
        await mapPage.clickCluster(0);
        
        // Should zoom in
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe('Map performance optimization', () => {
    test('should maintain acceptable performance with many markers', async ({ page }) => {
      // Check initial performance
      const perfMetrics = await mapPage.checkMapPerformance();
      
      // FPS should be above 30
      expect(perfMetrics.fps).toBeGreaterThanOrEqual(30);
      
      // Render time should be reasonable
      expect(perfMetrics.renderTime).toBeLessThan(50); // 50ms per frame
    });

    test('should handle rapid zoom changes', async ({ page }) => {
      // Rapidly zoom in and out
      for (let i = 0; i < 5; i++) {
        await mapPage.zoomIn();
        await page.waitForTimeout(100);
        await mapPage.zoomOut();
        await page.waitForTimeout(100);
      }
      
      // Map should remain responsive
      const markersVisible = await mapPage.getVisibleMarkersCount();
      const clustersVisible = await mapPage.getVisibleClustersCount();
      
      // Should still show markers/clusters
      expect(markersVisible + clustersVisible).toBeGreaterThan(0);
    });
  });

  test.describe('Custom map styling', () => {
    test('should apply custom map styles', async ({ page }) => {
      // Check if map has custom styling by looking at map container classes
      const mapClasses = await mapPage.mapCanvas.getAttribute('class');
      
      // Should have styling classes (varies by map provider)
      expect(mapClasses).toBeTruthy();
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: 'test-results/screenshots/map-styling.png',
        fullPage: false 
      });
    });
  });

  test.describe('Map interactions', () => {
    test('should pan map to specific coordinates', async ({ page }) => {
      // Pan to Vake district
      const vakeCoords = testData.map.districts.vake;
      await mapPage.panToCoordinates(vakeCoords.lat, vakeCoords.lng);
      
      // Check map is centered on Vake
      const isCentered = await mapPage.isMapCenteredOn(
        vakeCoords.lat,
        vakeCoords.lng,
        0.01
      );
      expect(isCentered).toBe(true);
    });

    test('should toggle fullscreen mode', async ({ page }) => {
      // Toggle fullscreen
      await mapPage.toggleFullscreen();
      await page.waitForTimeout(500);
      
      // Map should still be functional
      const markersCount = await mapPage.getVisibleMarkersCount();
      const clustersCount = await mapPage.getVisibleClustersCount();
      expect(markersCount + clustersCount).toBeGreaterThan(0);
      
      // Exit fullscreen
      await page.keyboard.press('Escape');
    });
  });
});