import { registerAs } from '@nestjs/config';

export default registerAs('apify', () => ({
  // Credentials
  userId: process.env.APIFY_USER_ID || '',
  secret: process.env.APIFY_SECRET || '',
  actorId: process.env.APIFY_ACTOR_ID || 'CIHG1VRwmC01rsPar',
  
  // Rate limiting
  rateLimit: parseInt(process.env.APIFY_RATE_LIMIT, 10) || 10,
  maxRetries: parseInt(process.env.APIFY_MAX_RETRIES, 10) || 3,
  
  // Parsing configuration
  channels: process.env.TELEGRAM_CHANNELS?.split(',').map(c => c.trim()) || [
    'kvartiry_v_tbilisi',
    'propertyintbilisi',
    'GeorgiaRealEstateGroup'
  ],
  
  // Scheduling
  schedule: {
    regular: process.env.PARSING_SCHEDULE_REGULAR || '0 */12 * * *',
    initial: process.env.PARSING_SCHEDULE_INITIAL || '0 0 * * 0',
  },
  
  // Batch settings
  batchSize: parseInt(process.env.PARSING_BATCH_SIZE, 10) || 20,
  initialLimit: parseInt(process.env.PARSING_INITIAL_LIMIT, 10) || 100,
  
  // Helper to check if credentials are configured
  isConfigured: () => {
    const config = apifyConfig();
    return !!(config.userId && config.secret);
  },
}));

// Export helper function for use in services
export const apifyConfig = () => ({
  userId: process.env.APIFY_USER_ID || '',
  secret: process.env.APIFY_SECRET || '',
  actorId: process.env.APIFY_ACTOR_ID || 'CIHG1VRwmC01rsPar',
  rateLimit: parseInt(process.env.APIFY_RATE_LIMIT, 10) || 10,
  maxRetries: parseInt(process.env.APIFY_MAX_RETRIES, 10) || 3,
  channels: process.env.TELEGRAM_CHANNELS?.split(',').map(c => c.trim()) || [
    'kvartiry_v_tbilisi',
    'propertyintbilisi',
    'GeorgiaRealEstateGroup'
  ],
  schedule: {
    regular: process.env.PARSING_SCHEDULE_REGULAR || '0 */12 * * *',
    initial: process.env.PARSING_SCHEDULE_INITIAL || '0 0 * * 0',
  },
  batchSize: parseInt(process.env.PARSING_BATCH_SIZE, 10) || 20,
  initialLimit: parseInt(process.env.PARSING_INITIAL_LIMIT, 10) || 100,
  isConfigured: () => {
    return !!(process.env.APIFY_USER_ID && process.env.APIFY_SECRET);
  },
});