const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Перехватываем все API запросы
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      console.log('📤 API Request:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log('📥 API Response:', response.status(), response.url());
    }
  });

  // Собираем консольные логи
  page.on('console', msg => {
    if (msg.text().includes('Fetching') || msg.text().includes('listings')) {
      console.log('🔍 Console:', msg.text());
    }
    if (msg.type() === 'error') {
      console.log('❌ Error:', msg.text());
    }
  });

  // Открываем страницу
  console.log('🔍 Opening http://localhost:5173...\n');
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    // Ждем загрузки
    await page.waitForTimeout(3000);
    
    // Проверяем наличие элементов
    const listingCards = await page.locator('[class*="ListingCard"], [class*="listing-card"], [class*="grid"] > div > div').count();
    console.log('\n📦 Listing cards found on page:', listingCards);
    
    // Проверяем наличие заголовков
    const titles = await page.locator('h3, .text-lg').allTextContents();
    console.log('📝 Titles found:', titles.slice(0, 3));
    
    // Проверяем наличие цен
    const prices = await page.locator('[class*="text-2xl"], [class*="price"]').allTextContents();
    console.log('💰 Prices found:', prices.slice(0, 3));
    
    // Проверяем загрузчик
    const hasLoader = await page.locator('.animate-spin').count();
    console.log('⏳ Loader visible:', hasLoader > 0);
    
    // Проверяем сообщение об отсутствии листингов
    const noListingsMsg = await page.locator('text=/No listings found/i').count();
    console.log('📭 "No listings" message:', noListingsMsg > 0);
    
    // Получаем API данные напрямую
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3333/api/listings');
        const data = await response.json();
        return {
          status: response.status,
          dataLength: data.data ? data.data.length : 0,
          total: data.total || data.meta?.total || 0,
          firstItem: data.data?.[0]
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('\n🔬 Direct API check:', apiResponse);
    
    // Делаем скриншот
    await page.screenshot({ path: 'api-flow-check.png', fullPage: true });
    console.log('\n📸 Screenshot saved: api-flow-check.png');
    
    console.log('\n👀 Browser will stay open for 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Failed:', error.message);
  }
  
  await browser.close();
})();