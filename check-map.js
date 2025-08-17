const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console messages
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });
  
  page.on('pageerror', error => {
    console.error('❌ Page error:', error.message);
  });

  try {
    console.log('Opening http://localhost:5175...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    
    // Click on Map view button
    await page.waitForTimeout(1000);
    const mapButton = await page.locator('button:has-text("Map")');
    if (await mapButton.count() > 0) {
      console.log('Clicking Map button...');
      await mapButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Check if Leaflet map is rendered
    const mapContainer = await page.evaluate(() => {
      const leafletContainer = document.querySelector('.leaflet-container');
      if (!leafletContainer) return { found: false };
      
      return {
        found: true,
        width: leafletContainer.clientWidth,
        height: leafletContainer.clientHeight,
        tiles: document.querySelectorAll('.leaflet-tile').length,
        markers: document.querySelectorAll('.leaflet-marker-icon').length
      };
    });
    
    console.log('\n📍 Map status:', mapContainer);
    
    // Check for Leaflet CSS
    const leafletCss = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          return sheet.href && sheet.href.includes('leaflet');
        } catch (e) {
          return false;
        }
      });
    });
    
    console.log('🎨 Leaflet CSS loaded:', leafletCss);
    
    // Check for failed network requests
    const failedRequests = [];
    page.on('requestfailed', request => {
      if (request.url().includes('tile') || request.url().includes('leaflet')) {
        failedRequests.push(request.url());
      }
    });
    
    await page.waitForTimeout(1000);
    
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed map requests:', failedRequests);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();