import { FullConfig } from '@playwright/test';
import axios from 'axios';

async function globalSetup(config: FullConfig) {
  console.log('Global setup: preparing test environment...');
  
  const backendUrl = 'http://localhost:3001';
  
  // Wait for backend to be ready
  let retries = 30;
  while (retries > 0) {
    try {
      await axios.get(`${backendUrl}/api/listings`);
      console.log('Backend is ready');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        throw new Error('Backend failed to start');
      }
      console.log(`Waiting for backend... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Seed test data if needed
  try {
    console.log('Checking if test data needs to be seeded...');
    const response = await axios.get(`${backendUrl}/api/listings`);
    
    if (!response.data.data || response.data.data.length === 0) {
      console.log('No test data found, seeding database...');
      // The seed script should already be run by the backend startup
      // but we can trigger it again if needed
      await axios.post(`${backendUrl}/api/admin/seed-test-data`).catch(() => {
        console.log('Seed endpoint not available, assuming data is already seeded');
      });
    } else {
      console.log(`Found ${response.data.data.length} listings in database`);
    }
  } catch (error) {
    console.error('Error checking test data:', error);
  }

  // Store some global test data
  process.env.TEST_BACKEND_URL = backendUrl;
  process.env.TEST_FRONTEND_URL = 'http://localhost:5173';

  console.log('Global setup completed');
}

export default globalSetup;