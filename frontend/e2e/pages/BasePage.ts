import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseURL: string;

  constructor(page: Page) {
    this.page = page;
    this.baseURL = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string = '') {
    await this.page.goto(`${this.baseURL}${path}`);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await expect(locator).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for API response
   */
  async waitForAPI(endpoint: string, method: string = 'GET') {
    return this.page.waitForResponse(
      response => response.url().includes(endpoint) && response.request().method() === method
    );
  }

  /**
   * Get text content safely
   */
  async getTextContent(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return await locator.textContent() || '';
  }

  /**
   * Scroll to element
   */
  async scrollToElement(locator: Locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Wait for element to be clickable and click
   */
  async clickWhenReady(locator: Locator) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
  }

  /**
   * Fill input field with clear
   */
  async fillInput(locator: Locator, value: string) {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  /**
   * Select option from dropdown
   */
  async selectOption(locator: Locator, value: string | { label?: string; value?: string; index?: number }) {
    await locator.waitFor({ state: 'visible' });
    await locator.selectOption(value);
  }

  /**
   * Get current URL
   */
  async getCurrentURL(): Promise<string> {
    return this.page.url();
  }

  /**
   * Reload page
   */
  async reload() {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  /**
   * Wait for specific timeout
   */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Check if page has text
   */
  async hasText(text: string): Promise<boolean> {
    const locator = this.page.getByText(text);
    return this.isVisible(locator);
  }

  /**
   * Get all text content from elements matching locator
   */
  async getAllTextContent(locator: Locator): Promise<string[]> {
    const elements = await locator.all();
    const texts: string[] = [];
    for (const element of elements) {
      const text = await element.textContent();
      if (text) texts.push(text);
    }
    return texts;
  }

  /**
   * Wait for element count
   */
  async waitForElementCount(locator: Locator, count: number) {
    await expect(locator).toHaveCount(count);
  }

  /**
   * Mock API response
   */
  async mockAPIResponse(endpoint: string, data: any, status: number = 200) {
    await this.page.route(`**/${endpoint}`, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(data)
      });
    });
  }

  /**
   * Remove API mock
   */
  async removeMock(endpoint: string) {
    await this.page.unroute(`**/${endpoint}`);
  }
}