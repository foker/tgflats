const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Disable cache
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  
  // Clear all cookies and cache
  await context.clearCookies();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
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
    console.error('❌ Page error:', error.message);
  });

  try {
    // Navigate with force reload
    console.log('Opening http://localhost:5175 with cache bypass...');
    await page.goto('http://localhost:5175', { 
      waitUntil: 'networkidle',
      // Force reload
      bypassCSP: true
    });
    
    // Force reload
    await page.reload({ waitUntil: 'networkidle' });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Check if main content is rendered
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? (root.children.length > 0 ? 'Content rendered!' : 'Empty root') : 'Root not found';
    });
    
    console.log('\n📦 Root status:', rootContent);
    
    // Try to check what's actually on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for any visible text
    const bodyText = await page.evaluate(() => {
      const body = document.body;
      return body.innerText.substring(0, 200);
    });
    console.log('📝 Page content preview:', bodyText || '(empty)');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();