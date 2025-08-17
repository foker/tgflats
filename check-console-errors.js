const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Собираем все ошибки консоли
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({
        text: msg.text(),
        location: msg.location()
      });
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
    console.log('❌ Network Error:', request.url(), request.failure()?.errorText);
  });

  // Открываем страницу
  console.log('🔍 Opening http://localhost:5173...');
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Ждем немного чтобы все загрузилось
    await page.waitForTimeout(3000);
    
    console.log('\n📊 Summary:');
    console.log('Console Errors:', consoleErrors.length);
    console.log('Network Errors:', networkErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('\n🔴 Console Errors Details:');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.text}`);
        if (err.location) {
          console.log(`   at ${err.location.url}:${err.location.lineNumber}`);
        }
      });
    }
    
    if (networkErrors.length > 0) {
      console.log('\n🔴 Network Errors Details:');
      networkErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err.url}`);
        console.log(`   ${err.failure?.errorText}`);
      });
    }

    // Проверяем что отображается на странице
    const title = await page.textContent('h1, h2, .text-2xl');
    console.log('\n📄 Page Title:', title);
    
    // Проверяем наличие листингов
    const listings = await page.locator('[data-testid="listing-card"], .listing-card, [class*="listing"]').count();
    console.log('📦 Listings found:', listings);
    
    // Делаем скриншот
    await page.screenshot({ path: 'frontend-state.png', fullPage: true });
    console.log('📸 Screenshot saved: frontend-state.png');
    
    // Оставляем браузер открытым 10 секунд чтобы можно было посмотреть
    console.log('\n👀 Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Failed to load page:', error.message);
  }
  
  await browser.close();
})();