const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    }
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  try {
    // Navigate to the page
    console.log('Opening http://localhost:5175...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle' });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Check if there are console errors
    if (consoleMessages.length > 0) {
      console.log('\n❌ Found console errors:');
      consoleMessages.forEach(msg => {
        console.log(`  - ${msg.text}`);
        if (msg.location?.url) {
          console.log(`    at ${msg.location.url}:${msg.location.lineNumber}`);
        }
      });
    } else {
      console.log('✅ No console errors found');
    }
    
    // Check if main content is rendered
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 100) : 'Root not found';
    });
    
    console.log('\n📦 Root element content:', rootContent);
    
    // Check for network errors
    const failedRequests = [];
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()
      });
    });
    
    // Try to fetch listings
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/listings');
        return { status: res.status, ok: res.ok };
      } catch (e) {
        return { error: e.message };
      }
    });
    
    console.log('\n🔌 API check:', response);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();