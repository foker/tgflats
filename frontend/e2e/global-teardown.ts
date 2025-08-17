import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Global teardown: cleaning up test environment...');
  
  // Here we could clean up test data if needed
  // But for development, we'll keep the test data
  
  console.log('Global teardown completed');
}

export default globalTeardown;