import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class MapPage extends BasePage {
  // Map locators
  readonly mapContainer: Locator;
  readonly mapCanvas: Locator;
  readonly zoomInButton: Locator;
  readonly zoomOutButton: Locator;
  readonly fullscreenButton: Locator;
  readonly mapTypeButton: Locator;
  readonly drawAreaButton: Locator;
  readonly showDistrictsToggle: Locator;
  readonly heatMapToggle: Locator;
  
  // Marker and cluster locators
  readonly mapMarkers: Locator;
  readonly mapClusters: Locator;
  readonly infoWindow: Locator;
  readonly infoWindowClose: Locator;
  
  // Info window content
  readonly infoWindowPhoto: Locator;
  readonly infoWindowPrice: Locator;
  readonly infoWindowBedrooms: Locator;
  readonly infoWindowArea: Locator;
  readonly infoWindowDistrict: Locator;
  readonly infoWindowViewButton: Locator;

  constructor(page: Page) {
    super(page);

    // Map container and controls
    this.mapContainer = page.getByTestId('map-container');
    this.mapCanvas = page.locator('.leaflet-container, .gm-style'); // Support both Leaflet and Google Maps
    this.zoomInButton = page.getByRole('button', { name: /zoom in/i });
    this.zoomOutButton = page.getByRole('button', { name: /zoom out/i });
    this.fullscreenButton = page.getByRole('button', { name: /fullscreen/i });
    this.mapTypeButton = page.getByRole('button', { name: /map type/i });
    this.drawAreaButton = page.getByRole('button', { name: /draw.*area/i });
    this.showDistrictsToggle = page.getByLabel(/show districts/i);
    this.heatMapToggle = page.getByLabel(/heat map/i);
    
    // Markers and clusters
    this.mapMarkers = page.locator('.leaflet-marker-icon, [role="img"][aria-label*="Map pin"]');
    this.mapClusters = page.locator('.marker-cluster, .cluster-icon');
    this.infoWindow = page.locator('.leaflet-popup, .gm-style-iw');
    this.infoWindowClose = page.locator('.leaflet-popup-close-button, .gm-ui-hover-effect');
    
    // Info window content
    this.infoWindowPhoto = this.infoWindow.locator('img');
    this.infoWindowPrice = this.infoWindow.locator('[data-testid="info-price"]');
    this.infoWindowBedrooms = this.infoWindow.locator('[data-testid="info-bedrooms"]');
    this.infoWindowArea = this.infoWindow.locator('[data-testid="info-area"]');
    this.infoWindowDistrict = this.infoWindow.locator('[data-testid="info-district"]');
    this.infoWindowViewButton = this.infoWindow.getByRole('button', { name: /view/i });
  }

  /**
   * Navigate to map view
   */
  async goto() {
    await this.navigate('/map');
    await this.waitForMapToLoad();
  }

  /**
   * Wait for map to load
   */
  async waitForMapToLoad() {
    await this.mapContainer.waitFor({ state: 'visible' });
    await this.mapCanvas.waitFor({ state: 'visible' });
    // Wait for tiles to load
    await this.page.waitForTimeout(2000);
  }

  /**
   * Get current zoom level
   */
  async getZoomLevel(): Promise<number> {
    return await this.page.evaluate(() => {
      // For Leaflet
      const leafletMap = (window as any).map;
      if (leafletMap && leafletMap.getZoom) {
        return leafletMap.getZoom();
      }
      // For Google Maps
      const googleMap = (window as any).googleMap;
      if (googleMap && googleMap.getZoom) {
        return googleMap.getZoom();
      }
      return 0;
    });
  }

  /**
   * Set zoom level
   */
  async setZoomLevel(level: number) {
    await this.page.evaluate((zoomLevel) => {
      // For Leaflet
      const leafletMap = (window as any).map;
      if (leafletMap && leafletMap.setZoom) {
        leafletMap.setZoom(zoomLevel);
      }
      // For Google Maps
      const googleMap = (window as any).googleMap;
      if (googleMap && googleMap.setZoom) {
        googleMap.setZoom(zoomLevel);
      }
    }, level);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Zoom in
   */
  async zoomIn() {
    await this.clickWhenReady(this.zoomInButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Zoom out
   */
  async zoomOut() {
    await this.clickWhenReady(this.zoomOutButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Get number of visible markers
   */
  async getVisibleMarkersCount(): Promise<number> {
    return await this.mapMarkers.count();
  }

  /**
   * Get number of visible clusters
   */
  async getVisibleClustersCount(): Promise<number> {
    return await this.mapClusters.count();
  }

  /**
   * Click on a marker by index
   */
  async clickMarker(index: number) {
    await this.mapMarkers.nth(index).click();
    await this.infoWindow.waitFor({ state: 'visible' });
  }

  /**
   * Click on a cluster by index
   */
  async clickCluster(index: number) {
    const cluster = this.mapClusters.nth(index);
    await cluster.click();
    // Wait for zoom animation
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get cluster count
   */
  async getClusterCount(index: number): Promise<number> {
    const cluster = this.mapClusters.nth(index);
    const text = await this.getTextContent(cluster);
    return parseInt(text) || 0;
  }

  /**
   * Check if info window is visible
   */
  async isInfoWindowVisible(): Promise<boolean> {
    return await this.isVisible(this.infoWindow);
  }

  /**
   * Close info window
   */
  async closeInfoWindow() {
    await this.clickWhenReady(this.infoWindowClose);
    await this.infoWindow.waitFor({ state: 'hidden' });
  }

  /**
   * Get info window details
   */
  async getInfoWindowDetails(): Promise<{
    price: string;
    bedrooms: string;
    area: string;
    district: string;
    hasPhoto: boolean;
  }> {
    return {
      price: await this.getTextContent(this.infoWindowPrice),
      bedrooms: await this.getTextContent(this.infoWindowBedrooms),
      area: await this.getTextContent(this.infoWindowArea),
      district: await this.getTextContent(this.infoWindowDistrict),
      hasPhoto: await this.isVisible(this.infoWindowPhoto)
    };
  }

  /**
   * Click view button in info window
   */
  async clickViewInInfoWindow() {
    await this.clickWhenReady(this.infoWindowViewButton);
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen() {
    await this.clickWhenReady(this.fullscreenButton);
    await this.page.waitForTimeout(500);
  }

  /**
   * Change map type
   */
  async changeMapType(type: 'roadmap' | 'satellite' | 'terrain' | 'hybrid') {
    await this.clickWhenReady(this.mapTypeButton);
    const typeButton = this.page.getByRole('button', { name: new RegExp(type, 'i') });
    await this.clickWhenReady(typeButton);
    await this.page.waitForTimeout(1000);
  }

  /**
   * Start drawing search area
   */
  async startDrawingArea() {
    await this.clickWhenReady(this.drawAreaButton);
  }

  /**
   * Draw polygon on map
   */
  async drawPolygon(points: Array<{ x: number; y: number }>) {
    const box = await this.mapCanvas.boundingBox();
    if (!box) throw new Error('Map canvas not found');

    for (const point of points) {
      await this.page.mouse.click(box.x + point.x, box.y + point.y);
      await this.page.waitForTimeout(200);
    }
    
    // Close polygon by clicking first point again
    if (points.length > 0) {
      await this.page.mouse.click(box.x + points[0].x, box.y + points[0].y);
    }
  }

  /**
   * Clear drawn area
   */
  async clearDrawnArea() {
    const clearButton = this.page.getByRole('button', { name: /clear.*area/i });
    await this.clickWhenReady(clearButton);
  }

  /**
   * Toggle district boundaries
   */
  async toggleDistrictBoundaries() {
    await this.showDistrictsToggle.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if district boundaries are visible
   */
  async areDistrictBoundariesVisible(): Promise<boolean> {
    const boundaries = this.page.locator('.district-boundary, [data-testid="district-boundary"]');
    return await this.isVisible(boundaries);
  }

  /**
   * Toggle heat map view
   */
  async toggleHeatMap() {
    await this.heatMapToggle.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if heat map is visible
   */
  async isHeatMapVisible(): Promise<boolean> {
    const heatMapLayer = this.page.locator('.heatmap-layer, [data-testid="heatmap"]');
    return await this.isVisible(heatMapLayer);
  }

  /**
   * Pan map to coordinates
   */
  async panToCoordinates(lat: number, lng: number) {
    await this.page.evaluate(({ latitude, longitude }) => {
      // For Leaflet
      const leafletMap = (window as any).map;
      if (leafletMap && leafletMap.panTo) {
        leafletMap.panTo([latitude, longitude]);
      }
      // For Google Maps
      const googleMap = (window as any).googleMap;
      if (googleMap && googleMap.panTo) {
        googleMap.panTo({ lat: latitude, lng: longitude });
      }
    }, { latitude: lat, longitude: lng });
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get map center coordinates
   */
  async getMapCenter(): Promise<{ lat: number; lng: number }> {
    return await this.page.evaluate(() => {
      // For Leaflet
      const leafletMap = (window as any).map;
      if (leafletMap && leafletMap.getCenter) {
        const center = leafletMap.getCenter();
        return { lat: center.lat, lng: center.lng };
      }
      // For Google Maps
      const googleMap = (window as any).googleMap;
      if (googleMap && googleMap.getCenter) {
        const center = googleMap.getCenter();
        return { lat: center.lat(), lng: center.lng() };
      }
      return { lat: 0, lng: 0 };
    });
  }

  /**
   * Check if map is centered on specific coordinates
   */
  async isMapCenteredOn(lat: number, lng: number, tolerance: number = 0.001): Promise<boolean> {
    const center = await this.getMapCenter();
    return Math.abs(center.lat - lat) < tolerance && Math.abs(center.lng - lng) < tolerance;
  }

  /**
   * Get cluster color
   */
  async getClusterColor(index: number): Promise<string> {
    const cluster = this.mapClusters.nth(index);
    return await cluster.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor || styles.color;
    });
  }

  /**
   * Check cluster density indicators
   */
  async checkClusterDensity(index: number): Promise<'low' | 'medium' | 'high'> {
    const count = await this.getClusterCount(index);
    if (count <= 10) return 'low';
    if (count <= 50) return 'medium';
    return 'high';
  }

  /**
   * Wait for markers to update after filter
   */
  async waitForMarkersUpdate() {
    await this.page.waitForTimeout(1000);
    await this.page.waitForFunction(() => {
      const markers = document.querySelectorAll('.leaflet-marker-icon, [role="img"][aria-label*="Map pin"]');
      return markers.length > 0 || document.querySelector('.no-results-message');
    });
  }

  /**
   * Check if map performance is acceptable
   */
  async checkMapPerformance(): Promise<{ fps: number; renderTime: number }> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        let fps = 0;
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
          frames++;
          const currentTime = performance.now();
          const delta = currentTime - lastTime;
          
          if (delta >= 1000) {
            fps = Math.round(frames * 1000 / delta);
            resolve({ fps, renderTime: delta / frames });
          } else {
            requestAnimationFrame(measureFPS);
          }
        };
        
        requestAnimationFrame(measureFPS);
      });
    });
  }
}