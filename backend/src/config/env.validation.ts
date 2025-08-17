import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),
  APP_NAME: Joi.string().default('TBI-Prop'),
  APP_VERSION: Joi.string().default('1.0.0'),
  
  // Database
  DATABASE_URL: Joi.string().required(),
  
  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_URL: Joi.string().optional(),
  
  // Apify (optional - will use mock data if not provided)
  APIFY_USER_ID: Joi.string().optional().allow(''),
  APIFY_SECRET: Joi.string().optional().allow(''),
  APIFY_ACTOR_ID: Joi.string().default('CIHG1VRwmC01rsPar'),
  APIFY_RATE_LIMIT: Joi.number().default(10),
  APIFY_MAX_RETRIES: Joi.number().default(3),
  
  // OpenAI (optional)
  OPENAI_API_KEY: Joi.string().optional().allow(''),
  OPENAI_MODEL: Joi.string().default('gpt-4-turbo-preview'),
  OPENAI_MAX_TOKENS: Joi.number().default(2000),
  OPENAI_TEMPERATURE: Joi.number().default(0.3),
  
  // OpenRouter (optional)
  OPENROUTER_API_KEY: Joi.string().optional().allow(''),
  OPENROUTER_MODEL: Joi.string().default('deepseek/deepseek-chat'),
  OPENROUTER_SITE_URL: Joi.string().default('https://tbi-prop.com'),
  OPENROUTER_APP_NAME: Joi.string().default('TBI-Prop'),
  
  // Google Maps (optional)
  GOOGLE_MAPS_API_KEY: Joi.string().optional().allow(''),
  GOOGLE_MAPS_REGION: Joi.string().default('ge'),
  GOOGLE_MAPS_LANGUAGE: Joi.string().default('en'),
  
  // OpenCage (optional)
  OPENCAGE_API_KEY: Joi.string().optional().allow(''),
  OPENCAGE_RATE_LIMIT: Joi.number().default(5),
  
  // Telegram channels
  TELEGRAM_CHANNELS: Joi.string().default('kvartiry_v_tbilisi,propertyintbilisi,GeorgiaRealEstateGroup'),
  
  // Parsing schedule
  PARSING_SCHEDULE_REGULAR: Joi.string().default('0 */12 * * *'),
  PARSING_SCHEDULE_INITIAL: Joi.string().default('0 0 * * 0'),
  PARSING_BATCH_SIZE: Joi.number().default(20),
  PARSING_INITIAL_LIMIT: Joi.number().default(100),
  
  // Queue configuration
  QUEUE_CONCURRENCY: Joi.number().default(5),
  QUEUE_MAX_RETRIES: Joi.number().default(3),
  QUEUE_RETRY_DELAY: Joi.number().default(5000),
  QUEUE_REMOVE_ON_COMPLETE: Joi.number().default(100),
  QUEUE_REMOVE_ON_FAIL: Joi.number().default(500),
  
  // AI Cost tracking
  AI_MONTHLY_SPENDING_LIMIT: Joi.number().default(100),
  AI_COST_WARNING_THRESHOLD: Joi.number().default(80),
  AI_ENABLE_FALLBACK: Joi.boolean().default(true),
  
  // Geocoding
  GEOCODING_CACHE_TTL: Joi.number().default(2592000),
  GEOCODING_CONFIDENCE_THRESHOLD: Joi.number().default(0.7),
  
  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  
  // Rate limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('debug'),
  LOG_FORMAT: Joi.string().valid('json', 'simple').default('json'),
  ENABLE_REQUEST_LOGGING: Joi.boolean().default(true),
  ENABLE_PERFORMANCE_MONITORING: Joi.boolean().default(true),
  
  // WebSocket
  WS_PORT: Joi.number().default(3001),
  WS_CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:5173'),
  WS_PING_INTERVAL: Joi.number().default(30000),
  
  // Admin
  ADMIN_USERNAME: Joi.string().default('admin'),
  ADMIN_PASSWORD: Joi.string().default('admin123'),
  ADMIN_JWT_SECRET: Joi.string().default('default-secret-change-in-production'),
  ADMIN_JWT_EXPIRES_IN: Joi.string().default('24h'),
  
  // Feature flags
  ENABLE_MOCK_DATA: Joi.boolean().default(false),
  ENABLE_AI_ANALYSIS: Joi.boolean().default(true),
  ENABLE_GEOCODING: Joi.boolean().default(true),
  ENABLE_AUTO_PARSING: Joi.boolean().default(false),
  ENABLE_WEBSOCKET: Joi.boolean().default(true),
  ENABLE_ADMIN_DASHBOARD: Joi.boolean().default(true),
  
  // External services (optional)
  TELEGRAM_BOT_TOKEN: Joi.string().optional().allow(''),
  TELEGRAM_ADMIN_CHAT_ID: Joi.string().optional().allow(''),
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().default('development'),
});

export function validateConfig(config: Record<string, unknown>) {
  const { error, value } = validationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });
  
  if (error) {
    const missingVars = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Config validation error: ${missingVars}`);
  }
  
  return value;
}